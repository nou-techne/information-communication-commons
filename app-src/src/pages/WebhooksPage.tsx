import { useState, useEffect } from 'react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { Button } from '../components/Button'
import { Input } from '../components/ui/Input'
import { webhookStore } from '../stores/webhook-store'
import { Webhook, Plus, Trash2, Power } from 'lucide-react'
import type { WebhookSubscription, WebhookEventType } from '../types/webhooks'

const ALL_EVENT_TYPES: WebhookEventType[] = [
  'contribution.created',
  'contribution.processed',
  'thread.created',
  'thread.resolved',
  'thread.consolidated',
  'thread.archived',
  'message.sent',
  'message.edited',
  'artifact.created',
  'artifact.tagged',
  'participant.joined',
  'reaction.added',
]

export default function WebhooksPage() {
  const [webhooks, setWebhooks] = useState<WebhookSubscription[]>([])
  const [showForm, setShowForm] = useState(false)
  const [formUrl, setFormUrl] = useState('')
  const [formEvents, setFormEvents] = useState<Set<WebhookEventType>>(new Set())
  const [formSecret, setFormSecret] = useState('')

  useEffect(() => {
    loadWebhooks()
  }, [])

  function loadWebhooks() {
    setWebhooks(webhookStore.list())
  }

  function handleCreate() {
    if (!formUrl || formEvents.size === 0) return

    webhookStore.add({
      url: formUrl,
      events: Array.from(formEvents),
      secret: formSecret || generateSecret(),
      active: true,
    })

    setFormUrl('')
    setFormEvents(new Set())
    setFormSecret('')
    setShowForm(false)
    loadWebhooks()
  }

  function toggleActive(id: string) {
    const webhook = webhookStore.get(id)
    if (!webhook) return
    webhookStore.update(id, { active: !webhook.active })
    loadWebhooks()
  }

  function deleteWebhook(id: string) {
    if (confirm('Delete this webhook?')) {
      webhookStore.remove(id)
      loadWebhooks()
    }
  }

  function toggleEvent(event: WebhookEventType) {
    setFormEvents(prev => {
      const next = new Set(prev)
      if (next.has(event)) {
        next.delete(event)
      } else {
        next.add(event)
      }
      return next
    })
  }

  function generateSecret(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    return Array.from({ length: 32 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Webhook className="w-6 h-6 text-[#c3fd50]" />
            <h1 className="text-2xl font-bold">Webhooks</h1>
          </div>
          <p className="text-sm text-gray-400">Receive real-time notifications when events occur</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)} icon={<Plus className="w-4 h-4" />}>
          Add Webhook
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardHeader>
            <h2 className="font-bold">New Webhook</h2>
          </CardHeader>
          <CardBody className="space-y-4">
            <Input
              label="Endpoint URL"
              value={formUrl}
              onChange={e => setFormUrl(e.target.value)}
              placeholder="https://example.com/webhook"
            />
            <Input
              label="Secret (optional, auto-generated if empty)"
              value={formSecret}
              onChange={e => setFormSecret(e.target.value)}
              placeholder="Leave empty to auto-generate"
            />
            <div>
              <label className="block text-sm font-medium mb-2">Events to Subscribe</label>
              <div className="grid grid-cols-2 gap-2">
                {ALL_EVENT_TYPES.map(event => (
                  <label key={event} className="flex items-center gap-2 text-sm cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formEvents.has(event)}
                      onChange={() => toggleEvent(event)}
                      className="rounded border-[#262626] bg-[#0f0f0f] text-[#c3fd50]"
                    />
                    <span className="text-gray-300">{event}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <Button onClick={handleCreate} disabled={!formUrl || formEvents.size === 0}>
                Create Webhook
              </Button>
              <Button variant="ghost" onClick={() => setShowForm(false)}>
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {webhooks.length === 0 ? (
        <div className="text-center py-16 text-gray-500">
          <Webhook className="w-12 h-12 mx-auto mb-4 opacity-50" />
          <p>No webhooks configured yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map(webhook => (
            <Card key={webhook.id}>
              <CardBody>
                <div className="flex items-start gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-white truncate">{webhook.url}</span>
                      <span
                        className={`px-2 py-0.5 text-xs rounded-full font-medium ${
                          webhook.active
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {webhook.active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                    <div className="text-sm text-gray-400 mb-2">
                      {webhook.events.length} event{webhook.events.length !== 1 ? 's' : ''}
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {webhook.events.slice(0, 5).map(event => (
                        <span
                          key={event}
                          className="text-xs px-2 py-0.5 rounded bg-[#0f0f0f] text-gray-400 border border-[#262626]"
                        >
                          {event}
                        </span>
                      ))}
                      {webhook.events.length > 5 && (
                        <span className="text-xs px-2 py-0.5 text-gray-500">
                          +{webhook.events.length - 5} more
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => toggleActive(webhook.id)}
                      className="text-gray-400 hover:text-white p-2"
                      title={webhook.active ? 'Deactivate' : 'Activate'}
                    >
                      <Power className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteWebhook(webhook.id)}
                      className="text-gray-400 hover:text-red-400 p-2"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
