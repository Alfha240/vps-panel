import readline from 'readline';
import bcrypt from 'bcrypt';
import prisma from '../src/lib/prisma';
import config from '../src/config';

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
});

const question = (query: string): Promise<string> => {
    return new Promise((resolve) => {
        rl.question(query, resolve);
    });
};

async function createUser() {
    console.log('\n=== VPS Panel - Create User ===\n');

    try {
        // Get user details
        const name = await question('Name: ');
        const email = await question('Email: ');
        const password = await question('Password: ');
        const isAdminInput = await question('Make admin? (yes/no): ');

        if (!name || !email || !password) {
            console.error('\nError: All fields are required.');
            rl.close();
            process.exit(1);
        }

        // Validate email
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
            console.error('\nError: Invalid email format.');
            rl.close();
            process.exit(1);
        }

        // Validate password length
        if (password.length < 8) {
            console.error('\nError: Password must be at least 8 characters long.');
            rl.close();
            process.exit(1);
        }

        // Check if user already exists
        const existingUser = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (existingUser) {
            console.error('\nError: User with this email already exists.');
            rl.close();
            process.exit(1);
        }

        // Determine admin status
        const isAdmin = ['yes', 'y', 'true', '1'].includes(isAdminInput.toLowerCase());

        // Hash password
        console.log('\nHashing password...');
        const hashedPassword = await bcrypt.hash(password, config.bcrypt.rounds);

        // Create user
        console.log('Creating user...');
        const user = await prisma.user.create({
            data: {
                name,
                email: email.toLowerCase(),
                password: hashedPassword,
                is_admin: isAdmin,
            },
        });

        console.log('\n✓ User created successfully!');
        console.log('\nUser Details:');
        console.log(`  ID: ${user.id}`);
        console.log(`  Name: ${user.name}`);
        console.log(`  Email: ${user.email}`);
        console.log(`  Admin: ${user.is_admin ? 'Yes' : 'No'}`);
        console.log(`  Created: ${user.created_at}`);

    } catch (error) {
        console.error('\nError creating user:', error);
        process.exit(1);
    } finally {
        rl.close();
        await prisma.$disconnect();
    }
}

createUser();
