<?php
// admin/nodes/add.php
// Add New Node
require_once "../../config.php";
require_once "../../includes/middleware.php";
require_once "../../includes/proxmox.class.php";

requireAdmin();

$success = $error = "";

// Handle node creation
if($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['create_node'])) {
    if(verifyCSRFToken($_POST['csrf_token'])) {
        $name = sanitize($_POST['name']);
        $location_id = $_POST['location_id'] ?: null;
        $host = sanitize($_POST['host']);
        $port = (int)$_POST['port'];
        $token_id = sanitize($_POST['token_id']);
        $token_secret = sanitize($_POST['token_secret']);
        $max_vps = (int)$_POST['max_vps'];
        
        // Test Proxmox connection
        $proxmox = new ProxmoxAPI($host, $port, $token_id, $token_secret);
        if($proxmox->testConnection()) {
            $stmt = $pdo->prepare("
                INSERT INTO nodes (name, location_id, host, port, token_id, token_secret, max_vps) 
                VALUES (:name, :location_id, :host, :port, :token_id, :token_secret, :max_vps)
            ");
            
            if($stmt->execute([
                ':name' => $name,
                ':location_id' => $location_id,
                ':host' => $host,
                ':port' => $port,
                ':token_id' => $token_id,
                ':token_secret' => $token_secret,
                ':max_vps' => $max_vps
            ])) {
                $success = "Node added successfully!";
                logActivity($_SESSION['id'], 'create_node', "Created node: $name");
                header("Location: list.php");
                exit;
            } else {
                $error = "Failed to create node!";
            }
        } else {
            $error = "Failed to connect to Proxmox! Check your credentials.";
        }
    }
}

// Fetch locations for dropdown
$locations = $pdo->query("SELECT * FROM locations ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);

$page_title = "Add Node";
include "../../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>➕ Add New Node</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Connect a new Proxmox node</p>
        </div>
        <a href="/admin/nodes/list.php" class="btn btn-secondary">
            <i class="fas fa-arrow-left"></i> Back
        </a>
    </div>

    <?php if($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    <?php if($error): ?>
        <div class="alert alert-danger"><?php echo $error; ?></div>
    <?php endif; ?>

    <div class="card fade-in">
        <form method="POST">
            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
            
            <div class="form-group">
                <label class="form-label">Node Name *</label>
                <input type="text" name="name" class="form-control" placeholder="pve-node-1" required>
            </div>

            <div class="form-group">
                <label class="form-label">Location</label>
                <select name="location_id" class="form-control">
                    <option value="">No location</option>
                    <?php foreach($locations as $location): ?>
                        <option value="<?php echo $location['id']; ?>">
                            <?php echo htmlspecialchars($location['name']); ?> (<?php echo $location['short_code']; ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 16px;">
                <div class="form-group">
                    <label class="form-label">Proxmox Host (FQDN or IP) *</label>
                    <input type="text" name="host" class="form-control" placeholder="192.168.1.100" required>
                </div>

                <div class="form-group">
                    <label class="form-label">Port *</label>
                    <input type="number" name="port" class="form-control" value="8006" required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">API Token ID *</label>
                <input type="text" name="token_id" class="form-control" placeholder="root@pam!token-name" required>
                <small style="color: var(--text-muted);">Format: user@realm!token-name</small>
            </div>

            <div class="form-group">
                <label class="form-label">API Token Secret *</label>
                <input type="password" name="token_secret" class="form-control" required>
            </div>

            <div class="form-group">
                <label class="form-label">Max VPS Instances *</label>
                <input type="number" name="max_vps" class="form-control" value="50" required>
            </div>

            <button type="submit" name="create_node" class="btn btn-primary">
                <i class="fas fa-save"></i> Add Node
            </button>
        </form>
    </div>
</div>

<?php include "../../includes/footer.php"; ?>
