<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/middleware.php';

requireAdmin();

$auth = new Auth();
$currentUser = $auth->getCurrentUser();
global $db;

// Handle POST requests
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCSRFToken($_POST['csrf_token'] ?? '')) {
        setFlash('error', 'Invalid request');
        redirect(APP_URL . '/admin/servers.php');
    }
    
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'suspend') {
            $id = (int)$_POST['id'];
            if ($db->update('servers', ['status' => 'suspended'], 'id = :id', ['id' => $id])) {
                setFlash('success', 'Server suspended successfully');
            }
        } elseif ($_POST['action'] === 'unsuspend') {
            $id = (int)$_POST['id'];
            if ($db->update('servers', ['status' => 'active'], 'id = :id', ['id' => $id])) {
                setFlash('success', 'Server unsuspended successfully');
            }
        } elseif ($_POST['action'] === 'delete') {
            $id = (int)$_POST['id'];
            // TODO: Delete VM from Proxmox before deleting from DB
            if ($db->update('servers', ['status' => 'deleted'], 'id = :id', ['id' => $id])) {
                setFlash('success', 'Server marked as deleted');
            }
        }
        redirect(APP_URL . '/admin/servers.php');
    }
}

// Get search filter
$search = sanitize($_GET['search'] ?? '');
$statusFilter = sanitize($_GET['status'] ?? '');

// Build query
$whereConditions = [];
$params = [];

if ($search) {
    $whereConditions[] = '(s.name LIKE :search OR s.uuid LIKE :search OR s.ip_address LIKE :search OR u.name LIKE :search OR u.email LIKE :search)';
    $params['search'] = "%{$search}%";
}

if ($statusFilter) {
    $whereConditions[] = 's.status = :status';
    $params['status'] = $statusFilter;
}

$whereClause = $whereConditions ? 'WHERE ' . implode(' AND ', $whereConditions) : '';

// Get all servers
$servers = $db->fetchAll("
    SELECT s.*, u.name as user_name, u.email as user_email, 
           n.name as node_name, p.name as plan_name
    FROM servers s
    LEFT JOIN users u ON s.user_id = u.id
    LEFT JOIN nodes n ON s.node_id = n.id
    LEFT JOIN plans p ON s.plan_id = p.id
    {$whereClause}
    ORDER BY s.created_at DESC
", $params);

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Servers - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1>Servers</h1>
                <p>Manage all VPS instances</p>
            </div>
            
            <?php $flash = getFlash(); if ($flash): ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Filters -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-body">
                    <form method="GET" action="">
                        <div class="grid grid-cols-3" style="gap: 1rem;">
                            <div class="form-group">
                                <label for="search">Search</label>
                                <input type="text" id="search" name="search" value="<?php echo sanitize($search); ?>" placeholder="Name, UUID, IP, User...">
                            </div>
                            
                            <div class="form-group">
                                <label for="status">Status</label>
                                <select id="status" name="status">
                                    <option value="">All Statuses</option>
                                    <option value="active" <?php echo $statusFilter === 'active' ? 'selected' : ''; ?>>Active</option>
                                    <option value="suspended" <?php echo $statusFilter === 'suspended' ? 'selected' : ''; ?>>Suspended</option>
                                    <option value="deleted" <?php echo $statusFilter === 'deleted' ? 'selected' : ''; ?>>Deleted</option>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label style="opacity: 0;">Actions</label>
                                <div style="display: flex; gap: 0.5rem;">
                                    <button type="submit" class="btn btn-primary">Filter</button>
                                    <a href="servers.php" class="btn btn-secondary">Clear</a>
                                </div>
                            </div>
                        </div>
                    </form>
                </div>
            </div>
            
            <!-- Servers List -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">All Servers (<?php echo count($servers); ?>)</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>User</th>
                                    <th>Node</th>
                                    <th>Plan</th>
                                    <th>IP Address</th>
                                    <th>VMID</th>
                                    <th>Status</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($servers)): ?>
                                <tr>
                                    <td colspan="9" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                        No servers found.
                                    </td>
                                </tr>
                                <?php else: ?>
                                <?php foreach ($servers as $server): ?>
                                <tr>
                                    <td><strong><?php echo sanitize($server['name']); ?></strong><br>
                                        <small style="color: var(--text-muted);"><?php echo sanitize($server['uuid']); ?></small>
                                    </td>
                                    <td><?php echo sanitize($server['user_name']); ?><br>
                                        <small style="color: var(--text-muted);"><?php echo sanitize($server['user_email']); ?></small>
                                    </td>
                                    <td><?php echo sanitize($server['node_name']); ?></td>
                                    <td><?php echo sanitize($server['plan_name']); ?></td>
                                    <td><?php echo sanitize($server['ip_address']); ?></td>
                                    <td><?php echo $server['vmid']; ?></td>
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
                                    <td>
                                        <?php if ($server['status'] === 'active'): ?>
                                        <form method="POST" style="display: inline-block;">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="suspend">
                                            <input type="hidden" name="id" value="<?php echo $server['id']; ?>">
                                            <button type="submit" class="btn btn-warning btn-sm">Suspend</button>
                                        </form>
                                        <?php elseif ($server['status'] === 'suspended'): ?>
                                        <form method="POST" style="display: inline-block;">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="unsuspend">
                                            <input type="hidden" name="id" value="<?php echo $server['id']; ?>">
                                            <button type="submit" class="btn btn-success btn-sm">Unsuspend</button>
                                        </form>
                                        <?php endif; ?>
                                        <?php if ($server['status'] !== 'deleted'): ?>
                                        <form method="POST" style="display: inline-block;" onsubmit="return confirm('Delete this server?');">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="delete">
                                            <input type="hidden" name="id" value="<?php echo $server['id']; ?>">
                                            <button type="submit" class="btn btn-danger btn-sm">Delete</button>
                                        </form>
                                        <?php endif; ?>
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
