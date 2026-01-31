import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: { balance: true },
        })

        return NextResponse.json({ balance: user?.balance || 0 })
    } catch (error) {
        console.error('Failed to fetch balance:', error)
        return NextResponse.json(
            { error: 'Failed to fetch balance' },
            { status: 500 }
        )
    }
}
