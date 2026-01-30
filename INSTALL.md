# VPS Panel - VPS Installation Guide

Complete guide to install the VPS Panel on an Ubuntu/Debian VPS server.

## Quick Install (Recommended)

For a fresh Ubuntu 20.04/22.04 server:

```bash
curl -sSL https://raw.githubusercontent.com/Alfha240/vps-panel/main/install.sh | sudo bash
```

---

## Manual Installation

### Prerequisites

- Ubuntu 20.04/22.04 or Debian 11/12
- Root or sudo access
- Domain name pointing to your VPS (recommended)

### Step 1: Update System

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 2: Install Required Packages

```bash
# Install Apache, PHP, MySQL, and required extensions
sudo apt install -y apache2 mysql-server php php-cli php-mysql php-curl php-json php-mbstring php-xml php-zip git unzip curl

# Enable required Apache modules
sudo a2enmod rewrite
sudo systemctl restart apache2
```

### Step 3: Configure MySQL

```bash
# Secure MySQL installation
sudo mysql_secure_installation
```

Answer the prompts:
- Set root password: **Yes** (choose a strong password)
- Remove anonymous users: **Yes**
- Disallow root login remotely: **Yes**
- Remove test database: **Yes**
- Reload privilege tables: **Yes**

### Step 4: Create Database

```bash
sudo mysql -u root -p
```

Execute these SQL commands:

```sql
CREATE DATABASE vps_panel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vps_user'@'localhost' IDENTIFIED BY 'YourSecurePassword123!';
GRANT ALL PRIVILEGES ON vps_panel.* TO 'vps_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

**Important**: Replace `YourSecurePassword123!` with a strong password!

### Step 5: Clone Repository

```bash
cd /var/www/
sudo git clone https://github.com/Alfha240/vps-panel.git
cd vps-panel
```

### Step 6: Import Database Schema

```bash
sudo mysql -u vps_user -p vps_panel < install.sql
```

Enter the database password you set in Step 4.

### Step 7: Configure Application

```bash
sudo nano includes/config.php
```

Update these values:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'vps_panel');
define('DB_USER', 'vps_user');
define('DB_PASS', 'YourSecurePassword123!');  // Same as Step 4
define('APP_URL', 'http://your-vps-ip-or-domain.com');  // Your domain or IP
```

Save and exit (Ctrl+X, Y, Enter).

### Step 8: Set File Permissions

```bash
sudo chown -R www-data:www-data /var/www/vps-panel
sudo chmod -R 755 /var/www/vps-panel
```

### Step 9: Configure Apache Virtual Host

```bash
sudo nano /etc/apache2/sites-available/vps-panel.conf
```

Add this configuration:

```apache
<VirtualHost *:80>
    ServerName your-domain.com
    ServerAlias www.your-domain.com
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

Replace `your-domain.com` with your actual domain.

### Step 10: Enable Site and Restart Apache

```bash
sudo a2ensite vps-panel.conf
sudo a2dissite 000-default.conf
sudo systemctl restart apache2
```

### Step 11: Configure Firewall

```bash
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp
sudo ufw enable
```

### Step 12: Create Admin User

```bash
cd /var/www/vps-panel
sudo php cli/create-user.php
```

Answer the prompts:
- Name: Your Name
- Email: your@email.com
- Password: ChooseStrongPassword
- Make admin? **yes**

### Step 13: Access Panel

Open your browser and navigate to:
```
http://your-domain.com
```

Login with the admin credentials you just created!

---

## SSL/HTTPS Setup (Recommended)

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-apache

# Get SSL certificate
sudo certbot --apache -d your-domain.com -d www.your-domain.com

# Follow the prompts:
# - Enter email address
# - Agree to terms
# - Choose redirect HTTP to HTTPS: Yes (2)
```

### Update config.php for HTTPS

```bash
sudo nano /var/www/vps-panel/includes/config.php
```

Change:
```php
define('APP_URL', 'https://your-domain.com');  // Change http to https
```

### Enable Secure Session Cookies

In `includes/config.php`, add after session_start():

```php
ini_set('session.cookie_secure', '1');
```

---

## Proxmox Configuration

### On Proxmox Server

1. **Create API Token**:
   - Login to Proxmox web interface
   - Go to **Datacenter** → **Permissions** → **API Tokens**
   - Click **Add**
   - User: `root@pam`
   - Token ID: `panel`
   - Privilege Separation: **Uncheck**
   - Click **Add**
   - **Copy the Secret** (you won't see it again!)

2. **Allow API Access** (if firewall enabled):
   ```bash
   # On Proxmox server
   ufw allow 8006/tcp
   ```

### In VPS Panel

1. Login to your panel as admin
2. Go to **Locations** → Create a location (e.g., "Mumbai DC")
3. Go to **Nodes** → Add Node:
   - Location: Select your location
   - Name: `pve-1` (or your node name)
   - Host: `proxmox-server-ip`
   - Port: `8006`
   - API Token ID: `root@pam!panel`
   - API Secret: Paste the secret from Proxmox
   - Click **Test Connection**
   - If successful, click **Add Node**

---

## Post-Installation Tasks

### 1. Create IP Pools

Go to **IPAM** → Create IP Pool:
- Node: Select your node
- Name: Main Pool
- CIDR: `192.168.1.0/24` (example)
- Gateway: `192.168.1.1`
- Netmask: `255.255.255.0`

### 2. Add IP Addresses

In **IPAM** → Add IP Address:
- Pool: Select pool
- IP Address: `192.168.1.100`
- MAC Address: Auto-generated or custom

### 3. Create Plans

Go to **Plans** → Create Plan:
- Name: Starter VPS
- CPU Cores: 1
- RAM (MB): 1024
- Disk (GB): 20
- Bandwidth (GB): 1000
- Price: 5.00

### 4. Generate API Token (Optional)

For WHMCS or external integrations:
- Go to **API Tokens**
- Create token with required permissions
- Copy token for external use

---

## Troubleshooting

### Apache Not Starting
```bash
sudo systemctl status apache2
sudo tail -f /var/log/apache2/error.log
```

### Database Connection Failed
- Check credentials in `includes/config.php`
- Verify MySQL is running: `sudo systemctl status mysql`
- Test connection: `mysql -u vps_user -p vps_panel`

### Permission Denied Errors
```bash
sudo chown -R www-data:www-data /var/www/vps-panel
sudo chmod -R 755 /var/www/vps-panel
```

### Proxmox Connection Failed
- Check firewall on Proxmox (port 8006)
- Verify API token has correct permissions
- Try accessing `https://proxmox-ip:8006` in browser
- Check if SSL certificate is valid (or disable SSL verification temporarily)

### 500 Internal Server Error
```bash
# Enable PHP error display (temporarily)
sudo nano /etc/php/8.1/apache2/php.ini
# Set: display_errors = On

sudo systemctl restart apache2
```

---

## Security Hardening

### 1. Disable Directory Listing
Already configured in Virtual Host with `-Indexes`

### 2. Hide PHP Version
```bash
sudo nano /etc/php/8.1/apache2/php.ini
# Set: expose_php = Off
sudo systemctl restart apache2
```

### 3. Enable ModSecurity (Web Application Firewall)
```bash
sudo apt install -y libapache2-mod-security2
sudo systemctl restart apache2
```

### 4. Regular Updates
```bash
# Set up automatic security updates
sudo apt install -y unattended-upgrades
sudo dpkg-reconfigure -plow unattended-upgrades
```

### 5. Change Default MySQL Port (Optional)
```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
# Change port = 3306 to custom port
# Update config.php accordingly
```

---

## Backup & Maintenance

### Database Backup

```bash
# Create backup script
sudo nano /root/backup-vps-panel.sh
```

Add:
```bash
#!/bin/bash
BACKUP_DIR="/root/backups"
DATE=$(date +%Y%m%d_%H%M%S)
mkdir -p $BACKUP_DIR

# Backup database
mysqldump -u vps_user -p'YourPassword' vps_panel > $BACKUP_DIR/vps_panel_$DATE.sql

# Backup files
tar -czf $BACKUP_DIR/vps-panel-files_$DATE.tar.gz /var/www/vps-panel

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

Make executable and schedule:
```bash
sudo chmod +x /root/backup-vps-panel.sh
sudo crontab -e
# Add: 0 2 * * * /root/backup-vps-panel.sh
```

### Update Panel

```bash
cd /var/www/vps-panel
sudo git pull origin main
sudo chown -R www-data:www-data /var/www/vps-panel
```

---

## System Requirements

**Minimum**:
- 1 CPU Core
- 1 GB RAM
- 10 GB Disk Space
- Ubuntu 20.04+

**Recommended**:
- 2 CPU Cores
- 2 GB RAM
- 20 GB SSD
- Ubuntu 22.04 LTS

---

## Support

For issues or questions:
- GitHub: https://github.com/Alfha240/vps-panel/issues
- Documentation: README.md

---

## License

Proprietary - All rights reserved
