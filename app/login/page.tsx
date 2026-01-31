'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { LogIn } from 'lucide-react'
import Input from '@/components/ui/Input'
import Button from '@/components/ui/Button'
import Card from '@/components/ui/Card'

export default function LoginPage() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const callbackUrl = searchParams.get('callbackUrl') || '/'

    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        try {
            const result = await signIn('credentials', {
                email,
                password,
                redirect: false,
            })

            if (result?.error) {
                setError('Invalid email or password')
            } else {
                router.push(callbackUrl)
                router.refresh()
            }
        } catch (err) {
            setError('An error occurred. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4">
            <div className="w-full max-w-md">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-primary-400 mb-2">VPS Control Panel</h1>
                    <p className="text-text-secondary">Sign in to access your dashboard</p>
                </div>

                <Card>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div className="flex items-center justify-center mb-6">
                            <div className="bg-primary-600/10 p-4 rounded-full">
                                <LogIn className="w-8 h-8 text-primary-400" />
                            </div>
                        </div>

                        {error && (
                            <div className="bg-error/10 border border-error text-error px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="admin@example.com"
                            autoFocus
                        />

                        <Input
                            label="Password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="••••••••"
                        />

                        <Button
                            type="submit"
                            variant="primary"
                            className="w-full"
                            loading={loading}
                            disabled={loading} // Added disabled prop
                        >
                            <LogIn className="w-4 h-4 mr-2" /> {/* Added LogIn icon */}
                            Sign In
                        </Button>
                    </form>

                    {/* Added signup link */}
                    <div className="mt-6 text-center text-sm text-text-muted">
                        Don't have an account?{' '}
                        <Link href="/signup" className="text-primary-400 hover:text-primary-300 font-medium">
                            Create account
                        </Link>
                    </div>

                    {/* Moved and restyled admin accounts message */}
                    <p className="text-xs text-text-muted text-center mt-4">
                        Admin accounts must be created via CLI
                    </p>
                </Card>
            </div>
        </div>
    )
}
