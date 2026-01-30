#!/bin/bash
# Quick Fix Script for VPS Panel

echo "🔧 Fixing VPS Panel..."

# 1. Import database schema
echo "📦 Importing database tables..."
mysql -u vps_user -plordcloud vps_panel < /var/www/html/vps-panel/install.sql

# 2. Fix config.php permissions
echo "🔒 Fixing config permissions..."
chmod 644 /var/www/html/vps-panel/includes/config.php

# 3. Restart Apache
echo "🔄 Restarting Apache..."
systemctl restart apache2

# 4. Test database
echo "✅ Testing database connection..."
mysql -u vps_user -plordcloud -e "SHOW TABLES FROM vps_panel;"

echo ""
echo "✅ All fixes applied!"
echo "🌐 Visit: http://162.141.0.65/"
echo ""
