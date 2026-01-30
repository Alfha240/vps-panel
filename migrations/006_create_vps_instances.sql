-- Migration: Create vps_instances table
-- Stores all VPS instances created by users

CREATE TABLE IF NOT EXISTS vps_instances (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    node_id INT NOT NULL,
    template_id INT NOT NULL,
    vmid INT NOT NULL COMMENT 'Proxmox VM ID',
    hostname VARCHAR(255) NOT NULL,
    ip_address VARCHAR(45),
    status VARCHAR(20) DEFAULT 'creating' COMMENT 'creating, running, stopped, suspended, deleted',
    ram INT NOT NULL COMMENT 'RAM in MB',
    cpu_cores INT NOT NULL,
    disk INT NOT NULL COMMENT 'Disk in GB',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES plans(id),
    FOREIGN KEY (node_id) REFERENCES nodes(id),
    FOREIGN KEY (template_id) REFERENCES proxmox_templates(id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add foreign key constraint for IP pools
ALTER TABLE ip_pools 
ADD CONSTRAINT fk_ip_vps 
FOREIGN KEY (assigned_to_vps) REFERENCES vps_instances(id) ON DELETE SET NULL;
