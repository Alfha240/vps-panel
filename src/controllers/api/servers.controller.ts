import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { deployServer } from '../../services/deployment.service';
import { createProxmoxClient } from '../../services/proxmox.service';

/**
 * Deploy a new server via API
 */
export const apiDeployServer = async (req: Request, res: Response) => {
    try {
        const { plan_id, os_template, location_id, hostname, user_id } = req.body;

        if (!plan_id || !os_template) {
            return res.status(400).json({ error: 'Missing required fields: plan_id, os_template' });
        }

        // Use authenticated user's ID or provided user_id (for system tokens)
        const targetUserId = user_id || (req as any).apiToken.userId;

        if (!targetUserId) {
            return res.status(400).json({ error: 'user_id is required' });
        }

        // Deploy server
        const server = await deployServer({
            userId: targetUserId,
            planId: parseInt(plan_id),
            osTemplate: os_template,
            locationId: location_id ? parseInt(location_id) : undefined,
            hostname,
        });

        res.status(201).json({
            success: true,
            message: 'Server deployed successfully',
            server: {
                id: server.id,
                name: server.name,
                vmid: server.proxmox_vmid,
                status: server.status,
                ip_address: server.ip_address?.address,
                node: server.node.name,
                plan: server.plan.name,
                root_password: server.root_password, // Send once in response
            },
        });
    } catch (error: any) {
        console.error('API deploy server error:', error);
        res.status(500).json({ error: error.message || 'Failed to deploy server' });
    }
};

/**
 * List servers via API
 */
export const apiListServers = async (req: Request, res: Response) => {
    try {
        const userId = (req as any).apiToken.userId;

        const where: any = {};
        if (userId) {
            where.user_id = userId;
        }

        const servers = await prisma.server.findMany({
            where,
            include: {
                node: { select: { name: true } },
                plan: { select: { name: true } },
                ip_address: { select: { address: true } },
                user: { select: { name: true, email: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        res.json({
            success: true,
            count: servers.length,
            servers: servers.map((s) => ({
                id: s.id,
                name: s.name,
                vmid: s.proxmox_vmid,
                status: s.status,
                ip_address: s.ip_address?.address,
                node: s.node.name,
                plan: s.plan.name,
                user: s.user,
                created_at: s.created_at,
            })),
        });
    } catch (error: any) {
        console.error('API list servers error:', error);
        res.status(500).json({ error: error.message || 'Failed to list servers' });
    }
};

/**
 * Control server power via API
 */
export const apiControlPower = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { action } = req.body;

        if (!action || !['start', 'stop', 'restart'].includes(action)) {
            return res.status(400).json({ error: 'Invalid action. Must be: start, stop, or restart' });
        }

        const server = await prisma.server.findUnique({
            where: { id: parseInt(id) },
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
        }

        res.json({
            success: true,
            message: `Server ${action} command sent successfully`,
            server: {
                id: server.id,
                name: server.name,
                action,
            },
        });
    } catch (error: any) {
        console.error('API power control error:', error);
        res.status(500).json({ error: error.message || 'Failed to control server' });
    }
};

/**
 * Delete server via API
 */
export const apiDeleteServer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        const server = await prisma.server.findUnique({
            where: { id: parseInt(id) },
        });

        if (!server) {
            return res.status(404).json({ error: 'Server not found' });
        }

        // Use deployment service to delete
        const { deleteServer } = await import('../../services/deployment.service');
        await deleteServer(parseInt(id));

        res.json({
            success: true,
            message: 'Server deleted successfully',
            server: {
                id: server.id,
                name: server.name,
            },
        });
    } catch (error: any) {
        console.error('API delete server error:', error);
        res.status(500).json({ error: error.message || 'Failed to delete server' });
    }
};
