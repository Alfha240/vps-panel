# Quick Start Guide

## ✅ Setup Complete!

Your VPS Control Panel is ready to use with SQLite database (no PostgreSQL installation required).

### Start the Application

**Option 1: Quick Setup (Recommended for first time)**
```bash
.\setup.bat
```
This will:
1. Prompt you to create an admin user
2. Start the development server

**Option 2: Manual Steps**
```bash
# Create admin user (first time only)
npm run create-admin

# Start development server
npm run dev
```

### Access the Panel

- **URL**: http://localhost:3000
- **Admin Panel**: http://localhost:3000/admin
- **User Panel**: http://localhost:3000/user

### Login

Use the email and password you created during setup.

### Database

- **Type**: SQLite (file-based, no server required)
- **Location**: `prisma/dev.db`
- **View/Edit**: Use Prisma Studio: `npm run prisma:studio`

### What's Working

✅ Login system with role-based routing  
✅ Admin Panel:
  - Dashboard with statistics
  - Locations management
  - Plans management
  
✅ User Panel:
  - Dashboard
  - Server list
  - Server details with power controls

### Next Steps

1. **Add Locations**: Go to Admin → Locations
2. **Create Plans**: Go to Admin → Plans  
3. **Complete Remaining Admin Pages**: Nodes, Servers, IPAM, Users, API Tokens

### Switching to PostgreSQL (Production)

When ready for production:

1. Install PostgreSQL
2. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
3. Update `.env`:
   ```env
   DATABASE_URL="postgresql://user:password@localhost:5432/vps_panel"
   ```
4. Run migrations:
   ```bash
   npm run prisma:migrate
   ```

### Troubleshooting

**Server won't start?**
- Make sure port 3000 is not in use
- Check `.env` file exists

**Can't login?**
- Make sure you created an admin user
- Check email/password are correct

**Need to reset?**
- Delete `prisma/dev.db`
- Run `npm run prisma:migrate`
- Run `npm run create-admin`

### Support

Check the full [README.md](README.md) for detailed documentation.
