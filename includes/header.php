<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo isset($page_title) ? $page_title . ' - ' : ''; ?>VPS Panel</title>
    
    <!-- Google Fonts -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    
    <!-- Font Awesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Dark Theme CSS -->
    <link rel="stylesheet" href="/assets/css/dark-theme.css">
</head>
<body>

<?php if(isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1): ?>
    <!-- Admin Mode Banner -->
    <div class="admin-mode-banner">
        <div class="label">
            <i class="fas fa-shield-alt"></i>
            <span>Administrator Mode</span>
        </div>
        <a href="/user/dashboard.php" class="btn btn-sm" style="background: rgba(255,255,255,0.2);">
            <i class="fas fa-sign-out-alt"></i> Exit Admin
        </a>
    </div>
<?php endif; ?>

<!-- Sidebar -->
<div class="sidebar">
    <div class="sidebar-logo">
        <h1>⚡ VPS Panel</h1>
    </div>

    <div class="sidebar-menu">
        <?php if(isset($_SESSION['is_admin']) && $_SESSION['is_admin'] == 1): ?>
            <!-- Admin Menu -->
            <div class="menu-section">
                <div class="menu-section-title">Admin</div>
                <a href="/admin/index.php" class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'index.php' && strpos($_SERVER['PHP_SELF'], 'admin') !== false ? 'active' : ''; ?>">
                    <i class="fas fa-chart-line"></i>
                    <span>Overview</span>
                </a>
                <a href="/admin/locations/list.php" class="menu-item">
                    <i class="fas fa-map-marker-alt"></i>
                    <span>Locations</span>
                </a>
                <a href="/admin/nodes/list.php" class="menu-item">
                    <i class="fas fa-server"></i>
                    <span>Nodes</span>
                </a>
                <a href="/admin/servers/list.php" class="menu-item">
                    <i class="fas fa-desktop"></i>
                    <span>Servers</span>
                </a>
                <a href="/admin/ipam/list.php" class="menu-item">
                    <i class="fas fa-network-wired"></i>
                    <span>IPAM</span>
                </a>
                <a href="/admin/users/list.php" class="menu-item">
                    <i class="fas fa-users"></i>
                    <span>Users</span>
                </a>
                <a href="/admin/api-tokens/list.php" class="menu-item">
                    <i class="fas fa-key"></i>
                    <span>API Tokens</span>
                </a>
                <a href="/admin/plans/list.php" class="menu-item">
                    <i class="fas fa-box"></i>
                    <span>Plans</span>
                </a>
            </div>
        <?php endif; ?>

        <!-- User Menu -->
        <div class="menu-section">
            <div class="menu-section-title">Account</div>
            <a href="/user/dashboard.php" class="menu-item <?php echo basename($_SERVER['PHP_SELF']) == 'dashboard.php' ? 'active' : ''; ?>">
                <i class="fas fa-home"></i>
                <span>Dashboard</span>
            </a>
            <a href="/user/vps/list.php" class="menu-item">
                <i class="fas fa-server"></i>
                <span>My Servers</span>
            </a>
            <a href="/user/profile.php" class="menu-item">
                <i class="fas fa-user"></i>
                <span>Profile</span>
            </a>
        </div>

        <div class="menu-section">
            <a href="/logout.php" class="menu-item">
                <i class="fas fa-sign-out-alt"></i>
                <span>Logout</span>
            </a>
        </div>
    </div>
</div>

<!-- Main Content -->
<div class="main-content">
