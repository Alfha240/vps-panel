import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

/**
 * User Dashboard
 */
export const showDashboard = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user!.id;

        // Get user's servers
        const servers = await prisma.server.findMany({
            where: { user_id: userId },
            include: {
                node: { select: { name: true, location: { select: { name: true } } } },
                plan: { select: { name: true } },
                ip_address: { select: { address: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        // Count by status
        const activeServers = servers.filter((s) => s.status === 'active').length;
        const suspendedServers = servers.filter((s) => s.status === 'suspended').length;

        // Calculate total resources
        const totalResources = servers.reduce(
            (acc, server) => ({
                cpu: acc.cpu + server.cpu,
                ram: acc.ram + server.ram,
                disk: acc.disk + server.disk,
            }),
            { cpu: 0, ram: 0, disk: 0 }
        );

        res.render('user/dashboard', {
            title: 'Dashboard',
            servers,
            stats: {
                totalServers: servers.length,
                activeServers,
                suspendedServers,
            },
            totalResources,
        });
    } catch (error) {
        console.error('User dashboard error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load dashboard',
        });
    }
};
