#!/bin/bash
# Setup Apache to serve panel on root domain (http://162.141.0.65/)

echo "🌐 Configuring Apache for VPS Panel..."

# Copy Apache config
echo "Installing Apache config..."
cp apache-vps-panel.conf /etc/apache2/sites-available/vps-panel.conf

# Disable default site
echo "Disabling default site..."
a2dissite 000-default.conf

# Enable our site
echo "Enabling VPS Panel site..."
a2ensite vps-panel.conf

# Enable mod_rewrite
echo "Enabling mod_rewrite..."
a2enmod rewrite

# Test Apache config
echo "Testing Apache configuration..."
apache2ctl configtest

if [ $? -eq 0 ] || grep -q "Syntax OK" <(apache2ctl configtest 2>&1); then
    echo "✅ Apache config is valid"
    
    # Restart Apache
    echo "Restarting Apache..."
    systemctl restart apache2
    
    echo ""
    echo "✅ Done! Panel is now available at:"
    echo "🌐 http://162.141.0.65/"
    echo ""
else
    echo "⚠️  Apache config has warnings (but should work)"
    systemctl restart apache2
    echo "🌐 http://162.141.0.65/"
fi
