import { ReactNode } from 'react'
import './globals.css'

export const metadata = {
    title: 'Cloud VPS Panel',
    description: 'Professional Cloud VPS Hosting Platform',
}

export default function RootLayout({ children }: { children: ReactNode }) {
    return (
        <html lang="en">
            <body>
                {children}
            </body>
        </html>
    )
}
