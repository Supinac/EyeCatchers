#!/bin/bash
# ============================================================
# Raspberry Pi 4 - Access Point + NAT Only
# Services run in Docker — this script just sets up the network.
# ============================================================

set -euo pipefail

# ----- Configuration -----
AP_SSID="Zrakove hry"
AP_PASSPHRASE="stropoffka"
AP_CHANNEL=7
AP_INTERFACE="wlan0"
AP_IP="192.168.50.1"
AP_NETMASK="255.255.255.0"
DHCP_RANGE_START="192.168.50.10"
DHCP_RANGE_END="192.168.50.50"
DHCP_LEASE_TIME="24h"
UPSTREAM_INTERFACE="eth0"
# --------------------------

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; NC='\033[0m'
log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ---- Handle --uninstall early ----
if [[ "${1:-}" == "--uninstall" ]]; then
    log "Reverting access point setup..."
    systemctl stop hostapd dnsmasq 2>/dev/null || true
    systemctl disable hostapd dnsmasq 2>/dev/null || true

    [[ -f /etc/dnsmasq.conf.orig ]] && mv /etc/dnsmasq.conf.orig /etc/dnsmasq.conf
    rm -f /etc/hostapd/hostapd.conf
    rm -rf /etc/systemd/system/hostapd.service.d

    DHCPCD_CONF="/etc/dhcpcd.conf"
    [[ -f "$DHCPCD_CONF" ]] && sed -i '/# --- rpi4-ap ---/,/nohook wpa_supplicant/d' "$DHCPCD_CONF"

    iptables -t nat -D POSTROUTING -o "$UPSTREAM_INTERFACE" -j MASQUERADE 2>/dev/null || true
    iptables -D FORWARD -i "$AP_INTERFACE" -o "$UPSTREAM_INTERFACE" -j ACCEPT 2>/dev/null || true
    iptables -D FORWARD -i "$UPSTREAM_INTERFACE" -o "$AP_INTERFACE" -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true

    sed -i 's/^net.ipv4.ip_forward=1/net.ipv4.ip_forward=0/' /etc/sysctl.conf
    sysctl -w net.ipv4.ip_forward=0 >/dev/null

    systemctl daemon-reload
    log "Uninstall complete. Reboot recommended."
    exit 0
fi

# ---- Preflight ----
[[ $EUID -ne 0 ]] && err "Run as root: sudo bash $0"
iw dev "$AP_INTERFACE" info &>/dev/null || err "Interface '$AP_INTERFACE' not found."
[[ ${#AP_PASSPHRASE} -lt 8 ]] && err "Passphrase must be >= 8 characters."

# ---- Install packages ----
log "Installing hostapd + dnsmasq..."
apt-get update -qq
apt-get install -y hostapd dnsmasq iptables
systemctl stop hostapd dnsmasq 2>/dev/null || true

# ---- Static IP for wlan0 ----
log "Setting static IP on $AP_INTERFACE..."

# NetworkManager — hands off
systemctl is-active --quiet NetworkManager &&
    nmcli device set "$AP_INTERFACE" managed no 2>/dev/null || true

# dhcpcd (Raspberry Pi OS < Bookworm)
DHCPCD_CONF="/etc/dhcpcd.conf"
if [[ -f "$DHCPCD_CONF" ]] && ! grep -q "# --- rpi4-ap ---" "$DHCPCD_CONF"; then
    cat >> "$DHCPCD_CONF" <<EOF

# --- rpi4-ap ---
interface $AP_INTERFACE
    static ip_address=${AP_IP}/24
    nohook wpa_supplicant
EOF
fi

# ---- hostapd ----
log "Configuring hostapd..."
cat > /etc/hostapd/hostapd.conf <<EOF
interface=$AP_INTERFACE
driver=nl80211
ssid=$AP_SSID
hw_mode=g
channel=$AP_CHANNEL
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=$AP_PASSPHRASE
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
ieee80211n=1
EOF

mkdir -p /etc/systemd/system/hostapd.service.d
cat > /etc/systemd/system/hostapd.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/sbin/hostapd /etc/hostapd/hostapd.conf
EOF

# ---- dnsmasq ----
log "Configuring dnsmasq..."
[[ -f /etc/dnsmasq.conf && ! -f /etc/dnsmasq.conf.orig ]] && cp /etc/dnsmasq.conf /etc/dnsmasq.conf.orig

cat > /etc/dnsmasq.conf <<EOF
interface=$AP_INTERFACE
bind-interfaces
dhcp-range=$DHCP_RANGE_START,$DHCP_RANGE_END,$AP_NETMASK,$DHCP_LEASE_TIME
dhcp-option=3,$AP_IP
dhcp-option=6,$AP_IP
domain=piserver.local
address=/piserver.local/$AP_IP
EOF

# ---- IP forwarding + NAT ----
log "Enabling IP forwarding + NAT ($AP_INTERFACE -> $UPSTREAM_INTERFACE)..."
sed -i 's/^#\?net.ipv4.ip_forward=.*/net.ipv4.ip_forward=1/' /etc/sysctl.conf
sysctl -w net.ipv4.ip_forward=1 >/dev/null

iptables -t nat -C POSTROUTING -o "$UPSTREAM_INTERFACE" -j MASQUERADE 2>/dev/null ||
    iptables -t nat -A POSTROUTING -o "$UPSTREAM_INTERFACE" -j MASQUERADE
iptables -C FORWARD -i "$AP_INTERFACE" -o "$UPSTREAM_INTERFACE" -j ACCEPT 2>/dev/null ||
    iptables -A FORWARD -i "$AP_INTERFACE" -o "$UPSTREAM_INTERFACE" -j ACCEPT
iptables -C FORWARD -i "$UPSTREAM_INTERFACE" -o "$AP_INTERFACE" -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null ||
    iptables -A FORWARD -i "$UPSTREAM_INTERFACE" -o "$AP_INTERFACE" -m state --state RELATED,ESTABLISHED -j ACCEPT

apt-get install -y iptables-persistent
netfilter-persistent save

# ---- Bring up interface + start services ----
log "Starting AP..."
ip link set "$AP_INTERFACE" down 2>/dev/null || true
ip addr flush dev "$AP_INTERFACE" 2>/dev/null || true
ip addr add "${AP_IP}/24" dev "$AP_INTERFACE"
ip link set "$AP_INTERFACE" up

systemctl unmask hostapd
systemctl daemon-reload
systemctl enable --now hostapd dnsmasq

# ---- Verify ----
sleep 2
echo ""
systemctl is-active --quiet hostapd && log "hostapd: running" || warn "hostapd failed — journalctl -u hostapd"
systemctl is-active --quiet dnsmasq && log "dnsmasq: running" || warn "dnsmasq failed — journalctl -u dnsmasq"

echo ""
echo "=============================================="
echo -e " ${GREEN}AP Ready${NC}"
echo "=============================================="
echo " SSID:       $AP_SSID"
echo " Password:   $AP_PASSPHRASE"
echo " Gateway:    $AP_IP"
echo " DHCP:       $DHCP_RANGE_START – $DHCP_RANGE_END"
echo " DNS alias:  piserver.local"
echo " NAT:        $AP_INTERFACE -> $UPSTREAM_INTERFACE"
echo "=============================================="
echo ""
echo " Docker containers with published ports are"
echo " reachable from any AP client at:"
echo "   http://$AP_IP:<port>"
echo "   http://piserver.local:<port>"
echo ""
echo " Undo:  sudo bash $0 --uninstall"
echo "=============================================="
