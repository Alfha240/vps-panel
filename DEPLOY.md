# Deployment Guide

## First-Time Setup on VPS

### Step 1: Initialize Git Repository (Local Machine)
```bash
cd c:\Users\suraj\Documents\GitHub\vps-panel
git init
git add .
git commit -m "Initial commit: VPS Panel with admin system"
git branch -M main
git remote add origin https://github.com/Alfha240/vps-panel.git
git push -u origin main
```

### Step 2: Deploy to VPS
SSH into your VPS and run:
```bash
cd /var/www/html
sudo git clone https://github.com/Alfha240/vps-panel.git
cd vps-panel
sudo chmod +x install.sh update.sh
sudo ./install.sh
```

### Step 3: Run Database Migration
```bash
mysql -u panel_user -p vps_panel < migrate_admin.sql
```

### Step 4: Create First Admin User
```bash
php make-user.php
```
Answer "yes" when prompted for admin privileges.

---

## Updating Code on VPS

### When you make changes locally:

1. **Commit and push** (on your local machine):
```bash
git add .
git commit -m "Your commit message"
git push origin main
```

2. **Update VPS** (SSH into VPS):
```bash
cd /var/www/html/vps-panel
sudo ./update.sh
```

That's it! The update script handles pulling code, setting permissions, and restarting Apache.

---

## Common Commands

### Create a new user
```bash
php make-user.php
```

### Check Apache status
```bash
sudo systemctl status apache2
```

### View Apache error logs
```bash
sudo tail -f /var/log/apache2/error.log
```

### Restart Apache
```bash
sudo systemctl restart apache2
```
