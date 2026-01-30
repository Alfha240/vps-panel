import prisma from '../lib/prisma';
import { createProxmoxClient } from './proxmox.service';
import crypto from 'crypto';

interface DeploymentConfig {
    userId: number;
    planId: number;
    osTemplate: string;
    locationId?: number;
    hostname?: string;
}

/**
 * Select the best node for deployment based on available resources
 */
export const selectBestNode = async (locationId?: number): Promise<any> => {
    const where: any = {
        is_active: true,
        maintenance_mode: false,
    };

    if (locationId) {
        where.location_id = locationId;
    }

    const nodes = await prisma.node.findMany({
        where,
        include: {
            location: true,
        },
    });

    if (nodes.length === 0) {
        throw new Error('No available nodes found');
    }

    // Sort by available resources (RAM usage as primary metric)
    const sortedNodes = nodes.sort((a, b) => {
        const aUsagePercent = Number(a.ram_used) / Number(a.ram_total);
        const bUsagePercent = Number(b.ram_used) / Number(b.ram_total);
        return aUsagePercent - bUsagePercent;
    });

    return sortedNodes[0];
};

/**
 * Assign the next available IP from a pool
 */
export const assignIP = async (poolId?: number, locationId?: number): Promise<any> => {
    // Find an available IP
    const where: any = {
        is_assigned: false,
    };

    if (poolId) {
        where.ip_pool_id = poolId;
    } else if (locationId) {
        where.ip_pool = {
            location_id: locationId,
        };
    }

    const availableIP = await prisma.ipAddress.findFirst({
        where,
        include: {
            ip_pool: true,
        },
    });

    if (!availableIP) {
        throw new Error('No available IP addresses');
    }

    // Mark as assigned
    const assignedIP = await prisma.ipAddress.update({
        where: { id: availableIP.id },
        data: {
            is_assigned: true,
            assigned_at: new Date(),
        },
    });

    return assignedIP;
};

/**
 * Generate a secure random password
 */
const generatePassword = (): string => {
    return crypto.randomBytes(16).toString('base64').slice(0, 24);
};

/**
 * Deploy a new VPS server
 */
export const deployServer = async (config: DeploymentConfig): Promise<any> => {
    try {
        // Get plan details
        const plan = await prisma.plan.findUnique({
            where: { id: config.planId },
        });

        if (!plan || !plan.is_active) {
            throw new Error('Invalid or inactive plan');
        }

        // Select best node
        const node = await selectBestNode(config.locationId);

        // Assign IP address
        const ipAddress = await assignIP(undefined, node.location_id);

        // Create Proxmox client
        const proxmox = createProxmoxClient(node);

        // Get next available VMID
        const vmid = await proxmox.getNextVMID(node.name);

        // Generate hostname if not provided
        const hostname = config.hostname || `vm-${vmid}`;

        // Generate root password
        const rootPassword = generatePassword();

        // Create server record in database
        const server = await prisma.server.create({
            data: {
                user_id: config.userId,
                node_id: node.id,
                plan_id: plan.id,
                ip_address_id: ipAddress.id,
                name: hostname,
                proxmox_vmid: vmid,
                status: 'installing',
                cpu: plan.cpu_cores,
                ram: plan.ram_mb,
                disk: plan.disk_gb,
                os_template: config.osTemplate,
                root_password: rootPassword, // TODO: Encrypt this
            },
            include: {
                plan: true,
                node: true,
                ip_address: true,
                user: true,
            },
        });

        // Create VM on Proxmox (assuming template-based deployment)
        // Note: You'll need to adjust this based on your Proxmox setup
        try {
            // Example: Clone from a template VM (you need to have template VMs set up)
            // The template VM ID would be stored somewhere or determined by os_template string

            await proxmox.createVM(node.name, {
                vmid,
                name: hostname,
                cores: plan.cpu_cores,
                memory: plan.ram_mb,
                disk: `${plan.disk_gb}G`,
                clone: 100, // Example: Template VM ID (you'll need to implement template mapping)
                storage: 'local-lvm',
                network: `virtio,bridge=vmbr0,ip=${ipAddress.address}/24,gw=${ipAddress.ip_pool.gateway}`,
            });

            // Start the VM
            await proxmox.startVM(node.name, vmid);

            // Update server status
            await prisma.server.update({
                where: { id: server.id },
                data: { status: 'active' },
            });
        } catch (proxmoxError: any) {
            // Rollback: Delete server record and free IP
            await prisma.server.delete({ where: { id: server.id } });
            await prisma.ipAddress.update({
                where: { id: ipAddress.id },
                data: { is_assigned: false, assigned_at: null },
            });

            throw new Error(`Proxmox deployment failed: ${proxmoxError.message}`);
        }

        return server;
    } catch (error: any) {
        console.error('Deployment error:', error);
        throw error;
    }
};

/**
 * Delete a server (remove from Proxmox and database)
 */
export const deleteServer = async (serverId: number): Promise<void> => {
    const server = await prisma.server.findUnique({
        where: { id: serverId },
        include: { node: true, ip_address: true },
    });

    if (!server) {
        throw new Error('Server not found');
    }

    // Delete from Proxmox
    try {
        const proxmox = createProxmoxClient(server.node);
        await proxmox.deleteVM(server.node.name, server.proxmox_vmid);
    } catch (error) {
        console.error('Error deleting VM from Proxmox:', error);
        // Continue with database deletion even if Proxmox fails
    }

    // Free IP address
    if (server.ip_address) {
        await prisma.ipAddress.update({
            where: { id: server.ip_address.id },
            data: { is_assigned: false, assigned_at: null },
        });
    }

    // Delete server record
    await prisma.server.delete({
        where: { id: serverId },
    });
};
