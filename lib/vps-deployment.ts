import prisma from '@/lib/prisma'
import { encrypt } from '@/lib/encryption'

interface DeploymentParams {
    userId: string
    planId: string
    osType: string
    hostname: string
}

/**
 * Deploy a new VPS server
 */
export async function deployVPS({ userId, planId, osType, hostname }: DeploymentParams) {
    try {
        // Get user and plan
        const [user, plan] = await Promise.all([
            prisma.user.findUnique({ where: { id: userId }, select: { balance: true } }),
            prisma.plan.findUnique({ where: { id: planId } }),
        ])

        if (!user) throw new Error('User not found')
        if (!plan) throw new Error('Plan not found')
        if (!plan.isActive) throw new Error('Plan is not active')

        // Check balance
        if (user.balance < plan.price) {
            throw new Error(`Insufficient balance. Required: $${plan.price}, Available: $${user.balance}`)
        }

        // Find available node with enough resources
        const node = await prisma.node.findFirst({
            where: {
                status: 'online',
                maxCpu: { gte: plan.cpu },
                maxRam: { gte: plan.ram },
                maxStorage: { gte: plan.storage },
            },
            include: {
                location: true,
            },
        })

        if (!node) {
            throw new Error('No available nodes with sufficient resources')
        }

        // Find available IP address
        const availableIP = await prisma.ipAddress.findFirst({
            where: {
                isAssigned: false,
                pool: {
                    locationId: node.locationId,
                },
            },
        })

        if (!availableIP) {
            throw new Error('No available IP addresses in this location')
        }

        // Create server and deduct balance in a transaction
        const result = await prisma.$transaction(async (tx) => {
            // Deduct balance
            const balanceBefore = user.balance
            const balanceAfter = balanceBefore - plan.price

            await tx.user.update({
                where: { id: userId },
                data: { balance: balanceAfter },
            })

            // Record balance transaction
            await tx.balanceTransaction.create({
                data: {
                    userId,
                    amount: plan.price,
                    type: 'debit',
                    description: `VPS deployment: ${hostname}`,
                    balanceBefore,
                    balanceAfter,
                },
            })

            // Create server
            const server = await tx.server.create({
                data: {
                    name: hostname,
                    hostname,
                    osType,
                    cpu: plan.cpu,
                    ram: plan.ram,
                    storage: plan.storage,
                    status: 'pending',
                    userId,
                    nodeId: node.id,
                    planId: plan.id,
                },
            })

            // Assign IP to server
            await tx.ipAddress.update({
                where: { id: availableIP.id },
                data: {
                    serverId: server.id,
                    isAssigned: true,
                },
            })

            // Update node resource usage
            await tx.node.update({
                where: { id: node.id },
                data: {
                    usedCpu: { increment: plan.cpu },
                    usedRam: { increment: plan.ram },
                    usedStorage: { increment: plan.storage },
                },
            })

            return { server, ipAddress: availableIP.address }
        })

        // TODO: Call virtualization backend to actually create the VPS
        // For now, we'll just update status to "running"
        await prisma.server.update({
            where: { id: result.server.id },
            data: { status: 'running' },
        })

        return {
            success: true,
            serverId: result.server.id,
            ipAddress: result.ipAddress,
            message: 'VPS deployed successfully',
        }
    } catch (error) {
        console.error('VPS deployment failed:', error)
        throw error
    }
}

/**
 * Check if deployment is possible
 */
export async function validateDeployment(userId: string, planId: string) {
    const [user, plan, availableNode] = await Promise.all([
        prisma.user.findUnique({ where: { id: userId }, select: { balance: true } }),
        prisma.plan.findUnique({ where: { id: planId } }),
        prisma.node.findFirst({
            where: {
                status: 'online',
            },
        }),
    ])

    if (!user) return { valid: false, error: 'User not found' }
    if (!plan) return { valid: false, error: 'Plan not found' }
    if (!plan.isActive) return { valid: false, error: 'Plan is not active' }
    if (user.balance < plan.price) {
        return { valid: false, error: 'Insufficient balance' }
    }
    if (!availableNode) {
        return { valid: false, error: 'No available nodes' }
    }

    return { valid: true }
}
