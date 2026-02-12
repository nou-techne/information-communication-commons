import { useState } from 'react'
import { Wifi, Share2, Download, Upload } from 'lucide-react'
import { Card, CardHeader, CardBody } from '../components/ui/Card'
import { PeerRegistry } from '../components/PeerRegistry'
import type { PeerNode } from '../types/federation'

export default function FederationPage() {
  // Mock peers - in real app, fetch from store
  const [peers] = useState<PeerNode[]>([
    {
      id: 'peer1',
      name: 'ETHDenver Commons',
      endpoint: 'https://commons.ethdenver.com/api/federation',
      status: 'online',
      capabilities: ['sync', 'search', 'publish'],
      lastSeen: new Date(Date.now() - 300000).toISOString(),
      metadata: {
        convergences: ['ethdenver_2026'],
      },
    },
    {
      id: 'peer2',
      name: 'Devcon Commons',
      endpoint: 'https://commons.devcon.org/api/federation',
      status: 'offline',
      capabilities: ['sync', 'search'],
      lastSeen: new Date(Date.now() - 86400000).toISOString(),
    },
  ])

  const [sharingPreferences, setSharingPreferences] = useState({
    contributions: true,
    threads: true,
    artifacts: true,
    participants: false,
    messages: false,
  })

  const [acceptPreferences, setAcceptPreferences] = useState({
    contributions: true,
    threads: true,
    artifacts: true,
    participants: false,
    messages: false,
  })

  function toggleSharing(key: keyof typeof sharingPreferences) {
    setSharingPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  function toggleAccept(key: keyof typeof acceptPreferences) {
    setAcceptPreferences(prev => ({ ...prev, [key]: !prev[key] }))
  }

  // Mock sync stats
  const syncStats = {
    totalSynced: 1247,
    lastSync: new Date(Date.now() - 180000).toISOString(),
    pendingUp: 12,
    pendingDown: 8,
  }

  return (
    <div className="max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Wifi className="w-6 h-6 text-[#a6ed2a]" />
          <h1 className="text-2xl font-bold">Federation</h1>
        </div>
        <p className="text-sm text-gray-400">
          Connect with peer nodes to share and sync convergence data
        </p>
      </div>

      {/* Sync Status Dashboard */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardBody>
            <div className="text-sm text-gray-400 mb-1">Items Synced</div>
            <div className="text-2xl font-bold">{syncStats.totalSynced}</div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="text-sm text-gray-400 mb-1">Last Sync</div>
            <div className="text-sm font-medium">
              {Math.floor((Date.now() - new Date(syncStats.lastSync).getTime()) / 60000)}m ago
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Upload className="w-4 h-4 text-[#a6ed2a]" />
              <div>
                <div className="text-sm text-gray-400">Pending Upload</div>
                <div className="text-xl font-bold">{syncStats.pendingUp}</div>
              </div>
            </div>
          </CardBody>
        </Card>
        <Card>
          <CardBody>
            <div className="flex items-center gap-2">
              <Download className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-sm text-gray-400">Pending Download</div>
                <div className="text-xl font-bold">{syncStats.pendingDown}</div>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Sharing Preferences */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-[#a6ed2a]" />
            <h3 className="font-bold">What to Share</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {Object.entries(sharingPreferences).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-sm text-gray-300 group-hover:text-white capitalize">
                    {key}
                  </span>
                  <button
                    onClick={() => toggleSharing(key as keyof typeof sharingPreferences)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      value ? 'bg-[#a6ed2a]' : 'bg-[#1d2839]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#1d2839] text-xs text-gray-500">
              Content types enabled for sharing will be sent to connected peers during sync
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <Download className="w-5 h-5 text-blue-400" />
            <h3 className="font-bold">What to Accept</h3>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              {Object.entries(acceptPreferences).map(([key, value]) => (
                <label
                  key={key}
                  className="flex items-center justify-between cursor-pointer group"
                >
                  <span className="text-sm text-gray-300 group-hover:text-white capitalize">
                    {key}
                  </span>
                  <button
                    onClick={() => toggleAccept(key as keyof typeof acceptPreferences)}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      value ? 'bg-blue-500' : 'bg-[#1d2839]'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white transition-transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </label>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-[#1d2839] text-xs text-gray-500">
              Content types enabled for accepting will be received from connected peers during sync
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Peer Registry */}
      <PeerRegistry
        peers={peers}
        onAddPeer={peer => {
          console.log('Add peer:', peer)
          // TODO: Add to store
        }}
        onRemovePeer={peerId => {
          console.log('Remove peer:', peerId)
          // TODO: Remove from store
        }}
        onSyncPeer={peerId => {
          console.log('Sync peer:', peerId)
          // TODO: Trigger sync
        }}
      />
    </div>
  )
}
