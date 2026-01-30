-- Migration: Create subnets table
-- Stores subnet configurations

CREATE TABLE IF NOT EXISTS subnets (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    subnet_range VARCHAR(50) NOT NULL,
    gateway VARCHAR(45) NOT NULL,
    netmask VARCHAR(45) NOT NULL,
    node_id INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
