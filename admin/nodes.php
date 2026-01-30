<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/middleware.php';
require_once __DIR__ . '/../includes/proxmox.php';

requireAdmin();

$auth = new Auth();
$currentUser = $auth->getCurrentUser();
global $db;

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCSRFToken($_POST['csrf_token'] ?? '')) {
        setFlash('error', 'Invalid request');
        redirect(APP_URL . '/admin/nodes.php');
    }
    
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'create') {
            $data = [
                'location_id' => (int)$_POST['location_id'],
                'name' => sanitize($_POST['name']),
                'host' => sanitize($_POST['host']),
                'port' => (int)($_POST['port'] ?: 8006),
                'api_token_id' => sanitize($_POST['api_token_id']),
                'api_secret' => sanitize($_POST['api_secret']),
                'is_active' => 1
            ];
            
            // Test connection before saving
            $proxmox = new ProxmoxAPI($data['host'], $data['port'], $data['api_token_id'], $data['api_secret']);
            if ($proxmox->testConnection()) {
                if ($db->insert('nodes', $data)) {
                    setFlash('success', 'Node added successfully and connection verified');
                } else {
                    setFlash('error', 'Failed to add node');
                }
            } else {
                setFlash('error', 'Failed to connect to Proxmox. Please check your credentials.');
            }
        } elseif ($_POST['action'] === 'delete') {
            $id = (int)$_POST['id'];
            if ($db->delete('nodes', 'id = :id', ['id' => $id])) {
                setFlash('success', 'Node deleted successfully');
            } else {
                setFlash('error', 'Failed to delete node');
            }
        } elseif ($_POST['action'] === 'toggle_status') {
            $id = (int)$_POST['id'];
            $node = $db->fetch('SELECT is_active FROM nodes WHERE id = :id', ['id' => $id]);
            $newStatus = $node['is_active'] ? 0 : 1;
            if ($db->update('nodes', ['is_active' => $newStatus], 'id = :id', ['id' => $id])) {
                setFlash('success', 'Node status updated');
            }
        }
        redirect(APP_URL . '/admin/nodes.php');
    }
}

// Get all nodes with location info
$nodes = $db->fetchAll('
    SELECT n.*, l.name as location_name, l.short_code,
           COUNT(s.id) as server_count
    FROM nodes n
    LEFT JOIN locations l ON n.location_id = l.id
    LEFT JOIN servers s ON n.id = s.node_id
    GROUP BY n.id
    ORDER BY n.created_at DESC
');

// Get locations for dropdown
$locations = $db->fetchAll('SELECT * FROM locations ORDER BY name');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nodes - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1>Proxmox Nodes</h1>
                <p>Manage your Proxmox VE servers</p>
            </div>
            
            <?php $flash = getFlash(); if ($flash): ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Add Node Form -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Add New Node</h3>
                </div>
                <div class="card-body">
                    <form method="POST" action="">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                        <input type="hidden" name="action" value="create">
                        
                        <div class="grid grid-cols-3" style="gap: 1rem; margin-bottom: 1rem;">
                            <div class="form-group">
                                <label for="location_id">Location</label>
                                <select id="location_id" name="location_id" required>
                                    <option value="">Select location</option>
                                    <?php foreach ($locations as $loc): ?>
                                    <option value="<?php echo $loc['id']; ?>"><?php echo sanitize($loc['name']); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="name">Node Name</label>
                                <input type="text" id="name" name="name" placeholder="e.g., pve-node-1" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="host">Host/IP</label>
                                <input type="text" id="host" name="host" placeholder="e.g., 192.168.1.100" required>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-3" style="gap: 1rem;">
                            <div class="form-group">
                                <label for="port">Port</label>
                                <input type="number" id="port" name="port" value="8006" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="api_token_id">API Token ID</label>
                                <input type="text" id="api_token_id" name="api_token_id" placeholder="user@realm!tokenname" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="api_secret">API Secret</label>
                                <input type="text" id="api_secret" name="api_secret" placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx" required>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Add Node & Test Connection</button>
                    </form>
                </div>
            </div>
            
            <!-- Nodes List -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">All Nodes</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Location</th>
                                    <th>Host</th>
                                    <th>Port</th>
                                    <th>Servers</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($nodes)): ?>
                                <tr>
                                    <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                        No nodes found. Add your first Proxmox node above.
                                    </td>
                                </tr>
                                <?php else: ?>
                                <?php foreach ($nodes as $node): ?>
                                <tr>
                                    <td><?php echo $node['id']; ?></td>
                                    <td><strong><?php echo sanitize($node['name']); ?></strong></td>
                                    <td>
                                        <span class="badge badge-info"><?php echo sanitize($node['short_code']); ?></span>
                                        <?php echo sanitize($node['location_name']); ?>
                                    </td>
                                    <td><?php echo sanitize($node['host']); ?></td>
                                    <td><?php echo $node['port']; ?></td>
                                    <td><?php echo $node['server_count']; ?> VPS</td>
                                    <td>
                                        <span class="badge badge-<?php echo $node['is_active'] ? 'success' : 'danger'; ?>">
                                            <?php echo $node['is_active'] ? 'Active' : 'Inactive'; ?>
                                        </span>
                                    </td>
                                    <td>
                                        <form method="POST" style="display: inline-block; margin-right: 0.5rem;">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="toggle_status">
                                            <input type="hidden" name="id" value="<?php echo $node['id']; ?>">
                                            <button type="submit" class="btn btn-info btn-sm">
                                                <?php echo $node['is_active'] ? 'Disable' : 'Enable'; ?>
                                            </button>
                                        </form>
                                        <form method="POST" style="display: inline-block;" onsubmit="return confirm('Delete this node? This will also delete all associated servers.');">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="delete">
                                            <input type="hidden" name="id" value="<?php echo $node['id']; ?>">
                                            <button type="submit" class="btn btn-danger btn-sm">Delete</button>
                                        </form>
                                    </td>
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
