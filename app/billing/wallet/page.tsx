'use client'

import { useState, useEffect } from 'react'
import { Plus, CreditCard, Loader } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

export default function WalletPage() {
    const [balance, setBalance] = useState(0)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [amount, setAmount] = useState(100)
    const [gateway, setGateway] = useState<'razorpay' | 'cashfree'>('razorpay')
    const [processing, setProcessing] = useState(false)

    const packages = [
        { amount: 100, coins: 100, bonus: 0 },
        { amount: 500, coins: 500, bonus: 25 },
        { amount: 1000, coins: 1000, bonus: 100 },
        { amount: 5000, coins: 5000, bonus: 750 },
    ]

    useEffect(() => {
        fetchBalance()
    }, [])

    const fetchBalance = async () => {
        try {
            const response = await fetch('/api/billing/balance')
            if (response.ok) {
                const data = await response.json()
                setBalance(data.balance)
            }
        } catch (error) {
            console.error('Failed to fetch balance:', error)
        }
    }

    const handleAddFunds = async () => {
        setProcessing(true)
        try {
            const response = await fetch(`/api/payments/${gateway}/create`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ amount, coins: amount })
            })

            if (response.ok) {
                const data = await response.json()
                // Redirect to payment page or open gateway checkout
                if (gateway === 'razorpay') {
                    // Open Razorpay checkout
                    const options = {
                        key: data.key,
                        amount: data.amount,
                        currency: data.currency,
                        order_id: data.orderId,
                        name: 'VPS Panel',
                        description: `Add ₹${amount} to wallet`,
                        handler: async function (response: any) {
                            // Verify payment
                            const verifyRes = await fetch('/api/payments/razorpay/verify', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({
                                    orderId: data.orderId,
                                    paymentId: response.razorpay_payment_id,
                                    signature: response.razorpay_signature
                                })
                            })

                            if (verifyRes.ok) {
                                alert('Payment successful!')
                                fetchBalance()
                                setIsModalOpen(false)
                            }
                        }
                    }

                    // @ts-ignore
                    const rzp = new window.Razorpay(options)
                    rzp.open()
                }
            }
        } catch (error) {
            console.error('Payment failed:', error)
            alert('Payment failed')
        } finally {
            setProcessing(false)
        }
    }

    return (
        <div className="space-y-6">
            {/* Current Balance */}
            <div className="bg-gradient-to-br from-primary-600 to-primary-700 rounded-lg p-8 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <div className="text-sm opacity-80 mb-2">Available Balance</div>
                        <div className="text-4xl font-bold">${balance.toFixed(2)}</div>
                    </div>
                    <Button variant="secondary" onClick={() => setIsModalOpen(true)}>
                        <Plus className="w-4 h-4 mr-2" />
                        Add Funds
                    </Button>
                </div>
            </div>

            {/* Recharge Packages */}
            <div>
                <h3 className="text-lg font-semibold text-text-primary mb-4">Quick Recharge</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    {packages.map((pkg) => (
                        <div
                            key={pkg.amount}
                            className="bg-background-paper border border-border rounded-lg p-6 hover:border-primary-500 transition-colors cursor-pointer"
                            onClick={() => {
                                setAmount(pkg.amount)
                                setIsModalOpen(true)
                            }}
                        >
                            <div className="text-2xl font-bold text-text-primary">₹{pkg.amount}</div>
                            <div className="text-sm text-text-muted mt-1">
                                {pkg.coins} Coins
                                {pkg.bonus > 0 && (
                                    <span className="text-success ml-1">+ {pkg.bonus} Bonus</span>
                                )}
                            </div>
                            <Button size="sm" className="w-full mt-4">
                                Select
                            </Button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Add Funds Modal */}
            <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Add Funds">
                <div className="space-y-4">
                    <Input
                        label="Amount (₹)"
                        type="number"
                        min="10"
                        value={amount}
                        onChange={(e) => setAmount(parseInt(e.target.value) || 0)}
                    />

                    <div>
                        <label className="text-sm font-medium text-text-primary mb-2 block">
                            Payment Gateway
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setGateway('razorpay')}
                                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${gateway === 'razorpay'
                                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                        : 'border-border text-text-muted hover:border-border'
                                    }`}
                            >
                                <CreditCard className="w-5 h-5 mx-auto mb-1" />
                                Razorpay
                            </button>
                            <button
                                type="button"
                                onClick={() => setGateway('cashfree')}
                                className={`px-4 py-3 rounded-lg border text-sm font-medium transition-colors ${gateway === 'cashfree'
                                        ? 'border-primary-500 bg-primary-500/10 text-primary-400'
                                        : 'border-border text-text-muted hover:border-border'
                                    }`}
                            >
                                <CreditCard className="w-5 h-5 mx-auto mb-1" />
                                Cashfree
                            </button>
                        </div>
                    </div>

                    <div className="bg-primary-600/10 border border-primary-500/20 rounded-lg p-3 text-sm">
                        <div className="flex justify-between mb-1">
                            <span className="text-text-muted">Amount:</span>
                            <span className="text-text-primary font-semibold">₹{amount}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-text-muted">You'll receive:</span>
                            <span className="text-primary-400 font-semibold">{amount} Coins</span>
                        </div>
                    </div>

                    <Button
                        className="w-full"
                        onClick={handleAddFunds}
                        disabled={processing || amount < 10}
                    >
                        {processing ? (
                            <>
                                <Loader className="w-4 h-4 mr-2 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            `Pay ₹${amount}`
                        )}
                    </Button>
                </div>
            </Modal>
        </div>
    )
}
