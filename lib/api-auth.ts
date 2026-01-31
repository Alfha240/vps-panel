import { NextRequest, NextResponse } from 'next/server'
import prisma from './prisma'

/**
 * Validates API token and returns permissions
 */
export async function validateApiToken(request: NextRequest): Promise<{
    valid: boolean
    permissions?: string[]
    tokenId?: string
}> {
    const authHeader = request.headers.get('authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return { valid: false }
    }

    const token = authHeader.substring(7)

    try {
        const apiToken = await prisma.apiToken.findUnique({
            where: { token, isActive: true },
        })

        if (!apiToken) {
            return { valid: false }
        }

        // Check expiration
        if (apiToken.expiresAt && apiToken.expiresAt < new Date()) {
            return { valid: false }
        }

        // Update last used timestamp
        await prisma.apiToken.update({
            where: { id: apiToken.id },
            data: { lastUsedAt: new Date() },
        })

        return {
            valid: true,
            permissions: apiToken.permissions,
            tokenId: apiToken.id,
        }
    } catch (error) {
        console.error('Token validation error:', error)
        return { valid: false }
    }
}

/**
 * Checks if token has required permission
 */
export function hasPermission(
    tokenPermissions: string[],
    requiredPermission: string
): boolean {
    return (
        tokenPermissions.includes('admin') ||
        tokenPermissions.includes(requiredPermission)
    )
}

/**
 * API authentication middleware
 */
export async function withApiAuth(
    request: NextRequest,
    requiredPermission?: string
): Promise<NextResponse | null> {
    const { valid, permissions } = await validateApiToken(request)

    if (!valid) {
        return NextResponse.json(
            { error: 'Invalid or expired API token' },
            { status: 401 }
        )
    }

    if (requiredPermission && !hasPermission(permissions!, requiredPermission)) {
        return NextResponse.json(
            { error: 'Insufficient permissions' },
            { status: 403 }
        )
    }

    return null
}
