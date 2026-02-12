import { useState } from 'react'
import { Wifi, WifiOff, HelpCircle, Trash2, Plus, ExternalLink } from 'lucide-react'
import { Card, CardHeader, CardBody } from './ui/Card'
import { Button } from './Button'
import { Input } from './ui/Input'
import type { PeerNode } from '../types/federation'

interface PeerRegistryProps {
  peers: PeerNode[]
  onAddPeer?: (peer: Omit<PeerNode, 'id' | 'lastSeen'>) => void
  onRemovePeer?: (peerId: string) => void
  onSyncPeer?: (peerId: string) => void
}

export function PeerRegistry({ peers, onAddPeer, onRemovePeer, onSyncPeer }: PeerRegistryProps) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [formName, setFormName] = useState('')
  const [formEndpoint, setFormEndpoint] = useState('')

  function handleAdd() {
    if (!formName || !formEndpoint) return

    onAddPeer?.({
      name: formName,
      endpoint: formEndpoint,
      status: 'unknown',
      capabilities: ['sync', 'search', 'publish'],
    })

    setFormName('')
    setFormEndpoint('')
    setShowAddForm(false)
  }

  function handleRemove(peerId: string, peerName: string) {
    if (confirm(`Remove peer "${peerName}"? This cannot be undone.`)) {
      onRemovePeer?.(peerId)
    }
  }

  function getStatusIcon(status: PeerNode['status']) {
    switch (status) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-400" />
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-400" />
      default:
        return <HelpCircle className="w-4 h-4 text-gray-500" />
    }
  }

  function formatLastSeen(lastSeen?: string) {
    if (!lastSeen) return 'Never'
    const date = new Date(lastSeen)
    const now = Date.now()
    const diff = now - date.getTime()
    const minutes = Math.floor(diff / 60000)
    const hours = Math.floor(diff / 3600000)
    const days = Math.floor(diff / 86400000)

    if (minutes < 1) return 'Just now'
    if (minutes < 60) return `${minutes}m ago`
    if (hours < 24) return `${hours}h ago`
    return `${days}d ago`
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold">Peer Registry</h2>
          <p className="text-sm text-gray-400">Manage federated peer nodes</p>
        </div>
        <Button
          onClick={() => setShowAddForm(!showAddForm)}
          icon={<Plus className="w-4 h-4" />}
        >
          Add Peer
        </Button>
      </div>

      {/* Add Peer Form */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <h3 className="font-bold">New Peer</h3>
          </CardHeader>
          <CardBody className="space-y-3">
            <Input
              label="Peer Name"
              value={formName}
              onChange={e => setFormName(e.target.value)}
              placeholder="ETHDenver Commons"
            />
            <Input
              label="Endpoint URL"
              value={formEndpoint}
              onChange={e => setFormEndpoint(e.target.value)}
              placeholder="https://commons.ethdenver.com/api/federation"
            />
            <div className="flex gap-2">
              <Button onClick={handleAdd} disabled={!formName || !formEndpoint}>
                Add Peer
              </Button>
              <Button variant="ghost" onClick={() => setShowAddForm(false)}>
                Cancel
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* Peer List */}
      {peers.length === 0 ? (
        <Card>
          <CardBody className="text-center py-8 text-gray-500">
            <Wifi className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No peers configured</p>
            <p className="text-xs mt-1">Add a peer to start federating</p>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {peers.map(peer => (
            <Card key={peer.id}>
              <CardBody>
                <div className="flex items-start gap-4">
                  {/* Status Icon */}
                  <div className="mt-1">{getStatusIcon(peer.status)}</div>

                  {/* Peer Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-white">{peer.name}</h3>
                      <a
                        href={peer.endpoint}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-gray-500 hover:text-[#a6ed2a]"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                    <div className="text-xs text-gray-400 mb-2 truncate">{peer.endpoint}</div>

                    <div className="flex flex-wrap gap-2 text-xs">
                      <span className="text-gray-500">Last sync: {formatLastSeen(peer.lastSeen)}</span>
                      <span className="text-gray-600">•</span>
                      <span className="text-gray-500">{peer.capabilities.length} capabilities</span>
                      {peer.metadata?.convergences && (
                        <>
                          <span className="text-gray-600">•</span>
                          <span className="text-gray-500">
                            {peer.metadata.convergences.length} convergences
                          </span>
                        </>
                      )}
                    </div>

                    {/* Capabilities */}
                    <div className="flex flex-wrap gap-1 mt-2">
                      {peer.capabilities.map(cap => (
                        <span
                          key={cap}
                          className="px-2 py-0.5 text-xs rounded bg-[#0a101d] text-gray-400 border border-[#1d2839]"
                        >
                          {cap}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    {onSyncPeer && (
                      <button
                        onClick={() => onSyncPeer(peer.id)}
                        className="text-gray-400 hover:text-[#a6ed2a] px-2 py-1 text-sm"
                        disabled={peer.status === 'offline'}
                      >
                        Sync
                      </button>
                    )}
                    <button
                      onClick={() => handleRemove(peer.id, peer.name)}
                      className="text-gray-400 hover:text-red-400 p-2"
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
