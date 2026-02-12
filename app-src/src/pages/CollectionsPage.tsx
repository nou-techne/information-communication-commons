import { useState, useEffect } from 'react'
import { Plus, BookMarked, X, Edit2, Trash2 } from 'lucide-react'
import { collectionStore } from '../stores/collection-store'
import type { Collection } from '../types/collection'
import { CuratedCollection } from '../components/CuratedCollection'
import { Button } from '../components/Button'
import { Input } from '../components/ui/Input'
import { Textarea } from '../components/ui/Textarea'
import { Card } from '../components/ui/Card'

export default function CollectionsPage() {
  const [collections, setCollections] = useState<Collection[]>([])
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [formData, setFormData] = useState({ name: '', description: '' })

  function loadCollections() {
    setCollections(collectionStore.list())
  }

  useEffect(() => {
    loadCollections()
  }, [])

  function handleCreate() {
    if (!formData.name.trim()) return

    collectionStore.create({
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      createdBy: 'current-user', // TODO: Get from auth
    })

    setFormData({ name: '', description: '' })
    setIsCreating(false)
    loadCollections()
  }

  function handleUpdate(id: string) {
    if (!formData.name.trim()) return

    collectionStore.update(id, {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
    })

    setFormData({ name: '', description: '' })
    setEditingId(null)
    loadCollections()
  }

  function handleDelete(id: string) {
    if (confirm('Delete this collection?')) {
      collectionStore.delete(id)
      loadCollections()
    }
  }

  function startEdit(collection: Collection) {
    setFormData({
      name: collection.name,
      description: collection.description || '',
    })
    setEditingId(collection.id)
  }

  function handleReorder(collectionId: string, itemIds: string[]) {
    collectionStore.reorderItems(collectionId, itemIds)
    loadCollections()
  }

  function handleRemoveItem(collectionId: string, itemId: string) {
    collectionStore.removeItem(collectionId, itemId)
    loadCollections()
  }

  return (
    <div className="max-w-6xl mx-auto p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Collections</h1>
          <p className="text-gray-400">Curated sets of contributions</p>
        </div>
        <Button onClick={() => setIsCreating(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Collection
        </Button>
      </div>

      {/* Create/Edit Form */}
      {(isCreating || editingId) && (
        <Card className="p-6 mb-6">
          <h3 className="text-lg font-bold mb-4">
            {isCreating ? 'Create Collection' : 'Edit Collection'}
          </h3>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium mb-2">
                Name
              </label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Collection name"
                autoFocus
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium mb-2">
                Description (optional)
              </label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="What's this collection about?"
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                onClick={() => isCreating ? handleCreate() : handleUpdate(editingId!)}
                disabled={!formData.name.trim()}
              >
                {isCreating ? 'Create' : 'Save'}
              </Button>
              <Button
                variant="secondary"
                onClick={() => {
                  setIsCreating(false)
                  setEditingId(null)
                  setFormData({ name: '', description: '' })
                }}
              >
                Cancel
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Collections List */}
      {collections.length === 0 ? (
        <Card className="p-8 text-center">
          <BookMarked className="w-12 h-12 mx-auto mb-4 text-gray-600" />
          <p className="text-gray-400 mb-4">No collections yet</p>
          <Button onClick={() => setIsCreating(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create First Collection
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {collections.map(collection => (
            <div key={collection.id}>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xl font-bold">{collection.name}</h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => startEdit(collection)}
                    className="p-2 hover:bg-[#1a1a1a] rounded transition-colors"
                    aria-label="Edit collection"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(collection.id)}
                    className="p-2 hover:bg-[#1a1a1a] rounded transition-colors text-red-500"
                    aria-label="Delete collection"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <CuratedCollection
                collection={collection}
                editable
                onReorder={(itemIds) => handleReorder(collection.id, itemIds)}
                onRemoveItem={(itemId) => handleRemoveItem(collection.id, itemId)}
                onAddItem={() => {
                  // TODO: Open item picker dialog
                  const itemId = `item_${Date.now()}`
                  collectionStore.addItem(collection.id, itemId)
                  loadCollections()
                }}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
