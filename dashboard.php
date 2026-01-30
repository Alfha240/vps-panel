<?php
// dashboard.php
// Initialize the session
session_start();
 
// Check if the user is logged in, if not then redirect him to login page
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    header("location: index.php");
    exit;
}
?>
 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Dashboard - VPS Panel</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .wrapper{ width: 800px; margin: 0 auto; padding: 20px; }
        .text-center{ text-align: center; }
    </style>
</head>
<body>
    <div class="wrapper">
        <h1 class="text-center">Hi, <b><?php echo htmlspecialchars($_SESSION["username"]); ?></b>. Welcome to your Dashboard.</h1>
        <p class="text-center">
            <a href="logout.php" class="btn btn-danger">Sign Out of Your Account</a>
        </p>

        <div class="panel">
             <h3>Your VPS Control Panel</h3>
             <p>This is where your VPS management features would go.</p>
             <!-- Placeholder for future VPS features -->
             <ul>
                 <li>Server Status: <span style="color: green;">Online</span></li>
                 <li>IP Address: 192.168.1.100</li>
                 <li>Memory Usage: 45%</li>
             </ul>
        </div>
    </div>
</body>
</html>
