# VPS Hosting Control Panel

A professional VPS hosting control panel with Proxmox integration, built with pure PHP.

## Features

- 🔐 **Unified Authentication** - Single login for admins and users with role-based access
- 🖥️ **Proxmox Integration** - Full VM lifecycle management
- 📊 **Admin Dashboard** - Comprehensive management interface
- 👤 **User Panel** - Self-service VPS management
- 🌐 **IP Address Management (IPAM)** - IP pool and address tracking
- 🔑 **API Token System** - External integration support (WHMCS, automation)
- 📦 **Plan Management** - Flexible hosting plans
- 🔒 **Security First** - PDO prepared statements, password hashing, CSRF protection

## Installation

### Requirements

- PHP 7.4 or higher
- MySQL 5.7 or higher
- Proxmox VE 6.0 or higher
- Apache/Nginx web server

### Step 1: Clone Repository

```bash
git clone <repository-url> vps-panel
cd vps-panel
```

### Step 2: Create Database

```bash
mysql -u root -p
```

```sql
CREATE DATABASE vps_panel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'vps_user'@'localhost' IDENTIFIED BY 'your_secure_password';
GRANT ALL PRIVILEGES ON vps_panel.* TO 'vps_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Import Database Schema

```bash
mysql -u vps_user -p vps_panel < install.sql
```

### Step 4: Configure Application

Edit `includes/config.php` and update:

```php
define('DB_HOST', 'localhost');
define('DB_NAME', 'vps_panel');
define('DB_USER', 'vps_user');
define('DB_PASS', 'your_secure_password');
define('APP_URL', 'http://your-domain.com');
```

### Step 5: Set Permissions

```bash
chmod -R 755 vps-panel/
chown -R www-data:www-data vps-panel/
```

### Step 6: Create First Admin User

```bash
php create-user.php
```

Follow the prompts:
- Enter name
- Enter email
- Enter password
- When asked "Make admin? (yes/no)", type: **yes**

### Step 7: Access Panel

Navigate to: `http://your-domain.com/login.php`

Login with the admin credentials you just created.

## Project Structure

```
vps-panel/
├── admin/                    # Admin panel pages
│   ├── index.php            # Dashboard
│   ├── locations.php        # Locations management
│   ├── nodes.php            # Proxmox nodes
│   ├── servers.php          # All VPS instances
│   ├── ipam.php             # IP management
│   ├── users.php            # User management
│   ├── api-tokens.php       # API token management
│   └── plans.php            # Hosting plans
├── user/                     # User panel pages
│   ├── index.php            # User dashboard
│   └── server.php           # VPS management
├── api/                      # API endpoints
│   ├── server-control.php   # Power controls
│   └── server-create.php    # VPS provisioning
├── includes/                 # Core system files
│   ├── config.php           # Configuration
│   ├── database.php         # Database handler
│   ├── auth.php             # Authentication
│   ├── middleware.php       # Access control
│   ├── proxmox.php          # Proxmox API wrapper
│   └── helpers.php          # Utility functions
├── assets/
│   └── css/
│       └── style.css        # Premium dark theme
├── login.php                 # Login page
├── register.php              # User registration
├── logout.php                # Logout handler
├── create-user.php           # CLI admin creation
└── install.sql               # Database schema
```

## Usage

### Admin Panel Features

**Dashboard** (`/admin/index.php`)
- System statistics
- Recent server activity
- Quick actions

**Locations** (`/admin/locations.php`)
- Create data center locations
- Assign short codes
- Manage node assignments

**Nodes** (`/admin/nodes.php`)
- Add Proxmox servers
- Configure API credentials
- Enable/disable nodes
- Connection testing

**Servers** (`/admin/servers.php`)
- View all VPS instances
- Search and filter
- Suspend/unsuspend
- Delete servers

**IPAM** (`/admin/ipam.php`)
- Create IP pools
- Add IP addresses
- Track assignments
- View usage statistics

**Users** (`/admin/users.php`)
- View all users
- Promote/demote admins
- Manage credits
- View server count

**API Tokens** (`/admin/api-tokens.php`)
- Generate access tokens
- Set permissions
- Track usage
- Revoke tokens

**Plans** (`/admin/plans.php`)
- Create hosting plans
- Set resource limits
- Configure pricing
- Enable/disable plans

### User Panel Features

**Dashboard** (`/user/index.php`)
- Server overview
- Account balance
- Quick server access

**Server Management** (`/user/server.php`)
- Power controls (start/stop/restart)
- Live status from Proxmox
- Resource specifications
- Network details
- Console access (placeholder)

### API Integration

**Authentication**

All API requests require a token in the header:

```
X-API-Token: your_64_character_token_here
```

**Create Server**

```bash
curl -X POST https://your-panel.com/api/server-create.php \
  -H "X-API-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "plan_id": 1,
    "name": "my-vps",
    "os": "Ubuntu 22.04"
  }'
```

**Control Server**

```bash
curl -X POST https://your-panel.com/api/server-control.php \
  -H "X-API-Token: your_token" \
  -H "Content-Type: application/json" \
  -d '{
    "server_uuid": "uuid-here",
    "action": "start"
  }'
```

Available actions: `start`, `stop`, `restart`, `shutdown`

## Proxmox Setup

1. Create an API token in Proxmox:
   - Go to Datacenter → Permissions → API Tokens
   - Click "Add"
   - User: `root@pam` or create dedicated user
   - Token ID: `panel`
   - Privilege Separation: **No**
   - Copy the token secret

2. Add node in admin panel:
   - Go to Nodes
   - Enter node name, host, port (8006)
   - API Token ID: `root@pam!panel`
   - API Secret: paste the secret
   - Test connection

## Security Notes

- Never commit `includes/config.php` with real credentials
- Change default database password
- Use HTTPS in production
- Set appropriate file permissions
- Regularly update dependencies
- Enable `session.cookie_secure` when using HTTPS
- Use strong passwords for admin accounts

## Troubleshooting

**Cannot connect to Proxmox**
- Check firewall rules (port 8006)
- Verify API token has proper permissions
- Ensure SSL certificate is valid or disable verification

**Database connection failed**
- Verify database credentials in config.php
- Check MySQL service is running
- Ensure database user has proper privileges

**Permission denied errors**
- Check file ownership: `chown -R www-data:www-data vps-panel/`
- Set correct permissions: `chmod -R 755 vps-panel/`

## License

Proprietary - All rights reserved

## Support

For support, please contact your administrator or create an issue in the repository.
