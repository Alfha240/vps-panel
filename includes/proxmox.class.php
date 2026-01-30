<?php
/**
 * Proxmox API Wrapper Class
 * Handles all communication with Proxmox VE API
 */

class ProxmoxAPI {
    private $host;
    private $port;
    private $token_id;
    private $token_secret;
    private $base_url;
    
    /**
     * Constructor
     * @param string $host Proxmox host
     * @param int $port Proxmox port (default 8006)
     * @param string $token_id API token ID
     * @param string $token_secret API token secret
     */
    public function __construct($host, $port, $token_id, $token_secret) {
        $this->host = $host;
        $this->port = $port;
        $this->token_id = $token_id;
        $this->token_secret = $token_secret;
        $this->base_url = "https://{$host}:{$port}/api2/json";
    }
    
    /**
     * Make HTTP request to Proxmox API
     * @param string $method HTTP method (GET, POST, PUT, DELETE)
     * @param string $endpoint API endpoint
     * @param array $data Request data
     * @return array Response data
     */
    private function request($method, $endpoint, $data = []) {
        $url = $this->base_url . $endpoint;
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            "Authorization: PVEAPIToken={$this->token_id}={$this->token_secret}",
            "Content-Type: application/x-www-form-urlencoded"
        ]);
        
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
        $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($http_code >= 400) {
            return ['success' => false, 'error' => "HTTP Error: $http_code"];
        }
        
        return json_decode($response, true);
    }
    
    /**
     * Test connection to Proxmox
     * @return bool Connection status
     */
    public function testConnection() {
        $result = $this->request('GET', '/version');
        return isset($result['data']);
    }
    
    /**
     * Get all nodes
     * @return array List of nodes
     */
    public function getNodes() {
        $result = $this->request('GET', '/nodes');
        return $result['data'] ?? [];
    }
    
    /**
     * Get all VMs on a node
     * @param string $node Node name
     * @return array List of VMs
     */
    public function getVMs($node) {
        $result = $this->request('GET', "/nodes/{$node}/qemu");
        return $result['data'] ?? [];
    }
    
    /**
     * Get VM status
     * @param string $node Node name
     * @param int $vmid VM ID
     * @return array VM status
     */
    public function getVMStatus($node, $vmid) {
        $result = $this->request('GET', "/nodes/{$node}/qemu/{$vmid}/status/current");
        return $result['data'] ?? [];
    }
    
    /**
     * Create new VM
     * @param string $node Node name
     * @param int $vmid VM ID
     * @param array $config VM configuration
     * @return array Creation result
     */
    public function createVM($node, $vmid, $config) {
        $data = array_merge(['vmid' => $vmid], $config);
        return $this->request('POST', "/nodes/{$node}/qemu", $data);
    }
    
    /**
     * Clone VM from template
     * @param string $node Node name
     * @param int $template_vmid Template VM ID
     * @param int $new_vmid New VM ID
     * @param array $config Clone configuration
     * @return array Clone result
     */
    public function cloneVM($node, $template_vmid, $new_vmid, $config = []) {
        $data = array_merge([
            'newid' => $new_vmid,
            'full' => 1
        ], $config);
        
        return $this->request('POST', "/nodes/{$node}/qemu/{$template_vmid}/clone", $data);
    }
    
    /**
     * Start VM
     * @param string $node Node name
     * @param int $vmid VM ID
     * @return array Start result
     */
    public function startVM($node, $vmid) {
        return $this->request('POST', "/nodes/{$node}/qemu/{$vmid}/status/start");
    }
    
    /**
     * Stop VM
     * @param string $node Node name
     * @param int $vmid VM ID
     * @return array Stop result
     */
    public function stopVM($node, $vmid) {
        return $this->request('POST', "/nodes/{$node}/qemu/{$vmid}/status/stop");
    }
    
    /**
     * Restart VM
     * @param string $node Node name
     * @param int $vmid VM ID
     * @return array Restart result
     */
    public function restartVM($node, $vmid) {
        return $this->request('POST', "/nodes/{$node}/qemu/{$vmid}/status/reboot");
    }
    
    /**
     * Delete VM
     * @param string $node Node name
     * @param int $vmid VM ID
     * @return array Delete result
     */
    public function deleteVM($node, $vmid) {
        return $this->request('DELETE', "/nodes/{$node}/qemu/{$vmid}");
    }
    
    /**
     * Get next available VM ID
     * @return int Next VMID
     */
    public function getNextVMID() {
        $result = $this->request('GET', '/cluster/nextid');
        return $result['data'] ?? 100;
    }
    
    /**
     * Get storage list
     * @param string $node Node name
     * @return array Storage list
     */
    public function getStorage($node) {
        $result = $this->request('GET', "/nodes/{$node}/storage");
        return $result['data'] ?? [];
    }
    
    /**
     * Get network interfaces
     * @param string $node Node name
     * @return array Network interfaces
     */
    public function getNetworkInterfaces($node) {
        $result = $this->request('GET', "/nodes/{$node}/network");
        return $result['data'] ?? [];
    }
}
?>
