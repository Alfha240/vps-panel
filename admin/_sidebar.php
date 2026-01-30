<div class="sidebar">
    <div class="sidebar-header">
        <h2>VPS Panel</h2>
        <p style="font-size: 0.8rem; color: var(--text-muted); margin-top: 0.25rem;">Admin Panel</p>
    </div>
    
    <div class="sidebar-menu">
        <a href="<?php echo APP_URL; ?>/admin/dashboard.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'dashboard.php' ? 'active' : ''; ?>">
            <span>📊</span>
            <span>Overview</span>
        </a>
        
        <a href="<?php echo APP_URL; ?>/admin/locations.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'locations.php' ? 'active' : ''; ?>">
            <span>📍</span>
            <span>Locations</span>
        </a>
        
        <a href="<?php echo APP_URL; ?>/admin/nodes.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'nodes.php' ? 'active' : ''; ?>">
            <span>🖥️</span>
            <span>Nodes</span>
        </a>
        
        <a href="<?php echo APP_URL; ?>/admin/servers.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'servers.php' ? 'active' : ''; ?>">
            <span>💻</span>
            <span>Servers</span>
        </a>
        
        <a href="<?php echo APP_URL; ?>/admin/ipam.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'ipam.php' ? 'active' : ''; ?>">
            <span>🌐</span>
            <span>IPAM</span>
        </a>
        
        <a href="<?php echo APP_URL; ?>/admin/users.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'users.php' ? 'active' : ''; ?>">
            <span>👥</span>
            <span>Users</span>
        </a>
        
        <a href="<?php echo APP_URL; ?>/admin/api-tokens.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'api-tokens.php' ? 'active' : ''; ?>">
            <span>🔑</span>
            <span>API Tokens</span>
        </a>
        
        <a href="<?php echo APP_URL; ?>/admin/plans.php" class="<?php echo basename($_SERVER['PHP_SELF']) === 'plans.php' ? 'active' : ''; ?>">
            <span>📦</span>
            <span>Plans</span>
        </a>
    </div>
    
    <div class="sidebar-footer">
        <div style="margin-bottom: 1rem; padding-bottom: 1rem; border-bottom: 1px solid var(--border-color);">
            <div style="font-weight: 500;"><?php echo sanitize($currentUser['name']); ?></div>
            <div style="font-size: 0.8rem; color: var(--text-muted);"><?php echo sanitize($currentUser['email']); ?></div>
        </div>
        <a href="<?php echo APP_URL; ?>/logout.php" class="btn btn-secondary btn-block btn-sm">Logout</a>
    </div>
</div>
