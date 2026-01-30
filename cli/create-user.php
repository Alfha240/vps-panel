<?php
/**
 * CLI Admin User Creation Script
 * Usage: php cli/create-user.php
 */

// Load required files
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';

// Check if running from CLI
if (php_sapi_name() !== 'cli') {
    die('This script can only be run from command line');
}

echo "===========================================\n";
echo "    VPS Panel - Create User\n";
echo "===========================================\n\n";

// Get user input
echo "Enter full name: ";
$name = trim(fgets(STDIN));

echo "Enter email address: ";
$email = trim(fgets(STDIN));

// Validate email
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    die("Error: Invalid email format\n");
}

echo "Enter password (min 8 characters): ";
// Hide password input
if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
    // Windows
    $password = trim(fgets(STDIN));
} else {
    // Linux/Mac
    system('stty -echo');
    $password = trim(fgets(STDIN));
    system('stty echo');
    echo "\n";
}

if (strlen($password) < 8) {
    die("Error: Password must be at least 8 characters\n");
}

echo "Make this user an admin? (yes/no): ";
$makeAdmin = strtolower(trim(fgets(STDIN)));
$isAdmin = in_array($makeAdmin, ['yes', 'y']);

echo "\n";

// Create user
$auth = new Auth();
$result = $auth->register($name, $email, $password, $isAdmin);

if ($result['success']) {
    echo "✓ User created successfully!\n\n";
    echo "Details:\n";
    echo "--------\n";
    echo "User ID:   " . $result['user_id'] . "\n";
    echo "Name:      " . $name . "\n";
    echo "Email:     " . $email . "\n";
    echo "Is Admin:  " . ($isAdmin ? 'Yes' : 'No') . "\n";
    echo "\nYou can now login at: " . APP_URL . "/index.php\n";
} else {
    echo "✗ Error: " . $result['error'] . "\n";
    exit(1);
}
