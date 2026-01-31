import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const groupSchema = z.object({
    name: z.string(),
    icon: z.string().optional(),
})

// POST - Create new template group
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const data = groupSchema.parse(body)

        const group = await prisma.templateGroup.create({
            data: {
                name: data.name,
                icon: data.icon,
            },
        })

        return NextResponse.json(group)
    } catch (error: any) {
        console.error('Failed to create group:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create group' },
            { status: 400 }
        )
    }
}
