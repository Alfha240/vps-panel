#!/bin/bash
# VPS Panel Update Script
# Run this after pushing code to GitHub

echo "🚀 Updating VPS Panel..."

# Navigate to project directory
cd /var/www/html/vps-panel

# Force reset to match GitHub (discard local changes)
echo "📦 Resetting to GitHub version..."
git fetch origin
git reset --hard origin/main
git clean -fd

# Run new migrations
echo "🗄️  Running database migrations..."
chmod +x run-migrations.sh

# Check if migrations exist
if [ -f "run-migrations.sh" ]; then
    ./run-migrations.sh
else
    echo "⚠️  Migration script not found, running migrations manually..."
    for file in migrations/*.sql; do
        if [ -f "$file" ]; then
            echo "Running: $file"
            mysql -u panel_user -plordcloud vps_panel < "$file" 2>/dev/null || echo "Skipping $file (already applied or error)"
        fi
    done
fi

# Set correct permissions
echo "🔒 Setting permissions..."
chown -R www-data:www-data .
chmod -R 755 .
chmod +x *.sh 2>/dev/null

# Restart web server
echo "🔄 Restarting Nginx..."
systemctl restart nginx

echo ""
echo "✅ Update completed successfully!"
echo "🌐 Panel URL: http://$(hostname -I | awk '{print $1}')"
