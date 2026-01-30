#!/bin/bash

# install-nginx.sh
# Installation script for Nginx + PHP-FPM

# Exit on error
set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Starting VPS Panel Installation (Nginx)...${NC}"

# 1. Ask for Domain/IP and Database Password
read -p "Enter your Domain Name or VPS IP: " DOMAIN_NAME
read -sp "Enter a secure password for the database user: " DB_PASS
echo ""

# 2. Update System and Install Dependencies
echo -e "${GREEN}Updating system and installing dependencies...${NC}"
apt update && apt upgrade -y
apt install nginx mysql-server php-fpm php-mysql php-cli unzip git -y

# 3. Setup Database
echo -e "${GREEN}Configuring Database...${NC}"
mysql -u root -e "CREATE DATABASE IF NOT EXISTS vps_panel;"
mysql -u root -e "CREATE USER IF NOT EXISTS 'panel_user'@'localhost' IDENTIFIED BY '$DB_PASS';"
mysql -u root -e "GRANT ALL PRIVILEGES ON vps_panel.* TO 'panel_user'@'localhost';"
mysql -u root -e "FLUSH PRIVILEGES;"

# Import SQL
REPO_DIR=$(pwd)
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
TARGET_DIR="/var/www/html/vps-panel"

mkdir -p $TARGET_DIR
cp -r * $TARGET_DIR/

# Update config.php
sed -i "s/define('DB_PASSWORD', '');/define('DB_PASSWORD', '$DB_PASS');/" $TARGET_DIR/config.php
sed -i "s/define('DB_USERNAME', 'root');/define('DB_USERNAME', 'panel_user');/" $TARGET_DIR/config.php

# Set Permissions
chown -R www-data:www-data $TARGET_DIR
chmod -R 755 $TARGET_DIR

# 5. Configure Nginx
echo -e "${GREEN}Configuring Nginx...${NC}"
cat > /etc/nginx/sites-available/vps-panel <<EOF
server {
    listen 80;
    server_name $DOMAIN_NAME;
    root $TARGET_DIR;
    index index.php index.html;

    location / {
        try_files \$uri \$uri/ /index.php?\$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
        fastcgi_param SCRIPT_FILENAME \$document_root\$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.ht {
        deny all;
    }
}
EOF

# Enable Site
ln -sf /etc/nginx/sites-available/vps-panel /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and Restart Nginx
nginx -t
systemctl restart nginx
systemctl restart php*-fpm

echo -e "${GREEN}Installation Complete!${NC}"
echo -e "You can access your panel at: http://$DOMAIN_NAME"
echo ""
echo -e "${GREEN}Next Steps:${NC}"
echo "1. Create an admin user: cd $TARGET_DIR && php /tmp/create-user.php"
echo "2. Login at: http://$DOMAIN_NAME"
