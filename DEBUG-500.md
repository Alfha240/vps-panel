# 500 Internal Server Error - Debug Guide

## Step 1: Check Apache Error Logs

Run this on your VPS to see the actual error:

```bash
sudo tail -f /var/log/apache2/error.log
```

Then refresh the page in your browser and watch for new errors.

---

## Step 2: Common Fixes

### Fix 1: Update APP_URL in config.php

Your config shows:
```php
define('APP_URL', 'http://localhost/vps-panel');
```

Change it to your actual IP:

```bash
nano /var/www/vps-panel/includes/config.php
```

Change to:
```php
define('APP_URL', 'http://162.141.0.65');
```

### Fix 2: Check DocumentRoot in Apache

```bash
cat /etc/apache2/sites-available/vps-panel.conf
```

Make sure it has:
```apache
DocumentRoot /var/www/vps-panel
```

NOT `/var/www/vps-panel/public` or anything else.

### Fix 3: Verify .htaccess is readable

```bash
ls -la /var/www/vps-panel/.htaccess
```

If it doesn't exist or has permission issues:
```bash
sudo chown www-data:www-data /var/www/vps-panel/.htaccess
sudo chmod 644 /var/www/vps-panel/.htaccess
```

### Fix 4: Disable .htaccess temporarily

Rename it to test if it's causing issues:
```bash
sudo mv /var/www/vps-panel/.htaccess /var/www/vps-panel/.htaccess.bak
```

Refresh browser. If it works, the .htaccess was the problem.

To restore:
```bash
sudo mv /var/www/vps-panel/.htaccess.bak /var/www/vps-panel/.htaccess
```

### Fix 5: Check PHP Extensions

```bash
php -m | grep -E 'pdo|mysql|curl|mbstring'
```

Should show:
- PDO
- pdo_mysql
- curl
- mbstring

If missing:
```bash
sudo apt install php-mysql php-curl php-mbstring -y
sudo systemctl restart apache2
```

### Fix 6: File Permissions (Most Common Issue)

```bash
cd /var/www/vps-panel
sudo chown -R www-data:www-data .
sudo chmod -R 755 .
sudo chmod 644 includes/config.php
```

### Fix 7: Enable mod_rewrite

```bash
sudo a2enmod rewrite
sudo systemctl restart apache2
```

---

## Step 3: Test PHP Directly

Create a test file:

```bash
echo "<?php phpinfo(); ?>" | sudo tee /var/www/vps-panel/test.php
```

Visit: `http://162.141.0.65/test.php`

If this shows PHP info page, PHP is working!

Delete test file:
```bash
sudo rm /var/www/vps-panel/test.php
```

---

## Step 4: Check Database Connection

Create a connection test:

```bash
cat > /var/www/vps-panel/db-test.php << 'EOF'
<?php
try {
    $pdo = new PDO(
        'mysql:host=localhost;dbname=vps_panel;charset=utf8mb4',
        'vps_user',
        'lordcloud'
    );
    echo "✓ Database connection successful!";
} catch (PDOException $e) {
    echo "✗ Database error: " . $e->getMessage();
}
?>
EOF
```

Visit: `http://162.141.0.65/db-test.php`

Should show "✓ Database connection successful!"

Delete test file:
```bash
sudo rm /var/www/vps-panel/db-test.php
```

---

## Step 5: Check Apache Virtual Host

View current config:
```bash
apache2ctl -S
```

Look for vps-panel.conf and verify it's pointing to correct DocumentRoot.

If using IP instead of domain, your VirtualHost should be:

```bash
sudo nano /etc/apache2/sites-available/vps-panel.conf
```

```apache
<VirtualHost *:80>
    ServerName 162.141.0.65
    DocumentRoot /var/www/vps-panel
    
    <Directory /var/www/vps-panel>
        Options -Indexes +FollowSymLinks
        AllowOverride All
        Require all granted
    </Directory>
    
    ErrorLog ${APACHE_LOG_DIR}/vps-panel-error.log
    CustomLog ${APACHE_LOG_DIR}/vps-panel-access.log combined
</VirtualHost>
```

Then:
```bash
sudo systemctl restart apache2
```

---

## Step 6: Detailed Error Display (Temporary)

Edit index.php to see errors:

```bash
sudo nano /var/www/vps-panel/index.php
```

Add at the very top (after `<?php`):
```php
error_reporting(E_ALL);
ini_set('display_errors', 1);
```

Refresh browser to see the actual error.

---

## Most Likely Solution

Based on your screenshots, try this sequence:

```bash
# 1. Fix APP_URL
sudo sed -i "s|http://localhost/vps-panel|http://162.141.0.65|g" /var/www/vps-panel/includes/config.php

# 2. Fix permissions
cd /var/www/vps-panel
sudo chown -R www-data:www-data .
sudo chmod -R 755 .

# 3. Enable mod_rewrite
sudo a2enmod rewrite

# 4. Restart Apache
sudo systemctl restart apache2
```

Now refresh: `http://162.141.0.65/`

---

## Still Not Working?

Send me the output of:
```bash
sudo tail -20 /var/log/apache2/error.log
```

This will show the exact error!
