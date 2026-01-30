<?php
/**
 * Helper Functions
 * Common utility functions used throughout the application
 */

/**
 * Sanitize input to prevent XSS
 */
function sanitize($input) {
    if (is_array($input)) {
        foreach ($input as $key => $value) {
            $input[$key] = sanitize($value);
        }
        return $input;
    }
    return htmlspecialchars(trim($input), ENT_QUOTES, 'UTF-8');
}

/**
 * Redirect to a URL
 */
function redirect($url, $permanent = false) {
    if ($permanent) {
        header('HTTP/1.1 301 Moved Permanently');
    }
    header('Location: ' . $url);
    exit();
}

/**
 * Generate CSRF token
 */
function generateCSRFToken() {
    if (!isset($_SESSION[CSRF_TOKEN_NAME])) {
        $_SESSION[CSRF_TOKEN_NAME] = bin2hex(random_bytes(32));
    }
    return $_SESSION[CSRF_TOKEN_NAME];
}

/**
 * Verify CSRF token
 */
function verifyCSRFToken($token) {
    return isset($_SESSION[CSRF_TOKEN_NAME]) && hash_equals($_SESSION[CSRF_TOKEN_NAME], $token);
}

/**
 * Generate UUID v4
 */
function generateUUID() {
    $data = random_bytes(16);
    $data[6] = chr(ord($data[6]) & 0x0f | 0x40);
    $data[8] = chr(ord($data[8]) & 0x3f | 0x80);
    return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($data), 4));
}

/**
 * Generate random MAC address
 */
function generateMACAddress() {
    $mac = [];
    for ($i = 0; $i < 6; $i++) {
        $mac[] = str_pad(dechex(mt_rand(0, 255)), 2, '0', STR_PAD_LEFT);
    }
    // Set locally administered bit
    $mac[0] = str_pad(dechex(hexdec($mac[0]) | 0x02), 2, '0', STR_PAD_LEFT);
    // Clear multicast bit
    $mac[0] = str_pad(dechex(hexdec($mac[0]) & 0xfe), 2, '0', STR_PAD_LEFT);
    
    return strtoupper(implode(':', $mac));
}

/**
 * Generate API token
 */
function generateAPIToken() {
    return bin2hex(random_bytes(32));
}

/**
 * Validate email format
 */
function isValidEmail($email) {
    return filter_var($email, FILTER_VALIDATE_EMAIL) !== false;
}

/**
 * Validate IP address
 */
function isValidIP($ip) {
    return filter_var($ip, FILTER_VALIDATE_IP) !== false;
}

/**
 * Format bytes to human readable
 */
function formatBytes($bytes, $precision = 2) {
    $units = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    for ($i = 0; $bytes > 1024 && $i < count($units) - 1; $i++) {
        $bytes /= 1024;
    }
    
    return round($bytes, $precision) . ' ' . $units[$i];
}

/**
 * Get time ago format
 */
function timeAgo($datetime) {
    $timestamp = strtotime($datetime);
    $difference = time() - $timestamp;
    
    if ($difference < 60) {
        return $difference . ' seconds ago';
    } elseif ($difference < 3600) {
        return floor($difference / 60) . ' minutes ago';
    } elseif ($difference < 86400) {
        return floor($difference / 3600) . ' hours ago';
    } elseif ($difference < 604800) {
        return floor($difference / 86400) . ' days ago';
    } else {
        return date('M d, Y', $timestamp);
    }
}

/**
 * Set flash message
 */
function setFlash($type, $message) {
    $_SESSION['flash'] = [
        'type' => $type,
        'message' => $message
    ];
}

/**
 * Get and clear flash message
 */
function getFlash() {
    if (isset($_SESSION['flash'])) {
        $flash = $_SESSION['flash'];
        unset($_SESSION['flash']);
        return $flash;
    }
    return null;
}

/**
 * Check if user is logged in
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Check if user is admin
 */
function isAdmin() {
    return isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1;
}

/**
 * Get current user ID
 */
function getCurrentUserID() {
    return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
}

/**
 * JSON response helper
 */
function jsonResponse($data, $statusCode = 200) {
    http_response_code($statusCode);
    header('Content-Type: application/json');
    echo json_encode($data);
    exit();
}

/**
 * Error response helper
 */
function errorResponse($message, $statusCode = 400) {
    jsonResponse(['success' => false, 'error' => $message], $statusCode);
}

/**
 * Success response helper
 */
function successResponse($data = [], $message = 'Success') {
    jsonResponse(array_merge(['success' => true, 'message' => $message], $data));
}
