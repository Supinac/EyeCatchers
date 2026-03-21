#!/bin/bash
set -e
AP_SSID="EyeCatchers"
AP_PASSWORD="password123"
AP_IP="10.42.0.1"
AP_SUBNET="10.42.0.0/24"
DHCP_RANGE_START="10.42.0.10"
DHCP_RANGE_END="10.42.0.100"
DHCP_LEASE="24h"

DB_NAME="eyecatchers"
DB_USER="eyecatchers"
DB_PASSWORD="password123"   # change this

API_PORT="80"

# Auto-detect the user who cloned the repo (the one who ran sudo)
PI_USER="${SUDO_USER:-pi}"
PI_HOME="/home/${PI_USER}"

# Try to find the backend directory
if [ -d "${PI_HOME}/EyeCatchers/backend" ]; then
    BACKEND_DIR="${PI_HOME}/EyeCatchers/backend"
elif [ -d "$(dirname "$(realpath "$0")")" ]; then
    BACKEND_DIR="$(dirname "$(realpath "$0")")"
else
    echo "ERROR: Cannot find the backend directory."
    echo "Make sure you cloned the repo to ${PI_HOME}/EyeCatchers"
    exit 1
fi

echo "============================================"
echo " EyeCatchers Raspberry Pi Setup"
echo "============================================"
echo " AP SSID:      ${AP_SSID}"
echo " AP Password:  ${AP_PASSWORD}"
echo " AP IP:        ${AP_IP}"
echo " Backend dir:  ${BACKEND_DIR}"
echo " DB name:      ${DB_NAME}"
echo " Pi user:      ${PI_USER}"
echo "============================================"
echo ""
read -p "Continue? (y/n) " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
fi

# ---------------------------
# 1. System update
# ---------------------------
echo ""
echo "[1/6] Updating system packages..."
apt update && apt upgrade -y

# ---------------------------
# 2. Install dependencies
# ---------------------------
echo ""
echo "[2/6] Installing dependencies..."
apt install -y \
    hostapd \
    dnsmasq \
    iptables \
    mariadb-server \
    libmariadb-dev \
    python3 \
    python3-venv \
    python3-pip \
    git

# ---------------------------
# 3. Configure WiFi AP
# ---------------------------
echo ""
echo "[3/6] Configuring WiFi Access Point..."

# Stop services while configuring
systemctl stop hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true

# Disable NetworkManager for wlan0 (Bookworm uses NM by default)
# We'll manage wlan0 manually via hostapd + dnsmasq
if systemctl is-active --quiet NetworkManager; then
    echo "Telling NetworkManager to ignore wlan0..."
    cat > /etc/NetworkManager/conf.d/99-unmanaged-wlan0.conf <<EOF
[keyfile]
unmanaged-devices=interface-name:wlan0
EOF
    systemctl restart NetworkManager
fi

# Unblock WiFi (in case rfkill has it blocked)
rfkill unblock wlan

# Set static IP on wlan0
cat > /etc/network/interfaces.d/wlan0 <<EOF
auto wlan0
iface wlan0 inet static
    address ${AP_IP}
    netmask 255.255.255.0
EOF

# Configure hostapd
cat > /etc/hostapd/hostapd.conf <<EOF
interface=wlan0
driver=nl80211
ssid=${AP_SSID}
hw_mode=g
channel=7
wmm_enabled=0
macaddr_acl=0
auth_algs=1
ignore_broadcast_ssid=0
wpa=2
wpa_passphrase=${AP_PASSWORD}
wpa_key_mgmt=WPA-PSK
wpa_pairwise=TKIP
rsn_pairwise=CCMP
# Use 802.11n for better speed if supported
ieee80211n=1
EOF

# Point hostapd to its config
sed -i 's|^#DAEMON_CONF=.*|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd 2>/dev/null || true
# Also create the systemd override for Bookworm
mkdir -p /etc/systemd/system/hostapd.service.d
cat > /etc/systemd/system/hostapd.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/sbin/hostapd /etc/hostapd/hostapd.conf
EOF

# Configure dnsmasq (DHCP server)
mv /etc/dnsmasq.conf /etc/dnsmasq.conf.bak 2>/dev/null || true
cat > /etc/dnsmasq.conf <<EOF
interface=wlan0
bind-interfaces
dhcp-range=${DHCP_RANGE_START},${DHCP_RANGE_END},${DHCP_LEASE}
# Optional: make the Pi reachable as "eyecatchers.local"
address=/eyecatchers.local/${AP_IP}
EOF

# Enable and unmask services
systemctl unmask hostapd
systemctl enable hostapd
systemctl enable dnsmasq

echo "WiFi AP configured: ${AP_SSID}"

# ---------------------------
# 4. Set up MariaDB
# ---------------------------
echo ""
echo "[4/6] Setting up MariaDB..."

systemctl enable mariadb
systemctl start mariadb

# Create database and user
mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
CREATE USER IF NOT EXISTS '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
GRANT ALL PRIVILEGES ON ${DB_NAME}.* TO '${DB_USER}'@'localhost';
FLUSH PRIVILEGES;
EOF

echo "Database '${DB_NAME}' ready."

# ---------------------------
# 5. Set up the backend
# ---------------------------
echo ""
echo "[5/6] Setting up EyeCatchers backend..."

cd "${BACKEND_DIR}"

# Fix requirements.txt (add missing deps)
cat > requirements.txt <<EOF
fastapi[standard]
sqlalchemy[standard]
mysql-connector-python
pydantic-settings
EOF

# Create venv and install
python3 -m venv .venv
.venv/bin/pip install --upgrade pip
.venv/bin/pip install -r requirements.txt

# Create .env
cat > .env <<EOF
DB_USER=${DB_USER}
DB_PASSWORD=${DB_PASSWORD}
DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=${DB_NAME}
EOF

# Fix ownership
chown -R ${PI_USER}:${PI_USER} "${BACKEND_DIR}"

echo "Backend installed at ${BACKEND_DIR}"

# ---------------------------
# 6. Create systemd service
# ---------------------------
echo ""
echo "[6/6] Creating systemd service..."

cat > /etc/systemd/system/eyecatchers.service <<EOF
[Unit]
Description=EyeCatchers FastAPI Backend
After=network.target mariadb.service hostapd.service
Wants=mariadb.service

[Service]
Type=simple
User=${PI_USER}
WorkingDirectory=${BACKEND_DIR}
ExecStart=${BACKEND_DIR}/.venv/bin/fastapi run app/main.py --host 0.0.0.0 --port ${API_PORT}
Restart=always
RestartSec=5
EnvironmentFile=${BACKEND_DIR}/.env

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable eyecatchers

echo ""
echo "============================================"
echo " Setup complete!"
echo "============================================"
echo ""
echo " After reboot:"
echo "   1. Connect to WiFi: ${AP_SSID}"
echo "      Password: ${AP_PASSWORD}"
echo "   2. Open: http://${AP_IP}/docs"
echo ""
echo " Useful commands:"
echo "   sudo systemctl status eyecatchers"
echo "   sudo systemctl restart eyecatchers"
echo "   sudo journalctl -u eyecatchers -f"
echo ""
echo " NOTE: After reboot, wlan0 becomes the AP."
echo " If you need SSH access, connect to the"
echo " '${AP_SSID}' WiFi first, then:"
echo "   ssh ${PI_USER}@${AP_IP}"
echo ""
read -p "Reboot now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    reboot
fi
