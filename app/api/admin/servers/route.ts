import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { getProxmoxClientForNode } from '@/lib/proxmox/helpers'
import { z } from 'zod'

const createServerSchema = z.object({
    name: z.string().min(1),
    hostname: z.string().min(1),
    planId: z.string(),
    nodeId: z.string(),
    templateId: z.string().optional(),
    userId: z.string(),
    ipAddress: z.string().optional(),
    gateway: z.string().optional(),
})

// GET - List all servers (for dropdowns)
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const servers = await prisma.server.findMany({
            select: {
                id: true,
                name: true,
                hostname: true,
                vmId: true,
            },
            orderBy: { createdAt: 'desc' }
        })

        return NextResponse.json(servers)
    } catch (error) {
        console.error('Failed to fetch servers:', error)
        return NextResponse.json(
            { error: 'Failed to fetch servers' },
            { status: 500 }
        )
    }
}

// POST - Create new server with Proxmox integration
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const data = createServerSchema.parse(body)

        // Get plan details
        const plan = await prisma.plan.findUnique({
            where: { id: data.planId }
        })

        if (!plan) {
            return NextResponse.json({ error: 'Plan not found' }, { status: 404 })
        }

        // Get node details
        const node = await prisma.node.findUnique({
            where: { id: data.nodeId }
        })

        if (!node) {
            return NextResponse.json({ error: 'Node not found' }, { status: 404 })
        }

        // Get template if specified
        let template = null
        if (data.templateId) {
            template = await prisma.oSTemplate.findUnique({
                where: { id: data.templateId },
                include: { group: true }
            })
        }

        let vmid: number | null = null
        let osType = 'linux'
        let osVersion = 'unknown'

        // Only create VM on Proxmox if we have token configured
        if (process.env.PROXMOX_TOKEN_ID && process.env.PROXMOX_TOKEN_SECRET) {
            try {
                // Initialize Proxmox client
                const proxmox = await getProxmoxClientForNode(data.nodeId)

                // Get next available VMID
                vmid = await proxmox.getNextVMID(node.hostname)

                if (template) {
                    // Clone from template
                    console.log(`Cloning template ${template.proxmoxTemplateId} to VMID ${vmid}`)

                    await proxmox.cloneVM(
                        node.hostname,
                        template.proxmoxTemplateId,
                        vmid,
                        {
                            name: data.hostname,
                            storage: 'local-lvm',
                            full: true, // Full clone for production
                        }
                    )

                    osType = template.group.name.toLowerCase()
                    osVersion = template.version

                    // Wait for clone to complete (2 seconds)
                    await new Promise(resolve => setTimeout(resolve, 2000))

                    // Configure VM resources
                    await proxmox.updateVMConfig(node.hostname, vmid, {
                        cores: plan.cpu,
                        memory: plan.ram,
                    })

                    // Configure cloud-init if IP provided
                    if (data.ipAddress && data.gateway) {
                        const ipconfig = `ip=${data.ipAddress}/24,gw=${data.gateway}`
                        await proxmox.configureCloudInit(node.hostname, vmid, {
                            ipconfig0: ipconfig,
                            nameserver: '8.8.8.8 1.1.1.1',
                        })
                    }

                    // Start VM
                    console.log(`Starting VM ${vmid}`)
                    await proxmox.startVM(node.hostname, vmid)
                } else {
                    // No template specified - create empty VM
                    console.log('No template specified, creating database entry only')
                }
            } catch (proxmoxError: any) {
                console.error('Proxmox API error:', proxmoxError)
                return NextResponse.json(
                    { error: `Proxmox error: ${proxmoxError.message}` },
                    { status: 500 }
                )
            }
        } else {
            console.warn('Proxmox credentials not configured - creating database entry only')
        }

        // Create database entry
        const server = await prisma.server.create({
            data: {
                name: data.name,
                hostname: data.hostname,
                vmId: vmid ? vmid.toString() : null,
                status: vmid ? 'running' : 'pending',
                osType: osType,
                osVersion: osVersion,
                cpu: plan.cpu,
                ram: plan.ram,
                storage: plan.storage,
                userId: data.userId,
                nodeId: data.nodeId,
                planId: data.planId,
                templateId: data.templateId,
            },
            include: {
                node: true,
                plan: true,
                template: {
                    include: { group: true }
                }
            }
        })

        // Update node resource usage
        await prisma.node.update({
            where: { id: data.nodeId },
            data: {
                usedCpu: { increment: plan.cpu },
                usedRam: { increment: plan.ram },
                usedStorage: { increment: plan.storage },
            }
        })

        return NextResponse.json({
            success: true,
            server,
            vmid,
            message: vmid
                ? `VM ${vmid} created successfully on Proxmox`
                : 'Server entry created (Proxmox not configured)'
        }, { status: 201 })

    } catch (error: any) {
        console.error('Failed to create server:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create server' },
            { status: 500 }
        )
    }
}
