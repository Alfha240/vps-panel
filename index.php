<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1><?php echo APP_NAME; ?></h1>
                <p>Sign in to your account</p>
            </div>
            
            <?php
            $flash = getFlash();
            if ($flash):
            ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <form method="POST" action="" class="auth-form">
                <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required autofocus>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required>
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">Sign In</button>
            </form>
            
            <div class="auth-footer">
                <p>Don't have an account? <a href="register.php">Register here</a></p>
            </div>
        </div>
    </div>
</body>
</html><?php
require_once __DIR__ . '/includes/config.php';
require_once __DIR__ . '/includes/auth.php';
require_once __DIR__ . '/includes/middleware.php';

// Redirect if already logged in
requireGuest();

$auth = new Auth();

// Handle form submission
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verify CSRF token
    if (!verifyCSRFToken($_POST['csrf_token'] ?? '')) {
        setFlash('error', 'Invalid request. Please try again.');
        redirect(APP_URL . '/index.php');
    }
    
    $email = sanitize($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    
    $result = $auth->login($email, $password);
    
    if ($result['success']) {
        // Redirect based on user role
        if (isAdmin()) {
            redirect(APP_URL . '/admin/dashboard.php');
        } else {
            redirect(APP_URL . '/user/dashboard.php');
        }
    } else {
        setFlash('error', $result['error']);
        redirect(APP_URL . '/index.php');
    }
}
?>
