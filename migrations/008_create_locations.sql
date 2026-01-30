-- Migration: Create locations table
-- Stores datacenter/location information

CREATE TABLE IF NOT EXISTS locations (
    id INT AUTO_INCREMENT PRIMARY KEY,
    short_code VARCHAR(10) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Update nodes table to include location
ALTER TABLE nodes ADD COLUMN location_id INT AFTER id;
ALTER TABLE nodes ADD FOREIGN KEY (location_id) REFERENCES locations(id) ON DELETE SET NULL;
