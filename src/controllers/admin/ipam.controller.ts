import { Request, Response } from 'express';
import prisma from '../../lib/prisma';
import { Prisma } from '@prisma/client';

/**
 * Parse CIDR and generate IP addresses
 */
const generateIPsFromCIDR = (cidr: string): string[] => {
    const [baseIP, bits] = cidr.split('/');
    const maskBits = parseInt(bits);
    const ipParts = baseIP.split('.').map(Number);

    const totalHosts = Math.pow(2, 32 - maskBits) - 2; // Exclude network and broadcast
    const ips: string[] = [];

    // Limit to reasonable pool sizes
    const maxIPs = Math.min(totalHosts, 1000);

    for (let i = 1; i <= maxIPs; i++) {
        const newIP = [...ipParts];
        let carry = i;

        for (let j = 3; j >= 0; j--) {
            newIP[j] += carry;
            carry = Math.floor(newIP[j] / 256);
            newIP[j] = newIP[j] % 256;
        }

        ips.push(newIP.join('.'));
    }

    return ips;
};

/**
 * List IP pools
 */
export const listIPPools = async (req: Request, res: Response) => {
    try {
        const ipPools = await prisma.ipPool.findMany({
            include: {
                location: { select: { name: true } },
                _count: { select: { ip_addresses: true } },
            },
            orderBy: { name: 'asc' },
        });

        // Get assigned/available counts for each pool
        const poolsWithStats = await Promise.all(
            ipPools.map(async (pool) => {
                const assigned = await prisma.ipAddress.count({
                    where: { ip_pool_id: pool.id, is_assigned: true },
                });

                return {
                    ...pool,
                    assignedCount: assigned,
                    availableCount: pool._count.ip_addresses - assigned,
                };
            })
        );

        const locations = await prisma.location.findMany({
            orderBy: { name: 'asc' },
        });

        res.render('admin/ipam', {
            title: 'IP Address Management',
            ipPools: poolsWithStats,
            locations,
            error: null,
            success: null,
        });
    } catch (error) {
        console.error('List IP pools error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load IP pools',
        });
    }
};

/**
 * Create IP pool
 */
export const createIPPool = async (req: Request, res: Response) => {
    try {
        const { name, location_id, cidr, gateway, netmask, dns_servers } = req.body;

        if (!name || !location_id || !cidr || !gateway || !netmask) {
            return res.redirect('/admin/ipam?error=missing_fields');
        }

        // Create IP pool
        const ipPool = await prisma.ipPool.create({
            data: {
                name,
                location_id: parseInt(location_id),
                cidr,
                gateway,
                netmask,
                dns_servers: dns_servers || '8.8.8.8,8.8.4.4',
            },
        });

        // Generate IPs from CIDR
        const ips = generateIPsFromCIDR(cidr);

        // Create IP address records
        await prisma.ipAddress.createMany({
            data: ips.map((ip) => ({
                ip_pool_id: ipPool.id,
                address: ip,
                is_assigned: false,
            })),
        });

        res.redirect('/admin/ipam?success=created');
    } catch (error) {
        console.error('Create IP pool error:', error);
        res.redirect('/admin/ipam?error=failed');
    }
};

/**
 * Delete IP pool
 */
export const deleteIPPool = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;

        // Check if any IPs are assigned
        const assignedCount = await prisma.ipAddress.count({
            where: { ip_pool_id: parseInt(id as string), is_assigned: true },
        });

        if (assignedCount > 0) {
            return res.redirect('/admin/ipam?error=has_assigned_ips');
        }

        // Delete pool (cascade will delete IP addresses)
        await prisma.ipPool.delete({
            where: { id: parseInt(id as string) },
        });

        res.redirect('/admin/ipam?success=deleted');
    } catch (error) {
        console.error('Delete IP pool error:', error);
        res.redirect('/admin/ipam?error=failed');
    }
};

/**
 * View IP addresses in a pool
 */
export const viewIPAddresses = async (req: Request, res: Response) => {
    try {
        const { poolId } = req.params;

        const ipPool = await prisma.ipPool.findUnique({
            where: { id: parseInt(poolId as string) },
            include: {
                location: true,
                ip_addresses: {
                    include: {
                        server: { select: { id: true, name: true, user: { select: { name: true } } } },
                    },
                    orderBy: { address: 'asc' },
                },
            },
        });

        if (!ipPool) {
            return res.redirect('/admin/ipam?error=pool_not_found');
        }

        res.render('admin/ip-addresses', {
            title: `IP Addresses - ${ipPool.name}`,
            ipPool,
            error: null,
            success: null,
        });
    } catch (error) {
        console.error('View IP addresses error:', error);
        res.status(500).render('errors/500', {
            title: 'Error',
            error: 'Failed to load IP addresses',
        });
    }
};
