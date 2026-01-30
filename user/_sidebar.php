<div class="sidebar">
    <div class="sidebar-header">
        <h2>VPS Panel</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">User Panel</p>
    </div>
    
    <div class="sidebar-menu">
        <a href="<?php echo APP_URL; ?>/user/dashboard.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'dashboard.php' ? 'active' : ''; ?>">
            <span>📊</span>
            <span>Dashboard</span>
        </a>
        
        <a href="<?php echo APP_URL; ?>/user/servers.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'servers.php' ? 'active' : ''; ?>">
            <span>💻</span>
            <span>My Servers</span>
        </a>
        
        <a href="#" style="opacity: 0.5; cursor: not-allowed;">
            <span>📦</span>
            <span>Deploy New VPS</span>
        </a>
        
        <a href="#" style="opacity: 0.5; cursor: not-allowed;">
            <span>💳</span>
            <span>Billing</span>
        </a>
    </div>
    
    <div class="sidebar-footer">
        <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500;"><?php echo sanitize($currentUser['name']); ?></div>
            <div style="font-size: 0.8rem; color: var(--text-muted);"><?php echo sanitize($currentUser['email']); ?></div>
            <div style="font-size: 0.85rem; color: var(--accent); margin-top: 0.5rem;">
                Balance: $<?php echo number_format($currentUser['credits'], 2); ?>
            </div>
        </div>
        <a href="<?php echo APP_URL; ?>/logout.php" class="btn btn-secondary btn-block btn-sm">Logout</a>
    </div>
</div>
