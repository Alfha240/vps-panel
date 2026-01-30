<?php
/**
 * VPS Hosting Control Panel - Configuration File
 * 
 * IMPORTANT: Update these settings before deploying to production
 */

// Database Configuration
define('DB_HOST', 'localhost');
define('DB_NAME', 'vps_panel');
define('DB_USER', 'vps_user');
define('DB_PASS', 'your_secure_password_here');
define('DB_CHARSET', 'utf8mb4');

// Application Settings
define('APP_NAME', 'VPS Control Panel');
define('APP_URL', 'http://localhost/vps-panel');
define('SESSION_NAME', 'vps_panel_session');
define('SESSION_LIFETIME', 1800); // 30 minutes in seconds

// Security Settings
define('PASSWORD_COST', 12); // Bcrypt cost factor
define('CSRF_TOKEN_NAME', '_csrf_token');

// Timezone
date_default_timezone_set('Asia/Kolkata');

// Error Reporting (set to 0 in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_name(SESSION_NAME);
    session_start();
    
    // Session security settings
    ini_set('session.cookie_httponly', 1);
    ini_set('session.use_only_cookies', 1);
    ini_set('session.cookie_secure', 0); // Set to 1 if using HTTPS
}

// Auto-include common files
require_once __DIR__ . '/database.php';
require_once __DIR__ . '/helpers.php';
