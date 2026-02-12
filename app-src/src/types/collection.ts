// Curated Collection Types

export interface Collection {
  id: string
  name: string
  description?: string
  items: string[] // Item IDs in order
  createdAt: string
  updatedAt: string
  createdBy: string
}

export interface CollectionItem {
  id: string
  type: 'contribution' | 'artifact' | 'thread'
  title?: string
  preview?: string
  addedAt: string
}
