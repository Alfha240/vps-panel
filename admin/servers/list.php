<?php
// admin/servers/list.php
// Server Management (Admin)
require_once "../../config.php";
require_once "../../includes/middleware.php";

requireAdmin();

// Handle search
$search = isset($_GET['search']) ? sanitize($_GET['search']) : '';

// Build query
$sql = "
    SELECT s.*, u.username, u.email, n.name as node_name, p.name as plan_name
    FROM servers s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN nodes n ON s.node_id = n.id
    LEFT JOIN plans p ON s.plan_id = p.id
    WHERE s.status != 'deleted'
";

if($search) {
    $sql .= " AND (s.hostname LIKE :search OR s.uuid LIKE :search OR u.username LIKE :search OR s.ip_address LIKE :search)";
}

$sql .= " ORDER BY s.created_at DESC";

$stmt = $pdo->prepare($sql);
if($search) {
    $stmt->execute([':search' => "%$search%"]);
} else {
    $stmt->execute();
}
$servers = $stmt->fetchAll(PDO::FETCH_ASSOC);

$page_title = "Servers";
include "../../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>💻 All Servers</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Manage all VPS instances</p>
        </div>
        <a href="/admin/servers/create.php" class="btn btn-primary">
            <i class="fas fa-plus"></i> Create Server
        </a>
    </div>

    <!-- Search Bar -->
    <div class="card" style="margin-bottom: 20px;">
        <form method="GET" style="display: flex; gap: 12px;">
            <input type="text" name="search" class="form-control" placeholder="Search by hostname, UUID, username, or IP..." value="<?php echo htmlspecialchars($search); ?>">
            <button type="submit" class="btn btn-primary">
                <i class="fas fa-search"></i> Search
            </button>
            <?php if($search): ?>
                <a href="list.php" class="btn btn-secondary">Clear</a>
            <?php endif; ?>
        </form>
    </div>

    <!-- Servers Table -->
    <div class="card fade-in">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Hostname</th>
                        <th>Owner</th>
                        <th>Node</th>
                        <th>Plan</th>
                        <th>IP</th>
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
                            <strong><?php echo htmlspecialchars($server['username']); ?></strong>
                            <div style="font-size: 11px; color: var(--text-muted);">
                                <?php echo htmlspecialchars($server['email']); ?>
                            </div>
                        </td>
                        <td><?php echo htmlspecialchars($server['node_name']); ?></td>
                        <td>
                            <?php echo htmlspecialchars($server['plan_name']); ?>
                            <div style="font-size: 11px; color: var(--text-muted);">
                                <?php echo $server['ram']; ?>MB / <?php echo $server['cpu_cores']; ?> CPU
                            </div>
                        </td>
                        <td><code><?php echo $server['ip_address']; ?></code></td>
                        <td>
                            <?php
                            $badge_class = 'badge-info';
                            $status_text = ucfirst($server['status']);
                            
                            if($server['suspended']) {
                                $badge_class = 'badge-warning';
                                $status_text = 'Suspended';
                            } elseif($server['status'] == 'running') {
                                $badge_class = 'badge-success';
                            } elseif($server['status'] == 'stopped') {
                                $badge_class = 'badge-danger';
                            }
                            ?>
                            <span class="badge <?php echo $badge_class; ?>">
                                <?php echo $status_text; ?>
                            </span>
                        </td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <a href="/admin/servers/view.php?id=<?php echo $server['id']; ?>" class="btn btn-primary btn-sm">
                                    <i class="fas fa-eye"></i>
                                </a>
                                <?php if(!$server['suspended']): ?>
                                    <a href="/admin/servers/suspend.php?id=<?php echo $server['id']; ?>" class="btn btn-warning btn-sm">
                                        <i class="fas fa-pause"></i>
                                    </a>
                                <?php else: ?>
                                    <a href="/admin/servers/unsuspend.php?id=<?php echo $server['id']; ?>" class="btn btn-success btn-sm">
                                        <i class="fas fa-play"></i>
                                    </a>
                                <?php endif; ?>
                                <a href="/admin/servers/delete.php?id=<?php echo $server['id']; ?>" 
                                   onclick="return confirm('Are you sure you want to delete this server?')" 
                                   class="btn btn-danger btn-sm">
                                    <i class="fas fa-trash"></i>
                                </a>
                            </div>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<?php include "../../includes/footer.php"; ?>
