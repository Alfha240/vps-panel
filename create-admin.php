<?php
// create-admin.php
// Web-based admin user creator (delete this file after creating your admin user)
require_once "config.php";

$success = $error = "";

if ($_SERVER["REQUEST_METHOD"] == "POST") {
    $username = trim($_POST["username"]);
    $email = trim($_POST["email"]);
    $password = trim($_POST["password"]);
    $is_admin = isset($_POST["is_admin"]) ? 1 : 0;
    
    // Basic validation
    if (empty($username) || empty($email) || empty($password)) {
        $error = "All fields are required!";
    } else {
        // Check if user exists
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = :username OR email = :email");
        $stmt->execute([':username' => $username, ':email' => $email]);
        
        if ($stmt->rowCount() > 0) {
            $error = "Username or email already exists!";
        } else {
            // Insert user
            $sql = "INSERT INTO users (username, email, password, is_admin) VALUES (:username, :email, :password, :is_admin)";
            $stmt = $pdo->prepare($sql);
            
            $hashed_password = password_hash($password, PASSWORD_DEFAULT);
            
            if ($stmt->execute([
                ':username' => $username,
                ':email' => $email,
                ':password' => $hashed_password,
                ':is_admin' => $is_admin
            ])) {
                $success = "User created successfully! Role: " . ($is_admin ? "Admin" : "User");
            } else {
                $error = "Error creating user!";
            }
        }
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>Create Admin User - VPS Panel</title>
    <link rel="stylesheet" href="assets/css/style.css">
    <style>
        .wrapper{ width: 400px; padding: 20px; margin: 50px auto; }
        .success{ color: green; padding: 10px; background: #d4edda; border: 1px solid #c3e6cb; border-radius: 4px; margin-bottom: 15px; }
        .error{ color: red; padding: 10px; background: #f8d7da; border: 1px solid #f5c6cb; border-radius: 4px; margin-bottom: 15px; }
        .warning{ color: #856404; padding: 10px; background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 4px; margin-bottom: 15px; }
    </style>
</head>
<body>
    <div class="wrapper">
        <h2>Create Admin User</h2>
        
        <div class="warning">
            <strong>⚠️ Security Warning:</strong> Delete this file after creating your admin user!
        </div>
        
        <?php if($success): ?>
            <div class="success"><?php echo $success; ?></div>
            <p><a href="index.php">Go to Login</a></p>
        <?php endif; ?>
        
        <?php if($error): ?>
            <div class="error"><?php echo $error; ?></div>
        <?php endif; ?>
        
        <form method="post">
            <div class="form-group">
                <label>Username</label>
                <input type="text" name="username" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>Email</label>
                <input type="email" name="email" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>Password</label>
                <input type="password" name="password" class="form-control" required>
            </div>
            
            <div class="form-group">
                <label>
                    <input type="checkbox" name="is_admin" value="1" checked>
                    Create as Admin User
                </label>
            </div>
            
            <div class="form-group">
                <input type="submit" class="btn btn-primary" value="Create User">
            </div>
        </form>
        
        <p><a href="index.php">Back to Login</a></p>
    </div>
</body>
</html>
