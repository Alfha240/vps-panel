<?php
/**
 * Proxmox VE API Wrapper
 * Handles communication with Proxmox API
 */

class ProxmoxAPI {
    private $host;
    private $port;
    private $tokenId;
    private $secret;
    private $ticket;
    private $csrfToken;
    
    /**
     * Constructor
     */
    public function __construct($host, $port, $tokenId, $secret) {
        $this->host = $host;
        $this->port = $port;
        $this->tokenId = $tokenId;
        $this->secret = $secret;
    }
    
    /**
     * Make API request
     */
    private function request($method, $endpoint, $data = []) {
        $url = "https://{$this->host}:{$this->port}/api2/json{$endpoint}";
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        
        // Set authorization header (API token)
        $headers = [
            "Authorization: PVEAPIToken={$this->tokenId}={$this->secret}"
        ];
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        
        // Set method and data
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($data));
        } elseif ($method === 'DELETE') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode >= 200 && $httpCode < 300) {
            return json_decode($response, true);
        }
        
        return false;
    }
    
    /**
     * Get cluster resources
     */
    public function getClusterResources() {
        return $this->request('GET', '/cluster/resources');
    }
    
    /**
     * Get all nodes
     */
    public function getNodes() {
        return $this->request('GET', '/nodes');
    }
    
    /**
     * Get node status
     */
    public function getNodeStatus($node) {
        return $this->request('GET', "/nodes/{$node}/status");
    }
    
    /**
     * Get node version info
     */
    public function getNodeVersion($node) {
        return $this->request('GET', "/nodes/{$node}/version");
    }
    
    /**
     * List VMs on a node
     */
    public function getVMs($node) {
        return $this->request('GET', "/nodes/{$node}/qemu");
    }
    
    /**
     * Get VM status
     */
    public function getVMStatus($node, $vmid) {
        return $this->request('GET', "/nodes/{$node}/qemu/{$vmid}/status/current");
    }
    
    /**
     * Create VM
     */
    public function createVM($node, $params) {
        return $this->request('POST', "/nodes/{$node}/qemu", $params);
    }
    
    /**
     * Start VM
     */
    public function startVM($node, $vmid) {
        return $this->request('POST', "/nodes/{$node}/qemu/{$vmid}/status/start");
    }
    
    /**
     * Stop VM
     */
    public function stopVM($node, $vmid) {
        return $this->request('POST', "/nodes/{$node}/qemu/{$vmid}/status/stop");
    }
    
    /**
     * Shutdown VM
     */
    public function shutdownVM($node, $vmid) {
        return $this->request('POST', "/nodes/{$node}/qemu/{$vmid}/status/shutdown");
    }
    
    /**
     * Restart VM
     */
    public function restartVM($node, $vmid) {
        return $this->request('POST', "/nodes/{$node}/qemu/{$vmid}/status/reboot");
    }
    
    /**
     * Delete VM
     */
    public function deleteVM($node, $vmid) {
        return $this->request('DELETE', "/nodes/{$node}/qemu/{$vmid}");
    }
    
    /**
     * Get storages on a node
     */
    public function getStorages($node) {
        return $this->request('GET', "/nodes/{$node}/storage");
    }
    
    /**
     * Get storage content (ISOs, templates, etc.)
     */
    public function getStorageContent($node, $storage, $content = 'iso') {
        return $this->request('GET', "/nodes/{$node}/storage/{$storage}/content?content={$content}");
    }
    
    /**
     * Get next available VMID
     */
    public function getNextVMID() {
        $result = $this->request('GET', '/cluster/nextid');
        return $result && isset($result['data']) ? $result['data'] : null;
    }
    
    /**
     * Test connection
     */
    public function testConnection() {
        $result = $this->request('GET', '/version');
        return $result !== false;
    }
    
    /**
     * Get node network interfaces
     */
    public function getNetworkInterfaces($node) {
        return $this->request('GET', "/nodes/{$node}/network");
    }
    
    /**
     * Create VM with full configuration
     */
    public function createVMFull($node, $vmid, $name, $cores, $memory, $disk, $iso, $network) {
        $params = [
            'vmid' => $vmid,
            'name' => $name,
            'cores' => $cores,
            'memory' => $memory,
            'net0' => $network,
            'ide2' => $iso . ',media=cdrom',
            'scsi0' => 'local-lvm:' . $disk,
            'scsihw' => 'virtio-scsi-pci',
            'ostype' => 'l26',
            'boot' => 'order=scsi0;ide2',
            'agent' => 1
        ];
        
        return $this->createVM($node, $params);
    }
}
