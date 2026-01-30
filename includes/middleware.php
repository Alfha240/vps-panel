<?php
/**
 * Middleware Functions
 * Route protection and access control
 */

/**
 * Require user to be authenticated
 */
function requireAuth() {
    $auth = new Auth();
    
    if (!$auth->validateSession()) {
        setFlash('error', 'Please login to continue');
        redirect(APP_URL . '/index.php');
    }
}

/**
 * Require user to be admin
 */
function requireAdmin() {
    requireAuth();
    
    if (!isAdmin()) {
        setFlash('error', 'Access denied. Admin privileges required.');
        redirect(APP_URL . '/user/index.php');
    }
}

/**
 * Require guest (not logged in)
 */
function requireGuest() {
    if (isLoggedIn()) {
        if (isAdmin()) {
            redirect(APP_URL . '/admin/dashboard.php');
        } else {
            redirect(APP_URL . '/user/dashboard.php');
        }
    }
}

/**
 * Verify API token for external requests
 */
function verifyAPIToken() {
    global $db;
    
    // Get token from header
    $headers = getallheaders();
    $token = isset($headers['X-API-Token']) ? $headers['X-API-Token'] : null;
    
    if (!$token) {
        errorResponse('API token required', 401);
    }
    
    // Verify token exists
    $tokenData = $db->fetch('SELECT * FROM api_tokens WHERE token = :token', ['token' => $token]);
    
    if (!$tokenData) {
        errorResponse('Invalid API token', 401);
    }
    
    // Update last used timestamp
    $db->update('api_tokens', 
        ['last_used_at' => date('Y-m-d H:i:s')],
        'id = :id',
        ['id' => $tokenData['id']]
    );
    
    return $tokenData;
}

/**
 * Check API permission
 */
function hasAPIPermission($tokenData, $permission) {
    $permissions = json_decode($tokenData['permissions'], true);
    return in_array($permission, $permissions);
}

/**
 * Require API permission
 */
function requireAPIPermission($permission) {
    $tokenData = verifyAPIToken();
    
    if (!hasAPIPermission($tokenData, $permission)) {
        errorResponse('Insufficient permissions', 403);
    }
    
    return $tokenData;
}
