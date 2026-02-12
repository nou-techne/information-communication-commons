import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Link2, ShieldCheck, ShieldAlert } from 'lucide-react'

interface ChainHead {
  head_seq: number
  head_hash: string
  total_contributions: number
  total_artifacts: number
  chain_intact: boolean
  last_contribution_at: string
}

export function ChainStatus({ compact = false }: { compact?: boolean }) {
  const [head, setHead] = useState<ChainHead | null>(null)

  useEffect(() => {
    supabase.rpc('chain_head').then(({ data }) => {
      if (data && data.length > 0) setHead(data[0])
    })
  }, [])

  if (!head) return null

  if (compact) {
    return (
      <div className="flex items-center gap-2 text-xs">
        {head.chain_intact ? (
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
        ) : (
          <ShieldAlert className="w-3.5 h-3.5 text-red-400" />
        )}
        <span className="text-gray-400">
          Chain #{head.head_seq}
        </span>
        <span className="font-mono text-gray-600" title={head.head_hash}>
          {head.head_hash?.slice(0, 8)}…
        </span>
      </div>
    )
  }

  return (
    <div className="rounded-lg border border-[#1d2839] bg-[#0a101d] p-4">
      <div className="flex items-center gap-2 mb-3">
        <Link2 className="w-4 h-4 text-[#a6ed2a]" />
        <h3 className="text-sm font-semibold text-white">Convergence Chain</h3>
        {head.chain_intact ? (
          <span className="ml-auto flex items-center gap-1 text-xs text-emerald-400">
            <ShieldCheck className="w-3.5 h-3.5" /> Intact
          </span>
        ) : (
          <span className="ml-auto flex items-center gap-1 text-xs text-red-400">
            <ShieldAlert className="w-3.5 h-3.5" /> Broken
          </span>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 text-sm">
        <div>
          <div className="text-gray-500 text-xs">HEAD</div>
          <div className="font-mono text-white">#{head.head_seq}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Hash</div>
          <div className="font-mono text-gray-300 text-xs truncate" title={head.head_hash}>
            {head.head_hash?.slice(0, 16)}…
          </div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Contributions</div>
          <div className="text-white">{head.total_contributions}</div>
        </div>
        <div>
          <div className="text-gray-500 text-xs">Artifacts</div>
          <div className="text-white">{head.total_artifacts}</div>
        </div>
      </div>
    </div>
  )
}
