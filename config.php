<?php
// config.php
/*
 * Database credentials.
 * Assuming you are running MySQL server with default setting (user 'root' with no password) 
 * or you will configure these on your VPS.
 */
define('DB_SERVER', 'localhost');
define('DB_USERNAME', 'root');
define('DB_PASSWORD', '');
define('DB_NAME', 'vps_panel');
 
/* Attempt to connect to MySQL database */
try {
    $pdo = new PDO("mysql:host=" . DB_SERVER . ";dbname=" . DB_NAME, DB_USERNAME, DB_PASSWORD);
    // Set the PDO error mode to exception
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
} catch(PDOException $e) {
    die("ERROR: Could not connect. " . $e->getMessage());
}

// Start the session
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}
?>
