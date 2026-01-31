import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { Users, Server, MapPin, Network } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'

export default async function AdminDashboard() {
    const session = await auth()

    // Fetch statistics
    const [totalUsers, totalServers, totalNodes, totalIps] = await Promise.all([
        prisma.user.count(),
        prisma.server.count({ where: { status: { not: 'deleted' } } }),
        prisma.node.count(),
        prisma.ipAddress.count(),
    ])

    const assignedIps = await prisma.ipAddress.count({ where: { isAssigned: true } })
    const availableIps = totalIps - assignedIps

    return (
        <div className="space-y-8">
            <div>
                <h1 className="text-3xl font-bold text-text-primary mb-2">
                    Welcome back, {session?.user?.name}!
                </h1>
                <p className="text-text-secondary">
                    Here's an overview of your VPS infrastructure
                </p>
            </div>

            {/* Statistics Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatCard
                    title="Total Users"
                    value={totalUsers}
                    icon={Users}
                    description="Registered accounts"
                />
                <StatCard
                    title="Total VPS"
                    value={totalServers}
                    icon={Server}
                    description="Active virtual servers"
                />
                <StatCard
                    title="Infrastructure Nodes"
                    value={totalNodes}
                    icon={MapPin}
                    description="Physical servers"
                />
                <StatCard
                    title="IP Addresses"
                    value={`${availableIps} / ${totalIps}`}
                    icon={Network}
                    description="Available addresses"
                />
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-background-paper border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Recent Servers</h3>
                    <RecentServersTable />
                </div>

                <div className="bg-background-paper border border-border rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Node Status</h3>
                    <NodeStatusTable />
                </div>
            </div>
        </div>
    )
}

async function RecentServersTable() {
    const servers = await prisma.server.findMany({
        where: { status: { not: 'deleted' } },
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            user: { select: { name: true, email: true } },
            node: { select: { name: true } },
        },
    })

    if (servers.length === 0) {
        return <p className="text-text-muted text-sm">No servers created yet</p>
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="text-left text-xs text-text-muted border-b border-border">
                        <th className="pb-2">Server</th>
                        <th className="pb-2">Owner</th>
                        <th className="pb-2">Status</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {servers.map((server) => (
                        <tr key={server.id} className="border-b border-border last:border-0">
                            <td className="py-3 text-text-primary">{server.name}</td>
                            <td className="py-3 text-text-secondary">{server.user.name}</td>
                            <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs ${server.status === 'running' ? 'bg-success/10 text-success' :
                                        server.status === 'stopped' ? 'bg-warning/10 text-warning' :
                                            'bg-border text-text-muted'
                                    }`}>
                                    {server.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

async function NodeStatusTable() {
    const nodes = await prisma.node.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
            location: { select: { name: true } },
        },
    })

    if (nodes.length === 0) {
        return <p className="text-text-muted text-sm">No nodes configured yet</p>
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full">
                <thead>
                    <tr className="text-left text-xs text-text-muted border-b border-border">
                        <th className="pb-2">Node</th>
                        <th className="pb-2">Location</th>
                        <th className="pb-2">Status</th>
                    </tr>
                </thead>
                <tbody className="text-sm">
                    {nodes.map((node) => (
                        <tr key={node.id} className="border-b border-border last:border-0">
                            <td className="py-3 text-text-primary">{node.name}</td>
                            <td className="py-3 text-text-secondary">{node.location.name}</td>
                            <td className="py-3">
                                <span className={`px-2 py-1 rounded text-xs ${node.status === 'online' ? 'bg-success/10 text-success' :
                                        node.status === 'offline' ? 'bg-error/10 text-error' :
                                            'bg-warning/10 text-warning'
                                    }`}>
                                    {node.status}
                                </span>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}
