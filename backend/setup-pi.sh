#!/bin/bash
# ============================================================
# EyeCatchers RPi Setup Script
# Turns a fresh Raspberry Pi OS Lite (Bookworm, 64-bit) into:
#   - A WiFi Access Point (hotspot)
#   - A MariaDB database server
#   - The EyeCatchers FastAPI backend (auto-start on boot)
#
# Usage:
#   1. Flash RPi OS Lite 64-bit with SSH enabled
#   2. Boot the Pi, connect via ethernet, and SSH in
#   3. Clone the repo:  git clone https://github.com/Supinac/EyeCatchers.git
#   4. Run:  sudo bash EyeCatchers/backend/setup-pi.sh
#   5. Reboot when prompted
#
# After reboot:
#   - Connect to WiFi "EyeCatchers" (password: eyecatchers123)
#   - API docs: http://10.42.0.1/docs
#   - SSH back: ssh <user>@10.42.0.1
# ============================================================

set -e

# ---------------------------
# Configuration - edit these
# ---------------------------
AP_SSID="EyeCatchers"
AP_PASSWORD="eyecatchers123"    # min 8 characters
AP_IP="10.42.0.1"
DHCP_RANGE_START="10.42.0.10"
DHCP_RANGE_END="10.42.0.100"
DHCP_LEASE="24h"

DB_NAME="eyecatchers"
DB_USER="eyecatchers"
DB_PASSWORD="eyecatchers_db_pass"   # change this

API_PORT="80"

# Auto-detect the user who cloned the repo
PI_USER="${SUDO_USER:-pi}"
PI_HOME="/home/${PI_USER}"

# Find the backend directory
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

systemctl stop hostapd 2>/dev/null || true
systemctl stop dnsmasq 2>/dev/null || true

# Tell NetworkManager to ignore wlan0
if systemctl is-active --quiet NetworkManager; then
    echo "Telling NetworkManager to ignore wlan0..."
    cat > /etc/NetworkManager/conf.d/99-unmanaged-wlan0.conf <<EOF
[keyfile]
unmanaged-devices=interface-name:wlan0
EOF
    systemctl restart NetworkManager
fi

rfkill unblock wlan

# Static IP on wlan0
cat > /etc/network/interfaces.d/wlan0 <<EOF
auto wlan0
iface wlan0 inet static
    address ${AP_IP}
    netmask 255.255.255.0
EOF

# hostapd config
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
ieee80211n=1
EOF

sed -i 's|^#DAEMON_CONF=.*|DAEMON_CONF="/etc/hostapd/hostapd.conf"|' /etc/default/hostapd 2>/dev/null || true
mkdir -p /etc/systemd/system/hostapd.service.d
cat > /etc/systemd/system/hostapd.service.d/override.conf <<EOF
[Service]
ExecStart=
ExecStart=/usr/sbin/hostapd /etc/hostapd/hostapd.conf
EOF

# dnsmasq config (DHCP)
mv /etc/dnsmasq.conf /etc/dnsmasq.conf.bak 2>/dev/null || true
cat > /etc/dnsmasq.conf <<EOF
interface=wlan0
bind-interfaces
dhcp-range=${DHCP_RANGE_START},${DHCP_RANGE_END},${DHCP_LEASE}
address=/eyecatchers.local/${AP_IP}
EOF

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

mysql -u root <<EOF
CREATE DATABASE IF NOT EXISTS ${DB_NAME};
DROP USER IF EXISTS '${DB_USER}'@'localhost';
CREATE USER '${DB_USER}'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';
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

# Write correct requirements
cat > requirements.txt <<EOF
fastapi[standard]
sqlalchemy[standard]
mysql-connector-python
pydantic-settings
passlib[bcrypt]
bcrypt<4.1
python-jose[cryptography]
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
echo "   2. API docs: http://${AP_IP}/docs"
echo "   3. SSH: ssh ${PI_USER}@${AP_IP}"
echo ""
echo " Useful commands:"
echo "   sudo systemctl status eyecatchers"
echo "   sudo systemctl restart eyecatchers"
echo "   sudo journalctl -u eyecatchers -f"
echo ""
read -p "Reboot now? (y/n) " -n 1 -r
echo ""
if [[ $REPLY =~ ^[Yy]$ ]]; then
    reboot
fi
