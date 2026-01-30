# VPS Control Panel

A professional, production-ready VPS hosting control panel built with Node.js, Express, TypeScript, MySQL, and Docker. Features Proxmox integration, role-based access control, IPAM system, and external API support.

## 🚀 Features

### Core Functionality
- **Single Login System**: Unified login for admins and users with role-based access control
- **Proxmox Integration**: Full VM lifecycle management (create, start, stop, restart, delete)
- **IP Address Management (IPAM)**: Automatic IP pool management with CIDR support
- **RESTful API**: External API with JWT authentication for WHMCS/automation integrations
- **Modern UI**: Professional dark theme with glassmorphism design

### Admin Panel
- 📊 **Dashboard**: System statistics and recent activity
- 📍 **Locations**: Manage data center locations
- 🖥️ **Nodes**: Proxmox node management with live stats
- 💻 **Servers**: Server management (list, suspend, delete)
- 🌐 **IPAM**: IP pool and address management
- 👥 **Users**: User management and role assignment
- 🔑 **API Tokens**: Generate permission-based API tokens
- 📦 **Plans**: VPS plan management

### User Panel
- 📊 **Dashboard**: Personal server overview
- 💻 **My Servers**: Server list with management controls
- ⚡ **Server Control**: Power on/off/restart functionality
- 👤 **Profile**: Account and password management

## 📋 Prerequisites

- **Node.js** 18+ 
- **Docker** and **Docker Compose**
- **Proxmox VE** server(s)

## ⚡ Quick Start

### 1. Clone the Repository

```bash
git clone <repository-url>
cd vps-panel
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` and configure:
```env
# Database
DATABASE_URL="mysql://vps_panel:your_password@db:3306/vps_panel"

# Secrets (CHANGE THESE!)
SESSION_SECRET=your-super-secret-session-key
JWT_SECRET=your-super-secret-jwt-key

# Application
NODE_ENV=production
PORT=3000
APP_URL=http://your-domain.com
```

### 3. Deploy with Docker

```bash
docker compose up -d
```

This will start:
- MySQL database
- Redis cache
- VPS Panel application (runs migrations automatically)

### 4. Create Admin User

```bash
docker compose exec app npm run create-user
```

Follow the prompts to create your first admin user.

### 5. Access the Panel

Open your browser to `http://localhost:3000` (or your configured domain) and login with your admin credentials.

## 📚 Project Structure

```
vps-panel/
├── src/
│   ├── config/              # Configuration management
│   ├── controllers/         # Route controllers
│   │   ├── admin/           # Admin controllers
│   │   ├── user/            # User controllers
│   │   └── api/             # API controllers
│   ├── middlewares/         # Express middlewares
│   ├── routes/              # Route definitions
│   ├── services/            # Business logic
│   │   ├── proxmox.service.ts
│   │   └── deployment.service.ts
│   ├── lib/                 # Utilities and helpers
│   ├── views/               # EJS templates
│   └── public/              # Static assets
├── prisma/
│   └── schema.prisma        # Database schema
├── scripts/
│   └── create-user.ts       # CLI user creation
├── docker-compose.yml
├── Dockerfile
└── package.json
```

## 🔧 Configuration

### Proxmox Setup

1. **Add a Node** via Admin Panel → Nodes
2. Provide:
   - Node name (must match Proxmox node name)
   - Proxmox host/IP
   - Port (default: 8006)
   - Username (e.g., `root`)
   - Password
   - Realm (default: `pam`)

3. The panel will test the connection and fetch live stats

### IP Pool Setup

1. Navigate to Admin Panel → IPAM
2. Create an IP pool with:
   - Name
   - Location
   - CIDR (e.g., `192.168.1.0/24`)
   - Gateway
   - Netmask
   - DNS servers

The system will automatically generate all IP addresses from the CIDR.

### VPS Plans

1. Navigate to Admin Panel → Plans
2. Create a plan with:
   - Name and description
   - CPU cores
   - RAM (MB)
   - Disk (GB)
   - Bandwidth (GB)
   - Price per hour (optional)

## 🔌 API Usage

### Generate API Token

1. Navigate to Admin Panel → API Tokens
2. Generate a new token with required permissions:
   - `create_vm`: Deploy servers
   - `list_vm`: List servers
   - `control_vm`: Power controls
   - `delete_vm`: Delete servers

### API Endpoints

**Deploy Server:**
```bash
curl -X POST http://your-domain.com/api/servers/deploy \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": 1,
    "plan_id": 1,
    "os_template": "ubuntu-22.04",
    "hostname": "server-001"
  }'
```

**List Servers:**
```bash
curl http://your-domain.com/api/servers \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

**Control Server:**
```bash
curl -X POST http://your-domain.com/api/servers/1/power \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"action": "start"}'
```

## 🛠️ Development

### Install Dependencies

```bash
npm install
```

### Run Database Migrations

```bash
npx prisma migrate dev
```

### Start Development Server

```bash
npm run dev
```

### Build for Production

```bash
npm run build
```

## 🔒 Security Best Practices

1. **Change Default Secrets**: Update `SESSION_SECRET` and `JWT_SECRET` in `.env`
2. **Use HTTPS**: Deploy behind nginx with SSL/TLS
3. **Secure Database**: Use strong passwords for MySQL
4. **Firewall Rules**: Restrict access to Proxmox API and database ports
5. **Regular Updates**: Keep dependencies updated

## 📝 Database Schema

The database includes models for:
- **Users**: Authentication and role management
- **Locations**: Data center locations
- **Nodes**: Proxmox server nodes
- **Servers**: Virtual machines
- **Plans**: VPS resource packages
- **IP Pools**: Network configuration
- **IP Addresses**: Individual IPs with assignment tracking
- **API Tokens**: External API access

## 🐛 Troubleshooting

### Cannot connect to Proxmox
- Verify Proxmox credentials
- Check firewall rules (port 8006)
- Ensure SSL certificate is valid or disable SSL verification

### Database connection failed
- Verify `DATABASE_URL` in `.env`
- Check if database container is running: `docker compose ps`
- View logs: `docker compose logs db`

### Redis connection failed
- Check if Redis container is running
- Verify `REDIS_HOST` and `REDIS_PORT`

## 📄 License

MIT

## 🤝 Contributing

Contributions are welcome! Please open an issue or submit a pull request.

---

**Built with ❤️ for professional VPS hosting management**
