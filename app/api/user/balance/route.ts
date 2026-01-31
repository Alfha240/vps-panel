import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getUserBalance, getBalanceHistory } from '@/lib/balance-manager'

// GET user's current balance
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const balance = await getUserBalance(session.user.id)

        return NextResponse.json({ balance })
    } catch (error) {
        console.error('Failed to fetch balance:', error)
        return NextResponse.json(
            { error: 'Failed to fetch balance' },
            { status: 500 }
        )
    }
}
