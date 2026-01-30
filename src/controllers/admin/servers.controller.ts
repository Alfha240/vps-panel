import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { deleteServer as deleteServerService } from '../../services/deployment.service';

/**
 * List all servers with filters
 */
export const listServers = async (req: Request, res: Response) => {
    try {
        const { status, node_id, user_id, search } = req.query;

        const where: any = {};

        if (status) {
            where.status = status;
        }

        if (node_id) {
            where.node_id = parseInt(node_id as string);
        }

        if (user_id) {
            where.user_id = parseInt(user_id as string);
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string } },
                { user: { email: { contains: search as string } } },
            ];
        }

        const servers = await prisma.server.findMany({
            where,
            include: {
                user: { select: { id: true, name: true, email: true } },
                node: { select: { id: true, name: true } },
                plan: { select: { name: true } },
                ip_address: { select: { address: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        // Get filter options
        const [nodes, users] = await Promise.all([
            prisma.node.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } }),
            prisma.user.findMany({ select: { id: true, name: true, email: true }, orderBy: { name: 'asc' } }),
        ]);

        res.render('admin/servers', {
            title: 'Manage Servers',
            servers,
            nodes,
            users,
            filters: { status, node_id, user_id, search },
            error: null,
            success: null,
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
 * Suspend a server
 */
export const suspendServer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.server.update({
            where: { id: parseInt(id) },
            data: { status: 'suspended' },
        });

        res.redirect('/admin/servers?success=suspended');
    } catch (error) {
        console.error('Suspend server error:', error);
        res.redirect('/admin/servers?error=failed');
    }
};

/**
 * Unsuspend a server
 */
export const unsuspendServer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.server.update({
            where: { id: parseInt(id) },
            data: { status: 'active' },
        });

        res.redirect('/admin/servers?success=unsuspended');
    } catch (error) {
        console.error('Unsuspend server error:', error);
        res.redirect('/admin/servers?error=failed');
    }
};

/**
 * Delete a server
 */
export const deleteServer = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await deleteServerService(parseInt(id));

        res.redirect('/admin/servers?success=deleted');
    } catch (error) {
        console.error('Delete server error:', error);
        res.redirect('/admin/servers?error=failed');
    }
};
