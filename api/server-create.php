<?php
/**
 * API: Server Creation Endpoint
 * Creates a new VPS instance
 * Requires API token with create_vm permission
 */

require_once __DIR__ . '/../includes/config.php';
require_once __DIR__ . '/../includes/middleware.php';
require_once __DIR__ . '/../includes/proxmox.php';

header('Content-Type: application/json');

// Verify API token
$tokenData = requireAPIPermission('create_vm');

// Get request data
$input = json_decode(file_get_contents('php://input'), true);

// Validate required fields
$required = ['user_id', 'plan_id', 'name'];
foreach ($required as $field) {
    if (!isset($input[$field])) {
        errorResponse("Field '{$field}' is required", 400);
    }
}

$userId = (int)$input['user_id'];
$planId = (int)$input['plan_id'];
$serverName = sanitize($input['name']);
$os = sanitize($input['os'] ?? 'Linux');

global $db;

// Verify user exists
$user = $db->fetch('SELECT * FROM users WHERE id = :id', ['id' => $userId]);
if (!$user) {
    errorResponse('User not found', 404);
}

// Verify plan exists and is active
$plan = $db->fetch('SELECT * FROM plans WHERE id = :id AND is_active = 1', ['id' => $planId]);
if (!$plan) {
    errorResponse('Plan not found or inactive', 404);
}

// Find available node (simple logic: first active node with available resources)
$node = $db->fetch('SELECT * FROM nodes WHERE is_active = 1 LIMIT 1');
if (!$node) {
    errorResponse('No available nodes', 503);
}

// Find available IP address
$ip = $db->fetch('
    SELECT i.* FROM ip_addresses i
    LEFT JOIN ip_pools p ON i.pool_id = p.id
    WHERE p.node_id = :node_id AND i.is_assigned = 0
    LIMIT 1
', ['node_id' => $node['id']]);

if (!$ip) {
    errorResponse('No available IP addresses', 503);
}

try {
    // Initialize Proxmox API
    $proxmox = new ProxmoxAPI($node['host'], $node['port'], $node['api_token_id'], $node['api_secret']);
    
    // Get next available VMID
    $vmidData = $proxmox->getNextVMID();
    $vmid = $vmidData ?: rand(100, 999);
    
    // Prepare network configuration
    $network = "virtio,bridge=vmbr0,ip={$ip['ip_address']}/24,gw=" . $db->fetch('SELECT gateway FROM ip_pools WHERE id = :id', ['id' => $ip['pool_id']])['gateway'];
    
    // Create VM on Proxmox
    $vmParams = [
        'vmid' => $vmid,
        'name' => $serverName,
        'cores' => $plan['cpu_cores'],
        'memory' => $plan['ram_mb'],
        'net0' => 'virtio,bridge=vmbr0',
        'scsi0' => 'local-lvm:' . $plan['disk_gb'],
        'scsihw' => 'virtio-scsi-pci',
        'ostype' => 'l26',
        'boot' => 'order=scsi0',
        'agent' => 1
    ];
    
    $result = $proxmox->createVM($node['name'], $vmParams);
    
    if (!$result) {
        errorResponse('Failed to create VM on Proxmox', 500);
    }
    
    // Start transaction
    $db->beginTransaction();
    
    try {
        // Create server record
        $serverUUID = generateUUID();
        $serverId = $db->insert('servers', [
            'uuid' => $serverUUID,
            'user_id' => $userId,
            'node_id' => $node['id'],
            'plan_id' => $planId,
            'vmid' => $vmid,
            'name' => $serverName,
            'ip_address' => $ip['ip_address'],
            'mac_address' => $ip['mac_address'],
            'status' => 'active',
            'os' => $os
        ]);
        
        if (!$serverId) {
            throw new Exception('Failed to create server record');
        }
        
        // Assign IP to server
        $db->update('ip_addresses', 
            ['server_id' => $serverId, 'is_assigned' => 1],
            'id = :id',
            ['id' => $ip['id']]
        );
        
        // Commit transaction
        $db->commit();
        
        successResponse([
            'server_uuid' => $serverUUID,
            'server_id' => $serverId,
            'vmid' => $vmid,
            'name' => $serverName,
            'ip_address' => $ip['ip_address'],
            'node' => $node['name'],
            'status' => 'active'
        ], 'Server created successfully');
        
    } catch (Exception $e) {
        $db->rollback();
        // Try to delete VM from Proxmox
        $proxmox->deleteVM($node['name'], $vmid);
        throw $e;
    }
    
} catch (Exception $e) {
    errorResponse('Server creation failed: ' . $e->getMessage(), 500);
}
