<?php
/**
 * Database Helper Functions
 */

/**
 * Get all nodes
 * @return array List of nodes
 */
function getNodes() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM nodes WHERE is_active = 1 ORDER BY name");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Get node by ID
 * @param int $id Node ID
 * @return array|false Node data
 */
function getNodeById($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM nodes WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Get available IP from pool
 * @param int $subnet_id Subnet ID (optional)
 * @return string|false IP address
 */
function getAvailableIP($subnet_id = null) {
    global $pdo;
    
    $sql = "SELECT ip_address FROM ip_addresses WHERE is_assigned = 0";
    if ($subnet_id) {
        $sql .= " AND subnet_id = :subnet_id";
    }
    $sql .= " LIMIT 1";
    
    $stmt = $pdo->prepare($sql);
    if ($subnet_id) {
        $stmt->execute([':subnet_id' => $subnet_id]);
    } else {
        $stmt->execute();
    }
    
    $result = $stmt->fetch(PDO::FETCH_ASSOC);
    return $result ? $result['ip_address'] : false;
}

/**
 * Assign IP to VPS
 * @param string $ip IP address
 * @param int $vps_id VPS instance ID
 * @return bool Success status
 */
function assignIP($ip, $vps_id) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE ip_addresses SET is_assigned = 1, assigned_to_vps = :vps_id WHERE ip_address = :ip");
    return $stmt->execute([':vps_id' => $vps_id, ':ip' => $ip]);
}

/**
 * Release IP from VPS
 * @param string $ip IP address
 * @return bool Success status
 */
function releaseIP($ip) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE ip_addresses SET is_assigned = 0, assigned_to_vps = NULL WHERE ip_address = :ip");
    return $stmt->execute([':ip' => $ip]);
}

/**
 * Get all plans
 * @param bool $visible_only Only visible plans
 * @return array List of plans
 */
function getPlans($visible_only = true) {
    global $pdo;
    
    $sql = "SELECT * FROM plans";
    if ($visible_only) {
        $sql .= " WHERE is_visible = 1";
    }
    $sql .= " ORDER BY price ASC";
    
    $stmt = $pdo->query($sql);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Get plan by ID
 * @param int $id Plan ID
 * @return array|false Plan data
 */
function getPlanById($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM plans WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Get user's VPS instances
 * @param int $user_id User ID
 * @return array List of VPS instances
 */
function getUserVPS($user_id) {
    global $pdo;
    $stmt = $pdo->prepare("
        SELECT v.*, p.name as plan_name, n.name as node_name 
        FROM servers v
        LEFT JOIN plans p ON v.plan_id = p.id
        LEFT JOIN nodes n ON v.node_id = n.id
        WHERE v.user_id = :user_id AND v.status != 'deleted'
        ORDER BY v.created_at DESC
    ");
    $stmt->execute([':user_id' => $user_id]);
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Get VPS instance by ID
 * @param int $id VPS ID
 * @param int $user_id User ID (for ownership check)
 * @return array|false VPS data
 */
function getVPSById($id, $user_id = null) {
    global $pdo;
    
    $sql = "SELECT v.*, p.name as plan_name, n.name as node_name, n.host as node_host 
            FROM servers v
            LEFT JOIN plans p ON v.plan_id = p.id
            LEFT JOIN nodes n ON v.node_id = n.id
            WHERE v.id = :id";
    
    if ($user_id) {
        $sql .= " AND v.user_id = :user_id";
    }
    
    $stmt = $pdo->prepare($sql);
    $params = [':id' => $id];
    if ($user_id) {
        $params[':user_id'] = $user_id;
    }
    
    $stmt->execute($params);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Get node by ID
 * @param int $id Node ID
 * @return array|false Node data
 */
function getNodeById($id) {
    global $pdo;
    $stmt = $pdo->prepare("SELECT * FROM nodes WHERE id = :id");
    $stmt->execute([':id' => $id]);
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Get all active nodes
 * @return array List of nodes
 */
function getActiveNodes() {
    global $pdo;
    return $pdo->query("SELECT * FROM nodes WHERE is_active = 1 ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Get all plans
 * @return array List of plans
 */
function getAllPlans() {
    global $pdo;
    return $pdo->query("SELECT * FROM plans ORDER BY name")->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Get active templates
 * @return array List of templates
 */
function getTemplates() {
    global $pdo;
    $stmt = $pdo->query("SELECT * FROM proxmox_templates WHERE is_active = 1 ORDER BY os_type, name");
    return $stmt->fetchAll(PDO::FETCH_ASSOC);
}

/**
 * Get best node for new VPS (load balancing)
 * @return array|false Node data
 */
function getBestNode() {
    global $pdo;
    $stmt = $pdo->query("
        SELECT * FROM nodes 
        WHERE is_active = 1 AND current_vps < max_vps 
        ORDER BY (current_vps / max_vps) ASC 
        LIMIT 1
    ");
    return $stmt->fetch(PDO::FETCH_ASSOC);
}

/**
 * Increment node VPS count
 * @param int $node_id Node ID
 * @return bool Success status
 */
function incrementNodeVPS($node_id) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE nodes SET current_vps = current_vps + 1 WHERE id = :id");
    return $stmt->execute([':id' => $node_id]);
}

/**
 * Decrement node VPS count
 * @param int $node_id Node ID
 * @return bool Success status
 */
function decrementNodeVPS($node_id) {
    global $pdo;
    $stmt = $pdo->prepare("UPDATE nodes SET current_vps = current_vps - 1 WHERE id = :id AND current_vps > 0");
    return $stmt->execute([':id' => $node_id]);
}
?>
