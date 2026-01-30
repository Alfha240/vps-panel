<?php
/**
 * Authentication System
 * Handles user registration, login, logout, and session management
 */

class Auth {
    private $db;
    
    public function __construct() {
        $this->db = Database::getInstance();
    }
    
    /**
     * Register a new user
     */
    public function register($name, $email, $password, $isAdmin = false) {
        // Validate inputs
        if (empty($name) || empty($email) || empty($password)) {
            return ['success' => false, 'error' => 'All fields are required'];
        }
        
        if (!isValidEmail($email)) {
            return ['success' => false, 'error' => 'Invalid email format'];
        }
        
        if (strlen($password) < 8) {
            return ['success' => false, 'error' => 'Password must be at least 8 characters'];
        }
        
        // Check if email already exists
        $existing = $this->db->fetch('SELECT id FROM users WHERE email = :email', ['email' => $email]);
        if ($existing) {
            return ['success' => false, 'error' => 'Email already registered'];
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT, ['cost' => PASSWORD_COST]);
        
        // Insert user
        $data = [
            'name' => $name,
            'email' => $email,
            'password' => $hashedPassword,
            'is_admin' => $isAdmin ? 1 : 0
        ];
        
        $userId = $this->db->insert('users', $data);
        
        if ($userId) {
            return ['success' => true, 'user_id' => $userId];
        }
        
        return ['success' => false, 'error' => 'Registration failed'];
    }
    
    /**
     * Login user
     */
    public function login($email, $password) {
        // Validate inputs
        if (empty($email) || empty($password)) {
            return ['success' => false, 'error' => 'Email and password are required'];
        }
        
        // Get user from database
        $user = $this->db->fetch('SELECT * FROM users WHERE email = :email', ['email' => $email]);
        
        if (!$user) {
            return ['success' => false, 'error' => 'Invalid email or password'];
        }
        
        // Verify password
        if (!password_verify($password, $user['password'])) {
            return ['success' => false, 'error' => 'Invalid email or password'];
        }
        
        // Create session
        $this->createSession($user);
        
        return ['success' => true, 'user' => $user];
    }
    
    /**
     * Create user session
     */
    private function createSession($user) {
        // Regenerate session ID for security
        session_regenerate_id(true);
        
        // Set session variables
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];
        $_SESSION['user_email'] = $user['email'];
        $_SESSION['is_admin'] = $user['is_admin'];
        $_SESSION['login_time'] = time();
    }
    
    /**
     * Logout user
     */
    public function logout() {
        // Clear session
        $_SESSION = [];
        
        // Destroy session cookie
        if (isset($_COOKIE[session_name()])) {
            setcookie(session_name(), '', time() - 3600, '/');
        }
        
        // Destroy session
        session_destroy();
        
        return true;
    }
    
    /**
     * Check if session is valid
     */
    public function validateSession() {
        if (!isLoggedIn()) {
            return false;
        }
        
        // Check session timeout
        if (isset($_SESSION['login_time'])) {
            $elapsed = time() - $_SESSION['login_time'];
            if ($elapsed > SESSION_LIFETIME) {
                $this->logout();
                return false;
            }
            // Update last activity time
            $_SESSION['login_time'] = time();
        }
        
        return true;
    }
    
    /**
     * Get current user data
     */
    public function getCurrentUser() {
        if (!isLoggedIn()) {
            return null;
        }
        
        $userId = getCurrentUserID();
        return $this->db->fetch('SELECT id, name, email, is_admin, credits, created_at FROM users WHERE id = :id', 
                               ['id' => $userId]);
    }
    
    /**
     * Update user password
     */
    public function updatePassword($userId, $newPassword) {
        if (strlen($newPassword) < 8) {
            return ['success' => false, 'error' => 'Password must be at least 8 characters'];
        }
        
        $hashedPassword = password_hash($newPassword, PASSWORD_BCRYPT, ['cost' => PASSWORD_COST]);
        
        $success = $this->db->update('users', 
            ['password' => $hashedPassword],
            'id = :id',
            ['id' => $userId]
        );
        
        return ['success' => $success];
    }
}
