-- Migration: Create API tokens table
-- Stores API tokens for external integrations (WHMCS, etc.)

CREATE TABLE IF NOT EXISTS api_tokens (
    id INT AUTO_INCREMENT PRIMARY KEY,
    token VARCHAR(64) NOT NULL UNIQUE,
    user_id INT NOT NULL,
    description VARCHAR(255),
    permissions JSON COMMENT 'Array of permissions: create_vm, delete_vm, suspend_vm, list_servers',
    last_used_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Add index for faster token lookups
CREATE INDEX idx_token ON api_tokens(token);
