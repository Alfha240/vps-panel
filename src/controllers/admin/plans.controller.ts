import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

/**
 * List all plans
 */
export const listPlans = async (req: Request, res: Response) => {
    try {
        const plans = await prisma.plan.findMany({
            include: {
                _count: { select: { servers: true } },
            },
            orderBy: { name: 'asc' },
        });

        res.render('admin/plans', {
            title: 'Manage Plans',
            plans,
            error: null,
            success: null,
        });
    } catch (error) {
        console.error('List plans error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load plans',
        });
    }
};

/**
 * Create a new plan
 */
export const createPlan = async (req: Request, res: Response) => {
    try {
        const { name, description, cpu_cores, ram_mb, disk_gb, bandwidth_gb, price_per_hour } =
            req.body;

        if (!name || !cpu_cores || !ram_mb || !disk_gb) {
            return res.redirect('/admin/plans?error=missing_fields');
        }

        await prisma.plan.create({
            data: {
                name,
                description,
                cpu_cores: parseInt(cpu_cores),
                ram_mb: parseInt(ram_mb),
                disk_gb: parseInt(disk_gb),
                bandwidth_gb: parseInt(bandwidth_gb) || 1000,
                price_per_hour: parseFloat(price_per_hour) || 0,
                is_active: true,
            },
        });

        res.redirect('/admin/plans?success=created');
    } catch (error) {
        console.error('Create plan error:', error);
        res.redirect('/admin/plans?error=failed');
    }
};

/**
 * Update a plan
 */
export const updatePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, cpu_cores, ram_mb, disk_gb, bandwidth_gb, price_per_hour, is_active } =
            req.body;

        await prisma.plan.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                cpu_cores: parseInt(cpu_cores),
                ram_mb: parseInt(ram_mb),
                disk_gb: parseInt(disk_gb),
                bandwidth_gb: parseInt(bandwidth_gb),
                price_per_hour: parseFloat(price_per_hour),
                is_active: is_active === 'true',
            },
        });

        res.redirect('/admin/plans?success=updated');
    } catch (error) {
        console.error('Update plan error:', error);
        res.redirect('/admin/plans?error=failed');
    }
};

/**
 * Delete a plan
 */
export const deletePlan = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if plan has active servers
        const serverCount = await prisma.server.count({
            where: { plan_id: parseInt(id) },
        });

        if (serverCount > 0) {
            return res.redirect('/admin/plans?error=has_servers');
        }

        await prisma.plan.delete({
            where: { id: parseInt(id) },
        });

        res.redirect('/admin/plans?success=deleted');
    } catch (error) {
        console.error('Delete plan error:', error);
        res.redirect('/admin/plans?error=failed');
    }
};
