import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import Link from 'next/link'
import { Server, Play, Square, RotateCw, Search } from 'lucide-react'

export default async function AdminServersPage() {
    const session = await auth()
    if (!session?.user.isAdmin) redirect('/')

    const servers = await prisma.server.findMany({
        include: {
            user: { select: { name: true, email: true } },
            node: { select: { name: true, location: { select: { name: true } } } },
            ipAddresses: { select: { address: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">All Servers</h1>
                <p className="text-text-secondary mt-1">Manage all VPS instances in the system</p>
            </div>

            <div className="bg-background-paper border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">
                        Total Servers: {servers.length}
                    </h3>
                </div>

                {servers.length === 0 ? (
                    <p className="text-text-muted text-center py-8">No servers in the system</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-text-muted border-b border-border">
                                    <th className="pb-2">Server</th>
                                    <th className="pb-2">Owner</th>
                                    <th className="pb-2">IP Address</th>
                                    <th className="pb-2">Location</th>
                                    <th className="pb-2">Status</th>
                                    <th className="pb-2">Resources</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {servers.map((server: any) => (
                                    <tr key={server.id} className="border-b border-border last:border-0 hover:bg-background-elevated/50">
                                        <td className="py-3">
                                            <div>
                                                <div className="font-medium text-text-primary">{server.name}</div>
                                                <div className="text-xs text-text-muted">{server.hostname}</div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div>
                                                <div className="text-text-primary">{server.user.name}</div>
                                                <div className="text-xs text-text-muted">{server.user.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-3 text-text-secondary">
                                            {server.ipAddresses[0]?.address || 'N/A'}
                                        </td>
                                        <td className="py-3 text-text-secondary">
                                            {server.node.location.name}
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${server.status === 'running' ? 'bg-success/10 text-success' :
                                                    server.status === 'stopped' ? 'bg-warning/10 text-warning' :
                                                        server.status === 'suspended' ? 'bg-error/10 text-error' :
                                                            'bg-border text-text-muted'
                                                }`}>
                                                {server.status}
                                            </span>
                                        </td>
                                        <td className="py-3 text-text-secondary text-xs">
                                            {server.cpu} CPU • {server.ram} MB • {server.storage} GB
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    )
}
