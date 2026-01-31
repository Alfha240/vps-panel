# VPS Hosting Control Panel

A professional, production-grade VPS hosting control panel built with Next.js 14, TypeScript, and Prisma.

## Features

- ✅ **Single Login System** - Both admins and users use the same login page
- ✅ **Role-Based Access Control** - Automatic routing based on user role
- ✅ **Admin Panel** - Complete infrastructure management
  - Locations management
  - Node management with encrypted credentials
  - VPS plans with pricing
  - Server oversight and control
  - IP Address Management (IPAM)
  - User management
  - API token system
- ✅ **User Panel** - Self-service VPS management
  - Personal dashboard
  - VPS list and details
  - Power control (start, stop, restart)
- ✅ **API System** - Token-based external API access
- ✅ **Premium Dark UI** - Modern, professional interface
- ✅ **Security** - Encrypted credentials, role protection, input validation

## Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5
- **Styling**: Tailwind CSS
- **Icons**: Lucide React

## Prerequisites

- Node.js 18+ 
- PostgreSQL database
- npm or yarn

## Installation

### 1. Clone the Repository

\`\`\`bash
git clone <repository-url>
cd vps-panel
\`\`\`

### 2. Install Dependencies

\`\`\`bash
npm install
\`\`\`

### 3. Configure Environment Variables

Copy the example environment file:

\`\`\`bash
cp .env.example .env
\`\`\`

Edit `.env` and configure:

\`\`\`env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/vps_panel?schema=public"

# NextAuth
NEXTAUTH_SECRET="your-super-secret-key-here-minimum-32-characters"
NEXTAUTH_URL="http://localhost:3000"

# Encryption (for node credentials)
ENCRYPTION_KEY="your-32-character-encryption-key-here-exactly-32-chars"
\`\`\`

**Important**: 
- Replace database credentials with your PostgreSQL details
- Generate a secure `NEXTAUTH_SECRET` (you can use: `openssl rand -base64 32`)
- The `ENCRYPTION_KEY` must be exactly 32 characters

### 4. Set Up Database

Run Prisma migrations:

\`\`\`bash
npm run prisma:generate
npm run prisma:migrate
\`\`\`

### 5. Create Admin Account

Use the CLI tool to create your first admin account:

\`\`\`bash
npm run create-admin
\`\`\`

Follow the prompts:
- Enter name
- Enter email
- Enter password (minimum 8 characters)
- Confirm admin status (yes/no)

### 6. Start Development Server

\`\`\`bash
npm run dev
\`\`\`

The panel will be available at: `http://localhost:3000`

## Usage

### Login

1. Navigate to `http://localhost:3000`
2. You'll be redirected to the login page
3. Enter your credentials
4. Admins will be routed to `/admin`
5. Regular users will be routed to `/user`

### Admin Tasks

**Locations**: Create geographical locations for your infrastructure
1. Go to Admin → Locations
2. Click "Add Location"
3. Fill in details (name, code, country, city)

**Plans**: Create VPS hosting plans
1. Go to Admin → Plans
2. Click "Add Plan"
3. Define resources (CPU, RAM, storage, bandwidth, price)

**Nodes**: Add infrastructure nodes *(Note: credentials are encrypted)*
1. Go to Admin → Nodes
2. Provide SSH/API credentials
3. Assign to a location

**IP Management**: Manage IP address pools
1. Go to Admin → IP Management
2. Create IP pools with CIDR notation
3. IPs are auto-assigned during VPS creation

**Users**: Manage all users
1. Go to Admin → Users
2. View user details
3. Promote/demote admin access

**API Tokens**: Generate API tokens for external access
1. Go to Admin → API Tokens
2. Create token with specific permissions
3. Use for automation/billing integration

### User Tasks

**View Servers**:
1. Go to User → My Servers
2. Click on any server to view details

**Control VPS**:
1. Open server details page
2. Use power controls (Start, Stop, Restart)

## Backend Integration

**IMPORTANT**: This control panel includes placeholder functions for VPS management. You need to implement the actual backend integration based on your virtualization platform.

Edit `lib/virtualization.ts` and implement:
- `createVPS()` - Create VM in your backend
- `startVPS()` - Start VM
- `stopVPS()` - Stop VM
- `restartVPS()` - Restart VM
- `deleteVPS()` - Delete VM

Supported backends (you'll need to add the SDK):
- Proxmox VE
- LibVirt/QEMU
- VMware
- OpenStack
- Custom API

## API Usage

### Authentication

All API requests require a Bearer token in the Authorization header:

\`\`\`bash
curl -H "Authorization: Bearer YOUR_API_TOKEN" \\
  http://localhost:3000/api/servers
\`\`\`

### Endpoints

- `GET /api/servers` - List servers
- `POST /api/servers` - Create server
- `POST /api/servers/{id}/power` - Control server power

## Production Deployment

### 1. Build the Application

\`\`\`bash
npm run build
\`\`\`

### 2. Start Production Server

\`\`\`bash
npm start
\`\`\`

### 3. Environment Configuration

- Set `NODE_ENV=production`
- Use a strong `NEXTAUTH_SECRET`
- Use a production PostgreSQL database
- Enable SSL for database connections
- Set up reverse proxy (nginx/Apache)

### 4. Security Checklist

- [ ] Change all default secrets
- [ ] Use HTTPS in production
- [ ] Enable database SSL
- [ ] Set up firewall rules
- [ ] Regular backups
- [ ] Monitor logs

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run create-admin` - Create admin account (CLI)
- `npm run prisma:generate` - Generate Prisma client
- `npm run prisma:migrate` - Run database migrations
- `npm run prisma:studio` - Open Prisma Studio (DB GUI)

## Project Structure

\`\`\`
vps-panel/
├── app/                      # Next.js app directory
│   ├── admin/               # Admin panel pages
│   ├── user/                # User panel pages
│   ├── api/                 # API routes
│   └── login/               # Login page
├── components/              # React components
│   └── ui/                  # Reusable UI components
├── lib/                     # Utility libraries
│   ├── auth.ts             # NextAuth configuration
│   ├── prisma.ts           # Prisma client
│   ├── encryption.ts       # Credential encryption
│   ├── virtualization.ts   # Backend integration (TODO)
│   └── ip-manager.ts       # IP management logic
├── prisma/                  # Database schema
│   └── schema.prisma
└── scripts/                 # CLI tools
    └── create-admin.ts      # Admin creation tool
\`\`\`

## Troubleshooting

### Can't login as admin
- Verify you created the account with `npm run create-admin`
- Check `isAdmin` flag is `true` in database
- Clear browser cookies and try again

### Database connection errors
- Verify PostgreSQL is running
- Check `DATABASE_URL` in `.env`
- Ensure database exists

### Build errors
- Run `npm install` again
- Delete `node_modules` and `.next`, then reinstall

## Future Enhancements

- Console/VNC integration
- Billing system integration
- Automated backups
- Resource usage graphs
- Email notifications
- Two-factor authentication
- Audit logging

## License

Proprietary - All rights reserved

## Support

For issues and questions, please open an issue in the repository.
