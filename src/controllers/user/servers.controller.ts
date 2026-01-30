import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { createProxmoxClient } from '../../services/proxmox.service';

/**
 * List user's servers
 */
export const listServers = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user!.id;

        const servers = await prisma.server.findMany({
            where: { user_id: userId },
            include: {
                node: { select: { name: true, location: { select: { name: true } } } },
                plan: { select: { name: true } },
                ip_address: { select: { address: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        res.render('user/servers', {
            title: 'My Servers',
            servers,
        });
    } catch (error) {
        console.error('List servers error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load servers',
        });
    }
};

/**
 * View server details
 */
export const viewServer = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user!.id;
        const { id } = req.params;

        const server = await prisma.server.findFirst({
            where: { id: parseInt(id), user_id: userId },
            include: {
                node: {
                    include: {
                        location: true,
                    },
                },
                plan: true,
                ip_address: {
                    include: {
                        ip_pool: true,
                    },
                },
            },
        });

        if (!server) {
            return res.status(404).render('errors/404', {
                title: '404 - Not Found',
                message: 'Server not found',
            });
        }

        // Get live VM status from Proxmox
        let vmStatus = null;
        try {
            const proxmox = createProxmoxClient(server.node);
            vmStatus = await proxmox.getVMStatus(server.node.name, server.proxmox_vmid);
        } catch (error) {
            console.error('Failed to fetch VM status:', error);
        }

        res.render('user/server-detail', {
            title: `Server: ${server.name}`,
            server,
            vmStatus,
        });
    } catch (error) {
        console.error('View server error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load server',
        });
    }
};

/**
 * Control server power (start/stop/restart)
 */
export const controlPower = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user!.id;
        const { id } = req.params;
        const { action } = req.body;

        // Verify server ownership
        const server = await prisma.server.findFirst({
            where: { id: parseInt(id), user_id: userId },
            include: { node: true },
        });

        if (!server) {
            return res.status(404).json({ error: 'Server not found' });
        }

        if (server.status === 'suspended') {
            return res.status(403).json({ error: 'Server is suspended' });
        }

        const proxmox = createProxmoxClient(server.node);

        let result;
        switch (action) {
            case 'start':
                result = await proxmox.startVM(server.node.name, server.proxmox_vmid);
                break;
            case 'stop':
                result = await proxmox.stopVM(server.node.name, server.proxmox_vmid);
                break;
            case 'restart':
                result = await proxmox.restartVM(server.node.name, server.proxmox_vmid);
                break;
            default:
                return res.status(400).json({ error: 'Invalid action' });
        }

        res.json({ success: true, message: `Server ${action} command sent`, result });
    } catch (error: any) {
        console.error('Power control error:', error);
        res.status(500).json({ error: error.message || 'Failed to control server' });
    }
};
