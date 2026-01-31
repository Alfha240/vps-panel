'use client'

import { useState, useEffect } from 'react'
import { Plus, FileCode, MoreVertical, Edit, Trash } from 'lucide-react'
import Button from '@/components/ui/Button'
import Modal from '@/components/ui/Modal'
import Input from '@/components/ui/Input'

interface OSTemplate {
    id: string
    name: string
    version: string
    proxmoxTemplateId: number
    description?: string
    isActive: boolean
}

interface TemplateGroup {
    id: string
    name: string
    icon?: string
    isActive: boolean
    templates: OSTemplate[]
}

export default function AdminTemplatesPage() {
    const [groups, setGroups] = useState<TemplateGroup[]>([])
    const [loading, setLoading] = useState(true)
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false)
    const [isTemplateModalOpen, setIsTemplateModalOpen] = useState(false)
    const [selectedGroupId, setSelectedGroupId] = useState('')

    const [groupFormData, setGroupFormData] = useState({
        name: '',
        icon: '',
    })

    const [templateFormData, setTemplateFormData] = useState({
        groupId: '',
        name: '',
        version: '',
        proxmoxTemplateId: 0,
        description: '',
    })

    useEffect(() => {
        fetchGroups()
    }, [])

    const fetchGroups = async () => {
        try {
            const response = await fetch('/api/admin/templates')
            if (response.ok) {
                const data = await response.json()
                setGroups(data)
            }
        } catch (error) {
            console.error('Failed to fetch templates:', error)
        } finally {
            setLoading(false)
        }
    }

    const handleCreateGroup = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/admin/templates/groups', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(groupFormData),
            })

            if (response.ok) {
                await fetchGroups()
                setIsGroupModalOpen(false)
                setGroupFormData({ name: '', icon: '' })
            }
        } catch (error) {
            console.error('Failed to create group:', error)
        }
    }

    const handleCreateTemplate = async (e: React.FormEvent) => {
        e.preventDefault()
        try {
            const response = await fetch('/api/admin/templates', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(templateFormData),
            })

            if (response.ok) {
                await fetchGroups()
                setIsTemplateModalOpen(false)
                setTemplateFormData({ groupId: '', name: '', version: '', proxmoxTemplateId: 0, description: '' })
            }
        } catch (error) {
            console.error('Failed to create template:', error)
        }
    }

    const handleOpenTemplateModal = (groupId: string) => {
        setSelectedGroupId(groupId)
        setTemplateFormData({ ...templateFormData, groupId })
        setIsTemplateModalOpen(true)
    }

    if (loading) {
        return <p className="text-text-muted text-center py-12">Loading...</p>
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-text-primary">OS Templates</h1>
                    <p className="text-text-secondary mt-1">Manage Proxmox templates for VM deployment</p>
                </div>
                <Button onClick={() => setIsGroupModalOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    New Template Group
                </Button>
            </div>

            {groups.length === 0 ? (
                <div className="bg-background-paper border border-border rounded-lg p-12 text-center">
                    <FileCode className="w-12 h-12 text-text-muted mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-text-primary mb-2">No Template Groups</h3>
                    <p className="text-text-muted">Create template groups to organize your OS templates</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {groups.map((group) => (
                        <div key={group.id} className="bg-background-paper border border-border rounded-lg overflow-hidden">
                            {/* Group Header */}
                            <div className="bg-background-elevated p-4 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        {group.icon && <span className="text-2xl">{group.icon}</span>}
                                        <FileCode className="w-5 h-5 text-primary-400" />
                                        <h3 className="font-semibold text-text-primary">{group.name}</h3>
                                    </div>
                                    <button className="text-text-muted hover:text-text-primary p-1">
                                        <MoreVertical className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>

                            {/* Templates List */}
                            <div className="p-4 space-y-2">
                                {group.templates.length > 0 ? (
                                    group.templates.map((template) => (
                                        <div
                                            key={template.id}
                                            className="flex items-center justify-between p-3 bg-background-elevated rounded-lg hover:bg-background-elevated/80 transition-colors"
                                        >
                                            <div>
                                                <div className="font-medium text-text-primary">{template.name}</div>
                                                <div className="text-xs text-text-muted">
                                                    VMID: {template.proxmoxTemplateId}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className={`px-2 py-1 rounded text-xs ${template.isActive
                                                        ? 'bg-success/10 text-success'
                                                        : 'bg-border text-text-muted'
                                                    }`}>
                                                    {template.isActive ? 'Active' : 'Inactive'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-text-muted text-sm text-center py-4">No templates</p>
                                )}

                                <Button
                                    size="sm"
                                    variant="secondary"
                                    className="w-full mt-2"
                                    onClick={() => handleOpenTemplateModal(group.id)}
                                >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Template
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Create Group Modal */}
            <Modal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                title="New Template Group"
            >
                <form onSubmit={handleCreateGroup} className="space-y-4">
                    <Input
                        label="Group Name"
                        placeholder="Ubuntu, Debian, etc."
                        value={groupFormData.name}
                        onChange={(e) => setGroupFormData({ ...groupFormData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Icon (Emoji)"
                        placeholder="🐧"
                        value={groupFormData.icon}
                        onChange={(e) => setGroupFormData({ ...groupFormData, icon: e.target.value })}
                    />
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">Create</Button>
                        <Button type="button" variant="secondary" onClick={() => setIsGroupModalOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>

            {/* Create Template Modal */}
            <Modal
                isOpen={isTemplateModalOpen}
                onClose={() => setIsTemplateModalOpen(false)}
                title="Add Template"
            >
                <form onSubmit={handleCreateTemplate} className="space-y-4">
                    <Input
                        label="Template Name"
                        placeholder="Ubuntu 22.04"
                        value={templateFormData.name}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, name: e.target.value })}
                        required
                    />
                    <Input
                        label="Version"
                        placeholder="22.04"
                        value={templateFormData.version}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, version: e.target.value })}
                        required
                    />
                    <Input
                        label="Proxmox Template ID (VMID)"
                        type="number"
                        placeholder="1002"
                        value={templateFormData.proxmoxTemplateId || ''}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, proxmoxTemplateId: parseInt(e.target.value) || 0 })}
                        required
                    />
                    <Input
                        label="Description (Optional)"
                        placeholder="Ubuntu 22.04 LTS Server"
                        value={templateFormData.description}
                        onChange={(e) => setTemplateFormData({ ...templateFormData, description: e.target.value })}
                    />
                    <div className="flex gap-3 pt-4">
                        <Button type="submit" className="flex-1">Create</Button>
                        <Button type="button" variant="secondary" onClick={() => setIsTemplateModalOpen(false)}>
                            Cancel
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    )
}
