'use client'

import { useState, useEffect } from 'react'
import { Network, Globe, Plus, ChevronDown, ChevronUp, Server } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface IPAddress {
    id: string
    address: string
    isAssigned: boolean
    server: { name: string; hostname: string } | null
}

interface IPPool {
    id: string
    cidr: string
    gateway: string
    location: { name: string; id: string }
    ipAddresses: IPAddress[]
}

export default function AdminIPAMPage() {
    const [pools, setPools] = useState<IPPool[]>([])
    const [servers, setServers] = useState<any[]>([])
    const [expandedPools, setExpandedPools] = useState<Set<string>>(new Set())
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [loading, setLoading] = useState(true)

    const [formData, setFormData] = useState({
        poolId: '',
        creationMode: 'single' as 'single' | 'multiple',
        ipType: 'ipv4' as 'ipv4' | 'ipv6',

        // Single mode
        address: '',
        cidr: '24',
        gateway: '',
        macAddress: '',
        serverId: '',

        // Multiple mode
        startingAddress: '',
        endingAddress: '',
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [poolsRes, serversRes] = await Promise.all([
                fetch('/api/admin/ipam'),
                fetch('/api/admin/servers'),
            ])

            if (poolsRes.ok) {
                const poolsData = await poolsRes.json()
                setPools(poolsData)
            }

            if (serversRes.ok) {
                const serversData = await serversRes.json()
                setServers(serversData)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const togglePool = (poolId: string) => {
        const newExpanded = new Set(expandedPools)
        if (newExpanded.has(poolId)) {
            newExpanded.delete(poolId)
        } else {
            newExpanded.add(poolId)
        }
        setExpandedPools(newExpanded)
    }

    const handleOpenModal = (poolId?: string) => {
        setFormData({
            poolId: poolId || '',
            creationMode: 'single',
            ipType: 'ipv4',
            address: '',
            cidr: '24',
            gateway: '',
            macAddress: '',
            serverId: '',
            startingAddress: '',
            endingAddress: '',
        })
        setIsModalOpen(true)
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const response = await fetch('/api/admin/ipam/addresses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                await fetchData()
                handleCloseModal()
            } else {
                const data = await response.json()
                alert(data.error || 'Failed to create address')
            }
        } catch (error) {
            console.error('Failed to create address:', error)
            alert('An error occurred')
        }
    }

    if (loading) {
        return <p className="text-text-muted text-center py-12">Loading...</p>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">IP Address Management</h1>
                    <p className="text-text-secondary mt-1">Manage IP pools and address assignments</p>
                </div>
                <Button onClick={() => handleOpenModal()}>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Address
                </Button>
            </div>

            {pools.length === 0 ? (
                <div className="bg-background-paper border border-border rounded-lg p-12 text-center">
                    <Network className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No IP Pools</h3>
                    <p className="text-text-muted">Create IP pools to assign addresses to servers</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {pools.map((pool) => {
                        const totalIPs = pool.ipAddresses.length
                        const assignedIPs = pool.ipAddresses.filter(ip => ip.isAssigned).length
                        const availableIPs = totalIPs - assignedIPs
                        const isExpanded = expandedPools.has(pool.id)

                        return (
                            <div key={pool.id} className="bg-background-paper border border-border rounded-lg overflow-hidden">
                                {/* Pool Header */}
                                <div
                                    className="p-6 cursor-pointer hover:bg-background-elevated/50 transition-colors"
                                    onClick={() => togglePool(pool.id)}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Globe className="w-5 h-5 text-primary-400" />
                                                <h3 className="text-lg font-bold text-text-primary">{pool.cidr}</h3>
                                                {isExpanded ? (
                                                    <ChevronUp className="w-5 h-5 text-text-muted" />
                                                ) : (
                                                    <ChevronDown className="w-5 h-5 text-text-muted" />
                                                )}
                                            </div>
                                            <p className="text-sm text-text-muted">
                                                {pool.location.name} • Gateway: {pool.gateway}
                                            </p>
                                        </div>

                                        <div className="flex items-center gap-6">
                                            <div className="text-center">
                                                <div className="text-xs text-text-muted mb-1">Total IPs</div>
                                                <div className="text-lg font-semibold text-text-primary">{totalIPs}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-text-muted mb-1">Assigned</div>
                                                <div className="text-lg font-semibold text-success">{assignedIPs}</div>
                                            </div>
                                            <div className="text-center">
                                                <div className="text-xs text-text-muted mb-1">Available</div>
                                                <div className="text-lg font-semibold text-primary-400">{availableIPs}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* IP Address List */}
                                {isExpanded && (
                                    <div className="border-t border-border p-6 bg-background-elevated/30">
                                        <div className="flex items-center justify-between mb-4">
                                            <h4 className="text-sm font-medium text-text-primary">
                                                IP Addresses ({pool.ipAddresses.length})
                                            </h4>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    handleOpenModal(pool.id)
                                                }}
                                            >
                                                <Plus className="w-4 h-4 mr-1" />
                                                Add IP
                                            </Button>
                                        </div>

                                        {pool.ipAddresses.length > 0 ? (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-left text-xs text-text-muted border-b border-border">
                                                            <th className="pb-2">Address</th>
                                                            <th className="pb-2">Status</th>
                                                            <th className="pb-2">Assigned To</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {pool.ipAddresses.map((ip) => (
                                                            <tr key={ip.id} className="border-b border-border last:border-0 hover:bg-background-elevated/50">
                                                                <td className="py-3 font-mono text-text-primary">{ip.address}</td>
                                                                <td className="py-3">
                                                                    <span className={`px-2 py-1 rounded text-xs ${ip.isAssigned
                                                                            ? 'bg-success/10 text-success'
                                                                            : 'bg-border text-text-muted'
                                                                        }`}>
                                                                        {ip.isAssigned ? 'Assigned' : 'Available'}
                                                                    </span>
                                                                </td>
                                                                <td className="py-3 text-text-secondary">
                                                                    {ip.server ? (
                                                                        <div className="flex items-center gap-2">
                                                                            <Server className="w-4 h-4" />
                                                                            {ip.server.hostname}
                                                                        </div>
                                                                    ) : '-'}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        ) : (
                                            <p className="text-text-muted text-center py-8">No IP addresses in this pool</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}

            {/* Create Address Modal */}
            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title="Create Address"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Creation Mode */}
                    <div>
                        <label className="text-sm font-medium text-text-primary mb-2 block">
                            # Creation Mode
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, creationMode: 'single' })}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.creationMode === 'single'
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-background-elevated text-text-muted hover:bg-background-elevated/80'
                                    }`}
                            >
                                Single
                            </button>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, creationMode: 'multiple' })}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${formData.creationMode === 'multiple'
                                        ? 'bg-primary-600 text-white'
                                        : 'bg-background-elevated text-text-muted hover:bg-background-elevated/80'
                                    }`}
                            >
                                Multiple
                            </button>
                        </div>
                    </div>

                    {/* IP Type */}
                    <div>
                        <label className="text-sm font-medium text-text-primary mb-2 block">
                            @ IP Type
                        </label>
                        <div className="space-y-2">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={formData.ipType === 'ipv4'}
                                    onChange={() => setFormData({ ...formData, ipType: 'ipv4' })}
                                    className="text-primary-600"
                                />
                                <span className="text-text-primary">IPv4</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={formData.ipType === 'ipv6'}
                                    onChange={() => setFormData({ ...formData, ipType: 'ipv6' })}
                                    className="text-primary-600"
                                />
                                <span className="text-text-primary">IPv6</span>
                            </label>
                        </div>
                    </div>

                    {/* Address Configuration */}
                    <div>
                        <label className="text-sm font-medium text-text-primary mb-2 block">
                            ⚙ Address Configuration
                        </label>

                        {formData.creationMode === 'single' ? (
                            <>
                                <Input
                                    label="Address"
                                    placeholder="192.168.1.10"
                                    value={formData.address}
                                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                                    required
                                />
                                <Input
                                    label="CIDR"
                                    placeholder="24"
                                    value={formData.cidr}
                                    onChange={(e) => setFormData({ ...formData, cidr: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Gateway"
                                    placeholder="192.168.1.1"
                                    value={formData.gateway}
                                    onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Mac Address"
                                    placeholder="00:00:00:00:00:00 (optional)"
                                    value={formData.macAddress}
                                    onChange={(e) => setFormData({ ...formData, macAddress: e.target.value })}
                                />
                            </>
                        ) : (
                            <>
                                <Input
                                    label="Starting Address"
                                    placeholder="192.168.1.10"
                                    value={formData.startingAddress}
                                    onChange={(e) => setFormData({ ...formData, startingAddress: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Ending Address"
                                    placeholder="192.168.1.20"
                                    value={formData.endingAddress}
                                    onChange={(e) => setFormData({ ...formData, endingAddress: e.target.value })}
                                    required
                                />
                                <Input
                                    label="CIDR"
                                    placeholder="24"
                                    value={formData.cidr}
                                    onChange={(e) => setFormData({ ...formData, cidr: e.target.value })}
                                    required
                                />
                                <Input
                                    label="Gateway"
                                    placeholder="192.168.1.1"
                                    value={formData.gateway}
                                    onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
                                    required
                                />
                            </>
                        )}
                    </div>

                    {/* Server Assignment (Single mode only) */}
                    {formData.creationMode === 'single' && (
                        <div>
                            <label className="text-sm font-medium text-text-primary mb-2 block">
                                💻 Server Assignment
                            </label>
                            <Select
                                label="Assigned Server"
                                value={formData.serverId}
                                onChange={(e) => setFormData({ ...formData, serverId: e.target.value })}
                            >
                                <option value="">Unassigned</option>
                                {servers.map((server) => (
                                    <option key={server.id} value={server.id}>
                                        {server.hostname}
                                    </option>
                                ))}
                            </Select>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">
                            CREATE
                        </Button>
                        <Button type="button" variant="secondary" onClick={handleCloseModal}>
                            CANCEL
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
