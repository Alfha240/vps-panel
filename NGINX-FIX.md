# Quick Nginx Configuration Fix

Run these commands on your VPS to configure Nginx properly:

```bash
# 1. Create Nginx config for VPS Panel
sudo tee /etc/nginx/sites-available/vps-panel > /dev/null << 'EOF'
server {
    listen 80 default_server;
    server_name _;
    root /var/www/html/vps-panel;
    index index.php index.html;

    access_log /var/log/nginx/vps-panel-access.log;
    error_log /var/log/nginx/vps-panel-error.log;

    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php8.1-fpm.sock;
        fastcgi_param SCRIPT_FILENAME $document_root$fastcgi_script_name;
        include fastcgi_params;
    }

    location ~ /\.(ht|git|sql) {
        deny all;
    }

    location ~* ^/includes/ {
        deny all;
    }
}
EOF

# 2. Remove default site and enable VPS panel
sudo rm -f /etc/nginx/sites-enabled/default
sudo ln -sf /etc/nginx/sites-available/vps-panel /etc/nginx/sites-enabled/

# 3. Test and restart Nginx
sudo nginx -t && sudo systemctl restart nginx

# 4. Import database if not done
sudo mysql -u vps_user -plordcloud vps_panel < /var/www/html/vps-panel/install.sql 2>/dev/null || echo "Database already imported"

# 5. Set permissions
sudo chown -R www-data:www-data /var/www/html/vps-panel
sudo chmod -R 755 /var/www/html/vps-panel
```

Then refresh: **http://162.141.0.65/**

You should see the LOGIN PAGE! 🎉
