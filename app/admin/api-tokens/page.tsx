import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Key, Calendar } from 'lucide-react'

export default async function AdminAPITokensPage() {
    const session = await auth()
    if (!session?.user.isAdmin) redirect('/')

    const tokens = await prisma.apiToken.findMany({
        include: {
            user: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
    })

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">API Tokens</h1>
                <p className="text-text-secondary mt-1">Manage API access tokens for automation</p>
            </div>

            <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                <p className="text-warning font-medium">🔐 Security Notice</p>
                <p className="text-sm text-text-muted mt-1">
                    API tokens provide programmatic access to the platform. Keep them secure and rotate regularly.
                </p>
            </div>

            <div className="bg-background-paper border border-border rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-text-primary">
                        Active Tokens: {tokens.filter((t: any) => t.isActive).length}
                    </h3>
                </div>

                {tokens.length === 0 ? (
                    <div className="text-center py-12">
                        <Key className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-text-primary mb-2">No API Tokens</h3>
                        <p className="text-text-muted">API tokens can be created via CLI or API</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-text-muted border-b border-border">
                                    <th className="pb-2">Token Name</th>
                                    <th className="pb-2">Owner</th>
                                    <th className="pb-2">Permissions</th>
                                    <th className="pb-2">Status</th>
                                    <th className="pb-2">Last Used</th>
                                    <th className="pb-2">Created</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {tokens.map((token: any) => (
                                    <tr key={token.id} className="border-b border-border last:border-0 hover:bg-background-elevated/50">
                                        <td className="py-3">
                                            <div className="flex items-center gap-2">
                                                <Key className="w-4 h-4 text-primary-400" />
                                                <span className="font-medium text-text-primary">{token.name}</span>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div>
                                                <div className="text-text-primary">{token.user.name}</div>
                                                <div className="text-xs text-text-muted">{token.user.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <div className="flex flex-wrap gap-1">
                                                {token.permissions && token.permissions.length > 0 ? (
                                                    token.permissions.map((perm: string, idx: number) => (
                                                        <span key={idx} className="px-2 py-1 bg-primary-600/10 text-primary-400 rounded text-xs">
                                                            {perm}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-text-muted text-xs">No permissions</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${token.isActive
                                                    ? 'bg-success/10 text-success'
                                                    : 'bg-error/10 text-error'
                                                }`}>
                                                {token.isActive ? 'Active' : 'Inactive'}
                                            </span>
                                        </td>
                                        <td className="py-3 text-text-secondary text-xs">
                                            {token.lastUsedAt
                                                ? new Date(token.lastUsedAt).toLocaleDateString('en-US', {
                                                    month: 'short',
                                                    day: 'numeric',
                                                    year: 'numeric',
                                                })
                                                : 'Never'}
                                        </td>
                                        <td className="py-3 text-text-secondary text-xs">
                                            {new Date(token.createdAt).toLocaleDateString('en-US', {
                                                month: 'short',
                                                day: 'numeric',
                                                year: 'numeric',
                                            })}
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
