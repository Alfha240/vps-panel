# VPS Hosting Control Panel

A production-ready VPS hosting control panel similar to Pterodactyl + Convoy, built with pure PHP and MySQL, featuring Proxmox integration.

## Features

### For Users
- **VPS Management**: Create, start, stop, restart VPS instances
- **Multiple OS Support**: Ubuntu, Debian, CentOS, Windows templates
- **Resource Monitoring**: RAM, CPU, Disk usage tracking
- **VNC Console**: Direct browser-based console access
- **Plan Selection**: Choose from predefined hosting plans

### For Administrators
- **Node Management**: Add and manage Proxmox nodes
- **IP Pool Management**: Automated IP assignment
- **Subnet Management**: Network configuration
- **Plan Management**: Create custom VPS plans
- **Template Sync**: Sync OS templates from Proxmox
- **User Management**: Full user administration
- **Activity Logging**: Complete audit trail

## Technology Stack

- **Backend**: Pure PHP (no framework)
- **Database**: MySQL/MariaDB
- **Integration**: Proxmox VE API
- **Frontend**: HTML5, CSS3 (Dark Theme), Vanilla JavaScript

## Project Structure

```
vps-panel/
├── admin/              # Admin dashboard pages
│   ├── nodes/          # Node management
│   ├── ips/            # IP pool management
│   ├── subnets/        # Subnet management
│   ├── plans/          # VPS plans
│   ├── templates/      # OS templates
│   └── users/          # User management
├── user/               # User dashboard
│   └── vps/            # VPS management
├── api/                # API endpoints
│   ├── vps/            # VPS control APIs
│   └── proxmox/        # Proxmox integration
├── includes/           # Core PHP files
│   ├── proxmox.class.php   # Proxmox API wrapper
│   ├── middleware.php      # Auth & security
│   └── functions.php       # Helper functions
├── migrations/         # Database migrations
└── assets/             # CSS, JS, images
```

## Installation

### Prerequisites
- PHP 7.4+ with curl extension
- MySQL 5.7+ or MariaDB 10.3+
- Nginx or Apache web server
- Proxmox VE 7.0+ server(s)

### Step 1: Clone Repository
```bash
git clone https://github.com/Alfha240/vps-panel.git
cd vps-panel
```

### Step 2: Database Setup
```bash
# Create database and user
mysql -u root -p
CREATE DATABASE vps_panel;
CREATE USER 'panel_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON vps_panel.* TO 'panel_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Run migrations
chmod +x run-migrations.sh
./run-migrations.sh
```

### Step 3: Configuration
Edit `config.php` with your database credentials:
```php
define('DB_USERNAME', 'panel_user');
define('DB_PASSWORD', 'your_password');
define('DB_NAME', 'vps_panel');
```

### Step 4: Create Admin User
```bash
php create-user.php
# Follow prompts and select 'yes' for admin user
```

### Step 5: Web Server Configuration

**For Nginx:**
```nginx
server {
    listen 80;
    server_name your-domain.com;
    root /var/www/html/vps-panel;
    index index.php;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/var/run/php/php-fpm.sock;
    }
}
```

## Database Schema

### Core Tables
- **users**: User accounts with role management
- **nodes**: Proxmox server nodes
- **ip_pools**: Available IP addresses
- **subnets**: Network configurations
- **plans**: VPS hosting plans
- **proxmox_templates**: OS templates
- **vps_instances**: User VPS instances
- **activity_logs**: Audit trail

## Security Features

- ✅ Prepared statements (SQL injection prevention)
- ✅ Password hashing (bcrypt)
- ✅ CSRF protection on all forms
- ✅ Admin route protection
- ✅ Input validation and sanitization
- ✅ XSS protection
- ✅ Activity logging
- ✅ Secure Proxmox API communication

## Development Status

### ✅ Completed
- [x] User authentication system
- [x] Database schema design
- [x] Proxmox API wrapper
- [x] Middleware & security functions
- [x] Project structure

### 🚧 In Progress
- [ ] Admin dashboard UI
- [ ] User dashboard UI
- [ ] VPS automation
- [ ] Dark theme implementation

### 📋 Planned
- [ ] Billing integration
- [ ] Email notifications
- [ ] Two-factor authentication
- [ ] API rate limiting
- [ ] Backup management

## API Documentation

### Proxmox API Wrapper

```php
require_once 'includes/proxmox.class.php';

$proxmox = new ProxmoxAPI($host, $port, $token_id, $token_secret);

// Test connection
$proxmox->testConnection();

// Get nodes
$nodes = $proxmox->getNodes();

// Create VM
$proxmox->createVM($node, $vmid, $config);

// Control VM
$proxmox->startVM($node, $vmid);
$proxmox->stopVM($node, $vmid);
$proxmox->restartVM($node, $vmid);
```

## Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## License

This project is licensed under the MIT License.

## Support

For issues and questions:
- GitHub Issues: https://github.com/Alfha240/vps-panel/issues
- Documentation: Coming soon

## Roadmap

**Phase 1**: Core Infrastructure ✅  
**Phase 2**: Admin Dashboard (In Progress)  
**Phase 3**: User Dashboard  
**Phase 4**: VPS Automation  
**Phase 5**: UI/UX Polish  
**Phase 6**: Production Deployment  

---

Built with ❤️ using Pure PHP
