'use client'

import { signOut, useSession } from 'next-auth/react'
import { LayoutDashboard, Server, DollarSign, Plus, LogOut } from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'
import Button from '@/components/ui/Button'

export default function ClientLayout({ children }: { children: React.ReactNode }) {
    const userLinks = [
        { href: '/', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/deploy', icon: Plus, label: 'Deploy VPS' },
        { href: '/servers', icon: Server, label: 'My Servers' },
        { href: '/balance', icon: DollarSign, label: 'Balance' },
    ]

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar title="Cloud Panel" links={userLinks} />
            <div className="flex-1">
                <header className="bg-background-paper border-b border-border px-8 py-4 flex items-center justify-between sticky top-0 z-10">
                    <h2 className="text-xl font-semibold text-text-primary">VPS Control Panel</h2>
                    <Button
                        variant="secondary"
                        size="sm"
                        onClick={() => signOut({ callbackUrl: '/login' })}
                    >
                        <LogOut className="w-4 h-4 mr-2" />
                        Sign Out
                    </Button>
                </header>
                <main className="p-8">
                    {children}
                </main>
            </div>
        </div>
    )
}
