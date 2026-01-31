'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

interface SidebarLinkProps {
    href: string
    icon: LucideIcon
    label: string
}

export function SidebarLink({ href, icon: Icon, label }: SidebarLinkProps) {
    const pathname = usePathname()
    const isActive = pathname === href || pathname.startsWith(href + '/')

    return (
        <Link
            href={href}
            className={cn(
                'sidebar-link',
                isActive && 'sidebar-link-active'
            )}
        >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
        </Link>
    )
}

interface SidebarProps {
    title: string
    links: Array<{
        href: string
        icon: LucideIcon
        label: string
    }>
}

export default function Sidebar({ title, links }: SidebarProps) {
    return (
        <aside className="w-64 h-screen bg-background-paper border-r border-border sticky top-0">
            <div className="p-6 border-b border-border">
                <h1 className="text-2xl font-bold text-primary-400">{title}</h1>
            </div>
            <nav className="p-4 space-y-1">
                {links.map((link) => (
                    <SidebarLink key={link.href} {...link} />
                ))}
            </nav>
        </aside>
    )
}
