import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const addressSchema = z.object({
    poolId: z.string().optional(),
    creationMode: z.enum(['single', 'multiple']),
    ipType: z.enum(['ipv4', 'ipv6']),
    address: z.string().optional(),
    cidr: z.string(),
    gateway: z.string(),
    macAddress: z.string().optional(),
    serverId: z.string().optional(),
    startingAddress: z.string().optional(),
    endingAddress: z.string().optional(),
})

// Helper function to generate IP range
function generateIPRange(start: string, end: string): string[] {
    const ipToNum = (ip: string) => {
        return ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>> 0
    }

    const numToIP = (num: number) => {
        return [
            (num >>> 24) & 255,
            (num >>> 16) & 255,
            (num >>> 8) & 255,
            num & 255
        ].join('.')
    }

    const startNum = ipToNum(start)
    const endNum = ipToNum(end)
    const addresses: string[] = []

    for (let i = startNum; i <= endNum; i++) {
        addresses.push(numToIP(i))
    }

    return addresses
}

// Helper function to calculate network details from CIDR
function calculateNetworkFromCIDR(address: string, cidr: string) {
    // For simplicity, just extract base network
    // In production, use proper CIDR calculation library
    const octets = address.split('.')
    const cidrNum = parseInt(cidr)

    // Simple /24 network extraction
    if (cidrNum === 24) {
        return `${octets[0]}.${octets[1]}.${octets[2]}.0/24`
    } else if (cidrNum === 16) {
        return `${octets[0]}.${octets[1]}.0.0/16`
    } else if (cidrNum === 8) {
        return `${octets[0]}.0.0.0/8`
    }

    return `${address}/${cidr}`
}

// POST - Create IP address(es)
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const data = addressSchema.parse(body)

        let poolId = data.poolId

        // If no pool specified, find or create one
        if (!poolId) {
            const cidrNetwork = calculateNetworkFromCIDR(
                data.address || data.startingAddress || '',
                data.cidr
            )

            // Try to find existing pool
            let pool = await prisma.ipPool.findFirst({
                where: { cidr: cidrNetwork }
            })

            // If no pool exists, we need a location - get first location or error
            if (!pool) {
                const firstLocation = await prisma.location.findFirst()
                if (!firstLocation) {
                    return NextResponse.json(
                        { error: 'No locations available. Create a location first.' },
                        { status: 400 }
                    )
                }

                const poolCount = await prisma.ipPool.count()
                pool = await prisma.ipPool.create({
                    data: {
                        name: `Auto Pool ${poolCount + 1}`,
                        cidr: cidrNetwork,
                        gateway: data.gateway,
                        locationId: firstLocation.id,
                    }
                })
            }

            poolId = pool.id
        }

        if (data.creationMode === 'single') {
            // Create single IP
            const existingIP = await prisma.ipAddress.findUnique({
                where: { address: data.address }
            })

            if (existingIP) {
                return NextResponse.json(
                    { error: 'IP address already exists' },
                    { status: 400 }
                )
            }

            await prisma.ipAddress.create({
                data: {
                    address: data.address!,
                    poolId: poolId,
                    serverId: data.serverId || null,
                    isAssigned: !!data.serverId,
                }
            })

            return NextResponse.json({ success: true, count: 1 })
        } else {
            // Create multiple IPs
            const addresses = generateIPRange(data.startingAddress!, data.endingAddress!)

            // Check for existing IPs
            const existing = await prisma.ipAddress.findMany({
                where: {
                    address: { in: addresses }
                }
            })

            if (existing.length > 0) {
                return NextResponse.json(
                    { error: `${existing.length} IP(s) already exist in the range` },
                    { status: 400 }
                )
            }

            // Bulk create
            await prisma.ipAddress.createMany({
                data: addresses.map(addr => ({
                    address: addr,
                    poolId: poolId,
                    isAssigned: false,
                }))
            })

            return NextResponse.json({ success: true, count: addresses.length })
        }
    } catch (error: any) {
        console.error('Failed to create IP address:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to create IP address' },
            { status: 400 }
        )
    }
}
