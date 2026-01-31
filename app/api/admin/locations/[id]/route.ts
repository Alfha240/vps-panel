import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import { locationSchema } from '@/lib/validation'

// PUT update location
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const body = await request.json()
        const validated = locationSchema.parse(body)

        const location = await prisma.location.update({
            where: { id: params.id },
            data: validated,
        })

        return NextResponse.json(location)
    } catch (error: any) {
        console.error('Failed to update location:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to update location' },
            { status: 400 }
        )
    }
}

// DELETE location
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        await prisma.location.delete({
            where: { id: params.id },
        })

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to delete location:', error)
        return NextResponse.json(
            { error: 'Failed to delete location' },
            { status: 400 }
        )
    }
}
