import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import { z } from 'zod'

const coinAdjustmentSchema = z.object({
    amount: z.number().min(1),
    type: z.enum(['add', 'deduct']),
    reason: z.string().min(1),
})

// POST - Admin adjust user coins
export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        const body = await request.json()
        const data = coinAdjustmentSchema.parse(body)
        const userId = params.id

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { id: true, balance: true, name: true, email: true },
        })

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 })
        }

        const amount = data.type === 'add' ? data.amount : -data.amount
        const newBalance = user.balance + amount

        if (newBalance < 0) {
            return NextResponse.json(
                { error: 'Insufficient balance' },
                { status: 400 }
            )
        }

        // Update balance and create transaction
        const [updatedUser, transaction] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { balance: newBalance },
            }),
            prisma.balanceTransaction.create({
                data: {
                    userId: userId,
                    amount: amount,
                    type: data.type === 'add' ? 'credit' : 'debit',
                    description: `Admin ${data.type}: ${data.reason}`,
                    balanceBefore: user.balance,
                    balanceAfter: newBalance,
                },
            }),
        ])

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                name: updatedUser.name,
                email: updatedUser.email,
                balance: updatedUser.balance,
            },
            transaction: transaction,
        })
    } catch (error: any) {
        console.error('Failed to adjust coins:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to adjust coins' },
            { status: 400 }
        )
    }
}
