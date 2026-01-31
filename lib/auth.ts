import NextAuth, { NextAuthConfig } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import prisma from './prisma'
import { loginSchema } from './validation'

export const authConfig: NextAuthConfig = {
    providers: [
        Credentials({
            credentials: {
                email: { label: 'Email', type: 'email' },
                password: { label: 'Password', type: 'password' },
            },
            async authorize(credentials) {
                try {
                    const { email, password } = loginSchema.parse(credentials)

                    const user = await prisma.user.findUnique({
                        where: { email },
                    })

                    if (!user) {
                        return null
                    }

                    const isPasswordValid = await bcrypt.compare(password, user.password)

                    if (!isPasswordValid) {
                        return null
                    }

                    return {
                        id: user.id,
                        name: user.name,
                        email: user.email,
                        isAdmin: user.isAdmin,
                    }
                } catch (error) {
                    console.error('Auth error:', error)
                    return null
                }
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.id = user.id
                token.isAdmin = user.isAdmin
            }
            return token
        },
        async session({ session, token }) {
            if (session.user) {
                session.user.id = token.id as string
                session.user.isAdmin = token.isAdmin as boolean
            }
            return session
        },
        async redirect({ url, baseUrl }) {
            // Handle callback URLs
            if (url.startsWith(baseUrl)) {
                return url
            }
            // Default redirects after login
            return baseUrl
        },
    },
    pages: {
        signIn: '/login',
    },
    session: {
        strategy: 'jwt',
    },
    secret: process.env.NEXTAUTH_SECRET,
}

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)
