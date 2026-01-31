import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import prisma from '@/lib/prisma'
import { Plus, DollarSign, TrendingUp, TrendingDown } from 'lucide-react'
import Card from '@/components/ui/Card'
import StatCard from '@/components/ui/StatCard'
import ClientLayout from '@/components/ClientLayout'

export default async function BalancePage() {
    const session = await auth()
    if (!session) redirect('/login')
    if (session.user.isAdmin) redirect('/admin')

    const user = await prisma.user.findUnique({
        where: { id: session.user.id },
        select: { balance: true },
    })

    const transactions = await prisma.balanceTransaction.findMany({
        where: { userId: session.user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
    })

    const totalCredits = transactions
        .filter((t: any) => t.type === 'credit')
        .reduce((sum: number, t: any) => sum + t.amount, 0)

    const totalDebits = transactions
        .filter((t: any) => t.type === 'debit')
        .reduce((sum: number, t: any) => sum + t.amount, 0)

    return (
        <ClientLayout>
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Balance & Billing</h1>
                    <p className="text-text-secondary mt-1">Manage your account balance and view transaction history</p>
                </div>

                {/* Balance Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Current Balance"
                        value={`$${user?.balance.toFixed(2) || '0.00'}`}
                        icon={DollarSign}
                        description="Available funds"
                    />
                    <StatCard
                        title="Total Credits"
                        value={`$${totalCredits.toFixed(2)}`}
                        icon={TrendingUp}
                        description="Funds added"
                    />
                    <StatCard
                        title="Total Debits"
                        value={`$${totalDebits.toFixed(2)}`}
                        icon={TrendingDown}
                        description="Funds used"
                    />
                </div>

                {/* Transaction History */}
                <Card>
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">Transaction History</h3>
                    </div>

                    {transactions.length === 0 ? (
                        <p className="text-text-muted text-center py-8">No transactions yet</p>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="text-left text-xs text-text-muted border-b border-border">
                                        <th className="pb-2">Date</th>
                                        <th className="pb-2">Description</th>
                                        <th className="pb-2">Type</th>
                                        <th className="pb-2 text-right">Amount</th>
                                        <th className="pb-2 text-right">Balance After</th>
                                    </tr>
                                </thead>
                                <tbody className="text-sm">
                                    {transactions.map((tx: any) => (
                                        <tr key={tx.id} className="border-b border-border last:border-0">
                                            <td className="py-3 text-text-secondary">
                                                {new Date(tx.createdAt).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'short',
                                                    day: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit',
                                                })}
                                            </td>
                                            <td className="py-3 text-text-primary">{tx.description}</td>
                                            <td className="py-3">
                                                <span className={`px-2 py-1 rounded text-xs ${tx.type === 'credit'
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-error/10 text-error'
                                                    }`}>
                                                    {tx.type}
                                                </span>
                                            </td>
                                            <td className={`py-3 text-right font-medium ${tx.type === 'credit' ? 'text-success' : 'text-error'
                                                }`}>
                                                {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                                            </td>
                                            <td className="py-3 text-right text-text-primary font-medium">
                                                ${tx.balanceAfter.toFixed(2)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </Card>
            </div>
        </ClientLayout>
    )
}
