-- VPS Hosting Control Panel - Database Schema
-- Version: 1.0
-- Date: 2026-01-30

-- Drop existing tables if they exist (for fresh install)
DROP TABLE IF EXISTS `api_tokens`;
DROP TABLE IF EXISTS `ip_addresses`;
DROP TABLE IF EXISTS `ip_pools`;
DROP TABLE IF EXISTS `servers`;
DROP TABLE IF EXISTS `plans`;
DROP TABLE IF EXISTS `nodes`;
DROP TABLE IF EXISTS `locations`;
DROP TABLE IF EXISTS `users`;

-- Users table
CREATE TABLE `users` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `email` varchar(255) NOT NULL,
  `password` varchar(255) NOT NULL,
  `is_admin` tinyint(1) NOT NULL DEFAULT 0,
  `credits` decimal(10,2) NOT NULL DEFAULT 0.00,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `email` (`email`),
  KEY `idx_is_admin` (`is_admin`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Locations table
CREATE TABLE `locations` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `short_code` varchar(10) NOT NULL,
  `description` text,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `short_code` (`short_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Nodes table (Proxmox servers)
CREATE TABLE `nodes` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `location_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `host` varchar(255) NOT NULL,
  `port` int(11) NOT NULL DEFAULT 8006,
  `api_token_id` varchar(255) NOT NULL,
  `api_secret` text NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `location_id` (`location_id`),
  KEY `idx_is_active` (`is_active`),
  CONSTRAINT `nodes_ibfk_1` FOREIGN KEY (`location_id`) REFERENCES `locations` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Plans table
CREATE TABLE `plans` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(255) NOT NULL,
  `cpu_cores` int(11) NOT NULL,
  `ram_mb` int(11) NOT NULL,
  `disk_gb` int(11) NOT NULL,
  `bandwidth_gb` int(11) NOT NULL DEFAULT 0,
  `price` decimal(10,2) NOT NULL,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `idx_is_active` (`is_active`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Servers table (VPS instances)
CREATE TABLE `servers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `uuid` varchar(36) NOT NULL,
  `user_id` int(11) NOT NULL,
  `node_id` int(11) NOT NULL,
  `plan_id` int(11) NOT NULL,
  `vmid` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `ip_address` varchar(45) DEFAULT NULL,
  `mac_address` varchar(17) DEFAULT NULL,
  `status` enum('active','suspended','deleted') NOT NULL DEFAULT 'active',
  `os` varchar(100) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `uuid` (`uuid`),
  KEY `user_id` (`user_id`),
  KEY `node_id` (`node_id`),
  KEY `plan_id` (`plan_id`),
  KEY `idx_status` (`status`),
  CONSTRAINT `servers_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE,
  CONSTRAINT `servers_ibfk_2` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE,
  CONSTRAINT `servers_ibfk_3` FOREIGN KEY (`plan_id`) REFERENCES `plans` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- IP Pools table
CREATE TABLE `ip_pools` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `node_id` int(11) NOT NULL,
  `name` varchar(255) NOT NULL,
  `gateway` varchar(45) NOT NULL,
  `netmask` varchar(45) NOT NULL,
  `cidr` varchar(50) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  KEY `node_id` (`node_id`),
  CONSTRAINT `ip_pools_ibfk_1` FOREIGN KEY (`node_id`) REFERENCES `nodes` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- IP Addresses table
CREATE TABLE `ip_addresses` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `pool_id` int(11) NOT NULL,
  `ip_address` varchar(45) NOT NULL,
  `mac_address` varchar(17) NOT NULL,
  `server_id` int(11) DEFAULT NULL,
  `is_assigned` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `ip_address` (`ip_address`),
  UNIQUE KEY `mac_address` (`mac_address`),
  KEY `pool_id` (`pool_id`),
  KEY `server_id` (`server_id`),
  KEY `idx_is_assigned` (`is_assigned`),
  CONSTRAINT `ip_addresses_ibfk_1` FOREIGN KEY (`pool_id`) REFERENCES `ip_pools` (`id`) ON DELETE CASCADE,
  CONSTRAINT `ip_addresses_ibfk_2` FOREIGN KEY (`server_id`) REFERENCES `servers` (`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- API Tokens table
CREATE TABLE `api_tokens` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `token` varchar(64) NOT NULL,
  `name` varchar(255) NOT NULL,
  `permissions` json NOT NULL,
  `created_by` int(11) NOT NULL,
  `last_used_at` timestamp NULL DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY `token` (`token`),
  KEY `created_by` (`created_by`),
  CONSTRAINT `api_tokens_ibfk_1` FOREIGN KEY (`created_by`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert default data (optional sample plan)
INSERT INTO `plans` (`name`, `cpu_cores`, `ram_mb`, `disk_gb`, `bandwidth_gb`, `price`, `is_active`) 
VALUES ('Starter VPS', 1, 1024, 20, 1000, 5.00, 1);
