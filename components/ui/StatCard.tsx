import { LucideIcon } from 'lucide-react'
import Card from './Card'

interface StatCardProps {
    title: string
    value: string | number
    icon: LucideIcon
    trend?: {
        value: number
        isPositive: boolean
    }
    description?: string
}

export default function StatCard({ title, value, icon: Icon, trend, description }: StatCardProps) {
    return (
        <Card className="relative overflow-hidden">
            <div className="flex items-center justify-between">
                <div className="flex-1">
                    <p className="text-sm text-text-secondary mb-1">{title}</p>
                    <h3 className="text-3xl font-bold text-text-primary mb-2">{value}</h3>
                    {description && (
                        <p className="text-xs text-text-muted">{description}</p>
                    )}
                    {trend && (
                        <div className={`flex items-center gap-1 text-sm mt-2 ${trend.isPositive ? 'text-success' : 'text-error'}`}>
                            <span>{trend.isPositive ? '↑' : '↓'}</span>
                            <span>{Math.abs(trend.value)}%</span>
                        </div>
                    )}
                </div>
                <div className="bg-primary-600/10 p-4 rounded-lg">
                    <Icon className="w-8 h-8 text-primary-400" />
                </div>
            </div>
        </Card>
    )
}
