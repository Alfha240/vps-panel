# VPS Panel - PHP User Management System

A simple PHP-based VPS panel with user authentication, admin management, and a CLI tool for user creation.

## Features

- ✅ User Registration & Login
- ✅ Password Hashing (bcrypt)
- ✅ Protected Dashboard
- ✅ Admin System with Role-Based Access
- ✅ CLI Tool for User Creation (`php make-user.php`)
- ✅ Admin Panel with User Management
- ✅ Automated Installation Script

## Quick Start

### Local Development
1. Set up a local MySQL database
2. Import `database.sql`
3. Run `migrate_admin.sql` for admin features
4. Configure `config.php` with your database credentials
5. Start a local PHP server: `php -S localhost:8000`

### VPS Deployment

#### First-Time Installation
```bash
git clone https://github.com/Alfha240/vps-panel.git
cd vps-panel
chmod +x install.sh
sudo ./install.sh
```

#### Create Admin User
```bash
php make-user.php
```

#### Update Existing Installation
```bash
cd /var/www/html/vps-panel
sudo git pull origin main
sudo ./update.sh
```

## File Structure

```
vps-panel/
├── config.php              # Database configuration
├── database.sql            # Initial database schema
├── migrate_admin.sql       # Admin column migration
├── index.php               # Login page
├── register.php            # Registration page
├── dashboard.php           # User dashboard
├── admin.php               # Admin panel (admin-only)
├── logout.php              # Logout handler
├── make-user.php           # CLI user creation tool
├── install.sh              # Automated installation
├── update.sh               # Update script
├── INSTALL.md              # Detailed installation guide
└── assets/
    └── css/
        └── style.css       # Styling
```

## Usage

### Creating Users via CLI
```bash
php make-user.php
```
Follow the prompts to create a user with optional admin privileges.

### Admin Features
- Login with an admin account
- Click "Admin Panel" on the dashboard
- View all users and their roles

## Security Features

- Password hashing with `password_hash()`
- PDO prepared statements (SQL injection prevention)
- Session-based authentication
- Admin-only route protection

## Requirements

- PHP 7.4+
- MySQL 5.7+
- Apache 2.4+
- Git

## License

MIT License - See LICENSE file for details

## Author

Created for VPS management and user administration.
