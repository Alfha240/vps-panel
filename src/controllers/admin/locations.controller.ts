import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

/**
 * List all locations
 */
export const listLocations = async (req: Request, res: Response) => {
    try {
        const locations = await prisma.location.findMany({
            include: {
                _count: {
                    select: { nodes: true, ip_pools: true },
                },
            },
            orderBy: { name: 'asc' },
        });

        res.render('admin/locations', {
            title: 'Manage Locations',
            locations,
            error: null,
            success: null,
        });
    } catch (error) {
        console.error('List locations error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load locations',
        });
    }
};

/**
 * Create a new location
 */
export const createLocation = async (req: Request, res: Response) => {
    try {
        const { name, description, country, city } = req.body;

        if (!name) {
            const locations = await prisma.location.findMany({
                include: { _count: { select: { nodes: true, ip_pools: true } } },
            });
            return res.render('admin/locations', {
                title: 'Manage Locations',
                locations,
                error: 'Location name is required',
                success: null,
            });
        }

        await prisma.location.create({
            data: { name, description, country, city },
        });

        res.redirect('/admin/locations?success=created');
    } catch (error) {
        console.error('Create location error:', error);
        res.redirect('/admin/locations?error=failed');
    }
};

/**
 * Update a location
 */
export const updateLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const { name, description, country, city } = req.body;

        await prisma.location.update({
            where: { id: parseInt(id as string) },
            data: { name, description, country, city },
        });

        res.redirect('/admin/locations?success=updated');
    } catch (error) {
        console.error('Update location error:', error);
        res.redirect('/admin/locations?error=failed');
    }
};

/**
 * Delete a location
 */
export const deleteLocation = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if location has nodes
        const nodeCount = await prisma.node.count({
            where: { location_id: parseInt(id as string) },
        });

        if (nodeCount > 0) {
            return res.redirect('/admin/locations?error=has_nodes');
        }

        await prisma.location.delete({
            where: { id: parseInt(id as string) },
        });

        res.redirect('/admin/locations?success=deleted');
    } catch (error) {
        console.error('Delete location error:', error);
        res.redirect('/admin/locations?error=failed');
    }
};
