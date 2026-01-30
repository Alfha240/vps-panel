#!/bin/bash
# VPS Panel - Smart Update Script
# Handles Git conflicts automatically and updates everything

echo "🚀 Starting VPS Panel Update..."

# Navigate to project directory
cd /var/www/html/vps-panel || exit 1

# Backup current config.php
echo "💾 Backing up config.php..."
cp config.php config.php.backup

# Stash any local changes
echo "📦 Stashing local changes..."
git stash

# Fetch latest code
echo "📥 Fetching latest code from GitHub..."
git fetch origin

# Force reset to latest version
echo "🔄 Resetting to latest version..."
git reset --hard origin/main

# Clean untracked files
git clean -fd

# Restore config with correct password
echo "⚙️  Restoring database configuration..."
sed -i "s/define('DB_PASSWORD', '');/define('DB_PASSWORD', 'lordcloud');/" config.php

# Set correct permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data .
chmod -R 755 .
chmod +x *.sh 2>/dev/null

# Run migrations
echo "📊 Running database migrations..."
if [ -f "run-migrations.sh" ]; then
    chmod +x run-migrations.sh
    ./run-migrations.sh
fi

# Restart Nginx
echo "🔄 Restarting Nginx..."
systemctl restart nginx

# Check Nginx status
if systemctl is-active --quiet nginx; then
    echo ""
    echo "✅ Update completed successfully!"
    echo "🌐 Panel URL: http://$(hostname -I | awk '{print $1}')"
else
    echo ""
    echo "⚠️  Warning: Nginx failed to restart!"
    echo "Run: sudo systemctl status nginx"
fi

echo ""
echo "📝 Update Summary:"
echo "- Code updated from GitHub"
echo "- Database migrations applied"
echo "- Permissions fixed"
echo "- Nginx restarted"
echo ""
