import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { addBalance } from '@/lib/balance-manager'
import { z } from 'zod'

const addBalanceSchema = z.object({
    userId: z.string(),
    amount: z.number().positive('Amount must be positive'),
    description: z.string().min(1, 'Description is required'),
})

// POST - Admin adds balance to user account
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session || !session.user.isAdmin) {
            return NextResponse.json({ error: 'Unauthorized - Admin access required' }, { status: 403 })
        }

        const body = await request.json()
        const { userId, amount, description } = addBalanceSchema.parse(body)

        const result = await addBalance({ userId, amount, description })

        return NextResponse.json({
            success: true,
            balance: result.user.balance,
            transaction: result.transaction,
        })
    } catch (error: any) {
        console.error('Failed to add balance:', error)
        return NextResponse.json(
            { error: error.message || 'Failed to add balance' },
            { status: 400 }
        )
    }
}
