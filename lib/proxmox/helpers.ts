import { ProxmoxClient, ProxmoxConfig } from './client'
import prisma from '@/lib/prisma'

/**
 * Get Proxmox client for a specific node
 */
export async function getProxmoxClientForNode(nodeId: string): Promise<ProxmoxClient> {
    const node = await prisma.node.findUnique({
        where: { id: nodeId }
    })

    if (!node) {
        throw new Error('Node not found')
    }

    const config: ProxmoxConfig = {
        host: node.ipAddress,
        port: 8006,
        tokenId: process.env.PROXMOX_TOKEN_ID!,
        tokenSecret: process.env.PROXMOX_TOKEN_SECRET!,
        node: node.hostname,
        verifyTls: false, // Set to true in production with valid certs
    }

    return new ProxmoxClient(config)
}

/**
 * Get Proxmox client for the best available node
 */
export async function getAvailableProxmoxClient(): Promise<{ client: ProxmoxClient, node: any }> {
    const node = await prisma.node.findFirst({
        where: { status: 'online' },
        orderBy: { usedCpu: 'asc' } // Select least loaded node
    })

    if (!node) {
        throw new Error('No available nodes')
    }

    const client = await getProxmoxClientForNode(node.id)

    return { client, node }
}

/**
 * Sync live VM data from Proxmox
 */
export async function syncVMFromProxmox(serverId: string) {
    const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: { node: true }
    })

    if (!server || !server.vmId) {
        throw new Error('Server not found or no VMID')
    }

    const client = await getProxmoxClientForNode(server.nodeId)
    const vmid = parseInt(server.vmId)

    try {
        const status = await client.getVMStatus(server.node.hostname, vmid)
        const config = await client.getVMConfig(server.node.hostname, vmid)

        // Get IP if running
        let ipAddress = null
        if (status.status === 'running') {
            ipAddress = await client.getVMNetwork(server.node.hostname, vmid)
        }

        // Update server in database
        await prisma.server.update({
            where: { id: serverId },
            data: {
                status: status.status,
                cpu: config.cores || server.cpu,
                ram: config.memory || server.ram,
            }
        })

        return {
            vmid,
            status: status.status,
            ipAddress,
            uptime: status.uptime || 0,
            cpuUsage: status.cpu || 0,
            memUsage: status.mem || 0,
            memTotal: status.maxmem || 0,
        }
    } catch (error) {
        console.error(`Failed to sync VM ${vmid}:`, error)
        throw error
    }
}

/**
 * Sync all VMs from all nodes
 */
export async function syncAllVMs() {
    const nodes = await prisma.node.findMany({
        where: { status: 'online' }
    })

    const results = {
        synced: 0,
        errors: [] as any[]
    }

    for (const node of nodes) {
        try {
            const client = await getProxmoxClientForNode(node.id)
            const vms = await client.getVMs(node.hostname)

            for (const vm of vms) {
                // Skip templates
                if (vm.template) continue

                try {
                    const existing = await prisma.server.findFirst({
                        where: { vmId: vm.vmid.toString() }
                    })

                    if (existing) {
                        await prisma.server.update({
                            where: { id: existing.id },
                            data: {
                                status: vm.status,
                                name: vm.name,
                            }
                        })
                        results.synced++
                    }
                } catch (error: any) {
                    results.errors.push({
                        vmid: vm.vmid,
                        error: error.message
                    })
                }
            }
        } catch (error: any) {
            results.errors.push({
                node: node.name,
                error: error.message
            })
        }
    }

    return results
}
