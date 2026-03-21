#!/bin/bash
set -euo pipefail
# ----- Configuration (edit these) -----
AP_SSID="Zrakove hry"
AP_PASSPHRASE="stropoffka"      # min 8 characters
AP_CHANNEL=7
AP_INTERFACE="wlan0"
AP_IP="192.168.50.1"
AP_NETMASK="255.255.255.0"
DHCP_RANGE_START="192.168.50.10"
DHCP_RANGE_END="192.168.50.50"
DHCP_LEASE_TIME="24h"
# Set to "yes" to forward AP traffic to eth0 (internet sharing)
ENABLE_NAT="yes"
UPSTREAM_INTERFACE="eth0"
# ---------------------------------------

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()  { echo -e "${GREEN}[+]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; exit 1; }

# ---- Preflight checks ----
if [[ $EUID -ne 0 ]]; then
    err "Run this script as root:  sudo bash $0"
fi

if ! iw dev "$AP_INTERFACE" info &>/dev/null; then
    err "Wireless interface '$AP_INTERFACE' not found. Check with 'iw dev'."
fi

if [[ ${#AP_PASSPHRASE} -lt 8 ]]; then
    err "WPA passphrase must be at least 8 characters."
fi

# ---- Step 1: Install required packages ----
log "Installing hostapd and dnsmasq..."
apt-get update -qq
apt-get install -y hostapd dnsmasq iptables

# Stop services while we configure
systemctl stop hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true

# ---- Step 2: Disable wpa_supplicant on AP interface ----
log "Disabling wpa_supplicant for $AP_INTERFACE..."
# Prevent NetworkManager / dhcpcd from managing wlan0
if systemctl is-active --quiet NetworkManager; then
    nmcli device set "$AP_INTERFACE" managed no 2>/dev/null || true
fi

# If using dhcpcd (Raspberry Pi OS default)
DHCPCD_CONF="/etc/dhcpcd.conf"
if [[ -f "$DHCPCD_CONF" ]]; then
    if ! grep -q "interface $AP_INTERFACE" "$DHCPCD_CONF"; then
        log "Configuring static IP in dhcpcd.conf..."
        cat >> "$DHCPCD_CONF" <<EOF

# --- Added by rpi4-ap-setup.sh ---
interface $AP_INTERFACE
    static ip_address=${AP_IP}/24
    nohook wpa_supplicant
EOF
    else
        warn "dhcpcd.conf already has an entry for $AP_INTERFACE — skipping."
    fi
fi

# ---- Step 3: Configure hostapd ----
log "Writing hostapd configuration..."
cat > /etc/hostapd/hostapd.conf <<EOF
# Interface and driver
interface=$AP_INTERFACE
driver=nl80211

# AP settings
ssid=$AP_SSID
hw_mode=g
channel=$AP_CHANNEL
wmm_enabled=0
macaddr_acl=0

# Security
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=$AP_PASSPHRASE
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP

# 802.11n support (Pi 4 capable)
ieee80211n=1
EOF

# Point hostapd to our config
sed -i 's|^#\?DAEMON_CONF=.*|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd 2>/dev/null || true

# Also handle the systemd override
mkdir -p /etc/systemd/system/hostapd.service.d
cat > /etc/systemd/system/hostapd.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/sbin/hostapd /etc/hostapd/hostapd.conf
EOF

# ---- Step 4: Configure dnsmasq ----
log "Writing dnsmasq configuration..."

# Back up original config
if [[ -f /etc/dnsmasq.conf && ! -f /etc/dnsmasq.conf.orig ]]; then
    cp /etc/dnsmasq.conf /etc/dnsmasq.conf.orig
fi

cat > /etc/dnsmasq.conf <<EOF
# Only listen on AP interface
interface=$AP_INTERFACE
bind-interfaces

# DHCP range
dhcp-range=$DHCP_RANGE_START,$DHCP_RANGE_END,$AP_NETMASK,$DHCP_LEASE_TIME

# Announce the Pi as the gateway and DNS server
dhcp-option=3,$AP_IP
dhcp-option=6,$AP_IP

# Local domain (optional, makes piserver.local resolve)
domain=piserver.local
address=/piserver.local/$AP_IP

# Logging (useful for debugging, disable later if you want)
log-queries
log-dhcp
EOF

# ---- Step 5: Enable IP forwarding + NAT (optional) ----
if [[ "$ENABLE_NAT" == "yes" ]]; then
    log "Enabling IP forwarding and NAT ($AP_INTERFACE -> $UPSTREAM_INTERFACE)..."

    # Persistent
    sed -i 's/^#\?net.ipv4.ip_forward=.*/net.ipv4.ip_forward=1/' /etc/sysctl.conf
    sysctl -w net.ipv4.ip_forward=1 > /dev/null

    # iptables masquerade
    iptables -t nat -C POSTROUTING -o "$UPSTREAM_INTERFACE" -j MASQUERADE 2>/dev/null ||
        iptables -t nat -A POSTROUTING -o "$UPSTREAM_INTERFACE" -j MASQUERADE

    iptables -C FORWARD -i "$AP_INTERFACE" -o "$UPSTREAM_INTERFACE" -j ACCEPT 2>/dev/null ||
        iptables -A FORWARD -i "$AP_INTERFACE" -o "$UPSTREAM_INTERFACE" -j ACCEPT

    iptables -C FORWARD -i "$UPSTREAM_INTERFACE" -o "$AP_INTERFACE" -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null ||
        iptables -A FORWARD -i "$UPSTREAM_INTERFACE" -o "$AP_INTERFACE" -m state --state RELATED,ESTABLISHED -j ACCEPT

    # Persist iptables rules
    apt-get install -y iptables-persistent
    netfilter-persistent save
else
    log "NAT disabled — AP clients will only reach the Pi, not the internet."
fi

# ---- Step 6: Bring up the interface manually for now ----
log "Bringing up $AP_INTERFACE with static IP $AP_IP..."
ip link set "$AP_INTERFACE" down 2>/dev/null || true
ip addr flush dev "$AP_INTERFACE" 2>/dev/null || true
ip addr add "${AP_IP}/24" dev "$AP_INTERFACE"
ip link set "$AP_INTERFACE" up

# ---- Step 7: Unmask and enable services ----
log "Enabling and starting services..."
systemctl unmask hostapd
systemctl daemon-reload
systemctl enable hostapd
systemctl enable dnsmasq
systemctl restart dnsmasq
systemctl restart hostapd

# ---- Step 8: Verify ----
sleep 2
echo ""
if systemctl is-active --quiet hostapd; then
    log "hostapd is ${GREEN}running${NC}"
else
    warn "hostapd failed to start — check: journalctl -u hostapd"
fi

if systemctl is-active --quiet dnsmasq; then
    log "dnsmasq is ${GREEN}running${NC}"
else
    warn "dnsmasq failed to start — check: journalctl -u dnsmasq"
fi

echo ""
echo "=============================================="
echo -e " ${GREEN}Access Point Setup Complete${NC}"
echo "=============================================="
echo " SSID:          $AP_SSID"
echo " Password:      $AP_PASSPHRASE"
echo " Pi IP:         $AP_IP"
echo " DHCP range:    $DHCP_RANGE_START - $DHCP_RANGE_END"
echo " DNS alias:     piserver.local -> $AP_IP"
if [[ "$ENABLE_NAT" == "yes" ]]; then
echo " NAT:           $AP_INTERFACE -> $UPSTREAM_INTERFACE"
fi
echo "=============================================="
echo ""
echo " Clients can reach your server at:"
echo "   http://$AP_IP:<port>"
echo "   http://piserver.local:<port>"
echo ""
echo " To undo everything, run:"
echo "   sudo bash $(realpath "$0") --uninstall"
echo "=============================================="


# ---- Uninstall mode ----
if [[ "${1:-}" == "--uninstall" ]]; then
    log "Reverting access point setup..."
    systemctl stop hostapd dnsmasq
    systemctl disable hostapd dnsmasq

    # Restore dnsmasq config
    [[ -f /etc/dnsmasq.conf.orig ]] && mv /etc/dnsmasq.conf.orig /etc/dnsmasq.conf

    # Remove hostapd config
    rm -f /etc/hostapd/hostapd.conf
    rm -rf /etc/systemd/system/hostapd.service.d

    # Remove dhcpcd additions
    if [[ -f "$DHCPCD_CONF" ]]; then
        sed -i '/# --- Added by rpi4-ap-setup.sh ---/,/nohook wpa_supplicant/d' "$DHCPCD_CONF"
    fi

    # Remove NAT rules
    iptables -t nat -D POSTROUTING -o "$UPSTREAM_INTERFACE" -j MASQUERADE 2>/dev/null || true
    iptables -D FORWARD -i "$AP_INTERFACE" -o "$UPSTREAM_INTERFACE" -j ACCEPT 2>/dev/null || true
    iptables -D FORWARD -i "$UPSTREAM_INTERFACE" -o "$AP_INTERFACE" -m state --state RELATED,ESTABLISHED -j ACCEPT 2>/dev/null || true

    sed -i 's/^net.ipv4.ip_forward=1/net.ipv4.ip_forward=0/' /etc/sysctl.conf
    sysctl -w net.ipv4.ip_forward=0 > /dev/null

    systemctl daemon-reload
    log "Uninstall complete. Reboot recommended."
    exit 0
fi
