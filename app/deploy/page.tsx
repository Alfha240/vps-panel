'use client'

import { useState, useEffect } from 'react'
import { Plus, Package, Cpu, HardDrive, DollarSign, Zap } from 'lucide-react'
import { useRouter } from 'next/navigation'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import ClientLayout from '@/components/ClientLayout'

interface Plan {
    id: string
    name: string
    description: string | null
    cpu: number
    ram: number
    storage: number
    bandwidth: number
    price: number
    isActive: boolean
}

const OS_OPTIONS = [
    { id: 'ubuntu-22.04', name: 'Ubuntu 22.04 LTS', icon: '🐧' },
    { id: 'ubuntu-20.04', name: 'Ubuntu 20.04 LTS', icon: '🐧' },
    { id: 'debian-12', name: 'Debian 12', icon: '🌀' },
    { id: 'debian-11', name: 'Debian 11', icon: '🌀' },
    { id: 'centos-9', name: 'CentOS Stream 9', icon: '💠' },
    { id: 'rocky-9', name: 'Rocky Linux 9', icon: '⛰️' },
]

export default function DeployVPSPage() {
    const router = useRouter()
    const [plans, setPlans] = useState<Plan[]>([])
    const [balance, setBalance] = useState(0)
    const [loading, setLoading] = useState(true)
    const [deploying, setDeploying] = useState(false)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null)
    const [formData, setFormData] = useState({
        hostname: '',
        osType: 'ubuntu-22.04',
    })
    const [error, setError] = useState('')

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [plansRes, balanceRes] = await Promise.all([
                fetch('/api/admin/plans'),
                fetch('/api/user/balance'),
            ])

            if (plansRes.ok) {
                const plansData = await plansRes.json()
                setPlans(plansData.filter((p: Plan) => p.isActive))
            }

            if (balanceRes.ok) {
                const balanceData = await balanceRes.json()
                setBalance(balanceData.balance)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSelectPlan = (plan: Plan) => {
        setSelectedPlan(plan)
        setIsModalOpen(true)
        setError('')
    }

    const handleDeploy = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        if (!selectedPlan) return

        if (balance < selectedPlan.price) {
            setError(`Insufficient balance. You need $${selectedPlan.price.toFixed(2)} but have $${balance.toFixed(2)}`)
            return
        }

        setDeploying(true)

        try {
            const response = await fetch('/api/user/deploy', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    planId: selectedPlan.id,
                    osType: formData.osType,
                    hostname: formData.hostname,
                }),
            })

            const data = await response.json()

            if (response.ok) {
                router.push(`/servers/${data.serverId}`)
            } else {
                setError(data.error || 'Failed to deploy VPS')
            }
        } catch (error) {
            setError('An error occurred. Please try again.')
        } finally {
            setDeploying(false)
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedPlan(null)
        setFormData({ hostname: '', osType: 'ubuntu-22.04' })
        setError('')
    }

    if (loading) {
        return (
            <ClientLayout>
                <p className="text-text-muted text-center py-12">Loading plans...</p>
            </ClientLayout>
        )
    }

    return (
        <ClientLayout>
            <div className="space-y-6">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-bold text-text-primary">Deploy New VPS</h1>
                        <p className="text-text-secondary mt-1">
                            Choose a plan and deploy your virtual server instantly
                        </p>
                    </div>
                    <div className="bg-background-elevated px-4 py-2 rounded-lg border border-border">
                        <p className="text-xs text-text-muted">Available Balance</p>
                        <p className="text-2xl font-bold text-primary-400">${balance.toFixed(2)}</p>
                    </div>
                </div>

                {balance === 0 && (
                    <div className="bg-warning/10 border border-warning/20 rounded-lg p-4">
                        <p className="text-warning font-medium">⚠️ Your balance is $0.00</p>
                        <p className="text-sm text-text-muted mt-1">
                            Please add balance to your account before deploying a VPS.
                        </p>
                    </div>
                )}

                {plans.length === 0 ? (
                    <Card>
                        <p className="text-text-muted text-center py-12">
                            No plans available. Contact support.
                        </p>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {plans.map((plan) => {
                            const canAfford = balance >= plan.price

                            return (
                                <Card key={plan.id} hover className="relative">
                                    {!canAfford && (
                                        <div className="absolute top-3 right-3">
                                            <span className="bg-error/10 text-error text-xs px-2 py-1 rounded">
                                                Insufficient balance
                                            </span>
                                        </div>
                                    )}

                                    <div className="flex items-start justify-between mb-4">
                                        <div className="bg-primary-600/10 p-3 rounded-lg">
                                            <Package className="w-8 h-8 text-primary-400" />
                                        </div>
                                    </div>

                                    <h3 className="text-xl font-bold text-text-primary mb-2">{plan.name}</h3>
                                    {plan.description && (
                                        <p className="text-sm text-text-muted mb-4">{plan.description}</p>
                                    )}

                                    <div className="space-y-3 mb-6">
                                        <div className="flex items-center gap-2 text-sm">
                                            <Cpu className="w-4 h-4 text-primary-400" />
                                            <span className="text-text-secondary">{plan.cpu} vCPU Cores</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <HardDrive className="w-4 h-4 text-primary-400" />
                                            <span className="text-text-secondary">{plan.ram} MB RAM</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <HardDrive className="w-4 h-4 text-primary-400" />
                                            <span className="text-text-secondary">{plan.storage} GB SSD</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-sm">
                                            <Zap className="w-4 h-4 text-primary-400" />
                                            <span className="text-text-secondary">{plan.bandwidth} GB Bandwidth</span>
                                        </div>
                                    </div>

                                    <div className="border-t border-border pt-4 mt-4">
                                        <div className="flex items-baseline gap-2 mb-3">
                                            <span className="text-3xl font-bold text-text-primary">
                                                ${plan.price.toFixed(2)}
                                            </span>
                                            <span className="text-text-muted text-sm">/month</span>
                                        </div>
                                        <Button
                                            onClick={() => handleSelectPlan(plan)}
                                            className="w-full"
                                            disabled={!canAfford}
                                        >
                                            <Plus className="w-4 h-4 mr-2" />
                                            Deploy Now
                                        </Button>
                                    </div>
                                </Card>
                            )
                        })}
                    </div>
                )}

                <Modal
                    isOpen={isModalOpen}
                    onClose={handleCloseModal}
                    title={`Deploy ${selectedPlan?.name || 'VPS'}`}
                >
                    <form onSubmit={handleDeploy} className="space-y-4">
                        {error && (
                            <div className="bg-error/10 border border-error/20 text-error rounded-lg p-3 text-sm">
                                {error}
                            </div>
                        )}

                        <div className="bg-background-elevated p-4 rounded-lg">
                            <h4 className="font-medium text-text-primary mb-2">Plan Details</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                                <div className="text-text-muted">CPU:</div>
                                <div className="text-text-primary">{selectedPlan?.cpu} cores</div>
                                <div className="text-text-muted">RAM:</div>
                                <div className="text-text-primary">{selectedPlan?.ram} MB</div>
                                <div className="text-text-muted">Storage:</div>
                                <div className="text-text-primary">{selectedPlan?.storage} GB</div>
                                <div className="text-text-muted">Price:</div>
                                <div className="text-text-primary font-bold">${selectedPlan?.price.toFixed(2)}/mo</div>
                            </div>
                        </div>

                        <Input
                            label="Hostname"
                            placeholder="my-server"
                            value={formData.hostname}
                            onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
                            required
                            disabled={deploying}
                        />

                        <div>
                            <label className="block text-sm font-medium text-text-primary mb-2">
                                Operating System
                            </label>
                            <div className="grid grid-cols-2 gap-3">
                                {OS_OPTIONS.map((os) => (
                                    <button
                                        key={os.id}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, osType: os.id })}
                                        disabled={deploying}
                                        className={`p-3 rounded-lg border text-left transition-all ${formData.osType === os.id
                                                ? 'border-primary-500 bg-primary-600/10'
                                                : 'border-border bg-background-elevated hover:border-primary-500/50'
                                            } ${deploying ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                                    >
                                        <div className="text-2xl mb-1">{os.icon}</div>
                                        <div className="text-sm font-medium text-text-primary">{os.name}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4 border-t border-border">
                            <div className="flex justify-between items-center mb-3 text-sm">
                                <span className="text-text-muted">Current Balance:</span>
                                <span className="text-text-primary font-medium">${balance.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center mb-3 text-sm">
                                <span className="text-text-muted">Deployment Cost:</span>
                                <span className="text-error font-medium">-${selectedPlan?.price.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-base font-bold">
                                <span className="text-text-primary">Balance After:</span>
                                <span className="text-primary-400">
                                    ${(balance - (selectedPlan?.price || 0)).toFixed(2)}
                                </span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-4">
                            <Button type="submit" className="flex-1" loading={deploying} disabled={deploying}>
                                {deploying ? 'Deploying...' : 'Deploy VPS'}
                            </Button>
                            <Button type="button" variant="secondary" onClick={handleCloseModal} disabled={deploying}>
                                Cancel
                            </Button>
                        </div>
                    </form>
                </Modal>
            </div>
        </ClientLayout>
    )
}
