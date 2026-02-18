/**
 * Chain Explorer Page
 * 
 * Sprint Q39: Browse chain entries for any convergence
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * This page displays the merkle chain for a perpetual convergence.
 * Shows entries by event type, pattern layer, and aggregate.
 * Includes chain integrity verification status.
 */

import { useState, useEffect } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { queryChain, verifyChain, getChainStats } from '../lib/chain-engine'
import type { ChainEntry, ChainEventType, PatternLayer } from '../types/chain'
import { PATTERN_LAYER_NAMES, PATTERN_LAYER_COLORS } from '../types/chain'
import { Link } from 'react-router-dom'
import { Hash, CheckCircle, XCircle, Loader, Filter } from 'lucide-react'

export function ChainExplorer() {
  const { convergence } = useConvergence()
  const [entries, setEntries] = useState<ChainEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [verifying, setVerifying] = useState(false)
  const [verification, setVerification] = useState<{ valid: boolean; violations: string[]; entriesChecked: number } | null>(null)
  const [stats, setStats] = useState<{
    totalEntries: number
    firstEntry: string | null
    lastEntry: string | null
    eventTypeCounts: Record<string, number>
    layerCounts: Record<string, number>
  } | null>(null)
  
  // Filters
  const [selectedLayer, setSelectedLayer] = useState<PatternLayer | null>(null)
  const [selectedEventType, setSelectedEventType] = useState<ChainEventType | null>(null)
  
  useEffect(() => {
    loadChain()
    loadStats()
  }, [convergence.id, selectedLayer, selectedEventType])
  
  async function loadChain() {
    setLoading(true)
    try {
      const result = await queryChain({
        convergenceId: convergence.id,
        patternLayer: selectedLayer || undefined,
        eventType: selectedEventType || undefined,
        limit: 1000,
      })
      setEntries(result)
    } catch (error) {
      console.error('Failed to load chain:', error)
    } finally {
      setLoading(false)
    }
  }
  
  async function loadStats() {
    try {
      const result = await getChainStats(convergence.id)
      setStats(result)
    } catch (error) {
      console.error('Failed to load stats:', error)
    }
  }
  
  async function runVerification() {
    setVerifying(true)
    try {
      const result = await verifyChain(convergence.id)
      setVerification(result)
    } catch (error) {
      console.error('Verification failed:', error)
    } finally {
      setVerifying(false)
    }
  }
  
  const eventTypes = stats ? Object.keys(stats.eventTypeCounts).sort() : []
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="border-b border-[#1d2839] pb-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Chain Explorer</h1>
            <p className="text-gray-400">
              Merkle chain for <span className="text-white font-medium">{convergence.name}</span>
            </p>
          </div>
          <button
            onClick={runVerification}
            disabled={verifying}
            className="px-4 py-2 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-lg hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {verifying ? (
              <>
                <Loader className="w-4 h-4 animate-spin" />
                Verifying...
              </>
            ) : (
              <>
                <Hash className="w-4 h-4" />
                Verify Chain
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Verification Status */}
      {verification && (
        <div className={`p-4 rounded-lg border ${
          verification.valid
            ? 'bg-green-500/10 border-green-500/30 text-green-400'
            : 'bg-red-500/10 border-red-500/30 text-red-400'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            {verification.valid ? (
              <>
                <CheckCircle className="w-5 h-5" />
                <span className="font-semibold">Chain is valid</span>
              </>
            ) : (
              <>
                <XCircle className="w-5 h-5" />
                <span className="font-semibold">Chain verification failed</span>
              </>
            )}
          </div>
          <p className="text-sm opacity-80">
            {verification.entriesChecked} entries checked
          </p>
          {verification.violations.length > 0 && (
            <ul className="mt-2 space-y-1 text-sm">
              {verification.violations.map((v, i) => (
                <li key={i}>• {v}</li>
              ))}
            </ul>
          )}
        </div>
      )}
      
      {/* Stats */}
      {stats && stats.totalEntries > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Total Entries</div>
            <div className="text-2xl font-bold">{stats.totalEntries}</div>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">First Entry</div>
            <div className="text-sm font-mono">
              {stats.firstEntry ? new Date(stats.firstEntry).toLocaleDateString() : 'N/A'}
            </div>
          </div>
          <div className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4">
            <div className="text-sm text-gray-400 mb-1">Latest Entry</div>
            <div className="text-sm font-mono">
              {stats.lastEntry ? new Date(stats.lastEntry).toLocaleDateString() : 'N/A'}
            </div>
          </div>
        </div>
      )}
      
      {/* Filters */}
      <div className="flex flex-wrap gap-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Pattern Layer</label>
          <select
            value={selectedLayer || ''}
            onChange={(e) => setSelectedLayer(e.target.value ? parseInt(e.target.value) as PatternLayer : null)}
            className="px-3 py-2 bg-[#0a101d] border border-[#1d2839] rounded-lg text-sm"
          >
            <option value="">All Layers</option>
            {([1, 2, 3, 4, 5, 6, 7] as PatternLayer[]).map(layer => (
              <option key={layer} value={layer}>
                Layer {layer}: {PATTERN_LAYER_NAMES[layer]}
              </option>
            ))}
          </select>
        </div>
        
        <div>
          <label className="block text-sm text-gray-400 mb-2">Event Type</label>
          <select
            value={selectedEventType || ''}
            onChange={(e) => setSelectedEventType(e.target.value as ChainEventType || null)}
            className="px-3 py-2 bg-[#0a101d] border border-[#1d2839] rounded-lg text-sm"
          >
            <option value="">All Events</option>
            {eventTypes.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </div>
        
        {(selectedLayer || selectedEventType) && (
          <button
            onClick={() => { setSelectedLayer(null); setSelectedEventType(null); }}
            className="mt-auto px-3 py-2 text-sm text-gray-400 hover:text-white"
          >
            Clear filters
          </button>
        )}
      </div>
      
      {/* Chain Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader className="w-6 h-6 animate-spin text-gray-400" />
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-12">
          <Hash className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 mb-2">No chain entries yet</p>
          <p className="text-sm text-gray-500">
            The chain will start when the first event is recorded
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {entries.map((entry, i) => (
            <div
              key={entry.id}
              className="bg-[#0a101d] border border-[#1d2839] rounded-lg p-4 hover:border-[#2a3849] transition-colors"
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: PATTERN_LAYER_COLORS[entry.pattern_layer] }}
                    title={`Layer ${entry.pattern_layer}: ${PATTERN_LAYER_NAMES[entry.pattern_layer]}`}
                  />
                  <div>
                    <div className="font-mono text-sm text-gray-400">
                      Entry #{entry.chain_index}
                    </div>
                    <div className="text-white font-medium">{entry.event_type}</div>
                  </div>
                </div>
                <div className="text-right text-xs">
                  <div className="text-gray-400">
                    {new Date(entry.created_at).toLocaleString()}
                  </div>
                  <div className="text-gray-500 font-mono">
                    {entry.aggregate_type}
                  </div>
                </div>
              </div>
              
              <div className="mt-3 space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Hash:</span>{' '}
                  <span className="font-mono text-gray-400">{entry.content_hash.slice(0, 16)}...</span>
                </div>
                <div>
                  <span className="text-gray-500">Prev:</span>{' '}
                  <span className="font-mono text-gray-400">
                    {entry.prev_hash === 'genesis' ? 'genesis' : `${entry.prev_hash.slice(0, 16)}...`}
                  </span>
                </div>
                {Object.keys(entry.payload).length > 0 && (
                  <details className="mt-2">
                    <summary className="cursor-pointer text-gray-500 hover:text-gray-400">
                      Payload ({Object.keys(entry.payload).length} fields)
                    </summary>
                    <pre className="mt-2 p-3 bg-[#080c16] rounded border border-[#1d2839] text-xs overflow-x-auto">
                      {JSON.stringify(entry.payload, null, 2)}
                    </pre>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
