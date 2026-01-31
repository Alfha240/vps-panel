'use client'

import { useState, useEffect } from 'react'
import { Wallet, TrendingUp, Calendar, AlertCircle } from 'lucide-react'
import Button from '@/components/ui/Button'

export default function BillingOverviewPage() {
    const [data, setData] = useState<any>(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        fetchOverview()
    }, [])

    const fetchOverview = async () => {
        try {
            const response = await fetch('/api/billing/overview')
            if (response.ok) {
                const data = await response.json()
                setData(data)
            }
        } catch (error) {
            console.error('Failed to fetch overview:', error)
        } finally {
            setLoading(false)
        }
    }

    if (loading) {
        return <p className="text-text-muted text-center py-12">Loading...</p>
    }

    const balance = data?.balance || 0
    const dueAmount = data?.dueAmount || 0
    const nextDueDate = data?.nextDueDate
    const monthlySpent = data?.monthlySpent || 0
    const unpaidInvoices = data?.unpaidInvoices || 0

    return (
        <div className="space-y-6">
            {/* Alerts */}
            {unpaidInvoices > 0 && (
                <div className="bg-warning/10 border border-warning/20 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-warning mt-0.5" />
                    <div>
                        <h3 className="font-semibold text-warning">Unpaid Invoices</h3>
                        <p className="text-sm text-text-muted mt-1">
                            You have {unpaidInvoices} unpaid invoice{unpaidInvoices > 1 ? 's' : ''}. Please pay to avoid service interruption.
                        </p>
                        <Button size="sm" className="mt-2" href="/billing/invoices">
                            View Invoices
                        </Button>
                    </div>
                </div>
            )}

            {/* Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-6 text-white">
                    <div className="flex items-center justify-between mb-2">
                        <Wallet className="w-8 h-8 opacity-80" />
                    </div>
                    <div className="text-3xl font-bold">${balance.toFixed(2)}</div>
                    <div className="text-sm opacity-80 mt-1">Current Balance</div>
                    <Button size="sm" variant="secondary" className="mt-4 w-full" href="/billing/wallet">
                        Add Funds
                    </Button>
                </div>

                <div className="bg-background-paper border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <AlertCircle className="w-6 h-6 text-warning" />
                    </div>
                    <div className="text-2xl font-bold text-text-primary">${dueAmount.toFixed(2)}</div>
                    <div className="text-sm text-text-muted mt-1">Due Amount</div>
                </div>

                <div className="bg-background-paper border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <Calendar className="w-6 h-6 text-primary-400" />
                    </div>
                    <div className="text-2xl font-bold text-text-primary">
                        {nextDueDate ? new Date(nextDueDate).toLocaleDateString() : 'N/A'}
                    </div>
                    <div className="text-sm text-text-muted mt-1">Next Due Date</div>
                </div>

                <div className="bg-background-paper border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-2">
                        <TrendingUp className="w-6 h-6 text-success" />
                    </div>
                    <div className="text-2xl font-bold text-text-primary">${monthlySpent.toFixed(2)}</div>
                    <div className="text-sm text-text-muted mt-1">This Month Spent</div>
                </div>
            </div>

            {/* Recent Activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Recent Invoices */}
                <div className="bg-background-paper border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">Recent Invoices</h3>
                        <a href="/billing/invoices" className="text-sm text-primary-400 hover:text-primary-300">
                            View All
                        </a>
                    </div>
                    <div className="space-y-3">
                        {data?.recentInvoices?.slice(0, 5).map((invoice: any) => (
                            <div key={invoice.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <div>
                                    <div className="font-medium text-text-primary">{invoice.invoiceNumber}</div>
                                    <div className="text-xs text-text-muted">
                                        {new Date(invoice.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="font-semibold text-text-primary">${invoice.totalAmount.toFixed(2)}</div>
                                    <span className={`text-xs px-2 py-1 rounded ${invoice.status === 'paid'
                                            ? 'bg-success/10 text-success'
                                            : 'bg-warning/10 text-warning'
                                        }`}>
                                        {invoice.status}
                                    </span>
                                </div>
                            </div>
                        )) || <p className="text-text-muted text-sm text-center py-8">No invoices yet</p>}
                    </div>
                </div>

                {/* Recent Transactions */}
                <div className="bg-background-paper border border-border rounded-lg p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-lg font-semibold text-text-primary">Recent Transactions</h3>
                        <a href="/billing/transactions" className="text-sm text-primary-400 hover:text-primary-300">
                            View All
                        </a>
                    </div>
                    <div className="space-y-3">
                        {data?.recentTransactions?.slice(0, 5).map((tx: any) => (
                            <div key={tx.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                                <div>
                                    <div className="font-medium text-text-primary">{tx.description}</div>
                                    <div className="text-xs text-text-muted">
                                        {new Date(tx.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className={`font-semibold ${tx.type === 'credit' ? 'text-success' : 'text-text-primary'}`}>
                                    {tx.type === 'credit' ? '+' : '-'}${Math.abs(tx.amount).toFixed(2)}
                                </div>
                            </div>
                        )) || <p className="text-text-muted text-sm text-center py-8">No transactions yet</p>}
                    </div>
                </div>
            </div>
        </div>
    )
}
