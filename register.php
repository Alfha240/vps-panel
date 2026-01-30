<?php
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
        redirect(APP_URL . '/register.php');
    }
    
    $name = sanitize($_POST['name'] ?? '');
    $email = sanitize($_POST['email'] ?? '');
    $password = $_POST['password'] ?? '';
    $confirmPassword = $_POST['confirm_password'] ?? '';
    
    // Validate password confirmation
    if ($password !== $confirmPassword) {
        setFlash('error', 'Passwords do not match');
        redirect(APP_URL . '/register.php');
    }
    
    $result = $auth->register($name, $email, $password);
    
    if ($result['success']) {
        setFlash('success', 'Registration successful! Please login.');
        redirect(APP_URL . '/index.php');
    } else {
        setFlash('error', $result['error']);
        redirect(APP_URL . '/register.php');
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Register - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body class="auth-page">
    <div class="auth-container">
        <div class="auth-card">
            <div class="auth-header">
                <h1><?php echo APP_NAME; ?></h1>
                <p>Create your account</p>
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
                    <label for="name">Full Name</label>
                    <input type="text" id="name" name="name" required autofocus>
                </div>
                
                <div class="form-group">
                    <label for="email">Email Address</label>
                    <input type="email" id="email" name="email" required>
                </div>
                
                <div class="form-group">
                    <label for="password">Password</label>
                    <input type="password" id="password" name="password" required minlength="8">
                    <small>Minimum 8 characters</small>
                </div>
                
                <div class="form-group">
                    <label for="confirm_password">Confirm Password</label>
                    <input type="password" id="confirm_password" name="confirm_password" required minlength="8">
                </div>
                
                <button type="submit" class="btn btn-primary btn-block">Create Account</button>
            </form>
            
            <div class="auth-footer">
                <p>Already have an account? <a href="login.php">Sign in</a></p>
            </div>
        </div>
    </div>
</body>
</html>
