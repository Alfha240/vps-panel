# VPS Panel - Development Workflow

## 🔄 Your Standard Workflow

### Step 1: Local Development (VS Code)
```
1. Open project: c:\Users\suraj\Documents\GitHub\vps-panel
2. Make your changes in VS Code
3. Save all files
```

### Step 2: Push to GitHub (GitHub Desktop)
```
1. Open GitHub Desktop
2. Review changes
3. Write commit message (e.g., "Added new feature")
4. Click "Commit to main"
5. Click "Push origin"
```

### Step 3: Update VPS (SSH)
```bash
# Connect to VPS
ssh root@162.143.0.65

# Run update script (ONE COMMAND!)
cd /var/www/html/vps-panel && sudo ./update.sh
```

That's it! ✅

---

## 📋 Quick Commands Reference

### First Time Setup (Only Once)
```bash
# On VPS
cd /var/www/html
git clone https://github.com/Alfha240/vps-panel.git
cd vps-panel
chmod +x update.sh
./update.sh
```

### Every Update After That
```bash
# On VPS (just this one command)
cd /var/www/html/vps-panel && sudo ./update.sh
```

---

## 🛠️ Troubleshooting

### If update.sh is not executable:
```bash
cd /var/www/html/vps-panel
sudo chmod +x update.sh
sudo ./update.sh
```

### If Git conflicts appear:
```bash
cd /var/www/html/vps-panel
sudo git reset --hard origin/main
sudo ./update.sh
```

### If Nginx fails:
```bash
sudo systemctl status nginx
sudo systemctl restart nginx
```

### Check if panel is working:
```bash
curl http://localhost
# Or open browser: http://162.143.0.65
```

---

## 🎯 What update.sh Does Automatically

1. ✅ Backs up config.php
2. ✅ Pulls latest code from GitHub
3. ✅ Fixes database password automatically
4. ✅ Runs all migrations
5. ✅ Sets correct permissions
6. ✅ Restarts Nginx
7. ✅ Shows success message

**No manual config editing needed!** 🎉

---

## 📝 Common Tasks

### Create Admin User
```bash
# Method 1: CLI
cd /var/www/html/vps-panel
php make-user.php

# Method 2: Web
# Open: http://162.143.0.65/create-admin.php
```

### View Logs
```bash
# Nginx error log
sudo tail -f /var/log/nginx/error.log

# Nginx access log
sudo tail -f /var/log/nginx/access.log
```

### Check Database
```bash
mysql -u panel_user -plordcloud vps_panel
```

---

## 🚀 Your Workflow Summary

```
Local (VS Code) → GitHub Desktop → VPS (update.sh)
     ↓                  ↓              ↓
  Edit Code      Commit & Push    Auto Update
```

**One command on VPS**: `cd /var/www/html/vps-panel && sudo ./update.sh`

Done! 🎉
