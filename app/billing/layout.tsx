'use client'

import { useState } from 'react'
import { Wallet, FileText, CreditCard, Server, User, HeadphonesIcon } from 'lucide-react'

export default function UserBillingLayout({ children }: { children: React.ReactNode }) {
    const [activeTab, setActiveTab] = useState('overview')

    const tabs = [
        { id: 'overview', label: 'Overview', icon: Wallet, href: '/billing' },
        { id: 'services', label: 'Services', icon: Server, href: '/billing/services' },
        { id: 'invoices', label: 'Invoices', icon: FileText, href: '/billing/invoices' },
        { id: 'transactions', label: 'Transactions', icon: CreditCard, href: '/billing/transactions' },
        { id: 'wallet', label: 'Wallet', icon: Wallet, href: '/billing/wallet' },
        { id: 'profile', label: 'Profile', icon: User, href: '/billing/profile' },
        { id: 'support', label: 'Support', icon: HeadphonesIcon, href: '/billing/support' },
    ]

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <div className="bg-background-paper border-b border-border">
                <div className="container mx-auto px-6 py-4">
                    <h1 className="text-2xl font-bold text-text-primary">Billing Dashboard</h1>
                    <p className="text-text-muted text-sm">Manage your billing, invoices, and payments</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="bg-background-paper border-b border-border">
                <div className="container mx-auto px-6">
                    <div className="flex gap-1 overflow-x-auto">
                        {tabs.map((tab) => {
                            const Icon = tab.icon
                            const isActive = window.location.pathname === tab.href

                            return (
                                <a
                                    key={tab.id}
                                    href={tab.href}
                                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${isActive
                                            ? 'border-primary-500 text-primary-400'
                                            : 'border-transparent text-text-muted hover:text-text-primary hover:border-border'
                                        }`}
                                >
                                    <Icon className="w-4 h-4" />
                                    {tab.label}
                                </a>
                            )
                        })}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container mx-auto px-6 py-8">
                {children}
            </div>
        </div>
    )
}
