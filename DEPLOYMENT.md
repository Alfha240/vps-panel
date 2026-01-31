# VPS Hosting Control Panel - Deployment Guide

## Docker Deployment

### 1. Create Dockerfile

See `Dockerfile` in the project root.

### 2. Create docker-compose.yml

\`\`\`yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: vps_panel
      POSTGRES_USER: vpsadmin
      POSTGRES_PASSWORD: changeme123
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U vpsadmin"]
      interval: 10s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: "postgresql://vpsadmin:changeme123@postgres:5432/vps_panel"
      NEXTAUTH_SECRET: "your-secret-key-here-minimum-32-characters"
      NEXTAUTH_URL: "http://localhost:3000"
      ENCRYPTION_KEY: "your-32-character-encryption-key"
      NODE_ENV: "production"
    depends_on:
      postgres:
        condition: service_healthy
    command: sh -c "npx prisma migrate deploy && npm start"

volumes:
  postgres_data:
\`\`\`

### 3. Deploy with Docker Compose

\`\`\`bash
docker-compose up -d
\`\`\`

### 4. Create Admin Account

\`\`\`bash
docker-compose exec app npm run create-admin
\`\`\`

## VPS Deployment (Ubuntu 22.04)

### 1. Install Prerequisites

\`\`\`bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install PM2 (process manager)
sudo npm install -g pm2
\`\`\`

### 2. Setup PostgreSQL

\`\`\`bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL prompt:
CREATE DATABASE vps_panel;
CREATE USER vpsadmin WITH ENCRYPTED PASSWORD 'your_strong_password';
GRANT ALL PRIVILEGES ON DATABASE\vps_panel TO vpsadmin;
\\q
\`\`\`

### 3. Deploy Application

\`\`\`bash
# Clone repository
cd /opt
sudo git clone <your-repo-url> vps-panel
cd vps-panel

# Install dependencies
sudo npm install

# Create .env file
sudo nano .env
# Add your configuration (see .env.example)

# Run migrations
sudo npm run prisma:generate
sudo npm run prisma:migrate

# Build application
sudo npm run build

# Create admin
sudo npm run create-admin
\`\`\`

### 4. Setup PM2

\`\`\`bash
# Start with PM2
pm2 start npm --name "vps-panel" -- start

# Save PM2 config
pm2 save

# Setup auto-start on boot
pm2 startup
# Run the command it outputs
\`\`\`

### 5. Configure Nginx

\`\`\`bash
sudo apt install -y nginx

# Create nginx config
sudo nano /etc/nginx/sites-available/vps-panel
\`\`\`

Add:

\`\`\`nginx
server {
    listen 80;
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
\`\`\`

Enable site:

\`\`\`bash
sudo ln -s /etc/nginx/sites-available/vps-panel /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
\`\`\`

### 6. Setup SSL with Let's Encrypt

\`\`\`bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
\`\`\`

## Environment Variables for Production

\`\`\`env
DATABASE_URL="postgresql://vpsadmin:password@localhost:5432/vps_panel"
NEXTAUTH_SECRET="$(openssl rand -base64 32)"
NEXTAUTH_URL="https://your-domain.com"
 ENCRYPTION_KEY="$(openssl rand -hex 16)"
NODE_ENV="production"
\`\`\`

## Maintenance

### View Logs

\`\`\`bash
pm2 logs vps-panel
\`\`\`

### Restart Application

\`\`\`bash
pm2 restart vps-panel
\`\`\`

### Update Application

\`\`\`bash
cd /opt/vps-panel
sudo git pull
sudo npm install
sudo npm run build
pm2 restart vps-panel
\`\`\`

### Database Backup

\`\`\`bash
pg_dump -U vpsadmin vps_panel > backup_$(date +%Y%m%d).sql
\`\`\`

### Database Restore

\`\`\`bash
psql -U vpsadmin vps_panel < backup_20260131.sql
\`\`\`
