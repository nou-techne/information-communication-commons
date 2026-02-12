import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../lib/supabase'

interface DimensionDef {
  key: string
  letter: string
  name: string
  tagName: string
  description: string
  color: string
}

const DIMENSIONS: DimensionDef[] = [
  { key: 'e', letter: 'e/', name: 'Ecology', tagName: 'hlamt:E', description: 'Where We Are — place, environment, context', color: '#4a8c6f' },
  { key: 'H', letter: 'H/', name: 'Human', tagName: 'hlamt:H', description: 'Who\'s Here — people, participants, relationships', color: '#c4956a' },
  { key: 'L', letter: 'L/', name: 'Language', tagName: 'hlamt:L', description: 'How We Talk — vocabulary, tags, shared concepts', color: '#a6ed2a' },
  { key: 'A', letter: 'A/', name: 'Artifacts', tagName: 'hlamt:A', description: 'What We\'re Building — tools, documents, infrastructure', color: '#8bbfff' },
  { key: 'M', letter: 'M/', name: 'Methodology', tagName: 'hlamt:M', description: 'How We Work — processes, governance, coordination', color: '#7ccfb8' },
  { key: 'T', letter: 'T/', name: 'Training', tagName: 'hlamt:T', description: 'What We\'re Learning — skills, transformation, practice', color: '#e8927c' },
  { key: 'S', letter: 'S/', name: 'Sessions', tagName: 'hlamt:S', description: 'Where Convergence Happens — unconference sessions emerging from attendee interests', color: '#c084fc' },
]

export function Dimensions() {
  const [counts, setCounts] = useState<Record<string, number>>({})

  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('tags')
        .select('name, artifact_tags(count)')
        .like('name', 'hlamt:%')

      if (data) {
        const c: Record<string, number> = {}
        for (const tag of data) {
          const arr = tag.artifact_tags as unknown as { count: number }[]
          c[tag.name] = arr?.[0]?.count ?? 0
        }
        setCounts(c)
      }
    }
    load()
  }, [])

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2">e/H-LAM/T/S</h1>
        <p className="text-gray-400">Seven dimensions of the knowledge graph. Each is a lens into the commons.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {DIMENSIONS.map(d => (
          <Link
            key={d.key}
            to={`/d/${d.key}`}
            className="block rounded-xl border border-[#1d2839] bg-[#0a101d] p-5 hover:bg-[#0a101d] transition-colors group"
          >
            <div className="flex items-baseline gap-3 mb-2">
              <span className="font-mono text-2xl font-bold" style={{ color: d.color }}>{d.letter}</span>
              <span className="text-lg font-semibold text-white">{d.name}</span>
            </div>
            <p className="text-sm text-gray-400 mb-3">{d.description}</p>
            <div className="text-xs text-gray-500">
              {counts[d.tagName] !== undefined ? `${counts[d.tagName]} artifacts` : '--'}
            </div>
          </Link>
        ))}
      </div>
    </div>
  )
}
