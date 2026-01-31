import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const templateSchema = z.object({
    groupId: z.string(),
    name: z.string(),
    version: z.string(),
    proxmoxTemplateId: z.number(),
    description: z.string().optional(),
})

// GET - Fetch all template groups with templates
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const groups = await prisma.templateGroup.findMany({
            include: {
                templates: {
                    orderBy: { order: 'asc' },
                },
            },
            orderBy: { order: 'asc' },
        })

        return NextResponse.json(groups)
    } catch (error) {
        console.error('Failed to fetch templates:', error)
        return NextResponse.json(
            { error: 'Failed to fetch templates' },
            { status: 500 }
        )
    }
}

// POST - Create new template
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const data = templateSchema.parse(body)

        const template = await prisma.oSTemplate.create({
            data: {
                groupId: data.groupId,
                name: data.name,
                version: data.version,
                proxmoxTemplateId: data.proxmoxTemplateId,
                description: data.description,
            },
        })

        return NextResponse.json(template)
    } catch (error: any) {
        console.error('Failed to create template:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create template' },
            { status: 400 }
        )
    }
}
