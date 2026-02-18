/**
 * Public Venture Portfolio — Non-Authenticated View
 * 
 * Sprint Q76: Public page showing Techne ventures (opt-in per venture).
 * Recruitment surface + cooperative model explanation.
 */

import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { Rocket, Users, ExternalLink, ArrowRight, Heart } from 'lucide-react'

interface PublicVenture {
  name: string
  description: string
  status: string
  teamSize: number
  tags: string[]
  websiteUrl?: string
}

export function PublicPortfolio() {
  const [ventures, setVentures] = useState<PublicVenture[]>([])

  useEffect(() => {
    // Mock public ventures (in production, filtered by opt-in flag)
    setVentures([
      {
        name: 'commons.id',
        description: 'Cooperative economic infrastructure — patronage accounting, contribution tracking, and governance tools built on append-only merkle chains.',
        status: 'Active',
        teamSize: 4,
        tags: ['Cooperative Economics', 'TypeScript', 'Supabase'],
        websiteUrl: 'https://commons.id',
      },
      {
        name: 'Habitat',
        description: 'Composable organizational tools — Treasury, People, Agreements as independent, event-sourced modules unified by REA ontology.',
        status: 'Building',
        teamSize: 3,
        tags: ['REA', 'Event Sourcing', 'Open Source'],
      },
    ])
  }, [])

  return (
    <div style={{ minHeight: '100vh', background: '#0d0f0c', color: '#e8e0d4' }}>
      {/* Hero */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '80px 24px 60px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, color: '#6a8858', textTransform: 'uppercase', marginBottom: 16 }}>
          Techne · Venture Studio
        </p>
        <h1 style={{ fontFamily: 'serif', fontSize: 'clamp(28px, 5vw, 48px)', fontWeight: 400, lineHeight: 1.2, marginBottom: 24, color: '#d8e8cc' }}>
          Co-created tools for the living economy
        </h1>
        <p style={{ fontSize: 17, lineHeight: 1.8, color: '#b0c4a0', maxWidth: 540 }}>
          Techne is a cooperative venture studio in Boulder, Colorado. Members co-create open tools 
          and share in the value they generate — through patronage and royalties.
        </p>
      </div>

      {/* How it works */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 60px' }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 16 }}>
          {[
            { title: 'Contribute', desc: 'Members submit work — code, research, coordination, design. Contributions are reviewed and credited.', icon: '📝' },
            { title: 'Co-Create', desc: 'Ventures emerge from the studio. Members earn royalty shares with vesting schedules.', icon: '🚀' },
            { title: 'Share', desc: 'Revenue flows back through the cooperative. Democratic governance. One member, one vote.', icon: '🤝' },
          ].map((step, i) => (
            <div key={i} style={{ background: '#181c14', border: '1px solid rgba(124,182,104,0.1)', borderRadius: 3, padding: 24 }}>
              <span style={{ fontSize: 24, display: 'block', marginBottom: 12 }}>{step.icon}</span>
              <h3 style={{ fontFamily: 'serif', fontSize: 18, fontWeight: 500, color: '#d8e8cc', marginBottom: 8 }}>{step.title}</h3>
              <p style={{ fontSize: 14, lineHeight: 1.7, color: '#8aa07a' }}>{step.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Ventures */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '0 24px 80px' }}>
        <p style={{ fontFamily: 'monospace', fontSize: 11, letterSpacing: 3, color: '#6a8858', textTransform: 'uppercase', marginBottom: 24 }}>
          Active Ventures
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {ventures.map((v, i) => (
            <div key={i} style={{ background: '#181c14', border: '1px solid rgba(124,182,104,0.1)', borderRadius: 3, padding: 28 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <h3 style={{ fontFamily: 'serif', fontSize: 22, fontWeight: 500, color: '#d8e8cc' }}>{v.name}</h3>
                <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, color: '#6a8858', background: 'rgba(124,182,104,0.08)', padding: '4px 10px', borderRadius: 2 }}>
                  {v.status}
                </span>
              </div>
              <p style={{ fontSize: 15, lineHeight: 1.75, color: '#8aa07a', marginBottom: 16 }}>{v.description}</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  {v.tags.map(tag => (
                    <span key={tag} style={{ fontFamily: 'monospace', fontSize: 10, color: '#6a8858', background: 'rgba(124,182,104,0.08)', padding: '3px 8px', borderRadius: 2 }}>
                      {tag}
                    </span>
                  ))}
                </div>
                <span style={{ fontSize: 12, color: '#506840' }}>{v.teamSize} members</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '24px', borderTop: '1px solid rgba(124,182,104,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontFamily: 'monospace', fontSize: 10, letterSpacing: 2, color: '#506840' }}>
            TECHNE · BOULDER, CO
          </span>
          <span style={{ fontFamily: 'monospace', fontSize: 10, color: '#506840' }}>
            RegenHub, LCA
          </span>
        </div>
      </div>
    </div>
  )
}
