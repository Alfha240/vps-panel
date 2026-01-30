-- Migration: Create plans table
-- Stores VPS hosting plans

CREATE TABLE IF NOT EXISTS plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    ram INT NOT NULL COMMENT 'RAM in MB',
    cpu_cores INT NOT NULL,
    disk INT NOT NULL COMMENT 'Disk in GB',
    bandwidth INT DEFAULT 0 COMMENT 'Bandwidth in GB, 0 = unlimited',
    price DECIMAL(10,2) NOT NULL,
    is_visible TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
