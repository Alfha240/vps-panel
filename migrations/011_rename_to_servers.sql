-- Migration: Rename vps_instances to servers
-- Match Pterodactyl naming convention

RENAME TABLE vps_instances TO servers;

-- Add additional server fields
ALTER TABLE servers
ADD COLUMN uuid VARCHAR(36) UNIQUE AFTER id,
ADD COLUMN suspended TINYINT(1) DEFAULT 0 AFTER status,
ADD COLUMN suspended_at TIMESTAMP NULL AFTER suspended;

-- Generate UUIDs for existing servers
UPDATE servers SET uuid = UUID() WHERE uuid IS NULL;
