#!/usr/bin/env php
<?php
/**
 * make-user.php
 * CLI tool to create users (similar to Laravel's artisan commands)
 * Usage: php make-user.php
 */

require_once __DIR__ . '/config.php';

// Helper function to read input from CLI
function readline_cli($prompt) {
    echo $prompt;
    return trim(fgets(STDIN));
}

// Helper function to read password (hidden input)
function readline_password($prompt) {
    echo $prompt;
    
    // Disable echo for password input
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Windows
        $password = stream_get_line(STDIN, 1024, PHP_EOL);
    } else {
        // Unix/Linux
        system('stty -echo');
        $password = trim(fgets(STDIN));
        system('stty echo');
        echo "\n";
    }
    
    return $password;
}

echo "===========================================\n";
echo "       VPS Panel - User Creator\n";
echo "===========================================\n\n";

// Get username
$username = readline_cli("Enter username: ");
while (empty($username) || !preg_match('/^[a-zA-Z0-9_]+$/', $username)) {
    echo "Invalid username. Use only letters, numbers, and underscores.\n";
    $username = readline_cli("Enter username: ");
}

// Check if username exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE username = :username");
$stmt->execute([':username' => $username]);
if ($stmt->rowCount() > 0) {
    die("Error: Username already exists!\n");
}

// Get email
$email = readline_cli("Enter email: ");
while (empty($email) || !filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo "Invalid email format.\n";
    $email = readline_cli("Enter email: ");
}

// Check if email exists
$stmt = $pdo->prepare("SELECT id FROM users WHERE email = :email");
$stmt->execute([':email' => $email]);
if ($stmt->rowCount() > 0) {
    die("Error: Email already exists!\n");
}

// Get password
$password = readline_password("Enter password (min 6 characters): ");
while (strlen($password) < 6) {
    echo "Password must be at least 6 characters.\n";
    $password = readline_password("Enter password (min 6 characters): ");
}

$confirm_password = readline_password("Confirm password: ");
while ($password !== $confirm_password) {
    echo "Passwords do not match.\n";
    $confirm_password = readline_password("Confirm password: ");
}

// Ask if admin
$is_admin_input = readline_cli("Create as admin user? (yes/no) [no]: ");
$is_admin = (strtolower($is_admin_input) === 'yes' || strtolower($is_admin_input) === 'y') ? 1 : 0;

// Insert user into database
try {
    $sql = "INSERT INTO users (username, email, password, is_admin) VALUES (:username, :email, :password, :is_admin)";
    $stmt = $pdo->prepare($sql);
    
    $hashed_password = password_hash($password, PASSWORD_DEFAULT);
    
    $stmt->execute([
        ':username' => $username,
        ':email' => $email,
        ':password' => $hashed_password,
        ':is_admin' => $is_admin
    ]);
    
    echo "\n✓ User created successfully!\n";
    echo "  Username: $username\n";
    echo "  Email: $email\n";
    echo "  Admin: " . ($is_admin ? 'Yes' : 'No') . "\n";
    
} catch (PDOException $e) {
    die("\nError creating user: " . $e->getMessage() . "\n");
}
?>
