<?php
/**
 * API: Server Control Endpoint
 * Handles power actions for servers
 * Requires API token authentication
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/middleware.php';
require_once __DIR__ . '/../includes/proxmox.php';

header('Content-Type: application/json');

// Verify API token and permissions
$tokenData = requireAPIPermission('start_vm'); // We'll check specific permission per action

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

if (!isset($input['server_uuid']) || !isset($input['action'])) {
    errorResponse('server_uuid and action are required', 400);
}

$serverUUID = sanitize($input['server_uuid']);
$action = sanitize($input['action']);

// Validate action
$validActions = ['start', 'stop', 'restart', 'shutdown'];
if (!in_array($action, $validActions)) {
    errorResponse('Invalid action. Must be: start, stop, restart, or shutdown', 400);
}

// Check permission for specific action
$permissionMap = [
    'start' => 'start_vm',
    'stop' => 'stop_vm',
    'restart' => 'restart_vm',
    'shutdown' => 'stop_vm'
];

if (!hasAPIPermission($tokenData, $permissionMap[$action])) {
    errorResponse('Insufficient permissions for this action', 403);
}

// Get server
global $db;
$server = $db->fetch('
    SELECT s.*, n.name as node_name, n.host, n.port, n.api_token_id, n.api_secret
    FROM servers s
    LEFT JOIN nodes n ON s.node_id = n.id
    WHERE s.uuid = :uuid
', ['uuid' => $serverUUID]);

if (!$server) {
    errorResponse('Server not found', 404);
}

if ($server['status'] === 'suspended') {
    errorResponse('Server is suspended', 403);
}

// Execute action via Proxmox API
try {
    $proxmox = new ProxmoxAPI($server['host'], $server['port'], $server['api_token_id'], $server['api_secret']);
    
    $result = false;
    switch ($action) {
        case 'start':
            $result = $proxmox->startVM($server['node_name'], $server['vmid']);
            break;
        case 'stop':
            $result = $proxmox->stopVM($server['node_name'], $server['vmid']);
            break;
        case 'restart':
            $result = $proxmox->restartVM($server['node_name'], $server['vmid']);
            break;
        case 'shutdown':
            $result = $proxmox->shutdownVM($server['node_name'], $server['vmid']);
            break;
    }
    
    if ($result) {
        successResponse([
            'server_uuid' => $serverUUID,
            'action' => $action,
            'vmid' => $server['vmid']
        ], 'Action executed successfully');
    } else {
        errorResponse('Failed to execute action on Proxmox', 500);
    }
    
} catch (Exception $e) {
    errorResponse('Proxmox API error: ' . $e->getMessage(), 500);
}
