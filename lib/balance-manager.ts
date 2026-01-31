import prisma from '@/lib/prisma'

export interface BalanceOperation {
    userId: string
    amount: number
    description: string
}

/**
 * Add balance to user account (credit)
 */
export async function addBalance({ userId, amount, description }: BalanceOperation) {
    try {
        // Get current balance
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        })

        if (!user) {
            throw new Error('User not found')
        }

        const balanceBefore = user.balance
        const balanceAfter = balanceBefore + amount

        // Update balance and create transaction record
        const [updatedUser, transaction] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { balance: balanceAfter },
            }),
            prisma.balanceTransaction.create({
                data: {
                    userId,
                    amount,
                    type: 'credit',
                    description,
                    balanceBefore,
                    balanceAfter,
                },
            }),
        ])

        return { user: updatedUser, transaction }
    } catch (error) {
        console.error('Failed to add balance:', error)
        throw error
    }
}

/**
 * Deduct balance from user account (debit)
 */
export async function deductBalance({ userId, amount, description }: BalanceOperation) {
    try {
        // Get current balance
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { balance: true },
        })

        if (!user) {
            throw new Error('User not found')
        }

        const balanceBefore = user.balance

        // Check sufficient balance
        if (balanceBefore < amount) {
            throw new Error('Insufficient balance')
        }

        const balanceAfter = balanceBefore - amount

        // Update balance and create transaction record
        const [updatedUser, transaction] = await prisma.$transaction([
            prisma.user.update({
                where: { id: userId },
                data: { balance: balanceAfter },
            }),
            prisma.balanceTransaction.create({
                data: {
                    userId,
                    amount,
                    type: 'debit',
                    description,
                    balanceBefore,
                    balanceAfter,
                },
            }),
        ])

        return { user: updatedUser, transaction }
    } catch (error) {
        console.error('Failed to deduct balance:', error)
        throw error
    }
}

/**
 * Get user balance
 */
export async function getUserBalance(userId: string): Promise<number> {
    const user = await prisma.user.findUnique({
        where: { id: userId },
        select: { balance: true },
    })

    return user?.balance ?? 0
}

/**
 * Get balance transaction history
 */
export async function getBalanceHistory(userId: string, limit: number = 50) {
    const transactions = await prisma.balanceTransaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
    })

    return transactions
}

/**
 * Check if user has sufficient balance
 */
export async function hasSufficientBalance(userId: string, requiredAmount: number): Promise<boolean> {
    const balance = await getUserBalance(userId)
    return balance >= requiredAmount
}
