#!/bin/bash

################################################################################
# VPS Panel - Nginx Installation Script
# Switches from Apache to Nginx + PHP-FPM
################################################################################

set -e

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║       VPS Panel - Nginx Installation                     ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""

# Check if running as root
if [[ $EUID -ne 0 ]]; then
   echo "✗ This script must be run as root"
   exit 1
fi

echo "➜ Step 1: Stopping and removing Apache..."
systemctl stop apache2
systemctl disable apache2
apt remove --purge apache2 apache2-utils -y
apt autoremove -y

echo "➜ Step 2: Installing Nginx and PHP-FPM..."
apt update
apt install -y nginx php-fpm php-mysql php-curl php-mbstring php-xml php-zip

echo "➜ Step 3: Configuring Nginx..."
# Backup default config
if [ -f /etc/nginx/sites-enabled/default ]; then
    rm /etc/nginx/sites-enabled/default
fi

# Create VPS Panel Nginx config
cat > /etc/nginx/sites-available/vps-panel << 'EOF'
server {
    listen 80;
    server_name 162.141.0.65;
    root /var/www/html/vps-panel;
    index index.php index.html;

    access_log /var/log/nginx/vps-panel-access.log;
    error_log /var/log/nginx/vps-panel-error.log;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    server_tokens off;

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }

    location ~ /install\.sql$ {
        deny all;
    }

    location ~* ^/includes/ {
        deny all;
    }

    # Main location
    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    # PHP processing
    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
        fastcgi_read_timeout 300;
    }

    # Cache static assets
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|woff|woff2|ttf|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss application/javascript application/json;
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/vps-panel /etc/nginx/sites-enabled/

echo "➜ Step 4: Testing Nginx configuration..."
nginx -t

echo "➜ Step 5: Setting permissions..."
chown -R www-data:www-data /var/www/html/vps-panel
chmod -R 755 /var/www/html/vps-panel

echo "➜ Step 6: Starting services..."
systemctl enable nginx
systemctl enable php8.1-fpm
systemctl start php8.1-fpm
systemctl restart nginx

echo "➜ Step 7: Importing database (if not done)..."
if ! mysql -u vps_user -plordcloud vps_panel -e "SHOW TABLES LIKE 'users';" | grep -q users; then
    echo "   Importing install.sql..."
    mysql -u vps_user -plordcloud vps_panel < /var/www/html/vps-panel/install.sql
else
    echo "   Database already exists, skipping import."
fi

echo "➜ Step 8: Configuring firewall..."
ufw allow 'Nginx Full'
ufw reload

echo ""
echo "╔═══════════════════════════════════════════════════════════╗"
echo "║              Installation Complete!                       ║"
echo "╚═══════════════════════════════════════════════════════════╝"
echo ""
echo "✓ Nginx is now running!"
echo "✓ Apache has been removed"
echo ""
echo "➜ Access your panel: http://162.141.0.65/"
echo ""
echo "➜ Create admin user:"
echo "   cd /var/www/html/vps-panel"
echo "   php cli/create-user.php"
echo ""
echo "➜ Check status:"
echo "   systemctl status nginx"
echo "   systemctl status php8.1-fpm"
echo ""
