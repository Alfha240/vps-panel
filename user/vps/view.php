<?php
// user/vps/view.php
// VPS Management (User)
require_once "../../config.php";
require_once "../../includes/middleware.php";
require_once "../../includes/proxmox.class.php";

requireLogin();

$server_id = (int)$_GET['id'];
$server = getVPSById($server_id, $_SESSION['id']);

if(!$server) {
    header("Location: /user/dashboard.php");
    exit;
}

// Get node details for Proxmox connection
$node = getNodeById($server['node_id']);

$page_title = $server['hostname'];
include "../../includes/header.php";
?>

<div class="container">
    <div class="header">
        <div class="header-title">
            <h2>🖥️ <?php echo htmlspecialchars($server['hostname']); ?></h2>
            <p style="color: var(--text-muted); font-size: 14px; margin-top: 4px;">
                UUID: <?php echo $server['uuid']; ?>
            </p>
        </div>
        <a href="/user/dashboard.php" class="btn btn-secondary">
            <i class="fas fa-arrow-left"></i> Back
        </a>
    </div>

    <!-- Server Info -->
    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px;">
        <!-- Main Panel -->
        <div>
            <!-- Power Controls -->
            <div class="card fade-in" style="margin-bottom: 20px;">
                <div class="card-header">
                    <h3 class="card-title">Power Management</h3>
                    <span class="badge <?php echo $server['status'] == 'running' ? 'badge-success' : 'badge-danger'; ?>">
                        <?php echo ucfirst($server['status']); ?>
                    </span>
                </div>
                
                <?php if($server['suspended']): ?>
                    <div style="background: rgba(245, 158, 11, 0.1); border: 1px solid var(--accent-warning); padding: 16px; border-radius: 8px; margin-bottom: 16px;">
                        <p style="color: var(--accent-warning); margin: 0;">
                            <i class="fas fa-exclamation-triangle"></i> This server is suspended. Contact support for more information.
                        </p>
                    </div>
                <?php else: ?>
                    <div style="display: flex; gap: 12px;">
                        <button onclick="controlServer('start', <?php echo $server['id']; ?>)" class="btn btn-success">
                            <i class="fas fa-play"></i> Start
                        </button>
                        <button onclick="controlServer('stop', <?php echo $server['id']; ?>)" class="btn btn-danger">
                            <i class="fas fa-stop"></i> Stop
                        </button>
                        <button onclick="controlServer('restart', <?php echo $server['id']; ?>)" class="btn btn-warning">
                            <i class="fas fa-redo"></i> Restart
                        </button>
                        <a href="/user/vps/console.php?id=<?php echo $server['id']; ?>" class="btn btn-primary">
                            <i class="fas fa-terminal"></i> Console
                        </a>
                    </div>
                <?php endif; ?>
            </div>

            <!-- Resource Usage -->
            <div class="card fade-in">
                <div class="card-header">
                    <h3 class="card-title">Resource Usage</h3>
                </div>
                
                <div style="display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px;">
                    <div style="text-align: center; padding: 20px; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 32px; margin-bottom: 8px;">💾</div>
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">
                            <?php echo number_format($server['ram'] / 1024, 1); ?> GB
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted);">RAM</div>
                    </div>

                    <div style="text-align: center; padding: 20px; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 32px; margin-bottom: 8px;">⚡</div>
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">
                            <?php echo $server['cpu_cores']; ?>
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted);">CPU Cores</div>
                    </div>

                    <div style="text-align: center; padding: 20px; background: var(--bg-tertiary); border-radius: 8px;">
                        <div style="font-size: 32px; margin-bottom: 8px;">💿</div>
                        <div style="font-size: 24px; font-weight: 700; margin-bottom: 4px;">
                            <?php echo $server['disk']; ?> GB
                        </div>
                        <div style="font-size: 12px; color: var(--text-muted);">Disk</div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Sidebar Info -->
        <div>
            <div class="card fade-in">
                <div class="card-header">
                    <h3 class="card-title">Server Details</h3>
                </div>
                
                <div style="display: flex; flex-direction: column; gap: 16px;">
                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">IP Address</div>
                        <code style="background: var(--bg-tertiary); padding: 8px 12px; border-radius: 6px; display: block;">
                            <?php echo $server['ip_address']; ?>
                        </code>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Node</div>
                        <div><?php echo htmlspecialchars($server['node_name']); ?></div>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Plan</div>
                        <div><?php echo htmlspecialchars($server['plan_name']); ?></div>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">Created</div>
                        <div><?php echo date('M d, Y H:i', strtotime($server['created_at'])); ?></div>
                    </div>

                    <div>
                        <div style="font-size: 12px; color: var(--text-muted); margin-bottom: 4px;">VMID</div>
                        <div><?php echo $server['vmid']; ?></div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>

<script>
function controlServer(action, serverId) {
    if(!confirm(`Are you sure you want to ${action} this server?`)) {
        return;
    }
    
    fetch(`/api/vps/${action}.php`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ server_id: serverId })
    })
    .then(response => response.json())
    .then(data => {
        if(data.success) {
            alert(`Server ${action} initiated successfully!`);
            location.reload();
        } else {
            alert(`Error: ${data.error || 'Unknown error'}`);
        }
    })
    .catch(error => {
        alert('Network error: ' + error);
    });
}
</script>

<?php include "../../includes/footer.php"; ?>
