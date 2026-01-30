#!/bin/bash

# update.sh - Update VPS Panel on server
# Usage: sudo ./update.sh

# Exit on error
set -e

# Colors
GREEN='\033[0;32m'
NC='\033[0m'

echo -e "${GREEN}Updating VPS Panel...${NC}"

# Pull latest changes from GitHub
echo -e "${GREEN}Pulling latest code from GitHub...${NC}"
git pull origin main

# Set permissions
echo -e "${GREEN}Setting permissions...${NC}"
chown -R www-data:www-data .
chmod -R 755 .

# Check if migration file exists and hasn't been run
if [ -f "migrate_admin.sql" ]; then
    read -p "Run database migration (migrate_admin.sql)? (y/n): " RUN_MIGRATION
    if [ "$RUN_MIGRATION" = "y" ] || [ "$RUN_MIGRATION" = "Y" ]; then
        read -sp "Enter database password: " DB_PASS
        echo ""
        mysql -u panel_user -p"$DB_PASS" vps_panel < migrate_admin.sql
        echo -e "${GREEN}Migration completed!${NC}"
    fi
fi

# Restart Apache
echo -e "${GREEN}Restarting Apache...${NC}"
systemctl restart apache2

echo -e "${GREEN}Update Complete!${NC}"
