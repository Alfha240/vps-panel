import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { createProxmoxClient } from '../../services/proxmox.service';

/**
 * List all nodes with live stats
 */
export const listNodes = async (req: Request, res: Response) => {
    try {
        const nodes = await prisma.node.findMany({
            include: {
                location: true,
                _count: { select: { servers: true } },
            },
            orderBy: { name: 'asc' },
        });

        // Fetch live stats from Proxmox for each node
        const nodesWithStats = await Promise.all(
            nodes.map(async (node) => {
                let liveStats = null;

                if (node.is_active && !node.maintenance_mode) {
                    try {
                        const proxmox = createProxmoxClient(node);
                        const status = await proxmox.getNodeStatus(node.name);

                        liveStats = {
                            cpuUsage: ((status.cpu / status.maxcpu) * 100).toFixed(1),
                            ramUsage: ((status.mem / status.maxmem) * 100).toFixed(1),
                            diskUsage: ((status.disk / status.maxdisk) * 100).toFixed(1),
                            uptime: status.uptime,
                        };

                        // Update database with latest stats
                        await prisma.node.update({
                            where: { id: node.id },
                            data: {
                                cpu_used: Math.round((status.cpu / status.maxcpu) * 100),
                                cpu_total: 100,
                                ram_used: BigInt(Math.round(status.mem / 1024 / 1024)),
                                ram_total: BigInt(Math.round(status.maxmem / 1024 / 1024)),
                                disk_used: BigInt(Math.round(status.disk / 1024 / 1024 / 1024)),
                                disk_total: BigInt(Math.round(status.maxdisk / 1024 / 1024 / 1024)),
                            },
                        });
                    } catch (error) {
                        console.error(`Failed to fetch stats for node ${node.name}:`, error);
                        liveStats = { error: 'Connection failed' };
                    }
                }

                return { ...node, liveStats };
            })
        );

        const locations = await prisma.location.findMany({
            orderBy: { name: 'asc' },
        });

        res.render('admin/nodes', {
            title: 'Manage Nodes',
            nodes: nodesWithStats,
            locations,
            error: null,
            success: null,
        });
    } catch (error) {
        console.error('List nodes error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load nodes',
        });
    }
};

/**
 * Create a new node
 */
export const createNode = async (req: Request, res: Response) => {
    try {
        const {
            name,
            location_id,
            proxmox_host,
            proxmox_port,
            proxmox_user,
            proxmox_password,
            proxmox_realm,
        } = req.body;

        if (!name || !location_id || !proxmox_host || !proxmox_user || !proxmox_password) {
            return res.redirect('/admin/nodes?error=missing_fields');
        }

        // Test Proxmox connection before saving
        try {
            const proxmox = createProxmoxClient({
                proxmox_host,
                proxmox_port: parseInt(proxmox_port) || 8006,
                proxmox_user,
                proxmox_password,
                proxmox_realm: proxmox_realm || 'pam',
            });

            await proxmox.authenticate();
            const status = await proxmox.getNodeStatus(name);

            // Create node with initial stats
            await prisma.node.create({
                data: {
                    name,
                    location_id: parseInt(location_id),
                    proxmox_host,
                    proxmox_port: parseInt(proxmox_port) || 8006,
                    proxmox_user,
                    proxmox_password, // TODO: Encrypt this
                    proxmox_realm: proxmox_realm || 'pam',
                    cpu_used: Math.round((status.cpu / status.maxcpu) * 100),
                    cpu_total: 100,
                    ram_used: BigInt(Math.round(status.mem / 1024 / 1024)),
                    ram_total: BigInt(Math.round(status.maxmem / 1024 / 1024)),
                    disk_used: BigInt(Math.round(status.disk / 1024 / 1024 / 1024)),
                    disk_total: BigInt(Math.round(status.maxdisk / 1024 / 1024 / 1024)),
                    is_active: true,
                },
            });

            res.redirect('/admin/nodes?success=created');
        } catch (proxmoxError) {
            console.error('Proxmox connection test failed:', proxmoxError);
            return res.redirect('/admin/nodes?error=connection_failed');
        }
    } catch (error) {
        console.error('Create node error:', error);
        res.redirect('/admin/nodes?error=failed');
    }
};

/**
 * Update a node
 */
export const updateNode = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const {
            name,
            location_id,
            proxmox_host,
            proxmox_port,
            proxmox_user,
            proxmox_password,
            proxmox_realm,
            is_active,
            maintenance_mode,
        } = req.body;

        const updateData: any = {
            name,
            location_id: parseInt(location_id),
            proxmox_host,
            proxmox_port: parseInt(proxmox_port) || 8006,
            proxmox_user,
            proxmox_realm: proxmox_realm || 'pam',
            is_active: is_active === 'true',
            maintenance_mode: maintenance_mode === 'true',
        };

        // Only update password if provided
        if (proxmox_password) {
            updateData.proxmox_password = proxmox_password;
        }

        await prisma.node.update({
            where: { id: parseInt(id as string) },
            data: updateData,
        });

        res.redirect('/admin/nodes?success=updated');
    } catch (error) {
        console.error('Update node error:', error);
        res.redirect('/admin/nodes?error=failed');
    }
};

/**
 * Delete a node
 */
export const deleteNode = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if node has servers
        const serverCount = await prisma.server.count({
            where: { node_id: parseInt(id as string) },
        });

        if (serverCount > 0) {
            return res.redirect('/admin/nodes?error=has_servers');
        }

        await prisma.node.delete({
            where: { id: parseInt(id as string) },
        });

        res.redirect('/admin/nodes?success=deleted');
    } catch (error) {
        console.error('Delete node error:', error);
        res.redirect('/admin/nodes?error=failed');
    }
};
