import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

// GET - Fetch all IP pools with addresses
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const ipPools = await prisma.ipPool.findMany({
            include: {
                location: { select: { name: true, id: true } },
                ipAddresses: {
                    include: {
                        server: { select: { name: true, hostname: true } },
                    },
                    orderBy: { address: 'asc' },
                },
            },
            orderBy: { cidr: 'asc' },
        })

        return NextResponse.json(ipPools)
    } catch (error) {
        console.error('Failed to fetch IP pools:', error)
        return NextResponse.json(
            { error: 'Failed to fetch IP pools' },
            { status: 500 }
        )
    }
}
