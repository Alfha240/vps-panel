# VPS Panel - Quick Start Guide

## 🚀 What You Have Now

A **professional VPS hosting control panel** with:
- ✅ Coal-black dark theme with glassmorphism
- ✅ Admin & User dashboards
- ✅ Proxmox integration
- ✅ Complete IPAM system
- ✅ API tokens for WHMCS
- ✅ VPS power controls

## 📁 File Structure

```
vps-panel/
├── admin/              # Admin dashboard
│   ├── index.php       # Overview with stats
│   ├── locations/      # Datacenter management
│   ├── nodes/          # Proxmox nodes
│   ├── servers/        # All VPS instances
│   ├── ipam/           # IP management
│   ├── api-tokens/     # API keys
│   ├── plans/          # VPS plans
│   └── users/          # User management
├── user/               # User dashboard
│   ├── dashboard.php   # User overview
│   └── vps/            # VPS management
├── api/vps/            # Control APIs
├── includes/           # Core files
│   ├── proxmox.class.php
│   ├── middleware.php
│   └── functions.php
├── migrations/         # Database migrations
└── assets/css/         # Dark theme CSS
```

## 🎯 Next Steps

### 1. Push to GitHub
```bash
cd c:\Users\suraj\Documents\GitHub\vps-panel
git add .
git commit -m "Complete VPS panel with dark theme and admin features"
git push origin main
```

### 2. Update VPS
```bash
cd /var/www/html/vps-panel
sudo ./update.sh
```

### 3. Access Panel
- **Login**: `http://your-vps-ip/`
- **Admin Panel**: Login with admin account
- **User Dashboard**: Login with regular account

## 🔑 Key Features

### Admin Features
1. **Overview** - System statistics
2. **Locations** - Manage datacenters
3. **Nodes** - Add Proxmox servers
4. **Servers** - View all VPS instances
5. **IPAM** - IP address management
6. **API Tokens** - For WHMCS integration
7. **Plans** - VPS hosting plans
8. **Users** - User management

### User Features
1. **Dashboard** - Server overview
2. **My Servers** - VPS list
3. **Power Controls** - Start/Stop/Restart
4. **Console** - VNC access (coming soon)

## 🎨 Theme Colors

- **Background**: Coal black (#0a0e14)
- **Cards**: Glassmorphism with blur
- **Accent**: Blue (#3b82f6) & Purple (#8b5cf6)
- **Success**: Green (#10b981)
- **Danger**: Red (#ef4444)

## 📝 TODO

- [ ] VPS creation automation
- [ ] noVNC console integration
- [ ] Real-time resource monitoring
- [ ] Billing integration
- [ ] Email notifications

## 🔒 Security

- ✅ Prepared statements (SQL injection prevention)
- ✅ Password hashing
- ✅ CSRF protection
- ✅ Admin route guards
- ✅ Activity logging

## 🛠️ Configuration

Edit `config.php` for database credentials.

---

**Version**: 1.0.0  
**Built with**: Pure PHP + MySQL  
**Theme**: Coal-Black Dark Mode
