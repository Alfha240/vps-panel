<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/middleware.php';

requireAdmin();

$auth = new Auth();
$currentUser = $auth->getCurrentUser();
global $db;

// Handle form submissions
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    if (!verifyCSRFToken($_POST['csrf_token'] ?? '')) {
        setFlash('error', 'Invalid request');
        redirect(APP_URL . '/admin/locations.php');
    }
    
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'create') {
            $data = [
                'name' => sanitize($_POST['name']),
                'short_code' => strtoupper(sanitize($_POST['short_code'])),
                'description' => sanitize($_POST['description'])
            ];
            
            if ($db->insert('locations', $data)) {
                setFlash('success', 'Location created successfully');
            } else {
                setFlash('error', 'Failed to create location');
            }
        } elseif ($_POST['action'] === 'delete') {
            $id = (int)$_POST['id'];
            if ($db->delete('locations', 'id = :id', ['id' => $id])) {
                setFlash('success', 'Location deleted successfully');
            } else {
                setFlash('error', 'Failed to delete location');
            }
        }
        redirect(APP_URL . '/admin/locations.php');
    }
}

// Get all locations with node count
$locations = $db->fetchAll('
    SELECT l.*, COUNT(n.id) as node_count
    FROM locations l
    LEFT JOIN nodes n ON l.id = n.location_id
    GROUP BY l.id
    ORDER BY l.created_at DESC
');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Locations - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1>Locations</h1>
                <p>Manage your data center locations</p>
            </div>
            
            <?php
            $flash = getFlash();
            if ($flash):
            ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Create Location Form -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Create New Location</h3>
                </div>
                <div class="card-body">
                    <form method="POST" action="">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                        <input type="hidden" name="action" value="create">
                        
                        <div class="grid grid-cols-3" style="gap: 1rem;">
                            <div class="form-group">
                                <label for="name">Location Name</label>
                                <input type="text" id="name" name="name" placeholder="e.g., India - Mumbai" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="short_code">Short Code</label>
                                <input type="text" id="short_code" name="short_code" placeholder="e.g., IN-MUM" maxlength="10" required>
                            </div>
                            
                            <div class="form-group">
                                <label for="description">Description</label>
                                <input type="text" id="description" name="description" placeholder="Optional description">
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Create Location</button>
                    </form>
                </div>
            </div>
            
            <!-- Locations List -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">All Locations</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Short Code</th>
                                    <th>Description</th>
                                    <th>Nodes</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($locations)): ?>
                                <tr>
                                    <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                        No locations found. Create your first location above.
                                    </td>
                                </tr>
                                <?php else: ?>
                                <?php foreach ($locations as $location): ?>
                                <tr>
                                    <td><?php echo $location['id']; ?></td>
                                    <td><strong><?php echo sanitize($location['name']); ?></strong></td>
                                    <td><span class="badge badge-info"><?php echo sanitize($location['short_code']); ?></span></td>
                                    <td><?php echo sanitize($location['description']) ?: '-'; ?></td>
                                    <td><?php echo $location['node_count']; ?> node(s)</td>
                                    <td><?php echo timeAgo($location['created_at']); ?></td>
                                    <td>
                                        <form method="POST" style="display: inline;" onsubmit="return confirm('Delete this location? This will also delete all associated nodes.');">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="delete">
                                            <input type="hidden" name="id" value="<?php echo $location['id']; ?>">
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
