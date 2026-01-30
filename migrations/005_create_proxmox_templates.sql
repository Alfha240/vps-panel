-- Migration: Create proxmox_templates table
-- Stores OS templates available from Proxmox

CREATE TABLE IF NOT EXISTS proxmox_templates (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    os_type VARCHAR(50) NOT NULL COMMENT 'ubuntu, debian, centos, windows, etc.',
    template_id INT NOT NULL COMMENT 'Proxmox template VMID',
    node_id INT NOT NULL,
    is_active TINYINT(1) DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (node_id) REFERENCES nodes(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
