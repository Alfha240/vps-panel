<?php
// api/vps/start.php
// Start VPS via Proxmox API
header('Content-Type: application/json');
require_once "../../config.php";
require_once "../../includes/middleware.php";
require_once "../../includes/proxmox.class.php";

requireLogin();

$data = json_decode(file_get_contents('php://input'), true);
$server_id = (int)$data['server_id'];

// Get server (check ownership)
$server = getVPSById($server_id, $_SESSION['id']);

if(!$server) {
    echo json_encode(['success' => false, 'error' => 'Server not found']);
    exit;
}

if($server['suspended']) {
    echo json_encode(['success' => false, 'error' => 'Server is suspended']);
    exit;
}

// Get node details
$node = getNodeById($server['node_id']);

if(!$node) {
    echo json_encode(['success' => false, 'error' => 'Node not found']);
    exit;
}

// Connect to Proxmox
$proxmox = new ProxmoxAPI($node['host'], $node['port'], $node['token_id'], $node['token_secret']);

// Start VM
$result = $proxmox->startVM($node['name'], $server['vmid']);

if($result) {
    // Update status in database
    $stmt = $pdo->prepare("UPDATE servers SET status = 'running' WHERE id = :id");
    $stmt->execute([':id' => $server_id]);
    
    logActivity($_SESSION['id'], 'start_server', "Started server: {$server['hostname']}");
    
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to start server']);
}
?>
