<?php
// admin/index.php
// Admin Dashboard Overview
require_once "../config.php";
require_once "../includes/middleware.php";

requireAdmin();

// Fetch statistics
$total_locations = $pdo->query("SELECT COUNT(*) FROM locations")->fetchColumn();
$total_nodes = $pdo->query("SELECT COUNT(*) FROM nodes WHERE is_active = 1")->fetchColumn();
$total_servers = $pdo->query("SELECT COUNT(*) FROM servers WHERE status != 'deleted'")->fetchColumn();
$total_users = $pdo->query("SELECT COUNT(*) FROM users")->fetchColumn();

// Aggregate resources
$resources = $pdo->query("
    SELECT 
        SUM(ram) as total_ram,
        SUM(disk) as total_disk
    FROM servers 
    WHERE status = 'running'
")->fetch(PDO::FETCH_ASSOC);

$total_ram = $resources['total_ram'] ?? 0;
$total_disk = $resources['total_disk'] ?? 0;

// Recent servers
$recent_servers = $pdo->query("
    SELECT s.*, u.username, n.name as node_name
    FROM servers s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN nodes n ON s.node_id = n.id
    ORDER BY s.created_at DESC
    LIMIT 10
")->fetchAll(PDO::FETCH_ASSOC);

include "../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>📊 Overview</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">System statistics and recent activity</p>
        </div>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <i class="stat-icon">📍</i>
            <div class="stat-label">Total Locations</div>
            <div class="stat-value"><?php echo $total_locations; ?></div>
        </div>

        <div class="stat-card">
            <i class="stat-icon">🖥️</i>
            <div class="stat-label">Total Nodes</div>
            <div class="stat-value"><?php echo $total_nodes; ?></div>
        </div>

        <div class="stat-card">
            <i class="stat-icon">💻</i>
            <div class="stat-label">Total Servers</div>
            <div class="stat-value"><?php echo $total_servers; ?></div>
        </div>

        <div class="stat-card">
            <i class="stat-icon">👥</i>
            <div class="stat-label">Total Users</div>
            <div class="stat-value"><?php echo $total_users; ?></div>
        </div>

        <div class="stat-card">
            <i class="stat-icon">💾</i>
            <div class="stat-label">RAM Usage</div>
            <div class="stat-value"><?php echo number_format($total_ram / 1024, 1); ?> GB</div>
        </div>

        <div class="stat-card">
            <i class="stat-icon">💿</i>
            <div class="stat-label">Disk Usage</div>
            <div class="stat-value"><?php echo $total_disk; ?> GB</div>
        </div>
    </div>

    <!-- Recent Servers -->
    <div class="card fade-in">
        <div class="card-header">
            <h3 class="card-title">Recent Servers</h3>
            <a href="/admin/servers/list.php" class="btn btn-secondary btn-sm">View All</a>
        </div>

        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>UUID</th>
                        <th>Hostname</th>
                        <th>Owner</th>
                        <th>Node</th>
                        <th>IP</th>
                        <th>Status</th>
                        <th>Created</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($recent_servers as $server): ?>
                    <tr>
                        <td><code><?php echo substr($server['uuid'], 0, 8); ?></code></td>
                        <td><?php echo htmlspecialchars($server['hostname']); ?></td>
                        <td><?php echo htmlspecialchars($server['username']); ?></td>
                        <td><?php echo htmlspecialchars($server['node_name']); ?></td>
                        <td><?php echo $server['ip_address']; ?></td>
                        <td>
                            <?php
                            $badge_class = 'badge-info';
                            if($server['status'] == 'running') $badge_class = 'badge-success';
                            if($server['status'] == 'stopped') $badge_class = 'badge-danger';
                            if($server['suspended']) $badge_class = 'badge-warning';
                            ?>
                            <span class="badge <?php echo $badge_class; ?>">
                                <?php echo $server['suspended'] ? 'Suspended' : ucfirst($server['status']); ?>
                            </span>
                        </td>
                        <td><?php echo date('M d, Y', strtotime($server['created_at'])); ?></td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include "../includes/footer.php"; ?>
