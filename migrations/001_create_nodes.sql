-- Migration: Create nodes table
-- Stores Proxmox node information

CREATE TABLE IF NOT EXISTS nodes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    host VARCHAR(255) NOT NULL,
    port INT DEFAULT 8006,
    token_id VARCHAR(255) NOT NULL,
    token_secret VARCHAR(255) NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    max_vps INT DEFAULT 50,
    current_vps INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
