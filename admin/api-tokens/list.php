<?php
// admin/api-tokens/list.php
// API Token Management
require_once "../../config.php";
require_once "../../includes/middleware.php";

requireAdmin();

$success = $error = "";

// Handle token creation
if($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['create_token'])) {
    if(verifyCSRFToken($_POST['csrf_token'])) {
        $user_id = $_POST['user_id'];
        $description = sanitize($_POST['description']);
        $permissions = $_POST['permissions'] ?? [];
        
        // Generate secure token
        $token = bin2hex(random_bytes(32));
        
        $stmt = $pdo->prepare("INSERT INTO api_tokens (token, user_id, description, permissions) VALUES (:token, :user_id, :description, :permissions)");
        if($stmt->execute([
            ':token' => $token,
            ':user_id' => $user_id,
            ':description' => $description,
            ':permissions' => json_encode($permissions)
        ])) {
            $success = "API Token created successfully! Token: <code>$token</code><br><small>Save this token securely, it won't be shown again!</small>";
            logActivity($_SESSION['id'], 'create_api_token', "Created API token for user ID: $user_id");
        } else {
            $error = "Failed to create token!";
        }
    }
}

// Handle token revocation
if(isset($_GET['revoke'])) {
    $token_id = (int)$_GET['revoke'];
    $stmt = $pdo->prepare("DELETE FROM api_tokens WHERE id = :id");
    if($stmt->execute([':id' => $token_id])) {
        $success = "Token revoked successfully!";
        logActivity($_SESSION['id'], 'revoke_api_token', "Revoked API token ID: $token_id");
    }
}

// Fetch all tokens
$tokens = $pdo->query("
    SELECT t.*, u.username, u.email
    FROM api_tokens t
    LEFT JOIN users u ON t.user_id = u.id
    ORDER BY t.created_at DESC
")->fetchAll(PDO::FETCH_ASSOC);

// Fetch users for dropdown
$users = $pdo->query("SELECT id, username, email FROM users ORDER BY username")->fetchAll(PDO::FETCH_ASSOC);

$page_title = "API Tokens";
include "../../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>🔑 API Tokens</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Manage API tokens for external integrations (WHMCS, etc.)</p>
        </div>
        <button onclick="document.getElementById('createTokenModal').style.display='block'" class="btn btn-primary">
            <i class="fas fa-plus"></i> Create Token
        </button>
    </div>

    <?php if($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    <?php if($error): ?>
        <div class="alert alert-danger"><?php echo $error; ?></div>
    <?php endif; ?>

    <!-- Tokens Table -->
    <div class="card fade-in">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Token</th>
                        <th>User</th>
                        <th>Description</th>
                        <th>Permissions</th>
                        <th>Last Used</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($tokens as $token): ?>
                    <tr>
                        <td>
                            <code style="font-size: 11px;"><?php echo substr($token['token'], 0, 16); ?>...</code>
                        </td>
                        <td>
                            <strong><?php echo htmlspecialchars($token['username']); ?></strong>
                            <div style="font-size: 11px; color: var(--text-muted);">
                                <?php echo htmlspecialchars($token['email']); ?>
                            </div>
                        </td>
                        <td><?php echo htmlspecialchars($token['description']); ?></td>
                        <td>
                            <?php
                            $perms = json_decode($token['permissions'], true) ?: [];
                            foreach($perms as $perm):
                            ?>
                                <span class="badge badge-info" style="margin: 2px;"><?php echo $perm; ?></span>
                            <?php endforeach; ?>
                        </td>
                        <td>
                            <?php echo $token['last_used_at'] ? date('M d, Y H:i', strtotime($token['last_used_at'])) : 'Never'; ?>
                        </td>
                        <td><?php echo date('M d, Y', strtotime($token['created_at'])); ?></td>
                        <td>
                            <a href="?revoke=<?php echo $token['id']; ?>" 
                               onclick="return confirm('Are you sure you want to revoke this token?')" 
                               class="btn btn-danger btn-sm">
                                <i class="fas fa-trash"></i> Revoke
                            </a>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Create Token Modal -->
<div id="createTokenModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; padding: 40px; overflow-y: auto;">
    <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="card-header">
            <h3 class="card-title">Create API Token</h3>
            <button onclick="document.getElementById('createTokenModal').style.display='none'" class="btn btn-sm">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <form method="POST">
            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
            
            <div class="form-group">
                <label class="form-label">User *</label>
                <select name="user_id" class="form-control" required>
                    <option value="">Select user</option>
                    <?php foreach($users as $user): ?>
                        <option value="<?php echo $user['id']; ?>">
                            <?php echo htmlspecialchars($user['username']); ?> (<?php echo htmlspecialchars($user['email']); ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div class="form-group">
                <label class="form-label">Description *</label>
                <input type="text" name="description" class="form-control" placeholder="WHMCS Integration" required>
            </div>

            <div class="form-group">
                <label class="form-label">Permissions</label>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px; margin-top: 8px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="permissions[]" value="create_vm">
                        <span>Create VM</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="permissions[]" value="delete_vm">
                        <span>Delete VM</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="permissions[]" value="suspend_vm">
                        <span>Suspend VM</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="permissions[]" value="list_servers">
                        <span>List Servers</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="permissions[]" value="control_vm">
                        <span>Control VM</span>
                    </label>
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer;">
                        <input type="checkbox" name="permissions[]" value="view_stats">
                        <span>View Stats</span>
                    </label>
                </div>
            </div>

            <div style="background: var(--bg-tertiary); padding: 12px; border-radius: 8px; margin-bottom: 16px;">
                <p style="font-size: 13px; color: var(--text-muted); margin: 0;">
                    <i class="fas fa-info-circle"></i> The generated token will only be shown once. Make sure to save it securely!
                </p>
            </div>

            <button type="submit" name="create_token" class="btn btn-primary">
                <i class="fas fa-key"></i> Generate Token
            </button>
        </form>
    </div>
</div>

<style>
.alert-success {
    background: rgba(16, 185, 129, 0.1);
    border: 1px solid var(--accent-success);
    color: var(--accent-success);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
}
.alert-danger {
    background: rgba(239, 68, 68, 0.1);
    border: 1px solid var(--accent-danger);
    color: var(--accent-danger);
    padding: 16px;
    border-radius: 8px;
    margin-bottom: 20px;
}
</style>

<?php include "../../includes/footer.php"; ?>
