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
        redirect(APP_URL . '/admin/api-tokens.php');
    }
    
    if (isset($_POST['action'])) {
        if ($_POST['action'] === 'create') {
            $permissions = [];
            if (isset($_POST['permissions']) && is_array($_POST['permissions'])) {
                $permissions = $_POST['permissions'];
            }
            
            $data = [
                'token' => generateAPIToken(),
                'name' => sanitize($_POST['name']),
                'permissions' => json_encode($permissions),
                'created_by' => getCurrentUserID()
            ];
            
            if ($db->insert('api_tokens', $data)) {
                setFlash('success', 'API token created successfully. Token: ' . $data['token']);
            } else {
                setFlash('error', 'Failed to create API token');
            }
        } elseif ($_POST['action'] === 'delete') {
            $id = (int)$_POST['id'];
            if ($db->delete('api_tokens', 'id = :id', ['id' => $id])) {
                setFlash('success', 'API token revoked successfully');
            } else {
                setFlash('error', 'Failed to revoke token');
            }
        }
        redirect(APP_URL . '/admin/api-tokens.php');
    }
}

// Get all API tokens
$tokens = $db->fetchAll('
    SELECT t.*, u.name as created_by_name
    FROM api_tokens t
    LEFT JOIN users u ON t.created_by = u.id
    ORDER BY t.created_at DESC
');

// Available permissions
$availablePermissions = [
    'create_vm' => 'Create VMs',
    'delete_vm' => 'Delete VMs',
    'list_vm' => 'List VMs',
    'suspend_vm' => 'Suspend VMs',
    'start_vm' => 'Start VMs',
    'stop_vm' => 'Stop VMs',
    'restart_vm' => 'Restart VMs'
];

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>API Tokens - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1>API Tokens</h1>
                <p>Manage external API access tokens</p>
            </div>
            
            <?php $flash = getFlash(); if ($flash): ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Create Token Form -->
            <div class="card" style="margin-bottom: 2rem;">
                <div class="card-header">
                    <h3 class="card-title">Generate New API Token</h3>
                </div>
                <div class="card-body">
                    <form method="POST" action="">
                        <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                        <input type="hidden" name="action" value="create">
                        
                        <div class="form-group" style="margin-bottom: 1rem;">
                            <label for="name">Token Name</label>
                            <input type="text" id="name" name="name" placeholder="e.g., WHMCS Integration" required>
                            <small>A descriptive name to identify this token</small>
                        </div>
                        
                        <div class="form-group">
                            <label>Permissions</label>
                            <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 0.75rem; margin-top: 0.5rem;">
                                <?php foreach ($availablePermissions as $perm => $label): ?>
                                <label style="display: flex; align-items: center; gap: 0.5rem; cursor: pointer;">
                                    <input type="checkbox" name="permissions[]" value="<?php echo $perm; ?>">
                                    <span><?php echo $label; ?></span>
                                </label>
                                <?php endforeach; ?>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary" style="margin-top: 1rem;">Generate Token</button>
                    </form>
                </div>
            </div>
            
            <!-- Tokens List -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Active API Tokens</h3>
                </div>
                <div class="card-body">
                    <div class="table-container">
                        <table>
                            <thead>
                                <tr>
                                    <th>Name</th>
                                    <th>Token</th>
                                    <th>Permissions</th>
                                    <th>Created By</th>
                                    <th>Last Used</th>
                                    <th>Created</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                <?php if (empty($tokens)): ?>
                                <tr>
                                    <td colspan="7" style="text-align: center; color: var(--text-secondary); padding: 2rem;">
                                        No API tokens found. Create one above for external integrations.
                                    </td>
                                </tr>
                                <?php else: ?>
                                <?php foreach ($tokens as $token): ?>
                                <tr>
                                    <td><strong><?php echo sanitize($token['name']); ?></strong></td>
                                    <td>
                                        <code style="background: var(--bg-primary); padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.85rem;">
                                            <?php echo sanitize($token['token']); ?>
                                        </code>
                                    </td>
                                    <td>
                                        <?php 
                                        $perms = json_decode($token['permissions'], true);
                                        if ($perms):
                                            foreach ($perms as $perm):
                                        ?>
                                        <span class="badge badge-info" style="margin-right: 0.25rem; margin-bottom: 0.25rem;">
                                            <?php echo sanitize($perm); ?>
                                        </span>
                                        <?php 
                                            endforeach;
                                        else:
                                            echo '-';
                                        endif; 
                                        ?>
                                    </td>
                                    <td><?php echo sanitize($token['created_by_name']); ?></td>
                                    <td><?php echo $token['last_used_at'] ? timeAgo($token['last_used_at']) : 'Never'; ?></td>
                                    <td><?php echo timeAgo($token['created_at']); ?></td>
                                    <td>
                                        <form method="POST" onsubmit="return confirm('Revoke this API token? This action cannot be undone.');">
                                            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                            <input type="hidden" name="action" value="delete">
                                            <input type="hidden" name="id" value="<?php echo $token['id']; ?>">
                                            <button type="submit" class="btn btn-danger btn-sm">Revoke</button>
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
