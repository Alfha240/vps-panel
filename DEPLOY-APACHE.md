# VPS Panel - Apache Deployment Guide

## 🚀 Quick Deploy (Your Workflow)

### 1️⃣ Local Development (VS Code)
```
Edit files in: c:\Users\suraj\Documents\GitHub\vps-panel
```

### 2️⃣ Push to GitHub (GitHub Desktop)
```
1. Open GitHub Desktop
2. Review changes
3. Commit message
4. Push origin
```

### 3️⃣ Deploy to VPS (SSH)
```bash
ssh root@162.141.0.65
cd /var/www/html/vps-panel && git reset --hard origin/main && ./setup-apache.sh
```

---

## 📋 First Time Setup

### Initial Installation
```bash
# On VPS
cd /var/www/html
git clone https://github.com/Alfha240/vps-panel.git
cd vps-panel

# Configure Apache
chmod +x setup-apache.sh
./setup-apache.sh

# Fix database password
sed -i "s/define('DB_PASSWORD', '');/define('DB_PASSWORD', 'lordcloud');/" config.php

# Setup database
mysql -u root -plordcloud <<EOF
CREATE DATABASE IF NOT EXISTS vps_panel;
GRANT ALL PRIVILEGES ON vps_panel.* TO 'panel_user'@'localhost' IDENTIFIED BY 'lordcloud';
FLUSH PRIVILEGES;
EOF

# Run migrations
chmod +x run-migrations.sh
./run-migrations.sh

# Create admin user
php make-user.php
```

---

## 🔄 Every Update After That

```bash
cd /var/www/html/vps-panel
git reset --hard origin/main
systemctl restart apache2
```

---

## 🌐 Access Panel

**URL**: http://162.141.0.65/

---

## 🛠️ Troubleshooting

### Check Apache Status
```bash
systemctl status apache2
```

### View Error Logs
```bash
tail -50 /var/log/apache2/vps-panel-error.log
```

### Fix Permissions
```bash
cd /var/www/html/vps-panel
chown -R www-data:www-data .
chmod -R 755 .
```

### Test Database
```bash
mysql -u panel_user -plordcloud vps_panel -e "SHOW TABLES;"
```

### Restart Apache
```bash
systemctl restart apache2
```

---

## ✅ What's Working

- ✅ Apache serves panel on root domain
- ✅ Database: `vps_panel` with user `panel_user`
- ✅ Password: `lordcloud`
- ✅ Auto-update via git pull
- ✅ Admin system ready

---

**Panel URL**: http://162.141.0.65/
