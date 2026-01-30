<?php
require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/auth.php';
require_once __DIR__ . '/../includes/middleware.php';
require_once __DIR__ . '/../includes/proxmox.php';

requireAuth();

$auth = new Auth();
$currentUser = $auth->getCurrentUser();
global $db;

// Get server by UUID
$uuid = sanitize($_GET['uuid'] ?? '');
if (empty($uuid)) {
    setFlash('error', 'Server not found');
    redirect(APP_URL . '/user/dashboard.php');
}

$server = $db->fetch('
    SELECT s.*, n.name as node_name, n.host, n.port, n.api_token_id, n.api_secret,
           p.name as plan_name, p.cpu_cores, p.ram_mb, p.disk_gb,
           l.name as location_name, l.short_code
    FROM servers s
    LEFT JOIN nodes n ON s.node_id = n.id
    LEFT JOIN plans p ON s.plan_id = p.id
    LEFT JOIN locations l ON n.location_id = l.id
    WHERE s.uuid = :uuid AND s.user_id = :user_id
', ['uuid' => $uuid, 'user_id' => getCurrentUserID()]);

if (!$server) {
    setFlash('error', 'Server not found or access denied');
    redirect(APP_URL . '/user/dashboard.php');
}

// Handle power actions
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['action'])) {
    if (!verifyCSRFToken($_POST['csrf_token'] ?? '')) {
        setFlash('error', 'Invalid request');
        redirect(APP_URL . '/user/server.php?uuid=' . $uuid);
    }
    
    if ($server['status'] === 'suspended') {
        setFlash('error', 'This server is suspended');
        redirect(APP_URL . '/user/server.php?uuid=' . $uuid);
    }
    
    $proxmox = new ProxmoxAPI($server['host'], $server['port'], $server['api_token_id'], $server['api_secret']);
    $action = $_POST['action'];
    $success = false;
    
    switch ($action) {
        case 'start':
            $success = $proxmox->startVM($server['node_name'], $server['vmid']);
            $message = $success ? 'Server started successfully' : 'Failed to start server';
            break;
        case 'stop':
            $success = $proxmox->stopVM($server['node_name'], $server['vmid']);
            $message = $success ? 'Server stopped successfully' : 'Failed to stop server';
            break;
        case 'restart':
            $success = $proxmox->restartVM($server['node_name'], $server['vmid']);
            $message = $success ? 'Server restarted successfully' : 'Failed to restart server';
            break;
    }
    
    setFlash($success ? 'success' : 'error', $message);
    redirect(APP_URL . '/user/server.php?uuid=' . $uuid);
}

// Get VM status from Proxmox
$vmStatus = null;
try {
    $proxmox = new ProxmoxAPI($server['host'], $server['port'], $server['api_token_id'], $server['api_secret']);
    $statusData = $proxmox->getVMStatus($server['node_name'], $server['vmid']);
    if ($statusData && isset($statusData['data'])) {
        $vmStatus = $statusData['data'];
    }
} catch (Exception $e) {
    // Silently fail
}

?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo sanitize($server['name']); ?> - <?php echo APP_NAME; ?></title>
    <link rel="stylesheet" href="<?php echo APP_URL; ?>/assets/css/style.css">
</head>
<body>
    <div class="dashboard">
        <?php include __DIR__ . '/_sidebar.php'; ?>
        
        <div class="main-content">
            <div class="page-header">
                <h1><?php echo sanitize($server['name']); ?></h1>
                <p>
                    <span class="badge badge-info"><?php echo sanitize($server['short_code']); ?></span>
                    <?php echo sanitize($server['location_name']); ?> • <?php echo sanitize($server['node_name']); ?>
                </p>
            </div>
            
            <?php $flash = getFlash(); if ($flash): ?>
            <div class="alert alert-<?php echo $flash['type']; ?>">
                <?php echo sanitize($flash['message']); ?>
            </div>
            <?php endif; ?>
            
            <!-- Server Status & Power Controls -->
            <div class="grid grid-cols-2" style="margin-bottom: 2rem;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Server Status</h3>
                    </div>
                    <div class="card-body">
                        <div style="margin-bottom: 1.5rem;">
                            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Status</div>
                            <?php
                            $statusBadge = 'info';
                            $statusText = 'Unknown';
                            if ($vmStatus) {
                                $statusText = ucfirst($vmStatus['status'] ?? 'unknown');
                                if ($vmStatus['status'] === 'running') $statusBadge = 'success';
                                elseif ($vmStatus['status'] === 'stopped') $statusBadge = 'danger';
                            }
                            if ($server['status'] === 'suspended') {
                                $statusBadge = 'warning';
                                $statusText = 'Suspended';
                            }
                            ?>
                            <span class="badge badge-<?php echo $statusBadge; ?>" style="font-size: 1rem; padding: 0.5rem 1rem;">
                                <?php echo $statusText; ?>
                            </span>
                        </div>
                        
                        <?php if ($vmStatus && isset($vmStatus['uptime'])): ?>
                        <div>
                            <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 0.5rem;">Uptime</div>
                            <div style="font-weight: 500;"><?php echo gmdate("H:i:s", $vmStatus['uptime']); ?></div>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Power Controls</h3>
                    </div>
                    <div class="card-body">
                        <?php if ($server['status'] === 'suspended'): ?>
                        <div class="alert alert-warning">
                            This server is suspended. Contact support to restore access.
                        </div>
                        <?php else: ?>
                        <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                            <form method="POST" style="flex: 1;">
                                <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                <input type="hidden" name="action" value="start">
                                <button type="submit" class="btn btn-success btn-block" 
                                        <?php echo ($vmStatus && $vmStatus['status'] === 'running') ? 'disabled' : ''; ?>>
                                    ▶️ Start
                                </button>
                            </form>
                            
                            <form method="POST" style="flex: 1;">
                                <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                <input type="hidden" name="action" value="stop">
                                <button type="submit" class="btn btn-danger btn-block"
                                        <?php echo ($vmStatus && $vmStatus['status'] !== 'running') ? 'disabled' : ''; ?>>
                                    ⏹️ Stop
                                </button>
                            </form>
                            
                            <form method="POST" style="flex: 1;">
                                <input type="hidden" name="csrf_token" value="<?php echo generateCSRFToken(); ?>">
                                <input type="hidden" name="action" value="restart">
                                <button type="submit" class="btn btn-warning btn-block"
                                        <?php echo ($vmStatus && $vmStatus['status'] !== 'running') ? 'disabled' : ''; ?>>
                                    🔄 Restart
                                </button>
                            </form>
                        </div>
                        <?php endif; ?>
                    </div>
                </div>
            </div>
            
            <!-- Server Details -->
            <div class="grid grid-cols-2" style="margin-bottom: 2rem;">
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Specifications</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; gap: 1rem;">
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">CPU</div>
                                <div style="font-weight: 500;"><?php echo $server['cpu_cores']; ?> vCore(s)</div>
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">RAM</div>
                                <div style="font-weight: 500;"><?php echo $server['ram_mb']; ?> MB</div>
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">Disk</div>
                                <div style="font-weight: 500;"><?php echo $server['disk_gb']; ?> GB</div>
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">Plan</div>
                                <div style="font-weight: 500;"><?php echo sanitize($server['plan_name']); ?></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="card">
                    <div class="card-header">
                        <h3 class="card-title">Network & System</h3>
                    </div>
                    <div class="card-body">
                        <div style="display: grid; gap: 1rem;">
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">IP Address</div>
                                <div style="font-weight: 500;"><code><?php echo sanitize($server['ip_address']); ?></code></div>
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">MAC Address</div>
                                <div style="font-weight: 500;"><code><?php echo sanitize($server['mac_address']); ?></code></div>
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">Operating System</div>
                                <div style="font-weight: 500;"><?php echo sanitize($server['os']) ?: 'Not specified'; ?></div>
                            </div>
                            <div>
                                <div style="font-size: 0.9rem; color: var(--text-secondary);">VMID</div>
                                <div style="font-weight: 500;"><?php echo $server['vmid']; ?></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Console Placeholder -->
            <div class="card">
                <div class="card-header">
                    <h3 class="card-title">Console</h3>
                </div>
                <div class="card-body">
                    <div style="background: var(--bg-primary); padding: 3rem; text-align: center; border-radius: var(--radius-md); border: 1px dashed var(--border-color);">
                        <div style="font-size: 2rem; margin-bottom: 1rem;">🖥️</div>
                        <div style="color: var(--text-secondary);">noVNC Console</div>
                        <div style="color: var(--text-muted); font-size: 0.9rem; margin-top: 0.5rem;">Coming Soon</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</body>
</html>
