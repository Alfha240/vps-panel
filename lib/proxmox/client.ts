import https from 'https'

export interface ProxmoxConfig {
    host: string
    port: number
    tokenId: string
    tokenSecret: string
    node: string
    verifyTls?: boolean
}

export interface ProxmoxVM {
    vmid: number
    name: string
    status: string
    cpus?: number
    maxmem?: number
    maxdisk?: number
    uptime?: number
    template?: number
}

export class ProxmoxClient {
    private baseUrl: string
    private headers: Record<string, string>
    private agent: https.Agent

    constructor(config: ProxmoxConfig) {
        this.baseUrl = `https://${config.host}:${config.port}/api2/json`
        this.headers = {
            'Authorization': `PVEAPIToken=${config.tokenId}=${config.tokenSecret}`,
            'Content-Type': 'application/json',
        }
        this.agent = new https.Agent({
            rejectUnauthorized: config.verifyTls ?? false
        })
    }

    async request(method: string, endpoint: string, data?: any) {
        const url = `${this.baseUrl}${endpoint}`
        const options: any = {
            method,
            headers: this.headers,
            agent: this.agent,
        }

        if (data) {
            if (method === 'GET') {
                const params = new URLSearchParams(data).toString()
                const response = await fetch(`${url}?${params}`, options)
                const json = await response.json()
                if (!response.ok) throw new Error(json.errors || 'Proxmox API error')
                return json.data
            } else {
                options.body = JSON.stringify(data)
            }
        }

        const response = await fetch(url, options)
        const json = await response.json()

        if (!response.ok) {
            throw new Error(json.errors || 'Proxmox API error')
        }

        return json.data
    }

    // List all VMs on a node
    async getVMs(node: string): Promise<ProxmoxVM[]> {
        return this.request('GET', `/nodes/${node}/qemu`)
    }

    // Get VM config
    async getVMConfig(node: string, vmid: number) {
        return this.request('GET', `/nodes/${node}/qemu/${vmid}/config`)
    }

    // Get VM current status
    async getVMStatus(node: string, vmid: number) {
        return this.request('GET', `/nodes/${node}/qemu/${vmid}/status/current`)
    }

    // Get IP via qemu-guest-agent
    async getVMNetwork(node: string, vmid: number): Promise<string | null> {
        try {
            const result = await this.request('GET',
                `/nodes/${node}/qemu/${vmid}/agent/network-get-interfaces`)

            // Extract IPv4 from result
            const interfaces = result.result || []
            for (const iface of interfaces) {
                if (iface.name !== 'lo' && iface['ip-addresses']) {
                    const ipv4 = iface['ip-addresses'].find((ip: any) =>
                        ip['ip-address-type'] === 'ipv4' && !ip['ip-address'].startsWith('169.254')
                    )
                    if (ipv4) return ipv4['ip-address']
                }
            }
            return null
        } catch {
            return null
        }
    }

    // Clone template to create new VM
    async cloneVM(node: string, templateId: number, newVmid: number, options: {
        name: string
        storage?: string
        pool?: string
        full?: boolean
    }) {
        return this.request('POST', `/nodes/${node}/qemu/${templateId}/clone`, {
            newid: newVmid,
            name: options.name,
            storage: options.storage || 'local-lvm',
            pool: options.pool,
            full: options.full ? 1 : 0,
        })
    }

    // Configure cloud-init
    async configureCloudInit(node: string, vmid: number, config: {
        ipconfig0?: string
        nameserver?: string
        ciuser?: string
        cipassword?: string
        sshkeys?: string
    }) {
        return this.request('PUT', `/nodes/${node}/qemu/${vmid}/config`, config)
    }

    // Start VM
    async startVM(node: string, vmid: number) {
        return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/start`)
    }

    // Stop VM
    async stopVM(node: string, vmid: number) {
        return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/stop`)
    }

    // Reboot VM
    async rebootVM(node: string, vmid: number) {
        return this.request('POST', `/nodes/${node}/qemu/${vmid}/status/reboot`)
    }

    // Delete VM
    async deleteVM(node: string, vmid: number) {
        return this.request('DELETE', `/nodes/${node}/qemu/${vmid}`)
    }

    // Get next available VMID
    async getNextVMID(node: string): Promise<number> {
        const vms = await this.getVMs(node)
        const vmids = vms.map((vm: any) => vm.vmid).sort((a: number, b: number) => b - a)
        return vmids.length > 0 ? vmids[0] + 1 : 100
    }

    // List all nodes
    async getNodes() {
        return this.request('GET', '/nodes')
    }

    // Get node resources
    async getNodeResources(node: string) {
        return this.request('GET', `/nodes/${node}/status`)
    }

    // Resize disk
    async resizeDisk(node: string, vmid: number, disk: string, size: string) {
        return this.request('PUT', `/nodes/${node}/qemu/${vmid}/resize`, {
            disk,
            size,
        })
    }

    // Update VM config
    async updateVMConfig(node: string, vmid: number, config: any) {
        return this.request('PUT', `/nodes/${node}/qemu/${vmid}/config`, config)
    }
}
