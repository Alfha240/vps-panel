import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import bcrypt from 'bcrypt';
import config from '../../config';

/**
 * Show user profile
 */
export const showProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user!.id;

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                created_at: true,
            },
        });

        res.render('user/profile', {
            title: 'My Profile',
            user,
            error: null,
            success: null,
        });
    } catch (error) {
        console.error('Show profile error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load profile',
        });
    }
};

/**
 * Update profile
 */
export const updateProfile = async (req: Request, res: Response) => {
    try {
        const userId = req.session.user!.id;
        const { name, email, current_password, new_password, confirm_password } = req.body;

        // Update basic info
        if (name || email) {
            const updateData: any = {};

            if (name) updateData.name = name;
            if (email) updateData.email = email.toLowerCase();

            const updatedUser = await prisma.user.update({
                where: { id: userId },
                data: updateData,
            });

            // Update session
            req.session.user = {
                ...req.session.user!,
                name: updatedUser.name,
                email: updatedUser.email,
            };
        }

        // Update password if provided
        if (current_password && new_password) {
            if (new_password !== confirm_password) {
                return res.redirect('/user/profile?error=passwords_dont_match');
            }

            if (new_password.length < 8) {
                return res.redirect('/user/profile?error=password_too_short');
            }

            // Verify current password
            const user = await prisma.user.findUnique({ where: { id: userId } });
            const passwordMatch = await bcrypt.compare(current_password, user!.password);

            if (!passwordMatch) {
                return res.redirect('/user/profile?error=incorrect_current_password');
            }

            // Hash and update new password
            const hashedPassword = await bcrypt.hash(new_password, config.bcrypt.rounds);
            await prisma.user.update({
                where: { id: userId },
                data: { password: hashedPassword },
            });
        }

        res.redirect('/user/profile?success=updated');
    } catch (error) {
        console.error('Update profile error:', error);
        res.redirect('/user/profile?error=failed');
    }
};
