-- Migration: Add is_admin column to users table
ALTER TABLE users ADD COLUMN is_admin TINYINT(1) DEFAULT 0 NOT NULL AFTER password;
