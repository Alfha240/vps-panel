<?php
// admin/ipam/list.php
// IP Address Management (IPAM)
require_once "../../config.php";
require_once "../../includes/middleware.php";

requireAdmin();

$success = $error = "";

// Handle IP range creation
if($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_POST['add_ip_range'])) {
    if(verifyCSRFToken($_POST['csrf_token'])) {
        $start_ip = sanitize($_POST['start_ip']);
        $end_ip = sanitize($_POST['end_ip']);
        $subnet_id = $_POST['subnet_id'] ?: null;
        $gateway = sanitize($_POST['gateway']);
        $cidr = sanitize($_POST['cidr']);
        
        // Generate IP range
        $start = ip2long($start_ip);
        $end = ip2long($end_ip);
        
        if($start && $end && $start <= $end) {
            $count = 0;
            for($ip = $start; $ip <= $end; $ip++) {
                $ip_address = long2ip($ip);
                $stmt = $pdo->prepare("INSERT IGNORE INTO ip_addresses (ip_address, subnet_id, gateway, cidr) VALUES (:ip, :subnet_id, :gateway, :cidr)");
                if($stmt->execute([':ip' => $ip_address, ':subnet_id' => $subnet_id, ':gateway' => $gateway, ':cidr' => $cidr])) {
                    $count++;
                }
            }
            $success = "Added $count IP addresses successfully!";
            logActivity($_SESSION['id'], 'add_ip_range', "Added IP range: $start_ip - $end_ip");
        } else {
            $error = "Invalid IP range!";
        }
    }
}

// Fetch all IPs with server info
$ips = $pdo->query("
    SELECT i.*, s.hostname as server_hostname, su.name as subnet_name
    FROM ip_addresses i
    LEFT JOIN servers s ON i.assigned_to_vps = s.id
    LEFT JOIN subnets su ON i.subnet_id = su.id
    ORDER BY INET_ATON(i.ip_address)
")->fetchAll(PDO::FETCH_ASSOC);

// Fetch subnets for dropdown
$subnets = $pdo->query("SELECT * FROM subnets ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);

// Stats
$total_ips = count($ips);
$assigned_ips = count(array_filter($ips, fn($ip) => $ip['is_assigned']));
$available_ips = $total_ips - $assigned_ips;

$page_title = "IPAM";
include "../../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>🌐 IP Address Management</h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">Manage IP pools and assignments</p>
        </div>
        <button onclick="document.getElementById('addIPModal').style.display='block'" class="btn btn-primary">
            <i class="fas fa-plus"></i> Add IP Range
        </button>
    </div>

    <?php if($success): ?>
        <div class="alert alert-success"><?php echo $success; ?></div>
    <?php endif; ?>
    <?php if($error): ?>
        <div class="alert alert-danger"><?php echo $error; ?></div>
    <?php endif; ?>

    <!-- Stats -->
    <div class="stats-grid">
        <div class="stat-card">
            <i class="stat-icon">📊</i>
            <div class="stat-label">Total IPs</div>
            <div class="stat-value"><?php echo $total_ips; ?></div>
        </div>
        <div class="stat-card">
            <i class="stat-icon">✅</i>
            <div class="stat-label">Assigned</div>
            <div class="stat-value"><?php echo $assigned_ips; ?></div>
        </div>
        <div class="stat-card">
            <i class="stat-icon">🆓</i>
            <div class="stat-label">Available</div>
            <div class="stat-value"><?php echo $available_ips; ?></div>
        </div>
    </div>

    <!-- IP List -->
    <div class="card fade-in">
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>IP Address</th>
                        <th>CIDR</th>
                        <th>Gateway</th>
                        <th>MAC Address</th>
                        <th>Subnet</th>
                        <th>Assigned To</th>
                        <th>Status</th>
                    </tr>
                </thead>
                <tbody>
                    <?php foreach($ips as $ip): ?>
                    <tr>
                        <td><code><?php echo $ip['ip_address']; ?></code></td>
                        <td><?php echo $ip['cidr'] ?: '-'; ?></td>
                        <td><?php echo $ip['gateway'] ?: '-'; ?></td>
                        <td><?php echo $ip['mac_address'] ?: '-'; ?></td>
                        <td><?php echo $ip['subnet_name'] ?: '-'; ?></td>
                        <td>
                            <?php if($ip['server_hostname']): ?>
                                <a href="/admin/servers/view.php?id=<?php echo $ip['assigned_to_vps']; ?>">
                                    <?php echo htmlspecialchars($ip['server_hostname']); ?>
                                </a>
                            <?php else: ?>
                                <span style="color: var(--text-muted);">Unassigned</span>
                            <?php endif; ?>
                        </td>
                        <td>
                            <?php if($ip['is_assigned']): ?>
                                <span class="badge badge-danger">Assigned</span>
                            <?php else: ?>
                                <span class="badge badge-success">Available</span>
                            <?php endif; ?>
                        </td>
                    </tr>
                    <?php endforeach; ?>
                </tbody>
            </table>
        </div>
    </div>
</div>

<!-- Add IP Range Modal -->
<div id="addIPModal" style="display: none; position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.8); z-index: 9999; padding: 40px; overflow-y: auto;">
    <div class="card" style="max-width: 600px; margin: 0 auto;">
        <div class="card-header">
            <h3 class="card-title">Add IP Range</h3>
            <button onclick="document.getElementById('addIPModal').style.display='none'" class="btn btn-sm">
                <i class="fas fa-times"></i>
            </button>
        </div>
        <form method="POST">
            <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px;">
                <div class="form-group">
                    <label class="form-label">Start IP *</label>
                    <input type="text" name="start_ip" class="form-control" placeholder="192.168.1.1" required>
                </div>

                <div class="form-group">
                    <label class="form-label">End IP *</label>
                    <input type="text" name="end_ip" class="form-control" placeholder="192.168.1.254" required>
                </div>
            </div>

            <div class="form-group">
                <label class="form-label">CIDR</label>
                <input type="text" name="cidr" class="form-control" placeholder="/24">
            </div>

            <div class="form-group">
                <label class="form-label">Gateway</label>
                <input type="text" name="gateway" class="form-control" placeholder="192.168.1.1">
            </div>

            <div class="form-group">
                <label class="form-label">Subnet</label>
                <select name="subnet_id" class="form-control">
                    <option value="">No subnet</option>
                    <?php foreach($subnets as $subnet): ?>
                        <option value="<?php echo $subnet['id']; ?>">
                            <?php echo htmlspecialchars($subnet['name']); ?> (<?php echo $subnet['subnet_range']; ?>)
                        </option>
                    <?php endforeach; ?>
                </select>
            </div>

            <button type="submit" name="add_ip_range" class="btn btn-primary">
                <i class="fas fa-save"></i> Add IP Range
            </button>
        </form>
    </div>
</div>

<?php include "../../includes/footer.php"; ?>
