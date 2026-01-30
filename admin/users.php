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
        redirect(APP_URL . '/admin/users.php');
    }
    
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'toggle_admin') {
            $userId = (int)$_POST['user_id'];
            $user = $db->fetch('SELECT is_admin FROM users WHERE id = :id', ['id' => $userId]);
            $newStatus = $user['is_admin'] ? 0 : 1;
            
            if ($db->update('users', ['is_admin' => $newStatus], 'id = :id', ['id' => $userId])) {
                setFlash('success', 'User admin status updated');
            } else {
                setFlash('error', 'Failed to update user');
            }
        } elseif ($_POST['action'] === 'update_credits') {
            $userId = (int)$_POST['user_id'];
            $credits = (float)$_POST['credits'];
            
            if ($db->update('users', ['credits' => $credits], 'id = :id', ['id' => $userId])) {
                setFlash('success', 'Credits updated successfully');
            } else {
                setFlash('error', 'Failed to update credits');
            }
        }
        redirect(APP_URL . '/admin/users.php');
    }
}

// Get all users with server count
$users = $db->fetchAll('
    SELECT u.*, COUNT(s.id) as server_count
    FROM users u
    LEFT JOIN servers s ON u.id = s.user_id
    GROUP BY u.id
    ORDER BY u.created_at DESC
');

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Users - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1>Users</h1>
                <p>Manage all registered users</p>
            </div>
            
            <?php $flash = getFlash(); if ($flash): ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Users List -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">All Users (<?php echo count($users); ?>)</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>ID</th>
                                    <th>Name</th>
                                    <th>Email</th>
                                    <th>Role</th>
                                    <th>Credits</th>
                                    <th>Servers</th>
                                    <th>Registered</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($users)): ?>
                                <tr>
                                    <td colspan="8" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                        No users found.
                                    </td>
                                </tr>
                                <?php else: ?>
                                <?php foreach ($users as $user): ?>
                                <tr>
                                    <td><?php echo $user['id']; ?></td>
                                    <td><strong><?php echo sanitize($user['name']); ?></strong></td>
                                    <td><?php echo sanitize($user['email']); ?></td>
                                    <td>
                                        <span class="badge badge-<?php echo $user['is_admin'] ? 'danger' : 'info'; ?>">
                                            <?php echo $user['is_admin'] ? 'Admin' : 'User'; ?>
                                        </span>
                                    </td>
                                    <td>
                                        <form method="POST" style="display: flex; gap: 0.5rem; align-items: center;">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="update_credits">
                                            <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                            <input type="number" name="credits" value="<?php echo $user['credits']; ?>" step="0.01" style="width: 100px; padding: 0.25rem 0.5rem;">
                                            <button type="submit" class="btn btn-info btn-sm">Update</button>
                                        </form>
                                    </td>
                                    <td><?php echo $user['server_count']; ?> VPS</td>
                                    <td><?php echo timeAgo($user['created_at']); ?></td>
                                    <td>
                                        <?php if ($user['id'] !== getCurrentUserID()): ?>
                                        <form method="POST" style="display: inline-block;">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="toggle_admin">
                                            <input type="hidden" name="user_id" value="<?php echo $user['id']; ?>">
                                            <button type="submit" class="btn btn-<?php echo $user['is_admin'] ? 'warning' : 'success'; ?> btn-sm">
                                                <?php echo $user['is_admin'] ? 'Demote' : 'Promote'; ?>
                                            </button>
                                        </form>
                                        <?php else: ?>
                                        <span style="color: var(--text-muted);">You</span>
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
