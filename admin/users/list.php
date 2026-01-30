<?php
// admin/users/list.php
// User Management (Enhanced)
require_once "../../config.php";
require_once "../../includes/middleware.php";

requireAdmin();

// Fetch all users with server count
$users = $pdo->query("
    SELECT u.*, COUNT(s.id) as server_count
    FROM users u
    LEFT JOIN servers s ON u.id = s.user_id AND s.status != 'deleted'
    GROUP BY u.id
    ORDER BY u.created_at DESC
")->fetchAll(PDO::FETCH_ASSOC);

$page_title = "Users";
include "../../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>👥 Users</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Manage user accounts</p>
        </div>
        <a href="/create-admin.php" class="btn btn-primary">
            <i class="fas fa-plus"></i> Create User
        </a>
    </div>

    <!-- Users Table -->
    <div class="card fade-in">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Servers</th>
                        <th>Created</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($users as $user): ?>
                    <tr>
                        <td><?php echo $user['id']; ?></td>
                        <td><strong><?php echo htmlspecialchars($user['username']); ?></strong></td>
                        <td><?php echo htmlspecialchars($user['email']); ?></td>
                        <td>
                            <?php if($user['is_admin']): ?>
                                <span class="badge badge-danger">Admin</span>
                            <?php else: ?>
                                <span class="badge badge-info">User</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <span class="badge badge-success"><?php echo $user['server_count']; ?></span>
                        </td>
                        <td><?php echo date('M d, Y', strtotime($user['created_at'])); ?></td>
                        <td>
                            <div style="display: flex; gap: 8px;">
                                <a href="/admin/users/view.php?id=<?php echo $user['id']; ?>" class="btn btn-primary btn-sm">
                                    <i class="fas fa-eye"></i>
                                </a>
                                <?php if($user['id'] != $_SESSION['id']): ?>
                                    <?php if(!$user['is_admin']): ?>
                                        <a href="/admin/users/promote.php?id=<?php echo $user['id']; ?>" class="btn btn-warning btn-sm">
                                            <i class="fas fa-arrow-up"></i> Promote
                                        </a>
                                    <?php else: ?>
                                        <a href="/admin/users/demote.php?id=<?php echo $user['id']; ?>" class="btn btn-secondary btn-sm">
                                            <i class="fas fa-arrow-down"></i> Demote
                                        </a>
                                    <?php endif; ?>
                                <?php endif; ?>
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
