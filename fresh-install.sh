#!/bin/bash
# Fresh Installation Script for VPS Panel
# This will delete everything and reinstall from scratch

echo "🗑️  Starting fresh installation..."

# Step 1: Remove old installation
echo "Removing old files..."
cd /var/www/html
rm -rf vps-panel

# Step 2: Clone from GitHub
echo "📥 Cloning from GitHub..."
git clone https://github.com/Alfha240/vps-panel.git
cd vps-panel

# Step 3: Set permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data .
chmod -R 755 .
chmod +x *.sh 2>/dev/null

# Step 4: Configure database credentials
echo "⚙️  Configuring database..."
sed -i "s/define('DB_PASSWORD', '');/define('DB_PASSWORD', 'lordcloud');/" config.php

# Step 5: Drop and recreate database
echo "🗄️  Recreating database..."
mysql -u root -plordcloud <<EOF
DROP DATABASE IF EXISTS vps_panel;
CREATE DATABASE vps_panel;
GRANT ALL PRIVILEGES ON vps_panel.* TO 'panel_user'@'localhost' IDENTIFIED BY 'lordcloud';
FLUSH PRIVILEGES;
EOF

# Step 6: Run migrations
echo "📊 Running migrations..."
chmod +x run-migrations.sh
./run-migrations.sh

# Step 7: Run admin migration
echo "👤 Setting up admin system..."
mysql -u panel_user -plordcloud vps_panel < migrate_admin.sql 2>/dev/null || echo "Admin migration already applied"

# Step 8: Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo ""
echo "✅ Fresh installation completed!"
echo "🌐 Panel URL: http://$(hostname -I | awk '{print $1}')"
echo ""
echo "📝 Next steps:"
echo "1. Create admin user: php make-user.php"
echo "   OR use web interface: http://$(hostname -I | awk '{print $1}')/create-admin.php"
echo ""
