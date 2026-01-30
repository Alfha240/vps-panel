<?php
// api/vps/restart.php
// Restart VPS via Proxmox API
header('Content-Type: application/json');
require_once "../../config.php";
require_once "../../includes/middleware.php";
require_once "../../includes/proxmox.class.php";

requireLogin();

$data = json_decode(file_get_contents('php://input'), true);
$server_id = (int)$data['server_id'];

$server = getVPSById($server_id, $_SESSION['id']);

if(!$server) {
    echo json_encode(['success' => false, 'error' => 'Server not found']);
    exit;
}

$node = getNodeById($server['node_id']);
$proxmox = new ProxmoxAPI($node['host'], $node['port'], $node['token_id'], $node['token_secret']);

$result = $proxmox->restartVM($node['name'], $server['vmid']);

if($result) {
    logActivity($_SESSION['id'], 'restart_server', "Restarted server: {$server['hostname']}");
    echo json_encode(['success' => true]);
} else {
    echo json_encode(['success' => false, 'error' => 'Failed to restart server']);
}
?>
