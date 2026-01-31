import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { locationSchema } from '@/lib/validation'

// GET all locations
export async function GET() {
    try {
        const locations = await prisma.location.findMany({
            include: {
                _count: {
                    select: { nodes: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(locations)
    } catch (error) {
        console.error('Failed to fetch locations:', error)
        return NextResponse.json(
            { error: 'Failed to fetch locations' },
            { status: 500 }
        )
    }
}

// POST create new location
export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const validated = locationSchema.parse(body)

        const location = await prisma.location.create({
            data: validated,
        })

        return NextResponse.json(location, { status: 201 })
    } catch (error: any) {
        console.error('Failed to create location:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create location' },
            { status: 400 }
        )
    }
}
