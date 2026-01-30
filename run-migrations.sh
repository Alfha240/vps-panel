#!/bin/bash
# Run all database migrations

echo "Running VPS Panel Database Migrations..."

DB_USER="panel_user"
DB_PASS="lordcloud"
DB_NAME="vps_panel"

# Run migrations in order
for file in migrations/*.sql; do
    echo "Running migration: $file"
    mysql -u $DB_USER -p$DB_PASS $DB_NAME < "$file"
    if [ $? -eq 0 ]; then
        echo "✓ $file completed successfully"
    else
        echo "✗ $file failed"
        exit 1
    fi
done

echo ""
echo "All migrations completed successfully!"
