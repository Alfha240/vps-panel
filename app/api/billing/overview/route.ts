import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'

export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
            select: {
                balance: true,
                invoices: {
                    where: { status: 'unpaid' },
                    select: { totalAmount: true, dueDate: true },
                },
            },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        // Calculate due amount
        const dueAmount = user.invoices.reduce((sum, inv) => sum + inv.totalAmount, 0)

        // Find next due date
        const nextDueDate = user.invoices.length > 0
            ? user.invoices.sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())[0].dueDate
            : null

        // Get this month's transactions
        const startOfMonth = new Date()
        startOfMonth.setDate(1)
        startOfMonth.setHours(0, 0, 0, 0)

        const monthlyTransactions = await prisma.balanceTransaction.aggregate({
            where: {
                userId: session.user.id,
                type: 'debit',
                createdAt: { gte: startOfMonth },
            },
            _sum: { amount: true },
        })

        // Get recent invoices
        const recentInvoices = await prisma.invoice.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                invoiceNumber: true,
                totalAmount: true,
                status: true,
                createdAt: true,
            },
        })

        // Get recent transactions
        const recentTransactions = await prisma.balanceTransaction.findMany({
            where: { userId: session.user.id },
            orderBy: { createdAt: 'desc' },
            take: 5,
            select: {
                id: true,
                amount: true,
                type: true,
                description: true,
                createdAt: true,
            },
        })

        return NextResponse.json({
            balance: user.balance,
            dueAmount,
            nextDueDate,
            monthlySpent: Math.abs(monthlyTransactions._sum.amount || 0),
            unpaidInvoices: user.invoices.length,
            recentInvoices,
            recentTransactions,
        })
    } catch (error) {
        console.error('Failed to fetch overview:', error)
        return NextResponse.json(
            { error: 'Failed to fetch overview' },
            { status: 500 }
        )
    }
}
