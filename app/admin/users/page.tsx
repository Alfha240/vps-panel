'use client'

import { useState, useEffect } from 'react'
import { Users, Server, Shield, Coins } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface User {
    id: string
    name: string
    email: string
    isAdmin: boolean
    balance: number
    createdAt: string
    _count: {
        servers: number
    }
}

export default function AdminUsersPage() {
    const [users, setUsers] = useState<User[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [selectedUser, setSelectedUser] = useState<User | null>(null)
    const [formData, setFormData] = useState({
        amount: 0,
        type: 'add' as 'add' | 'deduct',
        reason: '',
    })

    useEffect(() => {
        fetchUsers()
    }, [])

    const fetchUsers = async () => {
        try {
            const response = await fetch('/api/admin/users')
            if (response.ok) {
                const data = await response.json()
                setUsers(data)
            }
        } catch (error) {
            console.error('Failed to fetch users:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleOpenModal = (user: User) => {
        setSelectedUser(user)
        setFormData({ amount: 0, type: 'add', reason: '' })
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setSelectedUser(null)
        setFormData({ amount: 0, type: 'add', reason: '' })
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        if (!selectedUser) return

        try {
            const response = await fetch(`/api/admin/users/${selectedUser.id}/coins`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                await fetchUsers()
                handleCloseModal()
            } else {
                const data = await response.json()
                alert(data.error || 'Failed to adjust coins')
            }
        } catch (error) {
            console.error('Failed to adjust coins:', error)
            alert('An error occurred')
        }
    }

    if (loading) {
        return <p className="text-text-muted text-center py-12">Loading users...</p>
    }

    const totalUsers = users.length
    const adminUsers = users.filter((u) => u.isAdmin).length
    const regularUsers = totalUsers - adminUsers

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-text-primary">Users Management</h1>
                <p className="text-text-secondary mt-1">View and manage all platform users</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-background-paper border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-600/10 p-3 rounded-lg">
                            <Users className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-text-primary">{totalUsers}</div>
                            <div className="text-sm text-text-muted">Total Users</div>
                        </div>
                    </div>
                </div>
                <div className="bg-background-paper border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-success/10 p-3 rounded-lg">
                            <Shield className="w-6 h-6 text-success" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-text-primary">{adminUsers}</div>
                            <div className="text-sm text-text-muted">Admins</div>
                        </div>
                    </div>
                </div>
                <div className="bg-background-paper border border-border rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <div className="bg-primary-600/10 p-3 rounded-lg">
                            <Users className="w-6 h-6 text-primary-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-text-primary">{regularUsers}</div>
                            <div className="text-sm text-text-muted">Regular Users</div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-background-paper border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-text-primary mb-4">All Users</h3>

                {users.length === 0 ? (
                    <p className="text-text-muted text-center py-8">No users found</p>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead>
                                <tr className="text-left text-xs text-text-muted border-b border-border">
                                    <th className="pb-2">User</th>
                                    <th className="pb-2">Role</th>
                                    <th className="pb-2">Balance</th>
                                    <th className="pb-2">Servers</th>
                                    <th className="pb-2">Joined</th>
                                    <th className="pb-2 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="text-sm">
                                {users.map((user) => (
                                    <tr key={user.id} className="border-b border-border last:border-0 hover:bg-background-elevated/50">
                                        <td className="py-3">
                                            <div>
                                                <div className="font-medium text-text-primary">{user.name}</div>
                                                <div className="text-xs text-text-muted">{user.email}</div>
                                            </div>
                                        </td>
                                        <td className="py-3">
                                            <span className={`px-2 py-1 rounded text-xs ${user.isAdmin
                                                ? 'bg-success/10 text-success'
                                                : 'bg-border text-text-muted'
                                                }`}>
                                                {user.isAdmin ? 'Admin' : 'User'}
                                            </span>
                                        </td>
                                        <td className="py-3 text-text-primary font-medium">
                                            ${user.balance.toFixed(2)}
                                        </td>
                                        <td className="py-3 text-text-secondary">
                                            <div className="flex items-center gap-1">
                                                <Server className="w-4 h-4" />
                                                {user._count.servers}
                                            </div>
                                        </td>
                                        <td className="py-3 text-text-secondary text-xs">
                                            {new Date(user.createdAt).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric',
                                            })}
                                        </td>
                                        <td className="py-3 text-right">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handleOpenModal(user)}
                                            >
                                                <Coins className="w-4 h-4 mr-1" />
                                                Add Coins
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Coin Management Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={`Manage Coins - ${selectedUser?.name}`}
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="bg-background-elevated border border-border rounded-lg p-3">
                        <div className="text-sm text-text-muted">Current Balance</div>
                        <div className="text-2xl font-bold text-text-primary">
                            ${selectedUser?.balance.toFixed(2)}
                        </div>
                    </div>

                    <Select
                        label="Action"
                        value={formData.type}
                        onChange={(e) => setFormData({ ...formData, type: e.target.value as 'add' | 'deduct' })}
                        required
                    >
                        <option value="add">Add Coins</option>
                        <option value="deduct">Deduct Coins</option>
                    </Select>

                    <Input
                        label="Amount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={formData.amount}
                        onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                        required
                    />

                    <Input
                        label="Reason"
                        placeholder="e.g., Manual top-up, Refund, etc."
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        required
                    />

                    <div className="bg-primary-600/10 border border-primary-500/20 rounded-lg p-3 text-sm text-text-muted">
                        💡 {formData.type === 'add' ? 'Adding' : 'Deducting'} <strong>${formData.amount.toFixed(2)}</strong> {formData.type === 'add' ? 'to' : 'from'} user's balance.
                        New balance will be: <strong>${((selectedUser?.balance || 0) + (formData.type === 'add' ? formData.amount : -formData.amount)).toFixed(2)}</strong>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                            Confirm {formData.type === 'add' ? 'Add' : 'Deduct'}
                        </Button>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
