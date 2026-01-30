#!/bin/bash
# VPS Panel Update Script
# Run this after pushing code to GitHub

echo "🚀 Updating VPS Panel..."

# Navigate to project directory
cd /var/www/html/vps-panel

# Stash any local changes
echo "📦 Stashing local changes..."
git stash

# Pull latest code from GitHub
echo "⬇️  Pulling latest code..."
git pull origin main

# Run new migrations
echo "🗄️  Running database migrations..."
chmod +x run-migrations.sh
./run-migrations.sh

# Set correct permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data .
chmod -R 755 .
chmod +x *.sh

# Restart web server
echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo ""
echo "✅ Update completed successfully!"
echo "🌐 Panel URL: http://$(hostname -I | awk '{print $1}')"
