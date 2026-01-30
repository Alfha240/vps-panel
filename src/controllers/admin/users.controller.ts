import { Request, Response } from 'express';
import prisma from '../../lib/prisma';

/**
 * List all users
 */
export const listUsers = async (req: Request, res: Response) => {
    try {
        const users = await prisma.user.findMany({
            include: {
                _count: { select: { servers: true, api_tokens: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        res.render('admin/users', {
            title: 'Manage Users',
            users,
            error: null,
            success: null,
        });
    } catch (error) {
        console.error('List users error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load users',
        });
    }
};

/**
 * Toggle admin status
 */
export const toggleAdmin = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id);

        // Don't allow toggling own admin status
        if (req.session.user?.id === userId) {
            return res.redirect('/admin/users?error=cannot_modify_self');
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
        });

        if (!user) {
            return res.redirect('/admin/users?error=user_not_found');
        }

        // Toggle admin status
        await prisma.user.update({
            where: { id: userId },
            data: { is_admin: !user.is_admin },
        });

        res.redirect('/admin/users?success=updated');
    } catch (error) {
        console.error('Toggle admin error:', error);
        res.redirect('/admin/users?error=failed');
    }
};

/**
 * Delete a user
 */
export const deleteUser = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        const userId = parseInt(id as string);

        // Don't allow deleting own account
        if (req.session.user?.id === userId) {
            return res.redirect('/admin/users?error=cannot_delete_self');
        }

        // Check if user has active servers
        const serverCount = await prisma.server.count({
            where: { user_id: userId },
        });

        if (serverCount > 0) {
            return res.redirect('/admin/users?error=has_servers');
        }

        // Delete user (cascade will delete API tokens)
        await prisma.user.delete({
            where: { id: userId },
        });

        res.redirect('/admin/users?success=deleted');
    } catch (error) {
        console.error('Delete user error:', error);
        res.redirect('/admin/users?error=failed');
    }
};
