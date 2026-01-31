import prisma from './prisma'

/**
 * Parse CIDR and generate IP addresses
 */
export function parseCIDR(cidr: string): string[] {
    const [baseIp, prefixStr] = cidr.split('/')
    const prefix = parseInt(prefixStr, 10)

    if (prefix < 24 || prefix > 32) {
        throw new Error('Only /24 to /32 CIDR ranges are supported')
    }

    const octets = baseIp.split('.').map(Number)
    const hosts = Math.pow(2, 32 - prefix)
    const ips: string[] = []

    // Generate IPs (skip network and broadcast addresses for /24-/30)
    const start = prefix < 31 ? 1 : 0
    const end = prefix < 31 ? hosts - 1 : hosts

    for (let i = start; i < end; i++) {
        const newOctets = [...octets]
        let remainder = i

        for (let j = 3; j >= 0; j--) {
            newOctets[j] = (octets[j] + remainder) % 256
            remainder = Math.floor((octets[j] + remainder) / 256)
        }

        ips.push(newOctets.join('.'))
    }

    return ips
}

/**
 * Get available IP address from location's pools
 */
export async function getAvailableIp(
    locationId: string
): Promise<{ id: string; address: string } | null> {
    const availableIp = await prisma.ipAddress.findFirst({
        where: {
            pool: {
                locationId,
            },
            isAssigned: false,
        },
        include: {
            pool: true,
        },
    })

    if (!availableIp) {
        return null
    }

    return {
        id: availableIp.id,
        address: availableIp.address,
    }
}

/**
 * Assign IP to server
 */
export async function assignIpToServer(
    ipId: string,
    serverId: string
): Promise<void> {
    await prisma.ipAddress.update({
        where: { id: ipId },
        data: {
            serverId,
            isAssigned: true,
        },
    })
}

/**
 * Release IP from server
 */
export async function releaseIp(serverId: string): Promise<void> {
    await prisma.ipAddress.updateMany({
        where: { serverId },
        data: {
            serverId: null,
            isAssigned: false,
        },
    })
}
