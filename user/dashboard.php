<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/middleware.php';

requireAuth();

$auth = new Auth();
$currentUser = $auth->getCurrentUser();
global $db;

$userId = getCurrentUserID();

// Get user's server statistics
$stats = [
    'total_servers' => $db->count('servers', 'user_id = :user_id', ['user_id' => $userId]),
    'active_servers' => $db->count('servers', 'user_id = :user_id AND status = :status', ['user_id' => $userId, 'status' => 'active']),
    'suspended_servers' => $db->count('servers', 'user_id = :user_id AND status = :status', ['user_id' => $userId, 'status' => 'suspended']),
];

// Get user's servers
$servers = $db->fetchAll('
    SELECT s.*, n.name as node_name, p.name as plan_name, p.cpu_cores, p.ram_mb, p.disk_gb
    FROM servers s
    LEFT JOIN nodes n ON s.node_id = n.id
    LEFT JOIN plans p ON s.plan_id = p.id
    WHERE s.user_id = :user_id
    ORDER BY s.created_at DESC
    LIMIT 5
', ['user_id' => $userId]);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Dashboard - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1>My Dashboard</h1>
                <p>Welcome back, <?php echo sanitize($currentUser['name']); ?></p>
            </div>
            
            <?php $flash = getFlash(); if ($flash): ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Statistics Cards -->
            <div class="grid grid-cols-3" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-value"><?php echo $stats['total_servers']; ?></div>
                    <div class="stat-label">Total Servers</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--success);"><?php echo $stats['active_servers']; ?></div>
                    <div class="stat-label">Active</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value" style="color: var(--warning);"><?php echo $stats['suspended_servers']; ?></div>
                    <div class="stat-label">Suspended</div>
                </div>
            </div>
            
            <!-- Account Credits -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Account Balance</h3>
                </div>
                <div class="card-body">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <div style="font-size: 2rem; font-weight: 600; color: var(--accent);">
                                $<?php echo number_format($currentUser['credits'], 2); ?>
                            </div>
                            <div style="color: var(--text-secondary); margin-top: 0.5rem;">Available Credits</div>
                        </div>
                        <div>
                            <a href="#" class="btn btn-primary">Add Credits</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Servers -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">My Servers</h3>
                </div>
                <div class="card-body">
                    <?php if (empty($servers)): ?>
                    <div style="text-align: center; padding: 3rem; color: var(--text-secondary);">
                        <div style="font-size: 3rem; margin-bottom: 1rem;">🖥️</div>
                        <h3 style="margin-bottom: 0.5rem;">No Servers Yet</h3>
                        <p>Deploy your first VPS to get started</p>
                        <a href="#" class="btn btn-primary" style="margin-top: 1rem;">Deploy Server</a>
                    </div>
                    <?php else: ?>
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Plan</th>
                                    <th>Node</th>
                                    <th>IP Address</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php foreach ($servers as $server): ?>
                                <tr>
                                    <td>
                                        <strong><?php echo sanitize($server['name']); ?></strong><br>
                                        <small style="color: var(--text-muted);">
                                            <?php echo $server['cpu_cores']; ?> vCPU • 
                                            <?php echo $server['ram_mb']; ?>MB RAM • 
                                            <?php echo $server['disk_gb']; ?>GB Disk
                                        </small>
                                    </td>
                                    <td><?php echo sanitize($server['plan_name']); ?></td>
                                    <td><?php echo sanitize($server['node_name']); ?></td>
                                    <td><code><?php echo sanitize($server['ip_address']); ?></code></td>
                                    <td>
                                        <?php
                                        $badgeClass = 'success';
                                        if ($server['status'] === 'suspended') $badgeClass = 'warning';
                                        if ($server['status'] === 'deleted') $badgeClass = 'danger';
                                        ?>
                                        <span class="badge badge-<?php echo $badgeClass; ?>">
                                            <?php echo ucfirst($server['status']); ?>
                                        </span>
                                    </td>
                                    <td>
                                        <a href="server.php?uuid=<?php echo $server['uuid']; ?>" class="btn btn-primary btn-sm">Manage</a>
                                    </td>
                                </tr>
                                <?php endforeach; ?>
                            </tbody>
                        </table>
                    </div>
                    
                    <?php if ($stats['total_servers'] > 5): ?>
                    <div style="text-align: center; margin-top: 1rem;">
                        <a href="servers.php" class="btn btn-secondary">View All Servers</a>
                    </div>
                    <?php endif; ?>
                    <?php endif; ?>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
