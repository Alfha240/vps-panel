import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Server, Activity, DollarSign } from 'lucide-react'
import StatCard from '@/components/ui/StatCard'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import ClientLayout from '@/components/ClientLayout'

export default async function HomePage() {
    const session = await auth()

    if (!session) {
        redirect('/login')
    }

    // If admin, redirect to admin panel
    if (session.user.isAdmin) {
        redirect('/admin')
    }

    // Fetch user with balance
    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true },
    })

    // Fetch user's servers
    const servers = await prisma.server.findMany({
        where: {
            userId: session.user.id,
            status: { not: 'deleted' },
        },
        include: {
            node: {
                select: {
                    name: true,
                    location: { select: { name: true } },
                },
            },
            ipAddresses: { select: { address: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    const runningCount = servers.filter((s: any) => s.status === 'running').length
    const stoppedCount = servers.filter((s: any) => s.status === 'stopped').length

    return (
        <ClientLayout>
            <div className="space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary mb-2">
                            Welcome back, {session.user.name}!
                        </h1>
                        <p className="text-text-secondary">
                            Manage your virtual private servers
                        </p>
                    </div>
                    <Link href="/deploy">
                        <Button>
                            <Server className="w-4 h-4 mr-2" />
                            Deploy New VPS
                        </Button>
                    </Link>
                </div>

                {/* Statistics */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <StatCard
                        title="Balance"
                        value={`$${user?.balance.toFixed(2) || '0.00'}`}
                        icon={DollarSign}
                        description="Account balance"
                    />
                    <StatCard
                        title="Total Servers"
                        value={servers.length}
                        icon={Server}
                        description="Virtual private servers"
                    />
                    <StatCard
                        title="Running"
                        value={runningCount}
                        icon={Activity}
                        description="Active servers"
                    />
                    <StatCard
                        title="Stopped"
                        value={stoppedCount}
                        icon={Server}
                        description="Inactive servers"
                    />
                </div>

                {/* Recent Servers */}
                <div className="bg-background-paper border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">Your Servers</h3>
                        <Link href="/servers">
                            <Button variant="secondary" size="sm">View All</Button>
                        </Link>
                    </div>

                    {servers.length === 0 ? (
                        <div className="text-center py-12">
                            <p className="text-text-muted mb-4">
                                No servers found. Deploy your first VPS to get started!
                            </p>
                            <Link href="/deploy">
                                <Button>
                                    <Server className="w-4 h-4 mr-2" />
                                    Deploy VPS
                                </Button>
                            </Link>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-text-muted border-b border-border">
                                        <th className="pb-2">Name</th>
                                        <th className="pb-2">IP Address</th>
                                        <th className="pb-2">Location</th>
                                        <th className="pb-2">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {servers.slice(0, 5).map((server: any) => (
                                        <tr key={server.id} className="border-b border-border last:border-0">
                                            <td className="py-3 text-text-primary font-medium">{server.name}</td>
                                            <td className="py-3 text-text-secondary">
                                                {server.ipAddresses[0]?.address || 'N/A'}
                                            </td>
                                            <td className="py-3 text-text-secondary">{server.node.location.name}</td>
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
                    )}
                </div>
            </div>
        </ClientLayout>
    )
}
