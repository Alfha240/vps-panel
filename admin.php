<?php
// admin.php
// Initialize the session
session_start();
 
// Check if the user is logged in and is an admin
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    header("location: index.php");
    exit;
}

if(!isset($_SESSION["is_admin"]) || $_SESSION["is_admin"] != 1){
    header("location: dashboard.php");
    exit;
}

// Fetch all users from database
require_once "config.php";

$sql = "SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC";
$stmt = $pdo->query($sql);
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>
 
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Panel - VPS Panel</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .wrapper{ width: 1000px; margin: 0 auto; padding: 20px; }
        .text-center{ text-align: center; }
        table { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table th, table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
        table th { background-color: #007bff; color: white; }
        table tr:hover { background-color: #f5f5f5; }
        .badge { padding: 4px 8px; border-radius: 3px; font-size: 12px; }
        .badge-admin { background-color: #28a745; color: white; }
        .badge-user { background-color: #6c757d; color: white; }
    </style>
</head>
<body>
    <div class="wrapper">
        <h1 class="text-center">Admin Panel</h1>
        <p class="text-center">
            <a href="dashboard.php" class="btn btn-primary">Back to Dashboard</a>
            <a href="logout.php" class="btn btn-danger">Sign Out</a>
        </p>

        <div class="panel">
            <h3>User Management</h3>
            <p>Total Users: <strong><?php echo count($users); ?></strong></p>
            
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created At</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($users as $user): ?>
                    <tr>
                        <td><?php echo htmlspecialchars($user['id']); ?></td>
                        <td><?php echo htmlspecialchars($user['username']); ?></td>
                        <td><?php echo htmlspecialchars($user['email']); ?></td>
                        <td>
                            <?php if($user['is_admin'] == 1): ?>
                                <span class="badge badge-admin">Admin</span>
                            <?php else: ?>
                                <span class="badge badge-user">User</span>
                            <?php endif; ?>
                        </td>
                        <td><?php echo htmlspecialchars($user['created_at']); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</body>
</html>
