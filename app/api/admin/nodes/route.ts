import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const nodeSchema = z.object({
    name: z.string().min(2),
    hostname: z.string().min(1),
    ipAddress: z.string().min(1),
    proxmoxUrl: z.string().optional(),
    proxmoxTokenId: z.string().optional(),
    proxmoxTokenSecret: z.string().optional(),
    proxmoxNode: z.string().optional(),
    maxCpu: z.number().min(0),
    maxRam: z.number().min(0),
    maxStorage: z.number().min(0),
    locationId: z.string(),
})

// GET all nodes
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const nodes = await prisma.node.findMany({
            include: {
                location: {
                    select: { id: true, name: true, city: true },
                },
            },
            orderBy: { createdAt: 'desc' },
        })

        return NextResponse.json(nodes)
    } catch (error) {
        console.error('Failed to fetch nodes:', error)
        return NextResponse.json(
            { error: 'Failed to fetch nodes' },
            { status: 500 }
        )
    }
}

// POST create new node
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const data = nodeSchema.parse(body)

        // Create node
        const node = await prisma.node.create({
            data: {
                name: data.name,
                hostname: data.hostname,
                ipAddress: data.ipAddress,
                port: 22,
                username: 'root',
                encryptedPassword: '', // Use encryptedPassword field from schema
                apiEndpoint: data.proxmoxUrl || null,
                maxCpu: data.maxCpu,
                maxRam: data.maxRam * 1024, // Convert GB to MB
                maxStorage: data.maxStorage,
                locationId: data.locationId,
            },
        })

        return NextResponse.json(node, { status: 201 })
    } catch (error: any) {
        console.error('Failed to create node:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create node' },
            { status: 400 }
        )
    }
}
