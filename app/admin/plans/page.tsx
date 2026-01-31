'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Package } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'
import { formatCurrency } from '@/lib/utils'

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
    _count?: {
        servers: number
    }
}

export default function PlansPage() {
    const [plans, setPlans] = useState<Plan[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        description: '',
        cpu: 1,
        ram: 1024,
        storage: 20,
        bandwidth: 1000,
        price: 5.0,
    })

    useEffect(() => {
        fetchPlans()
    }, [])

    const fetchPlans = async () => {
        try {
            const response = await fetch('/api/admin/plans')
            const data = await response.json()
            setPlans(data)
        } catch (error) {
            console.error('Failed to fetch plans:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        try {
            const url = editingPlan
                ? `/api/admin/plans/${editingPlan.id}`
                : '/api/admin/plans'

            const response = await fetch(url, {
                method: editingPlan ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                fetchPlans()
                setShowModal(false)
                resetForm()
            }
        } catch (error) {
            console.error('Failed to save plan:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this plan?')) return

        try {
            const response = await fetch(`/api/admin/plans/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchPlans()
            }
        } catch (error) {
            console.error('Failed to delete plan:', error)
        }
    }

    const toggleActive = async (id: string, isActive: boolean) => {
        try {
            const response = await fetch(`/api/admin/plans/${id}/toggle`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ isActive: !isActive }),
            })

            if (response.ok) {
                fetchPlans()
            }
        } catch (error) {
            console.error('Failed to toggle plan status:', error)
        }
    }

    const openEditModal = (plan: Plan) => {
        setEditingPlan(plan)
        setFormData({
            name: plan.name,
            description: plan.description || '',
            cpu: plan.cpu,
            ram: plan.ram,
            storage: plan.storage,
            bandwidth: plan.bandwidth,
            price: plan.price,
        })
        setShowModal(true)
    }

    const resetForm = () => {
        setFormData({ name: '', description: '', cpu: 1, ram: 1024, storage: 20, bandwidth: 1000, price: 5.0 })
        setEditingPlan(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">VPS Plans</h1>
                    <p className="text-text-secondary mt-1">Manage VPS hosting plans and pricing</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        resetForm()
                        setShowModal(true)
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Plan
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-text-muted">Loading...</p>
                </div>
            ) : plans.length === 0 ? (
                <Card>
                    <p className="text-text-muted text-center py-12">
                        No plans found. Create your first plan to get started.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {plans.map((plan) => (
                        <Card key={plan.id} hover className={!plan.isActive ? 'opacity-60' : ''}>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-600/10 p-3 rounded-lg">
                                        <Package className="w-6 h-6 text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary">{plan.name}</h3>
                                        <p className="text-2xl font-bold text-primary-400 mt-1">
                                            {formatCurrency(plan.price)}<span className="text-sm text-text-muted">/mo</span>
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(plan)}
                                        className="text-primary-400 hover:text-primary-300 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan.id)}
                                        className="text-error hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 text-sm mb-4">
                                <div className="flex justify-between">
                                    <span className="text-text-muted">CPU:</span>
                                    <span className="text-text-primary font-medium">{plan.cpu} Core{plan.cpu > 1 ? 's' : ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted">RAM:</span>
                                    <span className="text-text-primary font-medium">{plan.ram} MB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Storage:</span>
                                    <span className="text-text-primary font-medium">{plan.storage} GB</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-text-muted">Bandwidth:</span>
                                    <span className="text-text-primary font-medium">{plan.bandwidth} GB</span>
                                </div>
                            </div>

                            {plan.description && (
                                <p className="text-text-muted text-sm mb-4">{plan.description}</p>
                            )}

                            <div className="flex items-center justify-between pt-4 border-t border-border">
                                <span className="text-sm text-text-muted">
                                    {plan._count?.servers || 0} server{plan._count?.servers !== 1 ? 's' : ''}
                                </span>
                                <button
                                    onClick={() => toggleActive(plan.id, plan.isActive)}
                                    className={`px-3 py-1 rounded text-xs font-medium ${plan.isActive
                                            ? 'bg-success/10 text-success'
                                            : 'bg-border text-text-muted'
                                        }`}
                                >
                                    {plan.isActive ? 'Active' : 'Inactive'}
                                </button>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            <Modal
                isOpen={showModal}
                onClose={() => {
                    setShowModal(false)
                    resetForm()
                }}
                title={editingPlan ? 'Edit Plan' : 'Create Plan'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => {
                            setShowModal(false)
                            resetForm()
                        }}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            {editingPlan ? 'Update' : 'Create'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Plan Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="Basic"
                    />
                    <div>
                        <label className="label">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input min-h-[80px]"
                            placeholder="Optional description..."
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="CPU Cores"
                            type="number"
                            value={formData.cpu}
                            onChange={(e) => setFormData({ ...formData, cpu: parseInt(e.target.value) })}
                            required
                            min="1"
                        />
                        <Input
                            label="RAM (MB)"
                            type="number"
                            value={formData.ram}
                            onChange={(e) => setFormData({ ...formData, ram: parseInt(e.target.value) })}
                            required
                            min="512"
                            step="512"
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Storage (GB)"
                            type="number"
                            value={formData.storage}
                            onChange={(e) => setFormData({ ...formData, storage: parseInt(e.target.value) })}
                            required
                            min="10"
                            step="10"
                        />
                        <Input
                            label="Bandwidth (GB)"
                            type="number"
                            value={formData.bandwidth}
                            onChange={(e) => setFormData({ ...formData, bandwidth: parseInt(e.target.value) })}
                            required
                            min="100"
                            step="100"
                        />
                    </div>
                    <Input
                        label="Price (USD/month)"
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) })}
                        required
                        min="0"
                        step="0.01"
                    />
                </div>
            </Modal>
        </div>
    )
}
