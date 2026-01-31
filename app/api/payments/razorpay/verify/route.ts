import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import prisma from '@/lib/prisma'
import crypto from 'crypto'

// Verify Razorpay payment
export async function POST(request: NextRequest) {
    try {
        const session = await auth()
        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
        }

        const { orderId, paymentId, signature } = await request.json()

        // Verify signature
        const generatedSignature = crypto
            .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
            .update(`${orderId}|${paymentId}`)
            .digest('hex')

        if (generatedSignature !== signature) {
            return NextResponse.json(
                { error: 'Invalid signature' },
                { status: 400 }
            )
        }

        // Get payment order
        const order = await prisma.paymentOrder.findUnique({
            where: { orderId },
        })

        if (!order || order.userId !== session.user.id) {
            return NextResponse.json(
                { error: 'Order not found' },
                { status: 404 }
            )
        }

        // Get user
        const user = await prisma.user.findUnique({
            where: { id: session.user.id },
        })

        if (!user) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        // Update order and credit balance
        await prisma.$transaction([
            prisma.paymentOrder.update({
                where: { id: order.id },
                data: {
                    status: 'success',
                    paymentId,
                },
            }),
            prisma.user.update({
                where: { id: session.user.id },
                data: {
                    balance: user.balance + order.coins,
                },
            }),
            prisma.balanceTransaction.create({
                data: {
                    userId: session.user.id,
                    amount: order.coins,
                    type: 'credit',
                    description: `Payment via Razorpay - ${paymentId}`,
                    balanceBefore: user.balance,
                    balanceAfter: user.balance + order.coins,
                },
            }),
        ])

        return NextResponse.json({ success: true })
    } catch (error) {
        console.error('Failed to verify payment:', error)
        return NextResponse.json(
            { error: 'Failed to verify payment' },
            { status: 500 }
        )
    }
}
