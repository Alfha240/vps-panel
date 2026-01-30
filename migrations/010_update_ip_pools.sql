-- Migration: Update IP pools for IPAM
-- Add MAC address and CIDR support

ALTER TABLE ip_pools 
ADD COLUMN cidr VARCHAR(50) AFTER ip_address,
ADD COLUMN gateway VARCHAR(45) AFTER cidr,
ADD COLUMN mac_address VARCHAR(17) AFTER gateway;

-- Rename table to ip_addresses for clarity
RENAME TABLE ip_pools TO ip_addresses;
