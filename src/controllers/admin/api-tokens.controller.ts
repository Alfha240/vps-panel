import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import config from '../../config';

/**
 * List all API tokens
 */
export const listAPITokens = async (req: Request, res: Response) => {
    try {
        const tokens = await prisma.apiToken.findMany({
            include: {
                user: { select: { id: true, name: true, email: true } },
            },
            orderBy: { created_at: 'desc' },
        });

        const tokensWithParsedPermissions = tokens.map((token) => ({
            ...token,
            parsedPermissions: JSON.parse(token.permissions),
        }));

        res.render('admin/api-tokens', {
            title: 'API Tokens',
            tokens: tokensWithParsedPermissions,
            error: null,
            success: null,
            newToken: null,
        });
    } catch (error) {
        console.error('List API tokens error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load API tokens',
        });
    }
};

/**
 * Generate new API token
 */
export const generateAPIToken = async (req: Request, res: Response) => {
    try {
        const { name, permissions, expires_in_days, user_id } = req.body;

        if (!name || !permissions) {
            return res.redirect('/admin/api-tokens?error=missing_fields');
        }

        // Parse permissions (checkboxes)
        const selectedPermissions = Array.isArray(permissions) ? permissions : [permissions];

        // Calculate expiration
        let expiresAt = null;
        if (expires_in_days) {
            const days = parseInt(expires_in_days);
            if (days > 0) {
                expiresAt = new Date();
                expiresAt.setDate(expiresAt.getDate() + days);
            }
        }

        // Create token record first
        const apiToken = await prisma.apiToken.create({
            data: {
                name,
                token: 'temporary', // Will be replaced
                permissions: JSON.stringify(selectedPermissions),
                expires_at: expiresAt,
                user_id: user_id ? parseInt(user_id) : null,
                is_active: true,
            },
        });

        // Generate JWT with token ID
        const jwtToken = jwt.sign({ tokenId: apiToken.id }, config.jwt.secret, {
            expiresIn: expires_in_days ? `${expires_in_days}d` : undefined,
        });

        // Update with actual JWT
        await prisma.apiToken.update({
            where: { id: apiToken.id },
            data: { token: jwtToken },
        });

        // Redirect with success and show the token (only shown once)
        res.render('admin/api-tokens', {
            title: 'API Tokens',
            tokens: [],
            error: null,
            success: 'Token generated successfully. Copy it now - it won\'t be shown again!',
            newToken: jwtToken,
        });
    } catch (error) {
        console.error('Generate API token error:', error);
        res.redirect('/admin/api-tokens?error=failed');
    }
};

/**
 * Revoke API token
 */
export const revokeAPIToken = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.apiToken.update({
            where: { id: parseInt(id) },
            data: { is_active: false },
        });

        res.redirect('/admin/api-tokens?success=revoked');
    } catch (error) {
        console.error('Revoke API token error:', error);
        res.redirect('/admin/api-tokens?error=failed');
    }
};

/**
 * Delete API token
 */
export const deleteAPIToken = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        await prisma.apiToken.delete({
            where: { id: parseInt(id) },
        });

        res.redirect('/admin/api-tokens?success=deleted');
    } catch (error) {
        console.error('Delete API token error:', error);
        res.redirect('/admin/api-tokens?error=failed');
    }
};
