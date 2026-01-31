import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { startVPS, stopVPS, restartVPS } from '@/lib/virtualization'
import { powerActionSchema } from '@/lib/validation'

// POST power action (start, stop, restart)
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        // Verify server ownership
        const server = await prisma.server.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
        })

        if (!server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 })
        }

        if (server.isSuspended) {
            return NextResponse.json(
                { error: 'Server is suspended' },
                { status: 403 }
            )
        }

        const body = await request.json()
        const { action } = powerActionSchema.parse(body)

        let success = false

        switch (action) {
            case 'start':
                success = await startVPS(server.id)
                break
            case 'stop':
                success = await stopVPS(server.id)
                break
            case 'restart':
                success = await restartVPS(server.id)
                break
        }

        return NextResponse.json({ success })
    } catch (error: any) {
        console.error('Failed to perform power action:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to perform action' },
            { status: 400 }
        )
    }
}
