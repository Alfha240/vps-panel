import axios, { AxiosInstance } from 'axios';
import https from 'https';

interface ProxmoxCredentials {
    host: string;
    port: number;
    user: string;
    password: string;
    realm?: string;
}

interface ProxmoxTicket {
    ticket: string;
    CSRFPreventionToken: string;
}

interface NodeStatus {
    cpu: number;
    maxcpu: number;
    mem: number;
    maxmem: number;
    disk: number;
    maxdisk: number;
    uptime: number;
}

interface VMConfig {
    vmid: number;
    name: string;
    cores: number;
    memory: number; // in MB
    disk: string; // e.g., "20G"
    ostemplate?: string; // for LXC containers
    clone?: number; // VM ID to clone from
    storage?: string;
    network?: string;
    ipconfig?: string;
}

class ProxmoxService {
    private credentials: ProxmoxCredentials;
    private client: AxiosInstance;
    private ticket: ProxmoxTicket | null = null;

    constructor(credentials: ProxmoxCredentials) {
        this.credentials = {
            ...credentials,
            realm: credentials.realm || 'pam',
        };

        // Create axios instance with SSL verification disabled (common for Proxmox)
        this.client = axios.create({
            baseURL: `https://${credentials.host}:${credentials.port}/api2/json`,
            httpsAgent: new https.Agent({
                rejectUnauthorized: false, // Accept self-signed certificates
            }),
            timeout: 30000,
        });
    }

    /**
     * Authenticate with Proxmox and get ticket
     */
    async authenticate(): Promise<void> {
        try {
            const response = await this.client.post('/access/ticket', {
                username: `${this.credentials.user}@${this.credentials.realm}`,
                password: this.credentials.password,
            });

            this.ticket = response.data.data;
        } catch (error: any) {
            console.error('Proxmox authentication error:', error.message);
            throw new Error('Failed to authenticate with Proxmox');
        }
    }

    /**
     * Ensure we have a valid authentication ticket
     */
    private async ensureAuthenticated(): Promise<void> {
        if (!this.ticket) {
            await this.authenticate();
        }
    }

    /**
     * Get headers with authentication
     */
    private getHeaders() {
        if (!this.ticket) {
            throw new Error('Not authenticated');
        }

        return {
            Cookie: `PVEAuthCookie=${this.ticket.ticket}`,
            CSRFPreventionToken: this.ticket.CSRFPreventionToken,
        };
    }

    /**
     * Get node status (CPU, RAM, disk usage)
     */
    async getNodeStatus(nodeName: string): Promise<NodeStatus> {
        await this.ensureAuthenticated();

        try {
            const response = await this.client.get(`/nodes/${nodeName}/status`, {
                headers: this.getHeaders(),
            });

            return response.data.data;
        } catch (error: any) {
            console.error(`Error fetching node status for ${nodeName}:`, error.message);
            throw new Error('Failed to fetch node status');
        }
    }

    /**
     * Get list of VMs on a node
     */
    async getVMs(nodeName: string): Promise<any[]> {
        await this.ensureAuthenticated();

        try {
            const response = await this.client.get(`/nodes/${nodeName}/qemu`, {
                headers: this.getHeaders(),
            });

            return response.data.data;
        } catch (error: any) {
            console.error(`Error fetching VMs for ${nodeName}:`, error.message);
            throw new Error('Failed to fetch VMs');
        }
    }

    /**
     * Create a new VM (QEMU)
     */
    async createVM(nodeName: string, config: VMConfig): Promise<string> {
        await this.ensureAuthenticated();

        try {
            const params: any = {
                vmid: config.vmid,
                name: config.name,
                cores: config.cores,
                memory: config.memory,
                scsihw: 'virtio-scsi-pci',
                bootdisk: 'scsi0',
                net0: config.network || 'virtio,bridge=vmbr0',
            };

            // If cloning from a template
            if (config.clone) {
                const response = await this.client.post(
                    `/nodes/${nodeName}/qemu/${config.clone}/clone`,
                    {
                        newid: config.vmid,
                        name: config.name,
                        storage: config.storage || 'local-lvm',
                        full: 1, // Full clone
                    },
                    { headers: this.getHeaders() }
                );

                return response.data.data;
            }

            // Create new VM from scratch
            const response = await this.client.post(`/nodes/${nodeName}/qemu`, params, {
                headers: this.getHeaders(),
            });

            return response.data.data;
        } catch (error: any) {
            console.error('Error creating VM:', error.message);
            throw new Error('Failed to create VM');
        }
    }

    /**
     * Get VM status
     */
    async getVMStatus(nodeName: string, vmid: number): Promise<any> {
        await this.ensureAuthenticated();

        try {
            const response = await this.client.get(`/nodes/${nodeName}/qemu/${vmid}/status/current`, {
                headers: this.getHeaders(),
            });

            return response.data.data;
        } catch (error: any) {
            console.error(`Error fetching VM ${vmid} status:`, error.message);
            throw new Error('Failed to fetch VM status');
        }
    }

    /**
     * Start a VM
     */
    async startVM(nodeName: string, vmid: number): Promise<string> {
        await this.ensureAuthenticated();

        try {
            const response = await this.client.post(
                `/nodes/${nodeName}/qemu/${vmid}/status/start`,
                {},
                { headers: this.getHeaders() }
            );

            return response.data.data;
        } catch (error: any) {
            console.error(`Error starting VM ${vmid}:`, error.message);
            throw new Error('Failed to start VM');
        }
    }

    /**
     * Stop a VM
     */
    async stopVM(nodeName: string, vmid: number): Promise<string> {
        await this.ensureAuthenticated();

        try {
            const response = await this.client.post(
                `/nodes/${nodeName}/qemu/${vmid}/status/stop`,
                {},
                { headers: this.getHeaders() }
            );

            return response.data.data;
        } catch (error: any) {
            console.error(`Error stopping VM ${vmid}:`, error.message);
            throw new Error('Failed to stop VM');
        }
    }

    /**
     * Restart a VM
     */
    async restartVM(nodeName: string, vmid: number): Promise<string> {
        await this.ensureAuthenticated();

        try {
            const response = await this.client.post(
                `/nodes/${nodeName}/qemu/${vmid}/status/reboot`,
                {},
                { headers: this.getHeaders() }
            );

            return response.data.data;
        } catch (error: any) {
            console.error(`Error restarting VM ${vmid}:`, error.message);
            throw new Error('Failed to restart VM');
        }
    }

    /**
     * Delete a VM
     */
    async deleteVM(nodeName: string, vmid: number): Promise<string> {
        await this.ensureAuthenticated();

        try {
            const response = await this.client.delete(`/nodes/${nodeName}/qemu/${vmid}`, {
                headers: this.getHeaders(),
            });

            return response.data.data;
        } catch (error: any) {
            console.error(`Error deleting VM ${vmid}:`, error.message);
            throw new Error('Failed to delete VM');
        }
    }

    /**
     * Get next available VM ID
     */
    async getNextVMID(nodeName: string): Promise<number> {
        await this.ensureAuthenticated();

        try {
            const response = await this.client.get(`/cluster/nextid`, {
                headers: this.getHeaders(),
            });

            return parseInt(response.data.data);
        } catch (error: any) {
            console.error('Error getting next VMID:', error.message);
            throw new Error('Failed to get next VMID');
        }
    }
}

/**
 * Create a Proxmox service instance from node credentials
 */
export const createProxmoxClient = (node: {
    proxmox_host: string;
    proxmox_port: number;
    proxmox_user: string;
    proxmox_password: string;
    proxmox_realm: string;
}): ProxmoxService => {
    return new ProxmoxService({
        host: node.proxmox_host,
        port: node.proxmox_port,
        user: node.proxmox_user,
        password: node.proxmox_password,
        realm: node.proxmox_realm,
    });
};

export default ProxmoxService;
