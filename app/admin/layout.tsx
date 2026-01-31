'use client'

import { signOut } from 'next-auth/react'
import { LayoutDashboard, MapPin, Server, HardDrive, Network, Users, Key, Package, LogOut, FileCode } from 'lucide-react'
import Sidebar from '@/components/ui/Sidebar'
import Button from '@/components/ui/Button'

export default function AdminLayout({ children }: { children: React.ReactNode }) {
    const adminLinks = [
        { href: '/admin', icon: LayoutDashboard, label: 'Dashboard' },
        { href: '/admin/locations', icon: MapPin, label: 'Locations' },
        { href: '/admin/nodes', icon: Server, label: 'Nodes' },
        { href: '/admin/templates', icon: FileCode, label: 'Templates' },
        { href: '/admin/plans', icon: Package, label: 'Plans' },
        { href: '/admin/servers', icon: Server, label: 'Servers' },
        { href: '/admin/ipam', icon: Network, label: 'IP Management' },
        { href: '/admin/users', icon: Users, label: 'Users' },
        { href: '/admin/api-tokens', icon: Key, label: 'API Tokens' },
    ]

    return (
        <div className="flex min-h-screen bg-background">
            <Sidebar title="Admin Panel" links={adminLinks} />
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
