<?php
// user/dashboard.php
// User Dashboard
require_once "../config.php";
require_once "../includes/middleware.php";

requireLogin();

// Fetch user's servers
$servers = getUserVPS($_SESSION['id']);
$server_count = count($servers);

// Calculate total resources
$total_ram = 0;
$total_disk = 0;
$running_count = 0;

foreach($servers as $server) {
    $total_ram += $server['ram'];
    $total_disk += $server['disk'];
    if($server['status'] == 'running') $running_count++;
}

$page_title = "Dashboard";
include "../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>👋 Welcome back, <?php echo htmlspecialchars($_SESSION['username']); ?>!</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Manage your VPS instances</p>
        </div>
        <a href="/user/vps/create.php" class="btn btn-primary">
            <i class="fas fa-plus"></i> Create Server
        </a>
    </div>

    <!-- Stats Grid -->
    <div class="stats-grid">
        <div class="stat-card">
            <i class="stat-icon">💻</i>
            <div class="stat-label">Total Servers</div>
            <div class="stat-value"><?php echo $server_count; ?></div>
        </div>

        <div class="stat-card">
            <i class="stat-icon">✅</i>
            <div class="stat-label">Running</div>
            <div class="stat-value"><?php echo $running_count; ?></div>
        </div>

        <div class="stat-card">
            <i class="stat-icon">💾</i>
            <div class="stat-label">Total RAM</div>
            <div class="stat-value"><?php echo number_format($total_ram / 1024, 1); ?> GB</div>
        </div>

        <div class="stat-card">
            <i class="stat-icon">💿</i>
            <div class="stat-label">Total Disk</div>
            <div class="stat-value"><?php echo $total_disk; ?> GB</div>
        </div>
    </div>

    <!-- Servers List -->
    <div class="card fade-in">
        <div class="card-header">
            <h3 class="card-title">My Servers</h3>
        </div>

        <?php if(empty($servers)): ?>
            <div style="text-align: center; padding: 60px 20px;">
                <i class="fas fa-server" style="font-size: 64px; color: var(--text-muted); margin-bottom: 16px;"></i>
                <h3 style="color: var(--text-secondary); margin-bottom: 8px;">No servers yet</h3>
                <p style="color: var(--text-muted); margin-bottom: 24px;">Create your first VPS instance to get started</p>
                <a href="/user/vps/create.php" class="btn btn-primary">
                    <i class="fas fa-plus"></i> Create Server
                </a>
            </div>
        <?php else: ?>
            <div class="table-container">
                <table>
                    <thead>
                        <tr>
                            <th>Hostname</th>
                            <th>Plan</th>
                            <th>IP Address</th>
                            <th>Node</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        <?php foreach($servers as $server): ?>
                        <tr>
                            <td>
                                <strong><?php echo htmlspecialchars($server['hostname']); ?></strong>
                                <div style="font-size: 11px; color: var(--text-muted); margin-top: 2px;">
                                    <?php echo substr($server['uuid'], 0, 8); ?>
                                </div>
                            </td>
                            <td>
                                <?php echo htmlspecialchars($server['plan_name']); ?>
                                <div style="font-size: 11px; color: var(--text-muted);">
                                    <?php echo $server['ram']; ?>MB RAM, <?php echo $server['cpu_cores']; ?> CPU
                                </div>
                            </td>
                            <td><code><?php echo $server['ip_address']; ?></code></td>
                            <td><?php echo htmlspecialchars($server['node_name']); ?></td>
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
                            <td>
                                <a href="/user/vps/view.php?id=<?php echo $server['id']; ?>" class="btn btn-primary btn-sm">
                                    <i class="fas fa-eye"></i> Manage
                                </a>
                            </td>
                        </tr>
                        <?php endforeach; ?>
                    </tbody>
                </table>
            </div>
        <?php endif; ?>
    </div>
</div>

<?php include "../includes/footer.php"; ?>
