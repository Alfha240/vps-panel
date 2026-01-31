#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import * as readline from 'readline'

const prisma = new PrismaClient()

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
})

function question(query: string): Promise<string> {
    return new Promise((resolve) => {
        rl.question(query, resolve)
    })
}

async function createAdmin() {
    console.log('\n=================================')
    console.log('VPS Panel - Admin Account Creator')
    console.log('=================================\n')

    try {
        // Get user details
        const name = await question('Enter name: ')
        if (!name.trim()) {
            console.error('Error: Name is required')
            process.exit(1)
        }

        const email = await question('Enter email: ')
        if (!email.trim() || !email.includes('@')) {
            console.error('Error: Valid email is required')
            process.exit(1)
        }

        // Check if email already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.trim() },
        })

        if (existingUser) {
            console.error('Error: User with this email already exists')
            process.exit(1)
        }

        const password = await question('Enter password (min 8 characters): ')
        if (!password || password.length < 8) {
            console.error('Error: Password must be at least 8 characters')
            process.exit(1)
        }

        const isAdminInput = await question('Is this user an admin? (yes/no): ')
        const isAdmin = isAdminInput.toLowerCase().trim() === 'yes' || isAdminInput.toLowerCase().trim() === 'y'

        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10)

        // Create user
        const user = await prisma.user.create({
            data: {
                name: name.trim(),
                email: email.trim(),
                password: hashedPassword,
                isAdmin,
            },
        })

        console.log('\n✅ User created successfully!')
        console.log('─────────────────────────────────')
        console.log(`Name: ${user.name}`)
        console.log(`Email: ${user.email}`)
        console.log(`Role: ${user.isAdmin ? 'Admin' : 'User'}`)
        console.log(`Created: ${user.createdAt}`)
        console.log('─────────────────────────────────\n')

        if (user.isAdmin) {
            console.log('✨ This user can now access the admin panel at http://localhost:3000/admin')
        } else {
            console.log('👤 This user can now access the user panel at http://localhost:3000/user')
        }

        console.log('\n🚀 Start the dev server with: npm run dev\n')
    } catch (error) {
        console.error('\n❌ Error creating user:', error)
        process.exit(1)
    } finally {
        rl.close()
        await prisma.$disconnect()
    }
}

createAdmin()
