# Quick Start Guide

## 🚀 One-Line Installation (VPS)

On a fresh Ubuntu 20.04/22.04 VPS, run:

```bash
curl -sSL https://raw.githubusercontent.com/Alfha240/vps-panel/main/install.sh | sudo bash
```

This will automatically:
- ✅ Install Apache, MySQL, PHP
- ✅ Clone the repository
- ✅ Setup database
- ✅ Configure Apache
- ✅ Set permissions

---

## 📋 Post-Installation Steps

### 1. Create Admin User

```bash
cd /var/www/vps-panel
sudo php cli/create-user.php
```

When prompted "Make admin? (yes/no)", type: **yes**

### 2. Login to Panel

Open browser: `http://your-vps-ip-or-domain`

Use credentials from step 1.

### 3. Add Proxmox Node

**On Proxmox Server:**
- Datacenter → Permissions → API Tokens → Add
- User: `root@pam`, Token ID: `panel`
- Uncheck "Privilege Separation"
- Copy the secret!

**In VPS Panel:**
1. Login as admin
2. **Locations** → Create location (e.g., "Mumbai DC")
3. **Nodes** → Add Node:
   - Host: Your Proxmox IP
   - Port: `8006`
   - API Token ID: `root@pam!panel`
   - API Secret: Paste from Proxmox
   - Click "Test Connection"
   - Click "Add Node"

### 4. Create IP Pool

1. **IPAM** → Create IP Pool
2. Fill in your subnet details:
   - CIDR: `192.168.1.0/24`
   - Gateway: `192.168.1.1`
   - Netmask: `255.255.255.0`

### 5. Add IPs

1. **IPAM** → Add IP Address
2. Add IPs: `192.168.1.100`, `192.168.1.101`, etc.

### 6. Create Plans

1. **Plans** → Create plan
2. Example: 1 vCore, 1024 MB RAM, 20 GB Disk

✅ **You're ready to deploy VPS!**

---

## 🔒 Enable SSL (Recommended)

```bash
sudo apt install certbot python3-certbot-apache
sudo certbot --apache -d your-domain.com
```

Then update `includes/config.php`:
```php
define('APP_URL', 'https://your-domain.com');
```

---

## 📚 Documentation

- **Manual Installation**: See [INSTALL.md](INSTALL.md)
- **Features & Architecture**: See [README.md](README.md)
- **GitHub**: https://github.com/Alfha240/vps-panel

---

## 🆘 Troubleshooting

**Can't connect to Proxmox?**
- Check Proxmox firewall (allow port 8006)
- Verify API token is correct
- Test: `curl -k https://proxmox-ip:8006`

**Database errors?**
- Check `includes/config.php` credentials
- Verify MySQL is running: `sudo systemctl status mysql`

**Permission denied?**
```bash
sudo chown -R www-data:www-data /var/www/vps-panel
sudo chmod -R 755 /var/www/vps-panel
```

---

## 📞 Support

Issues? → https://github.com/Alfha240/vps-panel/issues
