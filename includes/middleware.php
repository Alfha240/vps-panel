<?php
/**
 * Middleware Functions
 * Authentication and authorization guards
 */

/**
 * Require user to be logged in
 * Redirects to login page if not authenticated
 */
function requireLogin() {
    if (!isset($_SESSION['loggedin']) || $_SESSION['loggedin'] !== true) {
        header('Location: /index.php');
        exit;
    }
}

/**
 * Require user to be admin
 * Redirects to user dashboard if not admin
 */
function requireAdmin() {
    requireLogin();
    if (!isset($_SESSION['is_admin']) || $_SESSION['is_admin'] != 1) {
        header('Location: /user/dashboard.php');
        exit;
    }
}

/**
 * Generate CSRF token
 * @return string CSRF token
 */
function generateCSRFToken() {
    if (!isset($_SESSION['csrf_token'])) {
        $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
    }
    return $_SESSION['csrf_token'];
}

/**
 * Verify CSRF token
 * @param string $token Token to verify
 * @return bool Verification result
 */
function verifyCSRFToken($token) {
    return isset($_SESSION['csrf_token']) && hash_equals($_SESSION['csrf_token'], $token);
}

/**
 * Log activity
 * @param int $user_id User ID
 * @param string $action Action performed
 * @param string $details Additional details
 */
function logActivity($user_id, $action, $details = '') {
    global $pdo;
    
    $ip = $_SERVER['REMOTE_ADDR'] ?? 'unknown';
    
    $stmt = $pdo->prepare("INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES (:user_id, :action, :details, :ip)");
    $stmt->execute([
        ':user_id' => $user_id,
        ':action' => $action,
        ':details' => $details,
        ':ip' => $ip
    ]);
}

/**
 * Sanitize input
 * @param string $data Input data
 * @return string Sanitized data
 */
function sanitize($data) {
    return htmlspecialchars(strip_tags(trim($data)), ENT_QUOTES, 'UTF-8');
}

/**
 * Validate email
 * @param string $email Email address
 * @return bool Validation result
 */
function validateEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate IP address
 * @param string $ip IP address
 * @return bool Validation result
 */
function validateIP($ip) {
    return filter_var($ip, FILTER_VALIDATE_IP) !== false;
}

/**
 * Generate random password
 * @param int $length Password length
 * @return string Random password
 */
function generatePassword($length = 12) {
    $chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    return substr(str_shuffle(str_repeat($chars, $length)), 0, $length);
}

/**
 * Format bytes to human readable
 * @param int $bytes Bytes
 * @return string Formatted string
 */
function formatBytes($bytes) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    $bytes = max($bytes, 0);
    $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
    $pow = min($pow, count($units) - 1);
    $bytes /= (1 << (10 * $pow));
    return round($bytes, 2) . ' ' . $units[$pow];
}
?>
