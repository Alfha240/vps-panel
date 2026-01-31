import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET user's specific server
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const server = await prisma.server.findFirst({
            where: {
                id: params.id,
                userId: session.user.id,
            },
            include: {
                node: {
                    select: {
                        name: true,
                        location: {
                            select: { name: true, city: true, country: true },
                        },
                    },
                },
                ipAddresses: { select: { address: true } },
                plan: { select: { name: true, cpu: true, ram: true, storage: true } },
            },
        })

        if (!server) {
            return NextResponse.json({ error: 'Server not found' }, { status: 404 })
        }

        return NextResponse.json(server)
    } catch (error) {
        console.error('Failed to fetch server:', error)
        return NextResponse.json(
            { error: 'Failed to fetch server' },
            { status: 500 }
        )
    }
}
