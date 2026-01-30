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
        redirect(APP_URL . '/admin/plans.php');
    }
    
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'create') {
            $data = [
                'name' => sanitize($_POST['name']),
                'cpu_cores' => (int)$_POST['cpu_cores'],
                'ram_mb' => (int)$_POST['ram_mb'],
                'disk_gb' => (int)$_POST['disk_gb'],
                'bandwidth_gb' => (int)$_POST['bandwidth_gb'],
                'price' => (float)$_POST['price'],
                'is_active' => 1
            ];
            
            if ($db->insert('plans', $data)) {
                setFlash('success', 'Plan created successfully');
            } else {
                setFlash('error', 'Failed to create plan');
            }
        } elseif ($_POST['action'] === 'update') {
            $id = (int)$_POST['id'];
            $data = [
                'name' => sanitize($_POST['name']),
                'cpu_cores' => (int)$_POST['cpu_cores'],
                'ram_mb' => (int)$_POST['ram_mb'],
                'disk_gb' => (int)$_POST['disk_gb'],
                'bandwidth_gb' => (int)$_POST['bandwidth_gb'],
                'price' => (float)$_POST['price']
            ];
            
            if ($db->update('plans', $data, 'id = :id', ['id' => $id])) {
                setFlash('success', 'Plan updated successfully');
            } else {
                setFlash('error', 'Failed to update plan');
            }
        } elseif ($_POST['action'] === 'toggle') {
            $id = (int)$_POST['id'];
            $plan = $db->fetch('SELECT is_active FROM plans WHERE id = :id', ['id' => $id]);
            $newStatus = $plan['is_active'] ? 0 : 1;
            if ($db->update('plans', ['is_active' => $newStatus], 'id = :id', ['id' => $id])) {
                setFlash('success', 'Plan status updated');
            }
        } elseif ($_POST['action'] === 'delete') {
            $id = (int)$_POST['id'];
            if ($db->delete('plans', 'id = :id', ['id' => $id])) {
                setFlash('success', 'Plan deleted successfully');
            } else {
                setFlash('error', 'Failed to delete plan');
            }
        }
        redirect(APP_URL . '/admin/plans.php');
    }
}

// Get all plans with server count
$plans = $db->fetchAll('
    SELECT p.*, COUNT(s.id) as server_count
    FROM plans p
    LEFT JOIN servers s ON p.id = s.plan_id
    GROUP BY p.id
    ORDER BY p.created_at DESC
');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Plans - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1>Hosting Plans</h1>
                <p>Manage your VPS hosting plans</p>
            </div>
            
            <?php $flash = getFlash(); if ($flash): ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Create Plan Form -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Create New Plan</h3>
                </div>
                <div class="card-body">
                    <form method="POST" action="">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                        <input type="hidden" name="action" value="create">
                        
                        <div class="grid grid-cols-3" style="gap: 1rem; margin-bottom: 1rem;">
                            <div class="form-group">
                                <label for="name">Plan Name</label>
                                <input type="text" id="name" name="name" placeholder="e.g., Starter VPS" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="cpu_cores">CPU Cores</label>
                                <input type="number" id="cpu_cores" name="cpu_cores" min="1" value="1" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="ram_mb">RAM (MB)</label>
                                <input type="number" id="ram_mb" name="ram_mb" min="512" step="512" value="1024" required>
                            </div>
                        </div>
                        
                        <div class="grid grid-cols-3" style="gap: 1rem;">
                            <div class="form-group">
                                <label for="disk_gb">Disk (GB)</label>
                                <input type="number" id="disk_gb" name="disk_gb" min="10" step="10" value="20" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="bandwidth_gb">Bandwidth (GB)</label>
                                <input type="number" id="bandwidth_gb" name="bandwidth_gb" min="0" step="100" value="1000" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="price">Price ($)</label>
                                <input type="number" id="price" name="price" min="0" step="0.01" value="5.00" required>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Create Plan</button>
                    </form>
                </div>
            </div>
            
            <!-- Plans List -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">All Plans</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>CPU</th>
                                    <th>RAM</th>
                                    <th>Disk</th>
                                    <th>Bandwidth</th>
                                    <th>Price</th>
                                    <th>Servers</th>
                                    <th>Status</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($plans)): ?>
                                <tr>
                                    <td colspan="10" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                        No plans found. Create your first hosting plan above.
                                    </td>
                                </tr>
                                <?php else: ?>
                                <?php foreach ($plans as $plan): ?>
                                <tr>
                                    <td><?php echo $plan['id']; ?></td>
                                    <td><strong><?php echo sanitize($plan['name']); ?></strong></td>
                                    <td><?php echo $plan['cpu_cores']; ?> Core(s)</td>
                                    <td><?php echo $plan['ram_mb']; ?> MB</td>
                                    <td><?php echo $plan['disk_gb']; ?> GB</td>
                                    <td><?php echo $plan['bandwidth_gb']; ?> GB</td>
                                    <td><strong>$<?php echo number_format($plan['price'], 2); ?></strong></td>
                                    <td><?php echo $plan['server_count']; ?> VPS</td>
                                    <td>
                                        <span class="badge badge-<?php echo $plan['is_active'] ? 'success' : 'danger'; ?>">
                                            <?php echo $plan['is_active'] ? 'Active' : 'Inactive'; ?>
                                        </span>
                                    </td>
                                    <td>
                                        <form method="POST" style="display: inline-block; margin-right: 0.5rem;">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="toggle">
                                            <input type="hidden" name="id" value="<?php echo $plan['id']; ?>">
                                            <button type="submit" class="btn btn-info btn-sm">
                                                <?php echo $plan['is_active'] ? 'Disable' : 'Enable'; ?>
                                            </button>
                                        </form>
                                        <form method="POST" style="display: inline-block;" onsubmit="return confirm('Delete this plan?');">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="delete">
                                            <input type="hidden" name="id" value="<?php echo $plan['id']; ?>">
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
