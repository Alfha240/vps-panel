import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import config from '../config';
import prisma from '../lib/prisma';

// Extend Express Session type
declare module 'express-session' {
    interface SessionData {
        user?: {
            id: number;
            email: string;
            name: string;
            is_admin: boolean;
        };
    }
}

// Middleware to require authentication
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }
    next();
};

// Middleware to require admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.user) {
        return res.redirect('/auth/login');
    }

    if (!req.session.user.is_admin) {
        return res.status(403).render('errors/403', {
            title: '403 - Forbidden',
            message: 'You do not have permission to access this area.',
        });
    }

    next();
};

// Middleware to require API token for external API access
export const requireApiToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: 'Missing or invalid authorization header' });
        }

        const token = authHeader.substring(7);

        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret) as { tokenId: number };

        // Check if token exists and is active
        const apiToken = await prisma.apiToken.findUnique({
            where: { id: decoded.tokenId },
            include: { user: true },
        });

        if (!apiToken || !apiToken.is_active) {
            return res.status(401).json({ error: 'Invalid or inactive token' });
        }

        // Check if token has expired
        if (apiToken.expires_at && new Date() > apiToken.expires_at) {
            return res.status(401).json({ error: 'Token has expired' });
        }

        // Update last used timestamp
        await prisma.apiToken.update({
            where: { id: apiToken.id },
            data: { last_used_at: new Date() },
        });

        // Attach token info to request
        (req as any).apiToken = {
            id: apiToken.id,
            userId: apiToken.user_id,
            permissions: JSON.parse(apiToken.permissions),
            user: apiToken.user,
        };

        next();
        return;
    } catch (error) {
        console.error('API token verification error:', error);
        return res.status(401).json({ error: 'Invalid token' });
    }
};

// Middleware to check specific API permissions
export const checkPermissions = (requiredPermissions: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        const apiToken = (req as any).apiToken;

        if (!apiToken) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const hasPermission = requiredPermissions.every((permission) =>
            apiToken.permissions.includes(permission)
        );

        if (!hasPermission) {
            return res.status(403).json({
                error: 'Insufficient permissions',
                required: requiredPermissions,
                current: apiToken.permissions,
            });
        }

        next();
        return;
    };
};
