# DATABASE CONNECTION ERROR FIX

## Problem
Error: `Access denied for user 'pms_user'@'localhost'`

This means your VPS has an old/incorrect `config.php` file.

## Quick Fix (On Your VPS Server)

### Option 1: Edit Config File Directly

```bash
# SSH into your VPS
ssh root@your-vps-ip

# Edit the config file
nano /var/www/vps-panel/includes/config.php
```

Change these lines:
```php
define('DB_NAME', 'vps_panel');     // Make sure this is correct
define('DB_USER', 'vps_user');      // Change from 'pms_user' to 'vps_user'
define('DB_PASS', 'YourActualPassword');  // Your actual DB password
```

Save (Ctrl+X, Y, Enter).

### Option 2: Re-download Config from GitHub

```bash
cd /var/www/vps-panel
sudo git pull origin main
sudo nano includes/config.php
# Update DB_PASS and APP_URL only
```

### Option 3: Recreate Database User

If you need to create the correct user:

```bash
# Login to MySQL
sudo mysql -u root -p

# Execute these commands
DROP USER IF EXISTS 'pms_user'@'localhost';
DROP USER IF EXISTS 'vps_user'@'localhost';
CREATE USER 'vps_user'@'localhost' IDENTIFIED BY 'lordcloud';
GRANT ALL PRIVILEGES ON vps_panel.* TO 'vps_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

Then update `includes/config.php`:
```php
define('DB_USER', 'vps_user');
define('DB_PASS', 'lordcloud');
```

## Verify Fix

After fixing, visit your panel URL and you should see the login page!

## Common Issues

**Still getting error?**
1. Check database name: `SHOW DATABASES;` in MySQL
2. Check user exists: `SELECT User, Host FROM mysql.user;`
3. Verify credentials match in `config.php`

**Permission denied when editing config?**
```bash
sudo chown www-data:www-data /var/www/vps-panel/includes/config.php
sudo chmod 644 /var/www/vps-panel/includes/config.php
```
