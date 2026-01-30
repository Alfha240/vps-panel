#!/bin/bash
# Setup Nginx to serve panel on root domain (http://162.141.0.65/)

echo "🌐 Configuring Nginx for root domain..."

# Remove default Nginx config
echo "Removing default config..."
rm -f /etc/nginx/sites-enabled/default

# Copy our config
echo "Installing VPS Panel config..."
cp nginx-vps-panel.conf /etc/nginx/sites-available/vps-panel
ln -sf /etc/nginx/sites-available/vps-panel /etc/nginx/sites-enabled/

# Test Nginx config
echo "Testing Nginx configuration..."
nginx -t

if [ $? -eq 0 ]; then
    echo "✅ Nginx config is valid"
    
    # Reload Nginx
    echo "Reloading Nginx..."
    systemctl reload nginx
    
    echo ""
    echo "✅ Done! Panel is now available at:"
    echo "🌐 http://162.141.0.65/"
    echo ""
else
    echo "❌ Nginx config has errors!"
    echo "Please check the configuration."
fi
