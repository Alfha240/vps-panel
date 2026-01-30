<?php
// admin.php
// Comprehensive Admin Panel - only accessible to admin users
require_once "config.php";

// Check if user is logged in
if(!isset($_SESSION["loggedin"]) || $_SESSION["loggedin"] !== true){
    header("location: index.php");
    exit;
}

// Check if user is admin
if(!isset($_SESSION["is_admin"]) || $_SESSION["is_admin"] != 1){
    header("location: dashboard.php");
    exit;
}

$success = $error = "";

// Handle user deletion
if(isset($_POST['delete_user']) && isset($_POST['user_id'])){
    $user_id = $_POST['user_id'];
    
    // Prevent admin from deleting themselves
    if($user_id == $_SESSION["id"]){
        $error = "You cannot delete your own account!";
    } else {
        $stmt = $pdo->prepare("DELETE FROM users WHERE id = :id");
        if($stmt->execute([':id' => $user_id])){
            $success = "User deleted successfully!";
        } else {
            $error = "Error deleting user!";
        }
    }
}

// Handle toggle admin status
if(isset($_POST['toggle_admin']) && isset($_POST['user_id'])){
    $user_id = $_POST['user_id'];
    $current_status = $_POST['current_status'];
    $new_status = ($current_status == 1) ? 0 : 1;
    
    // Prevent admin from demoting themselves
    if($user_id == $_SESSION["id"]){
        $error = "You cannot change your own admin status!";
    } else {
        $stmt = $pdo->prepare("UPDATE users SET is_admin = :status WHERE id = :id");
        if($stmt->execute([':status' => $new_status, ':id' => $user_id])){
            $success = "User role updated successfully!";
        } else {
            $error = "Error updating user role!";
        }
    }
}

// Fetch statistics
$total_users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();
$total_admins = $pdo->query("SELECT COUNT(*) FROM users WHERE is_admin = 1")->fetchColumn();
$total_regular_users = $total_users - $total_admins;

// Fetch all users
$sql = "SELECT id, username, email, is_admin, created_at FROM users ORDER BY created_at DESC";
$stmt = $pdo->prepare($sql);
$stmt->execute();
$users = $stmt->fetchAll(PDO::FETCH_ASSOC);
?>

<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Admin Panel - VPS Panel</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .stats-container {
            display: flex;
            gap: 20px;
            margin: 20px 0;
        }
        .stat-card {
            flex: 1;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 20px;
            border-radius: 8px;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
        }
        .stat-card h3 {
            margin: 0;
            font-size: 36px;
            font-weight: bold;
        }
        .stat-card p {
            margin: 5px 0 0 0;
            opacity: 0.9;
        }
        .stat-card:nth-child(2) {
            background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
        }
        .stat-card:nth-child(3) {
            background: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            background: white;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }
        table, th, td {
            border: 1px solid #ddd;
        }
        th, td {
            padding: 12px;
            text-align: left;
        }
        th {
            background-color: #4CAF50;
            color: white;
        }
        tr:nth-child(even) {
            background-color: #f9f9f9;
        }
        tr:hover {
            background-color: #f5f5f5;
        }
        .badge {
            padding: 5px 10px;
            border-radius: 3px;
            color: white;
            font-size: 12px;
            font-weight: bold;
        }
        .badge-admin {
            background-color: #ff5722;
        }
        .badge-user {
            background-color: #2196F3;
        }
        .btn-small {
            padding: 5px 10px;
            font-size: 12px;
            margin: 2px;
        }
        .success-msg {
            background: #d4edda;
            color: #155724;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            border: 1px solid #c3e6cb;
        }
        .error-msg {
            background: #f8d7da;
            color: #721c24;
            padding: 10px;
            border-radius: 4px;
            margin-bottom: 15px;
            border: 1px solid #f5c6cb;
        }
        .actions {
            display: flex;
            gap: 5px;
        }
    </style>
</head>
<body>
    <div class="wrapper" style="max-width: 1200px;">
        <h2>🛡️ Admin Control Panel</h2>
        <p>Welcome, <b><?php echo htmlspecialchars($_SESSION["username"]); ?></b>. Manage all users and system settings from here.</p>
        
        <?php if($success): ?>
            <div class="success-msg"><?php echo $success; ?></div>
        <?php endif; ?>
        
        <?php if($error): ?>
            <div class="error-msg"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <div style="margin-bottom: 20px;">
            <a href="dashboard.php" class="btn btn-secondary">← Back to Dashboard</a>
            <a href="logout.php" class="btn btn-danger">Sign Out</a>
        </div>

        <!-- Statistics Cards -->
        <div class="stats-container">
            <div class="stat-card">
                <h3><?php echo $total_users; ?></h3>
                <p>Total Users</p>
            </div>
            <div class="stat-card">
                <h3><?php echo $total_admins; ?></h3>
                <p>Admin Users</p>
            </div>
            <div class="stat-card">
                <h3><?php echo $total_regular_users; ?></h3>
                <p>Regular Users</p>
            </div>
        </div>

        <h3>User Management</h3>
        
        <table>
            <thead>
                <tr>
                    <th>ID</th>
                    <th>Username</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Created At</th>
                    <th>Actions</th>
                </tr>
            </thead>
            <tbody>
                <?php foreach($users as $user): ?>
                <tr>
                    <td><?php echo $user['id']; ?></td>
                    <td><?php echo htmlspecialchars($user['username']); ?></td>
                    <td><?php echo htmlspecialchars($user['email']); ?></td>
                    <td>
                        <?php if($user['is_admin'] == 1): ?>
                            <span class="badge badge-admin">Admin</span>
                        <?php else: ?>
                            <span class="badge badge-user">User</span>
                        <?php endif; ?>
                    </td>
                    <td><?php echo date('M d, Y H:i', strtotime($user['created_at'])); ?></td>
                    <td>
                        <div class="actions">
                            <!-- Toggle Admin Status -->
                            <form method="post" style="display: inline;">
                                <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                <input type="hidden" name="current_status" value="<?php echo $user['is_admin']; ?>">
                                <button type="submit" name="toggle_admin" class="btn btn-primary btn-small"
                                    <?php echo ($user['id'] == $_SESSION["id"]) ? 'disabled' : ''; ?>
                                    onclick="return confirm('Are you sure you want to change this user\'s role?');">
                                    <?php echo ($user['is_admin'] == 1) ? 'Remove Admin' : 'Make Admin'; ?>
                                </button>
                            </form>
                            
                            <!-- Delete User -->
                            <form method="post" style="display: inline;">
                                <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                <button type="submit" name="delete_user" class="btn btn-danger btn-small"
                                    <?php echo ($user['id'] == $_SESSION["id"]) ? 'disabled' : ''; ?>
                                    onclick="return confirm('Are you sure you want to delete this user? This action cannot be undone!');">
                                    Delete
                                </button>
                            </form>
                        </div>
                    </td>
                </tr>
                <?php endforeach; ?>
            </tbody>
        </table>
    </div>
</body>
</html>
</html>
