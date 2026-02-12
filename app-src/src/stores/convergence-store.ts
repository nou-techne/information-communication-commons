// Convergence Store

import type { Convergence } from '../types/convergence'
import { ETH_BOULDER_2026 } from '../types/convergence'

const STORAGE_KEY = 'commons_convergences'
const ACTIVE_KEY = 'commons_active_convergence'

class ConvergenceStore {
  private convergences: Map<string, Convergence> = new Map()
  private activeId: string | null = null

  constructor() {
    this.load()
  }

  /**
   * Load convergences from localStorage
   */
  private load() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data = JSON.parse(stored) as Convergence[]
        data.forEach(conv => this.convergences.set(conv.id, conv))
      } else {
        // Initialize with ETHBoulder if empty
        this.convergences.set(ETH_BOULDER_2026.id, ETH_BOULDER_2026)
        this.save()
      }

      const activeStored = localStorage.getItem(ACTIVE_KEY)
      if (activeStored && this.convergences.has(activeStored)) {
        this.activeId = activeStored
      } else if (this.convergences.size > 0) {
        this.activeId = Array.from(this.convergences.keys())[0]
      }
    } catch (error) {
      console.error('Failed to load convergences:', error)
    }
  }

  /**
   * Save convergences to localStorage
   */
  private save() {
    try {
      const data = Array.from(this.convergences.values())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
      if (this.activeId) {
        localStorage.setItem(ACTIVE_KEY, this.activeId)
      }
    } catch (error) {
      console.error('Failed to save convergences:', error)
    }
  }

  /**
   * Create a new convergence
   */
  create(convergence: Convergence): Convergence {
    const now = new Date().toISOString()
    const newConvergence: Convergence = {
      ...convergence,
      created_at: convergence.created_at || now,
      updated_at: now,
    }

    this.convergences.set(newConvergence.id, newConvergence)
    this.save()
    return newConvergence
  }

  /**
   * Get a convergence by id
   */
  get(id: string): Convergence | undefined {
    return this.convergences.get(id)
  }

  /**
   * Get all convergences
   */
  list(): Convergence[] {
    return Array.from(this.convergences.values())
  }

  /**
   * Update a convergence
   */
  update(id: string, updates: Partial<Convergence>): Convergence | undefined {
    const existing = this.convergences.get(id)
    if (!existing) return undefined

    const updated: Convergence = {
      ...existing,
      ...updates,
      id: existing.id, // Prevent id change
      updated_at: new Date().toISOString(),
    }

    this.convergences.set(id, updated)
    this.save()
    return updated
  }

  /**
   * Delete a convergence
   */
  delete(id: string): boolean {
    const deleted = this.convergences.delete(id)
    if (deleted) {
      if (this.activeId === id) {
        this.activeId = this.convergences.size > 0 ? Array.from(this.convergences.keys())[0] : null
      }
      this.save()
    }
    return deleted
  }

  /**
   * Set active convergence
   */
  setActive(id: string): boolean {
    if (!this.convergences.has(id)) return false
    this.activeId = id
    localStorage.setItem(ACTIVE_KEY, id)
    return true
  }

  /**
   * Get active convergence
   */
  getActive(): Convergence | null {
    return this.activeId ? this.convergences.get(this.activeId) || null : null
  }

  /**
   * Get active convergence ID
   */
  getActiveId(): string | null {
    return this.activeId
  }

  /**
   * Filter convergences by status
   */
  filterByStatus(status: Convergence['status']): Convergence[] {
    return this.list().filter(conv => conv.status === status)
  }

  /**
   * Search convergences by name or description
   */
  search(query: string): Convergence[] {
    const lowerQuery = query.toLowerCase()
    return this.list().filter(
      conv =>
        conv.name.toLowerCase().includes(lowerQuery) ||
        conv.description.toLowerCase().includes(lowerQuery) ||
        conv.location.city.toLowerCase().includes(lowerQuery)
    )
  }

  /**
   * Clear all convergences
   */
  clear() {
    this.convergences.clear()
    this.activeId = null
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(ACTIVE_KEY)
  }

  /**
   * Get convergence count
   */
  count(): number {
    return this.convergences.size
  }
}

// Export singleton instance
export const convergenceStore = new ConvergenceStore()
