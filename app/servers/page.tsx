import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Server, MapPin, Cpu, HardDrive, Activity } from 'lucide-react'
import Card from '@/components/ui/Card'
import ClientLayout from '@/components/ClientLayout'

export default async function ServersPage() {
    const session = await auth()
    if (!session) redirect('/login')
    if (session.user.isAdmin) redirect('/admin')

    const servers = await prisma.server.findMany({
        where: {
            userId: session.user.id,
            status: { not: 'deleted' },
        },
        include: {
            node: {
                select: {
                    name: true,
                    location: { select: { name: true, city: true } },
                },
            },
            ipAddresses: { select: { address: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <ClientLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">My Servers</h1>
                    <p className="text-text-secondary mt-1">Manage your virtual private servers</p>
                </div>

                {servers.length === 0 ? (
                    <Card>
                        <div className="text-center py-12">
                            <Server className="w-12 h-12 text-text-muted mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-text-primary mb-2">No servers yet</h3>
                            <p className="text-text-muted mb-4">Deploy your first VPS to get started</p>
                            <Link href="/deploy">
                                <button className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg">
                                    Deploy VPS
                                </button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {servers.map((server: any) => (
                            <Link key={server.id} href={`/servers/${server.id}`}>
                                <Card hover className="h-full">
                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-primary-600/10 p-3 rounded-lg">
                                            <Server className="w-6 h-6 text-primary-400" />
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs font-medium ${server.status === 'running' ? 'bg-success/10 text-success' :
                                                server.status === 'stopped' ? 'bg-warning/10 text-warning' :
                                                    'bg-border text-text-muted'
                                            }`}>
                                            {server.status}
                                        </span>
                                    </div>

                                    <h3 className="text-lg font-bold text-text-primary mb-1">{server.name}</h3>
                                    <p className="text-sm text-text-muted mb-4">{server.hostname}</p>

                                    <div className="space-y-2">
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <MapPin className="w-4 h-4" />
                                            <span>{server.node.location.city}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Activity className="w-4 h-4" />
                                            <span>{server.ipAddresses[0]?.address || 'No IP'}</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <Cpu className="w-4 h-4" />
                                            <span>{server.cpu} vCPU • {server.ram} MB RAM</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm text-text-secondary">
                                            <HardDrive className="w-4 h-4" />
                                            <span>{server.storage} GB SSD</span>
                                        </div>
                                    </div>
                                </Card>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </ClientLayout>
    )
}
