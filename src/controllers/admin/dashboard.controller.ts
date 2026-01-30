import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { createProxmoxClient } from '../../services/proxmox.service';

/**
 * Admin Dashboard - Show overview statistics
 */
export const showDashboard = async (req: Request, res: Response) => {
    try {
        // Get total counts
        const [totalUsers, totalNodes, totalServers, totalIPs, assignedIPs] = await Promise.all([
            prisma.user.count(),
            prisma.node.count(),
            prisma.server.count(),
            prisma.ipAddress.count(),
            prisma.ipAddress.count({ where: { is_assigned: true } }),
        ]);

        // Get server counts by status
        const serversByStatus = await prisma.server.groupBy({
            by: ['status'],
            _count: true,
        });

        // Get resource usage aggregates
        const resourceStats = await prisma.server.aggregate({
            _sum: {
                ram: true,
                disk: true,
                cpu: true,
            },
        });

        // Get recent servers
        const recentServers = await prisma.server.findMany({
            take: 10,
            orderBy: { created_at: 'desc' },
            include: {
                user: { select: { name: true, email: true } },
                node: { select: { name: true } },
                plan: { select: { name: true } },
            },
        });

        // Calculate node health
        const nodes = await prisma.node.findMany({
            where: { is_active: true },
        });

        let healthyNodes = 0;
        for (const node of nodes) {
            const usagePercent = Number(node.ram_used) / Number(node.ram_total);
            if (usagePercent < 0.8) {
                healthyNodes++;
            }
        }

        res.render('admin/dashboard', {
            title: 'Admin Dashboard',
            stats: {
                totalUsers,
                totalNodes,
                totalServers,
                totalIPs,
                assignedIPs,
                availableIPs: totalIPs - assignedIPs,
                healthyNodes,
            },
            serversByStatus,
            resourceStats: {
                totalRAM: resourceStats._sum.ram || 0,
                totalDisk: resourceStats._sum.disk || 0,
                totalCPU: resourceStats._sum.cpu || 0,
            },
            recentServers,
        });
    } catch (error) {
        console.error('Dashboard error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load dashboard',
        });
    }
};
