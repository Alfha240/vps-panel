'use client'

import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2 } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'
import Card from '@/components/ui/Card'

interface Location {
    id: string
    name: string
    code: string
    country: string
    city: string
    description: string | null
    _count?: {
        nodes: number
    }
}

export default function LocationsPage() {
    const [locations, setLocations] = useState<Location[]>([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [editingLocation, setEditingLocation] = useState<Location | null>(null)

    const [formData, setFormData] = useState({
        name: '',
        code: '',
        country: '',
        city: '',
        description: '',
    })

    useEffect(() => {
        fetchLocations()
    }, [])

    const fetchLocations = async () => {
        try {
            const response = await fetch('/api/admin/locations')
            const data = await response.json()
            setLocations(data)
        } catch (error) {
            console.error('Failed to fetch locations:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleSubmit = async () => {
        try {
            const url = editingLocation
                ? `/api/admin/locations/${editingLocation.id}`
                : '/api/admin/locations'

            const response = await fetch(url, {
                method: editingLocation ? 'PUT' : 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            })

            if (response.ok) {
                fetchLocations()
                setShowModal(false)
                resetForm()
            }
        } catch (error) {
            console.error('Failed to save location:', error)
        }
    }

    const handleDelete = async (id: string) => {
        if (!confirm('Are you sure you want to delete this location?')) return

        try {
            const response = await fetch(`/api/admin/locations/${id}`, {
                method: 'DELETE',
            })

            if (response.ok) {
                fetchLocations()
            }
        } catch (error) {
            console.error('Failed to delete location:', error)
        }
    }

    const openEditModal = (location: Location) => {
        setEditingLocation(location)
        setFormData({
            name: location.name,
            code: location.code,
            country: location.country,
            city: location.city,
            description: location.description || '',
        })
        setShowModal(true)
    }

    const resetForm = () => {
        setFormData({ name: '', code: '', country: '', city: '', description: '' })
        setEditingLocation(null)
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">Locations</h1>
                    <p className="text-text-secondary mt-1">Manage geographical locations for your nodes</p>
                </div>
                <Button
                    variant="primary"
                    onClick={() => {
                        resetForm()
                        setShowModal(true)
                    }}
                >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Location
                </Button>
            </div>

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-text-muted">Loading...</p>
                </div>
            ) : locations.length === 0 ? (
                <Card>
                    <p className="text-text-muted text-center py-12">
                        No locations found. Create your first location to get started.
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {locations.map((location) => (
                        <Card key={location.id} hover>
                            <div className="flex items-start justify-between mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-text-primary">{location.name}</h3>
                                    <p className="text-sm text-text-secondary">{location.code}</p>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => openEditModal(location)}
                                        className="text-primary-400 hover:text-primary-300 transition-colors"
                                    >
                                        <Edit className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(location.id)}
                                        className="text-error hover:text-red-400 transition-colors"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-2 text-sm">
                                <p className="text-text-secondary">
                                    <span className="text-text-muted">City:</span> {location.city}
                                </p>
                                <p className="text-text-secondary">
                                    <span className="text-text-muted">Country:</span> {location.country}
                                </p>
                                {location.description && (
                                    <p className="text-text-muted mt-2">{location.description}</p>
                                )}
                                <p className="text-text-muted mt-4">
                                    {location._count?.nodes || 0} node{location._count?.nodes !== 1 ? 's' : ''}
                                </p>
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
                title={editingLocation ? 'Edit Location' : 'Create Location'}
                footer={
                    <>
                        <Button variant="secondary" onClick={() => {
                            setShowModal(false)
                            resetForm()
                        }}>
                            Cancel
                        </Button>
                        <Button variant="primary" onClick={handleSubmit}>
                            {editingLocation ? 'Update' : 'Create'}
                        </Button>
                    </>
                }
            >
                <div className="space-y-4">
                    <Input
                        label="Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        placeholder="US East"
                    />
                    <Input
                        label="Code"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                        placeholder="US-EAST"
                    />
                    <Input
                        label="Country"
                        value={formData.country}
                        onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                        required
                        placeholder="United States"
                    />
                    <Input
                        label="City"
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                        placeholder="New York"
                    />
                    <div>
                        <label className="label">Description</label>
                        <textarea
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            className="input min-h-[100px]"
                            placeholder="Optional description..."
                        />
                    </div>
                </div>
            </Modal>
        </div>
    )
}
