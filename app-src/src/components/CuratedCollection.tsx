import { useState } from 'react'
import { GripVertical, X, Plus } from 'lucide-react'
import type { Collection } from '../types/collection'
import { Card } from './ui/Card'
import { Button } from './Button'

interface CuratedCollectionProps {
  collection: Collection
  onAddItem?: () => void
  onRemoveItem?: (itemId: string) => void
  onReorder?: (itemIds: string[]) => void
  editable?: boolean
}

export function CuratedCollection({
  collection,
  onAddItem,
  onRemoveItem,
  onReorder,
  editable = false,
}: CuratedCollectionProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)

  function handleDragStart(index: number) {
    setDraggedIndex(index)
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (draggedIndex === null || draggedIndex === index) return

    const items = [...collection.items]
    const [removed] = items.splice(draggedIndex, 1)
    items.splice(index, 0, removed)

    onReorder?.(items)
    setDraggedIndex(index)
  }

  function handleDragEnd() {
    setDraggedIndex(null)
  }

  return (
    <Card className="p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold mb-1">{collection.name}</h3>
          {collection.description && (
            <p className="text-sm text-gray-400">{collection.description}</p>
          )}
        </div>
        {editable && (
          <Button size="sm" onClick={onAddItem}>
            <Plus className="w-4 h-4 mr-1" />
            Add Item
          </Button>
        )}
      </div>

      {collection.items.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No items in this collection</p>
          {editable && (
            <Button size="sm" onClick={onAddItem} className="mt-4">
              <Plus className="w-4 h-4 mr-1" />
              Add First Item
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          {collection.items.map((itemId, index) => (
            <div
              key={itemId}
              draggable={editable}
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`flex items-center gap-3 p-3 bg-[#0a101d] border border-[#1d2839] rounded ${
                editable ? 'cursor-move' : ''
              } ${draggedIndex === index ? 'opacity-50' : ''}`}
            >
              {editable && (
                <GripVertical className="w-4 h-4 text-gray-500 flex-shrink-0" />
              )}
              
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">
                  Item {itemId.slice(0, 8)}...
                </div>
                <div className="text-xs text-gray-500">
                  {/* TODO: Fetch and display actual item preview */}
                </div>
              </div>

              {editable && (
                <button
                  onClick={() => onRemoveItem?.(itemId)}
                  className="p-1 hover:bg-[#1d2839] rounded transition-colors"
                  aria-label="Remove item"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 text-xs text-gray-500">
        {collection.items.length} item{collection.items.length !== 1 ? 's' : ''} · 
        Last updated {new Date(collection.updatedAt).toLocaleDateString()}
      </div>
    </Card>
  )
}
