import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { getBalanceHistory } from '@/lib/balance-manager'

// GET user's balance transaction history
export async function GET(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { searchParams } = new URL(request.url)
        const limit = parseInt(searchParams.get('limit') || '50')

        const transactions = await getBalanceHistory(session.user.id, limit)

        return NextResponse.json({ transactions })
    } catch (error) {
        console.error('Failed to fetch balance history:', error)
        return NextResponse.json(
            { error: 'Failed to fetch balance history' },
            { status: 500 }
        )
    }
}
