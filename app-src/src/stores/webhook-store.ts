// Webhook Registry Store (Client-Side)

import type { WebhookSubscription, WebhookEventType } from '../types/webhooks'

const STORAGE_KEY = 'commons_webhooks'

class WebhookStore {
  private webhooks: Map<string, WebhookSubscription> = new Map()

  constructor() {
    this.load()
  }

  /**
   * Load webhooks from localStorage
   */
  private load(): void {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const data: WebhookSubscription[] = JSON.parse(stored)
        this.webhooks = new Map(data.map(w => [w.id, w]))
      }
    } catch (error) {
      console.error('Failed to load webhooks from storage:', error)
    }
  }

  /**
   * Save webhooks to localStorage
   */
  private save(): void {
    try {
      const data = Array.from(this.webhooks.values())
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    } catch (error) {
      console.error('Failed to save webhooks to storage:', error)
    }
  }

  /**
   * Add a new webhook subscription
   */
  add(webhook: Omit<WebhookSubscription, 'id' | 'created_at' | 'updated_at'>): WebhookSubscription {
    const id = this.generateId()
    const now = new Date().toISOString()
    
    const subscription: WebhookSubscription = {
      ...webhook,
      id,
      created_at: now,
      updated_at: now,
    }

    this.webhooks.set(id, subscription)
    this.save()
    return subscription
  }

  /**
   * Get a webhook by ID
   */
  get(id: string): WebhookSubscription | undefined {
    return this.webhooks.get(id)
  }

  /**
   * List all webhooks
   */
  list(): WebhookSubscription[] {
    return Array.from(this.webhooks.values())
  }

  /**
   * List active webhooks
   */
  listActive(): WebhookSubscription[] {
    return this.list().filter(w => w.active)
  }

  /**
   * List webhooks subscribed to a specific event
   */
  listByEvent(eventType: WebhookEventType): WebhookSubscription[] {
    return this.listActive().filter(w => w.events.includes(eventType))
  }

  /**
   * Update a webhook
   */
  update(id: string, updates: Partial<Omit<WebhookSubscription, 'id' | 'created_at'>>): WebhookSubscription | null {
    const existing = this.webhooks.get(id)
    if (!existing) return null

    const updated: WebhookSubscription = {
      ...existing,
      ...updates,
      updated_at: new Date().toISOString(),
    }

    this.webhooks.set(id, updated)
    this.save()
    return updated
  }

  /**
   * Remove a webhook
   */
  remove(id: string): boolean {
    const deleted = this.webhooks.delete(id)
    if (deleted) this.save()
    return deleted
  }

  /**
   * Clear all webhooks
   */
  clear(): void {
    this.webhooks.clear()
    this.save()
  }

  /**
   * Generate a unique ID
   */
  private generateId(): string {
    return `wh_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
  }
}

// Export singleton instance
export const webhookStore = new WebhookStore()

// Export class for testing
export { WebhookStore }
