import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { ArrowLeft, Server, Play, Square, RotateCw, Trash2, Globe, HardDrive, Cpu, MapPin } from 'lucide-react'
import Link from 'next/link'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'
import ClientLayout from '@/components/ClientLayout'

export default async function ServerDetailPage({ params }: { params: { id: string } }) {
    const session = await auth()
    if (!session) redirect('/login')
    if (session.user.isAdmin) redirect('/admin')

    const server = await prisma.server.findFirst({
        where: {
            id: params.id,
            userId: session.user.id,
        },
        include: {
            node: {
                select: {
                    name: true,
                    location: { select: { name: true, city: true, country: true } },
                },
            },
            ipAddresses: { select: { address: true } },
        },
    })

    if (!server) {
        redirect('/servers')
    }

    return (
        <ClientLayout>
            <div className="space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/servers">
                        <Button variant="secondary" size="sm">
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back
                        </Button>
                    </Link>
                    <div className="flex-1">
                        <h1 className="text-3xl font-bold text-text-primary">{server.name}</h1>
                        <p className="text-text-secondary mt-1">{server.hostname}</p>
                    </div>
                    <span className={`px-3 py-1 rounded text-sm font-medium ${server.status === 'running' ? 'bg-success/10 text-success' :
                            server.status === 'stopped' ? 'bg-warning/10 text-warning' :
                                'bg-border text-text-muted'
                        }`}>
                        {server.status}
                    </span>
                </div>

                {/* Power Controls */}
                <Card>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Power Management</h3>
                    <div className="flex gap-3">
                        <Button variant="secondary" size="sm" disabled={server.status === 'running'}>
                            <Play className="w-4 h-4 mr-2" />
                            Start
                        </Button>
                        <Button variant="secondary" size="sm" disabled={server.status === 'stopped'}>
                            <Square className="w-4 h-4 mr-2" />
                            Stop
                        </Button>
                        <Button variant="secondary" size="sm" disabled={server.status !== 'running'}>
                            <RotateCw className="w-4 h-4 mr-2" />
                            Restart
                        </Button>
                    </div>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Server Information */}
                    <Card>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Server Information</h3>
                        <div className="space-y-3">
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-text-muted flex items-center gap-2">
                                    <Globe className="w-4 h-4" />
                                    IP Address
                                </span>
                                <span className="text-text-primary font-mono">
                                    {server.ipAddresses[0]?.address || 'Not assigned'}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-text-muted flex items-center gap-2">
                                    <MapPin className="w-4 h-4" />
                                    Location
                                </span>
                                <span className="text-text-primary">
                                    {server.node.location.city}, {server.node.location.country}
                                </span>
                            </div>
                            <div className="flex items-center justify-between py-2 border-b border-border">
                                <span className="text-text-muted flex items-center gap-2">
                                    <Server className="w-4 h-4" />
                                    Operating System
                                </span>
                                <span className="text-text-primary">{server.osType}</span>
                            </div>
                            <div className="flex items-center justify-between py-2">
                                <span className="text-text-muted flex items-center gap-2">
                                    <Server className="w-4 h-4" />
                                    Node
                                </span>
                                <span className="text-text-primary">{server.node.name}</span>
                            </div>
                        </div>
                    </Card>

                    {/* Resources */}
                    <Card>
                        <h3 className="text-lg font-semibold text-text-primary mb-4">Resource Allocation</h3>
                        <div className="space-y-4">
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-text-muted flex items-center gap-2">
                                        <Cpu className="w-4 h-4" />
                                        CPU
                                    </span>
                                    <span className="text-text-primary font-semibold">{server.cpu} Cores</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-text-muted flex items-center gap-2">
                                        <HardDrive className="w-4 h-4" />
                                        RAM
                                    </span>
                                    <span className="text-text-primary font-semibold">{server.ram} MB</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-text-muted flex items-center gap-2">
                                        <HardDrive className="w-4 h-4" />
                                        Storage
                                    </span>
                                    <span className="text-text-primary font-semibold">{server.storage} GB SSD</span>
                                </div>
                            </div>
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <span className="text-text-muted flex items-center gap-2">
                                        <Globe className="w-4 h-4" />
                                        Bandwidth
                                    </span>
                                    <span className="text-text-primary font-semibold">{server.bandwidth} GB</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Console */}
                <Card>
                    <h3 className="text-lg font-semibold text-text-primary mb-4">Console Access</h3>
                    <div className="bg-background-elevated border border-border rounded-lg p-6 text-center">
                        <Server className="w-12 h-12 text-text-muted mx-auto mb-3" />
                        <p className="text-text-muted">Console access will be available soon</p>
                    </div>
                </Card>

                {/* Danger Zone */}
                <Card>
                    <h3 className="text-lg font-semibold text-error mb-4">Danger Zone</h3>
                    <div className="bg-error/5 border border-error/20 rounded-lg p-4">
                        <p className="text-sm text-text-muted mb-3">
                            Deleting this server is permanent and cannot be undone.
                        </p>
                        <Button variant="secondary" size="sm" className="border-error text-error hover:bg-error hover:text-white">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete Server
                        </Button>
                    </div>
                </Card>
            </div>
        </ClientLayout>
    )
}
