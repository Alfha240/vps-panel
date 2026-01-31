import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { planSchema } from '@/lib/validation'

// GET all plans
export async function GET() {
    try {
        const plans = await prisma.plan.findMany({
            include: {
                _count: {
                    select: { servers: true },
                },
            },
            orderBy: { price: 'asc' },
        })

        return NextResponse.json(plans)
    } catch (error) {
        console.error('Failed to fetch plans:', error)
        return NextResponse.json(
            { error: 'Failed to fetch plans' },
            { status: 500 }
        )
    }
}

// POST create new plan
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validated = planSchema.parse(body)

        const plan = await prisma.plan.create({
            data: validated,
        })

        return NextResponse.json(plan, { status: 201 })
    } catch (error: any) {
        console.error('Failed to create plan:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create plan' },
            { status: 400 }
        )
    }
}
