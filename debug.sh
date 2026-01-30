#!/bin/bash
# Debug Script - Check what's wrong with the panel

echo "🔍 VPS Panel Diagnostics"
echo "========================"
echo ""

# Check if directory exists
echo "📁 Checking directory..."
if [ -d "/var/www/html/vps-panel" ]; then
    echo "✅ Directory exists"
    cd /var/www/html/vps-panel
else
    echo "❌ Directory not found!"
    exit 1
fi

# Check Nginx status
echo ""
echo "🌐 Nginx Status:"
systemctl status nginx --no-pager | head -5

# Check PHP-FPM status
echo ""
echo "🐘 PHP-FPM Status:"
systemctl status php*-fpm --no-pager | head -5

# Check file permissions
echo ""
echo "🔒 File Permissions:"
ls -la /var/www/html/vps-panel/index.php 2>/dev/null || echo "index.php not found!"

# Check Nginx error log (last 20 lines)
echo ""
echo "📋 Nginx Error Log (last 20 lines):"
tail -20 /var/log/nginx/error.log

# Check if config.php exists
echo ""
echo "⚙️  Config File:"
if [ -f "config.php" ]; then
    echo "✅ config.php exists"
    grep "DB_PASSWORD" config.php | head -1
else
    echo "❌ config.php not found!"
fi

# Test database connection
echo ""
echo "🗄️  Database Connection:"
mysql -u panel_user -plordcloud -e "USE vps_panel; SHOW TABLES;" 2>&1 | head -10

# Check if index.php has syntax errors
echo ""
echo "🐛 PHP Syntax Check:"
php -l index.php 2>&1

echo ""
echo "========================"
echo "Diagnostics Complete!"
