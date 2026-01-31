import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

// Create Razorpay order
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { amount, coins } = await request.json()

        // Create order ID
        const orderId = `order_${crypto.randomBytes(12).toString('hex')}`

        // Save payment order
        await prisma.paymentOrder.create({
            data: {
                userId: session.user.id,
                gateway: 'razorpay',
                orderId,
                amount: amount * 100, // Amount in paise
                coins,
                status: 'pending',
            },
        })

        return NextResponse.json({
            orderId,
            amount: amount * 100,
            currency: 'INR',
            key: process.env.RAZORPAY_KEY_ID,
        })
    } catch (error) {
        console.error('Failed to create Razorpay order:', error)
        return NextResponse.json(
            { error: 'Failed to create order' },
            { status: 500 }
        )
    }
}
