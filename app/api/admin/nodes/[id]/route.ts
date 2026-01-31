import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'
import { z } from 'zod'

const updateNodeSchema = z.object({
    name: z.string().min(2).optional(),
    hostname: z.string().min(1).optional(),
    ipAddress: z.string().min(1).optional(),
    port: z.number().min(1).optional(),
    username: z.string().min(1).optional(),
    password: z.string().optional(),
    maxCpu: z.number().min(1).optional(),
    maxRam: z.number().min(1).optional(),
    maxStorage: z.number().min(1).optional(),
    locationId: z.string().optional(),
})

// PUT update node
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const data = updateNodeSchema.parse(body)

        const updateData: any = { ...data }

        // Encrypt password if provided
        if (data.password) {
            updateData.encryptedPassword = encrypt(data.password)
            delete updateData.password
        }

        const node = await prisma.node.update({
            where: { id: params.id },
            data: updateData,
        })

        return NextResponse.json(node)
    } catch (error: any) {
        console.error('Failed to update node:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update node' },
            { status: 400 }
        )
    }
}

// DELETE node
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        // Check if node has servers
        const serverCount = await prisma.server.count({
            where: { nodeId: params.id },
        })

        if (serverCount > 0) {
            return NextResponse.json(
                { error: `Cannot delete node with ${serverCount} active servers` },
                { status: 400 }
            )
        }

        await prisma.node.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete node:', error)
        return NextResponse.json(
            { error: 'Failed to delete node' },
            { status: 500 }
        )
    }
}
