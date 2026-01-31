import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import { z } from 'zod'

const signupSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
})

export async function POST(request: NextRequest) {
    try {
        const body = await request.json()
        const { name, email, password } = signupSchema.parse(body)

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email },
        })

        if (existingUser) {
            return NextResponse.json(
                { error: 'User with this email already exists' },
                { status: 400 }
            )
        }

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user (non-admin by default)
        const user = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                isAdmin: false,
                balance: 0, // Start with 0 balance
            },
            select: {
                id: true,
                name: true,
                email: true,
                isAdmin: true,
            },
        })

        return NextResponse.json({
            success: true,
            user,
            message: 'Account created successfully! Please login.',
        })
    } catch (error: any) {
        console.error('Signup error:', error)

        if (error.name === 'ZodError') {
            return NextResponse.json(
                { error: error.errors[0].message },
                { status: 400 }
            )
        }

        return NextResponse.json(
            { error: 'Failed to create account' },
            { status: 500 }
        )
    }
}
