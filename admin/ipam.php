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
        redirect(APP_URL . '/admin/ipam.php');
    }
    
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'create_pool') {
            $data = [
                'node_id' => (int)$_POST['node_id'],
                'name' => sanitize($_POST['name']),
                'gateway' => sanitize($_POST['gateway']),
                'netmask' => sanitize($_POST['netmask']),
                'cidr' => sanitize($_POST['cidr'])
            ];
            
            if ($db->insert('ip_pools', $data)) {
                setFlash('success', 'IP pool created successfully');
            } else {
                setFlash('error', 'Failed to create IP pool');
            }
        } elseif ($_POST['action'] === 'add_ip') {
            $data = [
                'pool_id' => (int)$_POST['pool_id'],
                'ip_address' => sanitize($_POST['ip_address']),
                'mac_address' => strtoupper(sanitize($_POST['mac_address'])),
                'is_assigned' => 0
            ];
            
            if ($db->insert('ip_addresses', $data)) {
                setFlash('success', 'IP address added successfully');
            } else {
                setFlash('error', 'Failed to add IP address');
            }
        } elseif ($_POST['action'] === 'delete_pool') {
            $id = (int)$_POST['id'];
            if ($db->delete('ip_pools', 'id = :id', ['id' => $id])) {
                setFlash('success', 'IP pool deleted successfully');
            }
        } elseif ($_POST['action'] === 'delete_ip') {
            $id = (int)$_POST['id'];
            if ($db->delete('ip_addresses', 'id = :id AND is_assigned = 0', ['id' => $id])) {
                setFlash('success', 'IP address deleted successfully');
            } else {
                setFlash('error', 'Cannot delete assigned IP address');
            }
        }
        redirect(APP_URL . '/admin/ipam.php');
    }
}

// Get all IP pools with node info
$pools = $db->fetchAll('
    SELECT p.*, n.name as node_name, l.short_code,
           COUNT(i.id) as total_ips,
           SUM(CASE WHEN i.is_assigned = 1 THEN 1 ELSE 0 END) as assigned_ips
    FROM ip_pools p
    LEFT JOIN nodes n ON p.node_id = n.id
    LEFT JOIN locations l ON n.location_id = l.id
    LEFT JOIN ip_addresses i ON p.id = i.pool_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
');

// Get all IP addresses
$ips = $db->fetchAll('
    SELECT i.*, p.name as pool_name, s.name as server_name, s.uuid as server_uuid
    FROM ip_addresses i
    LEFT JOIN ip_pools p ON i.pool_id = p.id
    LEFT JOIN servers s ON i.server_id = s.id
    ORDER BY i.created_at DESC
');

// Get nodes for dropdown
$nodes = $db->fetchAll('SELECT * FROM nodes WHERE is_active = 1 ORDER BY name');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IPAM - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1>IP Address Management</h1>
                <p>Manage IP pools and addresses</p>
            </div>
            
            <?php $flash = getFlash(); if ($flash): ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Create IP Pool Form -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Create IP Pool</h3>
                </div>
                <div class="card-body">
                    <form method="POST" action="">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                        <input type="hidden" name="action" value="create_pool">
                        
                        <div class="grid grid-cols-2" style="gap: 1rem; margin-bottom: 1rem;">
                            <div class="form-group">
                                <label for="node_id">Node</label>
                                <select id="node_id" name="node_id" required>
                                    <option value="">Select node</option>
                                    <?php foreach ($nodes as $node): ?>
                                    <option value="<?php echo $node['id']; ?>"><?php echo sanitize($node['name']); ?></option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="name">Pool Name</label>
                                <input type="text" id="name" name="name" placeholder="e.g., Main Pool" required>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-3" style="gap: 1rem;">
                            <div class="form-group">
                                <label for="cidr">CIDR</label>
                                <input type="text" id="cidr" name="cidr" placeholder="e.g., 192.168.1.0/24" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="gateway">Gateway</label>
                                <input type="text" id="gateway" name="gateway" placeholder="e.g., 192.168.1.1" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="netmask">Netmask</label>
                                <input type="text" id="netmask" name="netmask" placeholder="e.g., 255.255.255.0" required>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Create Pool</button>
                    </form>
                </div>
            </div>
            
            <!-- IP Pools List -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">IP Pools</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Pool Name</th>
                                    <th>Node</th>
                                    <th>CIDR</th>
                                    <th>Gateway</th>
                                    <th>Netmask</th>
                                    <th>IPs</th>
                                    <th>Usage</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($pools)): ?>
                                <tr>
                                    <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                        No IP pools found.
                                    </td>
                                </tr>
                                <?php else: ?>
                                <?php foreach ($pools as $pool): ?>
                                <tr>
                                    <td><strong><?php echo sanitize($pool['name']); ?></strong></td  >
                                    <td>
                                        <span class="badge badge-info"><?php echo sanitize($pool['short_code']); ?></span>
                                        <?php echo sanitize($pool['node_name']); ?>
                                    </td>
                                    <td><?php echo sanitize($pool['cidr']); ?></td>
                                    <td><?php echo sanitize($pool['gateway']); ?></td>
                                    <td><?php echo sanitize($pool['netmask']); ?></td>
                                    <td><?php echo $pool['total_ips'] ?: 0; ?> IPs</td>
                                    <td>
                                        <?php 
                                        $totalIps = $pool['total_ips'] ?: 0;
                                        $assignedIps = $pool['assigned_ips'] ?: 0;
                                        $percentage = $totalIps > 0 ? ($assignedIps / $totalIps) * 100 : 0;
                                        ?>
                                        <span class="badge badge-<?php echo $percentage > 80 ? 'danger' : ($percentage > 50 ? 'warning' : 'success'); ?>">
                                            <?php echo $assignedIps; ?> / <?php echo $totalIps; ?> (<?php echo number_format($percentage, 1); ?>%)
                                        </span>
                                    </td>
                                    <td>
                                        <form method="POST" onsubmit="return confirm('Delete this IP pool and all its addresses?');">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="delete_pool">
                                            <input type="hidden" name="id" value="<?php echo $pool['id']; ?>">
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
            
            <!-- Add IP Address Form -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Add IP Address</h3>
                </div>
                <div class="card-body">
                    <form method="POST" action="">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                        <input type="hidden" name="action" value="add_ip">
                        
                        <div class="grid grid-cols-3" style="gap: 1rem;">
                            <div class="form-group">
                                <label for="pool_id">IP Pool</label>
                                <select id="pool_id" name="pool_id" required>
                                    <option value="">Select pool</option>
                                    <?php foreach ($pools as $pool): ?>
                                    <option value="<?php echo $pool['id']; ?>"><?php echo sanitize($pool['name']); ?> (<?php echo sanitize($pool['cidr']); ?>)</option>
                                    <?php endforeach; ?>
                                </select>
                            </div>
                            
                            <div class="form-group">
                                <label for="ip_address">IP Address</label>
                                <input type="text" id="ip_address" name="ip_address" placeholder="e.g., 192.168.1.100" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="mac_address">MAC Address</label>
                                <input type="text" id="mac_address" name="mac_address" placeholder="e.g., 00:11:22:33:44:55" pattern="^([0-9A-Fa-f]{2}[:-]){5}([0-9A-Fa-f]{2})$" required>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Add IP Address</button>
                    </form>
                </div>
            </div>
            
            <!-- IP Addresses List -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">All IP Addresses</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>IP Address</th>
                                    <th>MAC Address</th>
                                    <th>Pool</th>
                                    <th>Status</th>
                                    <th>Assigned To</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($ips)): ?>
                                <tr>
                                    <td colspan="6" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                        No IP addresses found.
                                    </td>
                                </tr>
                                <?php else: ?>
                                <?php foreach ($ips as $ip): ?>
                                <tr>
                                    <td><code><?php echo sanitize($ip['ip_address']); ?></code></td>
                                    <td><code><?php echo sanitize($ip['mac_address']); ?></code></td>
                                    <td><?php echo sanitize($ip['pool_name']); ?></td>
                                    <td>
                                        <span class="badge badge-<?php echo $ip['is_assigned'] ? 'success' : 'info'; ?>">
                                            <?php echo $ip['is_assigned'] ? 'Assigned' : 'Available'; ?>
                                        </span>
                                    </td>
                                    <td>
                                        <?php if ($ip['server_name']): ?>
                                            <strong><?php echo sanitize($ip['server_name']); ?></strong><br>
                                            <small style="color: var(--text-muted);"><?php echo sanitize($ip['server_uuid']); ?></small>
                                        <?php else: ?>
                                            <span style="color: var(--text-muted);">-</span>
                                        <?php endif; ?>
                                    </td>
                                    <td>
                                        <?php if (!$ip['is_assigned']): ?>
                                        <form method="POST" onsubmit="return confirm('Delete this IP address?');">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="delete_ip">
                                            <input type="hidden" name="id" value="<?php echo $ip['id']; ?>">
                                            <button type="submit" class="btn btn-danger btn-sm">Delete</button>
                                        </form>
                                        <?php else: ?>
                                            <span style="color: var(--text-muted);">In Use</span>
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
