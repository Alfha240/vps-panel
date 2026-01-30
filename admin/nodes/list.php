<?php
// admin/nodes/list.php
// Node Management
require_once "../../config.php";
require_once "../../includes/middleware.php";

requireAdmin();

// Fetch all nodes with location info
$nodes = $pdo->query("
    SELECT n.*, l.name as location_name, l.short_code,
           COUNT(s.id) as server_count
    FROM nodes n
    LEFT JOIN locations l ON n.location_id = l.id
    LEFT JOIN servers s ON n.id = s.node_id AND s.status != 'deleted'
    GROUP BY n.id
    ORDER BY n.created_at DESC
")->fetchAll(PDO::FETCH_ASSOC);

$page_title = "Nodes";
include "../../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>🖥️ Nodes</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Manage Proxmox nodes</p>
        </div>
        <a href="/admin/nodes/add.php" class="btn btn-primary">
            <i class="fas fa-plus"></i> Add Node
        </a>
    </div>

    <!-- Nodes Table -->
    <div class="card fade-in">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Location</th>
                        <th>Host</th>
                        <th>Memory</th>
                        <th>Servers</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($nodes as $node): ?>
                    <tr>
                        <td>
                            <strong><?php echo htmlspecialchars($node['name']); ?></strong>
                        </td>
                        <td>
                            <?php if($node['location_name']): ?>
                                <span class="badge badge-info"><?php echo $node['short_code']; ?></span>
                                <?php echo htmlspecialchars($node['location_name']); ?>
                            <?php else: ?>
                                <span style="color: var(--text-muted);">No location</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <code><?php echo $node['host']; ?>:<?php echo $node['port']; ?></code>
                        </td>
                        <td>
                            <div style="font-size: 12px; color: var(--text-muted);">
                                <?php echo $node['current_vps']; ?> / <?php echo $node['max_vps']; ?> allocated
                            </div>
                        </td>
                        <td>
                            <span class="badge badge-success"><?php echo $node['server_count']; ?></span>
                        </td>
                        <td>
                            <?php if($node['is_active']): ?>
                                <span class="badge badge-success">Active</span>
                            <?php else: ?>
                                <span class="badge badge-danger">Inactive</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <a href="/admin/nodes/edit.php?id=<?php echo $node['id']; ?>" class="btn btn-secondary btn-sm">
                                    <i class="fas fa-edit"></i>
                                </a>
                                <button class="btn btn-danger btn-sm">
                                    <i class="fas fa-trash"></i>
                                </button>
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
