<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/middleware.php';

// Require admin access
requireAdmin();

// Get current user
$auth = new Auth();
$currentUser = $auth->getCurrentUser();

// Get statistics
global $db;
$stats = [
    'total_users' => $db->count('users'),
    'total_locations' => $db->count('locations'),
    'total_nodes' => $db->count('nodes'),
    'total_servers' => $db->count('servers'),
    'active_servers' => $db->count('servers', 'status = :status', ['status' => 'active']),
    'suspended_servers' => $db->count('servers', 'status = :status', ['status' => 'suspended']),
];

// Get recent servers
$recentServers = $db->fetchAll('
    SELECT s.*, u.name as user_name, u.email as user_email, n.name as node_name
    FROM servers s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN nodes n ON s.node_id = n.id
    ORDER BY s.created_at DESC
    LIMIT 5
');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1>Dashboard</h1>
                <p>Welcome back, <?php echo sanitize($currentUser['name']); ?></p>
            </div>
            
            <?php
            $flash = getFlash();
            if ($flash):
            ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Statistics Cards -->
            <div class="grid grid-cols-4" style="margin-bottom: 2rem;">
                <div class="stat-card">
                    <div class="stat-value"><?php echo $stats['total_users']; ?></div>
                    <div class="stat-label">Total Users</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value"><?php echo $stats['total_locations']; ?></div>
                    <div class="stat-label">Locations</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value"><?php echo $stats['total_nodes']; ?></div>
                    <div class="stat-label">Nodes</div>
                </div>
                
                <div class="stat-card">
                    <div class="stat-value"><?php echo $stats['total_servers']; ?></div>
                    <div class="stat-label">Total Servers</div>
                </div>
            </div>
            
            <!-- Server Status -->
            <div class="grid grid-cols-2" style="margin-bottom: 2rem;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Server Status</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; gap: 2rem;">
                            <div>
                                <div style="font-size: 1.5rem; font-weight: 600; color: var(--success);">
                                    <?php echo $stats['active_servers']; ?>
                                </div>
                                <div style="color: var(--text-secondary);">Active</div>
                            </div>
                            <div>
                                <div style="font-size: 1.5rem; font-weight: 600; color: var(--warning);">
                                    <?php echo $stats['suspended_servers']; ?>
                                </div>
                                <div style="color: var(--text-secondary);">Suspended</div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Quick Actions</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <a href="locations.php" class="btn btn-primary btn-sm">Add Location</a>
                            <a href="nodes.php" class="btn btn-primary btn-sm">Add Node</a>
                            <a href="plans.php" class="btn btn-primary btn-sm">Add Plan</a>
                            <a href="ipam.php" class="btn btn-primary btn-sm">Manage IPs</a>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Recent Servers -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Recent Servers</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>User</th>
                                    <th>Node</th>
                                    <th>IP Address</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($recentServers)): ?>
                                <tr>
                                    <td colspan="6" style="text-align: center; color: var(--text-secondary);">
                                        No servers found
                                    </td>
                                </tr>
                                <?php else: ?>
                                <?php foreach ($recentServers as $server): ?>
                                <tr>
                                    <td><?php echo sanitize($server['name']); ?></td>
                                    <td><?php echo sanitize($server['user_name']); ?></td>
                                    <td><?php echo sanitize($server['node_name']); ?></td>
                                    <td><?php echo sanitize($server['ip_address']); ?></td>
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
                                    <td><?php echo timeAgo($server['created_at']); ?></td>
                                </tr>
                                <?php endforeach; ?>
                                <?php endif; ?>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
