import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { planSchema } from '@/lib/validation'

// PUT update plan
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const validated = planSchema.parse(body)

        const plan = await prisma.plan.update({
            where: { id: params.id },
            data: validated,
        })

        return NextResponse.json(plan)
    } catch (error: any) {
        console.error('Failed to update plan:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update plan' },
            { status: 400 }
        )
    }
}

// DELETE plan
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.plan.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete plan:', error)
        return NextResponse.json(
            { error: 'Failed to delete plan' },
            { status: 400 }
        )
    }
}
