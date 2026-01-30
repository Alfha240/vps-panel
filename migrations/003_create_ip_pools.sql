-- Migration: Create IP pools table
-- Stores available IP addresses

CREATE TABLE IF NOT EXISTS ip_pools (
    id INT AUTO_INCREMENT PRIMARY KEY,
    ip_address VARCHAR(45) NOT NULL UNIQUE,
    subnet_id INT,
    is_assigned TINYINT(1) DEFAULT 0,
    assigned_to_vps INT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subnet_id) REFERENCES subnets(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
