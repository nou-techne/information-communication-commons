// Collection Store

import type { Collection } from '../types/collection'

const STORAGE_KEY = 'commons_collections'

class CollectionStore {
  private collections: Map<string, Collection> = new Map()

  constructor() {
    this.load()
  }

  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored) as Collection[]
        data.forEach(c => this.collections.set(c.id, c))
      }
    } catch (error) {
      console.error('Failed to load collections:', error)
    }
  }

  private save() {
    try {
      const data = Array.from(this.collections.values())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save collections:', error)
    }
  }

  create(params: {
    name: string
    description?: string
    createdBy: string
  }): Collection {
    const collection: Collection = {
      id: `collection_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`,
      name: params.name,
      description: params.description,
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: params.createdBy,
    }

    this.collections.set(collection.id, collection)
    this.save()
    return collection
  }

  get(id: string): Collection | undefined {
    return this.collections.get(id)
  }

  list(): Collection[] {
    return Array.from(this.collections.values())
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  }

  update(id: string, updates: Partial<Pick<Collection, 'name' | 'description'>>): Collection | undefined {
    const collection = this.collections.get(id)
    if (!collection) return undefined

    const updated = {
      ...collection,
      ...updates,
      updatedAt: new Date().toISOString(),
    }

    this.collections.set(id, updated)
    this.save()
    return updated
  }

  delete(id: string): boolean {
    const deleted = this.collections.delete(id)
    if (deleted) this.save()
    return deleted
  }

  addItem(collectionId: string, itemId: string): Collection | undefined {
    const collection = this.collections.get(collectionId)
    if (!collection) return undefined

    if (!collection.items.includes(itemId)) {
      collection.items.push(itemId)
      collection.updatedAt = new Date().toISOString()
      this.save()
    }

    return collection
  }

  removeItem(collectionId: string, itemId: string): Collection | undefined {
    const collection = this.collections.get(collectionId)
    if (!collection) return undefined

    collection.items = collection.items.filter(id => id !== itemId)
    collection.updatedAt = new Date().toISOString()
    this.save()
    return collection
  }

  reorderItems(collectionId: string, itemIds: string[]): Collection | undefined {
    const collection = this.collections.get(collectionId)
    if (!collection) return undefined

    collection.items = itemIds
    collection.updatedAt = new Date().toISOString()
    this.save()
    return collection
  }

  clear() {
    this.collections.clear()
    localStorage.removeItem(STORAGE_KEY)
  }
}

export const collectionStore = new CollectionStore()
