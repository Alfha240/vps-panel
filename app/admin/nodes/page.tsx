'use client'

import { useState, useEffect } from 'react'
import { Server, Plus, Trash2 } from 'lucide-react'
import Card from '@/components/ui/Card'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'

interface Node {
    id: string
    name: string
    hostname: string
    ipAddress: string
    locationId: string
    location: {
        id: string
        name: string
        city: string
    }
}

interface Location {
    id: string
    name: string
    city: string
}

export default function AdminNodesPage() {
    const [nodes, setNodes] = useState<Node[]>([])
    const [locations, setLocations] = useState<Location[]>([])
    const [loading, setLoading] = useState(true)
    const [isModalOpen, setIsModalOpen] = useState(false)
    const [formData, setFormData] = useState({
        // Basic Information
        displayName: '',
        locationId: '',
        proxmoxNode: 'pve',

        // Authentication
        tokenId: '',
        tokenSecret: '',

        // Connection
        fqdn: '',
        port: 8006,
        verifyTls: false,

        // Resources
        maxCpu: 0,
        maxRam: 0,
        maxStorage: 0,
    })

    useEffect(() => {
        fetchData()
    }, [])

    const fetchData = async () => {
        try {
            const [nodesRes, locationsRes] = await Promise.all([
                fetch('/api/admin/nodes'),
                fetch('/api/admin/locations'),
            ])

            if (nodesRes.ok) {
                const nodesData = await nodesRes.json()
                setNodes(nodesData)
            }

            if (locationsRes.ok) {
                const locationsData = await locationsRes.json()
                setLocations(locationsData)
            }
        } catch (error) {
            console.error('Failed to fetch data:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()

        try {
            const payload = {
                name: formData.displayName,
                hostname: formData.fqdn,
                ipAddress: formData.fqdn,
                proxmoxUrl: `https://${formData.fqdn}:${formData.port}`,
                proxmoxTokenId: formData.tokenId,
                proxmoxTokenSecret: formData.tokenSecret,
                proxmoxNode: formData.proxmoxNode,
                maxCpu: formData.maxCpu,
                maxRam: formData.maxRam,
                maxStorage: formData.maxStorage,
                locationId: formData.locationId,
            }

            const response = await fetch('/api/admin/nodes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            })

            if (response.ok) {
                await fetchData()
                handleCloseModal()
            } else {
                const data = await response.json()
                alert(data.error || 'Failed to create node')
            }
        } catch (error) {
            console.error('Failed to create node:', error)
            alert('An error occurred while creating the node')
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this node?')) return

        try {
            const response = await fetch(`/api/admin/nodes/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                await fetchData()
            } else {
                alert('Failed to delete node')
            }
        } catch (error) {
            console.error('Failed to delete node:', error)
        }
    }

    const handleCloseModal = () => {
        setIsModalOpen(false)
        setFormData({
            displayName: '',
            locationId: '',
            proxmoxNode: 'pve',
            tokenId: '',
            tokenSecret: '',
            fqdn: '',
            port: 8006,
            verifyTls: false,
            maxCpu: 0,
            maxRam: 0,
            maxStorage: 0,
        })
    }

    if (loading) {
        return <p className="text-text-muted text-center py-12">Loading nodes...</p>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Infrastructure Nodes</h1>
                    <p className="text-text-secondary mt-1">Manage your compute nodes and resources</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Node
                </Button>
            </div>

            {nodes.length === 0 ? (
                <Card>
                    <div className="text-center py-12">
                        <Server className="w-12 h-12 text-text-muted mx-auto mb-4" />
                        <h3 className="text-lg font-semibold text-text-primary mb-2">No nodes yet</h3>
                        <p className="text-text-muted mb-4">Add your first infrastructure node to get started</p>
                        {locations.length === 0 && (
                            <p className="text-warning text-sm">
                                ⚠️ Create a location first before adding nodes
                            </p>
                        )}
                    </div>
                </Card>
            ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {nodes.map((node) => (
                        <Card key={node.id} hover>
                            <div className="flex items-start justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <div className="bg-primary-600/10 p-3 rounded-lg">
                                        <Server className="w-6 h-6 text-primary-400" />
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-semibold text-text-primary">{node.name}</h3>
                                        <p className="text-sm text-text-muted">{node.ipAddress}</p>
                                    </div>
                                </div>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    onClick={() => handleDelete(node.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                            </div>
                            <div className="bg-background-elevated p-3 rounded-lg">
                                <p className="text-xs text-text-muted mb-1">Location</p>
                                <p className="text-sm text-text-primary">{node.location.city}</p>
                            </div>
                        </Card>
                    ))}
                </div>
            )}

            {/* Add Node Modal */}
            <Modal isOpen={isModalOpen} onClose={handleCloseModal} title="Create a Node">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* BASIC INFORMATION */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-text-primary font-semibold">
                            <div className="bg-primary-600/20 p-1.5 rounded">
                                <Server className="w-4 h-4 text-primary-400" />
                            </div>
                            <h3 className="text-sm uppercase tracking-wide">Basic Information</h3>
                        </div>

                        <Input
                            label="Display Name"
                            placeholder="Node 1"
                            value={formData.displayName}
                            onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                            required
                        />

                        <Select
                            label="Location Group"
                            value={formData.locationId}
                            onChange={(e) => setFormData({ ...formData, locationId: e.target.value })}
                            required
                        >
                            <option value="">Select location</option>
                            {locations.map((location) => (
                                <option key={location.id} value={location.id}>
                                    {location.name} ({location.city})
                                </option>
                            ))}
                        </Select>

                        <Input
                            label="Node Name in Proxmox"
                            placeholder="pve"
                            value={formData.proxmoxNode}
                            onChange={(e) => setFormData({ ...formData, proxmoxNode: e.target.value })}
                            required
                        />
                    </div>

                    {/* AUTHENTICATION */}
                    <div className="space-y-4 border-t border-border pt-4">
                        <div className="flex items-center gap-2 text-text-primary font-semibold">
                            <div className="bg-warning/20 p-1.5 rounded">
                                <span className="text-warning text-sm">🔑</span>
                            </div>
                            <h3 className="text-sm uppercase tracking-wide">Authentication</h3>
                        </div>

                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm text-warning">
                            ⚠️ Please create API token in Proxmox and grant required privileges
                        </div>

                        <Input
                            label="Token ID"
                            placeholder="root@pam!vps-panel"
                            value={formData.tokenId}
                            onChange={(e) => setFormData({ ...formData, tokenId: e.target.value })}
                            required
                        />

                        <Input
                            label="Secret"
                            type="password"
                            placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                            value={formData.tokenSecret}
                            onChange={(e) => setFormData({ ...formData, tokenSecret: e.target.value })}
                            required
                        />
                    </div>

                    {/* CONNECTION */}
                    <div className="space-y-4 border-t border-border pt-4">
                        <div className="flex items-center gap-2 text-text-primary font-semibold">
                            <div className="bg-success/20 p-1.5 rounded">
                                <span className="text-success text-sm">🔗</span>
                            </div>
                            <h3 className="text-sm uppercase tracking-wide">Connection</h3>
                        </div>

                        <Input
                            label="FQDN"
                            placeholder="192.168.1.100 or proxmox.example.com"
                            value={formData.fqdn}
                            onChange={(e) => setFormData({ ...formData, fqdn: e.target.value })}
                            required
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <Input
                                label="Port"
                                type="number"
                                value={formData.port}
                                onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                                required
                            />

                            <div className="flex items-end pb-2">
                                <label className="flex items-center gap-2 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        checked={formData.verifyTls}
                                        onChange={(e) => setFormData({ ...formData, verifyTls: e.target.checked })}
                                        className="w-4 h-4 rounded border-border bg-background text-primary-500"
                                    />
                                    <span className="text-sm text-text-secondary">Verify TLS Certificate</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* RESOURCES */}
                    <div className="space-y-4 border-t border-border pt-4">
                        <div className="flex items-center gap-2 text-text-primary font-semibold">
                            <div className="bg-primary-600/20 p-1.5 rounded">
                                <span className="text-primary-400 text-sm">📊</span>
                            </div>
                            <h3 className="text-sm uppercase tracking-wide">Resources</h3>
                        </div>

                        <div className="grid grid-cols-3 gap-4">
                            <Input
                                label="CPU (cores)"
                                type="number"
                                min="0"
                                value={formData.maxCpu}
                                onChange={(e) => setFormData({ ...formData, maxCpu: parseInt(e.target.value) || 0 })}
                            />
                            <Input
                                label="RAM (GB)"
                                type="number"
                                min="0"
                                value={formData.maxRam}
                                onChange={(e) => setFormData({ ...formData, maxRam: parseInt(e.target.value) || 0 })}
                            />
                            <Input
                                label="Storage (GB)"
                                type="number"
                                min="0"
                                value={formData.maxStorage}
                                onChange={(e) => setFormData({ ...formData, maxStorage: parseInt(e.target.value) || 0 })}
                            />
                        </div>
                    </div>

                    {locations.length === 0 && (
                        <div className="bg-warning/10 border border-warning/20 rounded-lg p-3 text-sm text-warning">
                            ⚠️ No locations available. Please create a location first.
                        </div>
                    )}

                    <div className="flex gap-3 pt-4 border-t border-border">
                        <Button type="submit" className="flex-1" disabled={locations.length === 0}>
                            + Create
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
