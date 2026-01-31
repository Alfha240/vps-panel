import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

// POST toggle plan active status
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const { isActive } = await request.json()

        const plan = await prisma.plan.update({
            where: { id: params.id },
            data: { isActive },
        })

        return NextResponse.json(plan)
    } catch (error) {
        console.error('Failed to toggle plan status:', error)
        return NextResponse.json(
            { error: 'Failed to toggle plan status' },
            { status: 400 }
        )
    }
}
