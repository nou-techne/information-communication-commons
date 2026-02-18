/**
 * Education Editor — Community Writer Toolkit (Q70)
 * 
 * Allows TIO-08 role to author/edit glossary terms and articles.
 * Enforces style guide: plain language, analogies, no jargon.
 */

import { useState } from 'react'
import { useConvergence } from '../contexts/ConvergenceContext'
import { upsertGlossaryTerm } from '../lib/education-engine'
import type { GlossaryTerm, Topic, ComplexityLevel } from '../types/education'
import { 
  Edit3, Eye, Save, AlertTriangle, Type, 
  CheckCircle, Loader2, BookOpen
} from 'lucide-react'

// Style Guide Rules
const STYLE_RULES = [
  { check: (text: string) => text.split(' ').length < 25, label: 'Short sentences (<25 words)' },
  { check: (text: string) => !text.includes('utilize'), label: 'Avoid "utilize" (use "use")' },
  { check: (text: string) => !text.includes('leverage'), label: 'Avoid "leverage" (use "use")' },
  { check: (text: string) => text.toLowerCase().includes('like') || text.toLowerCase().includes('imagine'), label: 'Use an analogy' },
]

export function EducationEditor() {
  const { convergence } = useConvergence()
  const [mode, setMode] = useState<'edit' | 'preview'>('edit')
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')

  // Form State
  const [title, setTitle] = useState('')
  const [plainDef, setPlainDef] = useState('')
  const [formalDef, setFormalDef] = useState('')
  const [example, setExample] = useState('')
  const [topic, setTopic] = useState<Topic>('general')
  const [complexity, setComplexity] = useState<ComplexityLevel>('newcomer')

  async function handleSave() {
    if (!title || !plainDef) return
    setSaving(true)
    try {
      const termId = `term-${title.toLowerCase().replace(/\s+/g, '-')}`
      const term: GlossaryTerm = {
        id: termId,
        type: 'glossary_term',
        title,
        plainDefinition: plainDef,
        formalDefinition: formalDef,
        example,
        topic,
        complexity,
        briefText: plainDef.slice(0, 140),
        fullText: `${plainDef}\n\n### Formal Definition\n${formalDef}\n\n### Example\n${example}`,
        helpContexts: [],
        version: 1,
        author: 'current-user', // TODO: get real user
        published: true,
        relatedTerms: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }

      await upsertGlossaryTerm({
        convergenceId: convergence.id,
        term,
        actorId: 'current-user',
      })
      
      setMessage('Term saved to chain!')
      // Reset form
      setTitle('')
      setPlainDef('')
      setFormalDef('')
      setExample('')
    } catch (err: any) {
      setMessage(`Error: ${err.message}`)
    } finally {
      setSaving(false)
    }
  }

  // Style Check
  const styleScore = STYLE_RULES.filter(r => r.check(plainDef)).length
  const styleTotal = STYLE_RULES.length

  return (
    <div className="max-w-4xl mx-auto bg-white/[0.02] border border-white/10 rounded-lg overflow-hidden">
      <div className="bg-white/5 p-4 border-b border-white/10 flex justify-between items-center">
        <h2 className="text-lg font-medium text-white flex items-center gap-2">
          <Edit3 className="w-5 h-5 text-copper-400" />
          Education Editor
        </h2>
        <div className="flex gap-2">
          <button
            onClick={() => setMode('edit')}
            className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-2 ${mode === 'edit' ? 'bg-copper-500 text-white' : 'text-white/60 hover:bg-white/5'}`}
          >
            <Type className="w-3.5 h-3.5" /> Edit
          </button>
          <button
            onClick={() => setMode('preview')}
            className={`px-3 py-1.5 text-xs rounded-md flex items-center gap-2 ${mode === 'preview' ? 'bg-copper-500 text-white' : 'text-white/60 hover:bg-white/5'}`}
          >
            <Eye className="w-3.5 h-3.5" /> Preview
          </button>
        </div>
      </div>

      <div className="p-6 grid grid-cols-3 gap-6">
        {/* Main Editor */}
        <div className="col-span-2 space-y-4">
          {mode === 'edit' ? (
            <>
              <div>
                <label className="text-xs text-white/50 mb-1 block">Term Title</label>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-copper-400/50 outline-none"
                  placeholder="e.g. Capital Account"
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Plain English Definition (No Jargon)</label>
                <textarea
                  value={plainDef}
                  onChange={e => setPlainDef(e.target.value)}
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-copper-400/50 outline-none resize-none"
                  placeholder="Explain it like you're talking to a friend..."
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Concrete Example</label>
                <textarea
                  value={example}
                  onChange={e => setExample(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-copper-400/50 outline-none resize-none"
                  placeholder="e.g. If you contribute $500..."
                />
              </div>

              <div>
                <label className="text-xs text-white/50 mb-1 block">Formal/Legal Definition (Optional)</label>
                <textarea
                  value={formalDef}
                  onChange={e => setFormalDef(e.target.value)}
                  rows={2}
                  className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white focus:border-copper-400/50 outline-none resize-none"
                  placeholder="IRC 704(b) definition..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Topic</label>
                  <select 
                    value={topic}
                    onChange={e => setTopic(e.target.value as Topic)}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none"
                  >
                    <option value="general">General</option>
                    <option value="patronage">Patronage</option>
                    <option value="royalties">Royalties</option>
                    <option value="governance">Governance</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-white/50 mb-1 block">Complexity</label>
                  <select 
                    value={complexity}
                    onChange={e => setComplexity(e.target.value as ComplexityLevel)}
                    className="w-full bg-white/5 border border-white/10 rounded px-3 py-2 text-white outline-none"
                  >
                    <option value="newcomer">Newcomer</option>
                    <option value="practitioner">Practitioner</option>
                    <option value="steward">Steward</option>
                  </select>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white/5 border border-white/10 rounded-lg p-6">
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="w-5 h-5 text-copper-400" />
                <h3 className="text-xl font-medium text-white">{title || 'Untitled Term'}</h3>
              </div>
              <p className="text-white/80 mb-4 text-lg leading-relaxed">{plainDef || 'No definition provided.'}</p>
              {example && (
                <div className="bg-black/20 p-3 rounded border-l-2 border-copper-400/50 italic text-white/60 mb-4">
                  "{example}"
                </div>
              )}
              {formalDef && (
                <div className="text-xs text-white/40 pt-4 border-t border-white/5">
                  <strong className="block mb-1 text-white/20 uppercase tracking-wider">Formal Definition</strong>
                  {formalDef}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Sidebar: Style Guide */}
        <div className="space-y-6">
          <div className="bg-blue-500/10 border border-blue-400/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-blue-300 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4" /> Style Guide
            </h3>
            <div className="space-y-2">
              {STYLE_RULES.map((rule, i) => {
                const passed = rule.check(plainDef)
                return (
                  <div key={i} className={`flex items-center gap-2 text-xs ${passed ? 'text-green-400' : 'text-white/40'}`}>
                    {passed ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-white/20" />}
                    {rule.label}
                  </div>
                )
              })}
            </div>
            <div className="mt-3 pt-3 border-t border-white/5 text-xs text-white/30">
              Score: {styleScore}/{styleTotal}
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-400/20 rounded-lg p-4">
            <h3 className="text-sm font-medium text-yellow-300 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Guidelines
            </h3>
            <ul className="text-xs text-white/60 space-y-1 list-disc pl-4">
              <li>Use active voice ("You receive..." not "Receipt is given...")</li>
              <li>Teach at point of need</li>
              <li>Use the user's data when possible</li>
            </ul>
          </div>

          <button
            onClick={handleSave}
            disabled={saving || !title || !plainDef}
            className="w-full bg-copper-500 hover:bg-copper-400 disabled:bg-white/10 disabled:text-white/30 text-white font-medium py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save to Chain
          </button>
          
          {message && (
            <p className={`text-xs text-center ${message.includes('Error') ? 'text-red-400' : 'text-green-400'}`}>
              {message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
