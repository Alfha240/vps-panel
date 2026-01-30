#!/bin/bash

# VPS Panel Installation Script
# Supports Ubuntu 20.04/22.04

# Exit on error
set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting VPS Panel Installation...${NC}"

# 1. Ask for Domain/IP and Database Password
read -p "Enter your Domain Name or VPS IP: " DOMAIN_NAME
read -sp "Enter a secure password for the database user: " DB_PASS
echo ""

# 2. Update System and Install Dependencies
echo -e "${GREEN}Updating system and installing dependencies...${NC}"
apt update && apt upgrade -y
apt install apache2 mysql-server php php-mysql php-cli libapache2-mod-php unzip git -y

# 3. Setup Database
echo -e "${GREEN}Configuring Database...${NC}"
mysql -u root -e "CREATE DATABASE IF NOT EXISTS vps_panel;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'panel_user'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -u root -e "GRANT ALL PRIVILEGES ON vps_panel.* TO 'panel_user'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# Import SQL
# Assuming script is run from inside the cloned repo
if [ -f "database.sql" ]; then
    mysql -u root vps_panel < database.sql
    echo -e "${GREEN}Database schema imported successfully!${NC}"
else
    echo "database.sql not found! Please run this script from inside the repository folder."
    exit 1
fi

# Import admin migration
if [ -f "migrate_admin.sql" ]; then
    mysql -u root vps_panel < migrate_admin.sql
    echo -e "${GREEN}Admin migration completed!${NC}"
fi

# 4. Setup Web Files
echo -e "${GREEN}Setting up web files...${NC}"
# Determine current directory
REPO_DIR=$(pwd)
TARGET_DIR="/var/www/html/vps-panel"

# Move/Copy files to target directory
mkdir -p $TARGET_DIR
cp -r * $TARGET_DIR/

# Update config.php
sed -i "s/define('DB_PASSWORD', '');/define('DB_PASSWORD', '$DB_PASS');/" $TARGET_DIR/config.php
sed -i "s/define('DB_USERNAME', 'root');/define('DB_USERNAME', 'panel_user');/" $TARGET_DIR/config.php

# Set Permissions
chown -R www-data:www-data $TARGET_DIR
chmod -R 755 $TARGET_DIR

# Set executable permissions for scripts
chmod +x $TARGET_DIR/install.sh
chmod +x $TARGET_DIR/update.sh
chmod +x $TARGET_DIR/make-user.php
chmod 644 $TARGET_DIR/*.php
chmod +x $TARGET_DIR/make-user.php

# 5. Configure Apache
echo -e "${GREEN}Configuring Apache...${NC}"
cat > /etc/apache2/sites-available/vps-panel.conf <<EOF
<VirtualHost *:80>
    ServerAdmin admin@$DOMAIN_NAME
    DocumentRoot $TARGET_DIR
    ServerName $DOMAIN_NAME

    <Directory $TARGET_DIR>
        Options Indexes FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>

    ErrorLog \${APACHE_LOG_DIR}/error.log
    CustomLog \${APACHE_LOG_DIR}/access.log combined
</VirtualHost>
EOF

# Enable Site and Rewrite Module
a2ensite vps-panel.conf
a2enmod rewrite
systemctl restart apache2

echo -e "${GREEN}Installation Complete!${NC}"
echo -e "You can access your panel at: http://$DOMAIN_NAME"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Create an admin user: cd $TARGET_DIR && php make-user.php"
echo "2. Login at: http://$DOMAIN_NAME"
