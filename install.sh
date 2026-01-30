#!/bin/bash

################################################################################
# VPS Panel - Automated Installation Script
# For Ubuntu 20.04/22.04 and Debian 11/12
################################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Print functions
print_success() { echo -e "${GREEN}✓${NC} $1"; }
print_error() { echo -e "${RED}✗${NC} $1"; }
print_info() { echo -e "${YELLOW}➜${NC} $1"; }

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   print_error "This script must be run as root"
   exit 1
fi

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║          VPS Panel - Automated Installation              ║"
echo "║                                                           ║"
echo "║  This will install:                                       ║"
echo "║  • Apache Web Server                                      ║"
echo "║  • MySQL Database                                         ║"
echo "║  • PHP 8.1+ with extensions                              ║"
echo "║  • VPS Panel Application                                  ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Prompt for configuration
print_info "Configuration Setup"
echo ""

read -p "Domain name or IP (e.g., panel.example.com): " DOMAIN
read -p "MySQL root password: " -s MYSQL_ROOT_PASS
echo ""
read -p "Database password for vps_user: " -s DB_PASSWORD
echo ""

# Generate random password if empty
if [ -z "$DB_PASSWORD" ]; then
    DB_PASSWORD=$(openssl rand -base64 16)
    print_info "Generated database password: $DB_PASSWORD"
fi

echo ""
print_info "Starting installation..."
echo ""

# Update system
print_info "Updating system packages..."
apt update -qq && apt upgrade -y -qq
print_success "System updated"

# Install required packages
print_info "Installing required packages..."
apt install -y -qq apache2 mysql-server php php-cli php-mysql php-curl php-json php-mbstring php-xml php-zip git unzip curl
print_success "Packages installed"

# Configure MySQL
print_info "Configuring MySQL..."
mysql -e "ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY '${MYSQL_ROOT_PASS}';" || true
mysql -u root -p"${MYSQL_ROOT_PASS}" -e "CREATE DATABASE IF NOT EXISTS vps_panel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;"
mysql -u root -p"${MYSQL_ROOT_PASS}" -e "CREATE USER IF NOT EXISTS 'vps_user'@'localhost' IDENTIFIED BY '${DB_PASSWORD}';"
mysql -u root -p"${MYSQL_ROOT_PASS}" -e "GRANT ALL PRIVILEGES ON vps_panel.* TO 'vps_user'@'localhost';"
mysql -u root -p"${MYSQL_ROOT_PASS}" -e "FLUSH PRIVILEGES;"
print_success "MySQL configured"

# Clone repository
print_info "Cloning VPS Panel repository..."
cd /var/www/
if [ -d "vps-panel" ]; then
    rm -rf vps-panel
fi
git clone -q https://github.com/Alfha240/vps-panel.git
cd vps-panel
print_success "Repository cloned"

# Import database schema
print_info "Importing database schema..."
mysql -u vps_user -p"${DB_PASSWORD}" vps_panel < install.sql
print_success "Database schema imported"

# Configure application
print_info "Configuring application..."
cat > includes/config.php << EOF
<?php
/**
 * VPS Panel Configuration
 * Auto-generated during installation
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'vps_panel');
define('DB_USER', 'vps_user');
define('DB_PASS', '${DB_PASSWORD}');

// Application Settings
define('APP_NAME', 'VPS Panel');
define('APP_URL', 'http://${DOMAIN}');

// Session Configuration
session_start();
define('SESSION_LIFETIME', 1800); // 30 minutes

// Security Settings
define('PASSWORD_COST', 12);
define('CSRF_TOKEN_NAME', '_token');

// Timezone
date_default_timezone_set('Asia/Kolkata');
EOF
print_success "Application configured"

# Set permissions
print_info "Setting file permissions..."
chown -R www-data:www-data /var/www/vps-panel
chmod -R 755 /var/www/vps-panel
print_success "Permissions set"

# Configure Apache
print_info "Configuring Apache..."
a2enmod rewrite > /dev/null 2>&1

cat > /etc/apache2/sites-available/vps-panel.conf << EOF
<VirtualHost *:80>
    ServerName ${DOMAIN}
    DocumentRoot /var/www/vps-panel
    
    <Directory /var/www/vps-panel>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog \${APACHE_LOG_DIR}/vps-panel-error.log
    CustomLog \${APACHE_LOG_DIR}/vps-panel-access.log combined
</VirtualHost>
EOF

a2ensite vps-panel.conf > /dev/null 2>&1
a2dissite 000-default.conf > /dev/null 2>&1
systemctl restart apache2
print_success "Apache configured"

# Configure firewall
print_info "Configuring firewall..."
ufw --force enable > /dev/null 2>&1
ufw allow 80/tcp > /dev/null 2>&1
ufw allow 443/tcp > /dev/null 2>&1
ufw allow 22/tcp > /dev/null 2>&1
print_success "Firewall configured"

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              Installation Complete!                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
print_success "VPS Panel installed successfully!"
echo ""
print_info "Next Steps:"
echo ""
echo "1. Create admin user:"
echo "   cd /var/www/vps-panel"
echo "   sudo php cli/create-user.php"
echo ""
echo "2. Access your panel:"
echo "   http://${DOMAIN}"
echo ""
echo "3. Configure SSL (recommended):"
echo "   sudo apt install certbot python3-certbot-apache"
echo "   sudo certbot --apache -d ${DOMAIN}"
echo ""
print_info "Configuration saved:"
echo "   Database: vps_panel"
echo "   DB User: vps_user"
echo "   DB Password: ${DB_PASSWORD}"
echo "   App URL: http://${DOMAIN}"
echo ""
print_info "IMPORTANT: Save this information securely!"
echo ""
