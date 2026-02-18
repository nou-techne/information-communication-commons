/**
 * Techne Genesis Script
 * 
 * Sprint Q35: Create the Techne perpetual convergence and seed founding members
 * Author: TIO Sprint Runner
 * Date: 2026-02-18
 * 
 * This script creates:
 * - Entry #0: convergence.created for Techne
 * - Entries #1-8: people.member.created for the 8 founding cooperative members
 * 
 * Prerequisites:
 * - Migration 046_chain_entries.sql has been applied
 * - Techne convergence row exists in convergences table
 * 
 * Usage:
 *   tsx src/scripts/genesis-techne.ts
 */

import { appendEntry, verifyChain, getChainStats } from '../lib/chain-engine'
import type { ConvergenceCreatedPayload, MemberCreatedPayload } from '../types/chain'

// Techne convergence UUID (must exist in convergences table before running)
const TECHNE_CONVERGENCE_ID = '00000000-0000-0000-0000-000000000200'

// Founding cooperative members (as of Feb 6, 2026 LCA filing)
const FOUNDING_MEMBERS = [
  { number: '001', name: 'Aaron G Neyer' },
  { number: '002', name: 'Benjamin Ross' },
  { number: '003', name: 'Jonathan Borichevskiy' },
  { number: '004', name: 'Kevin Owocki' },
  { number: '005', name: 'Lucian Hymer' },
  { number: '006', name: 'Neil Mackay Yarnal' },
  { number: '007', name: 'Savannah Kruger' },
  { number: '008', name: 'Todd Youngblood' },
] as const

async function genesis() {
  console.log('=== Techne Genesis ===\n')
  console.log('Convergence ID:', TECHNE_CONVERGENCE_ID)
  console.log('Founding members:', FOUNDING_MEMBERS.length)
  console.log()
  
  // Generate convergence aggregate ID (same as convergence_id for genesis)
  const convergenceAggregateId = TECHNE_CONVERGENCE_ID
  
  // Entry #0: convergence.created
  console.log('Creating Entry #0: convergence.created...')
  const genesisEntry = await appendEntry({
    convergenceId: TECHNE_CONVERGENCE_ID,
    eventType: 'convergence.created',
    aggregateId: convergenceAggregateId,
    aggregateType: 'convergence',
    payload: {
      name: 'Techne',
      type: 'perpetual',
      description: 'RegenHub LCA — cooperative patronage chain',
      location: 'Boulder, Colorado',
      startDate: '2026-02-06T00:00:00Z', // LCA filing date
    } satisfies ConvergenceCreatedPayload,
    patternLayer: 1, // Identity layer
  })
  
  console.log(`✓ Entry #${genesisEntry.chain_index}: ${genesisEntry.event_type}`)
  console.log(`  Hash: ${genesisEntry.content_hash.slice(0, 16)}...`)
  console.log(`  Prev: ${genesisEntry.prev_hash}`)
  console.log()
  
  // Entries #1-8: founding members
  console.log('Creating founding member entries...')
  for (const member of FOUNDING_MEMBERS) {
    const memberId = crypto.randomUUID()
    
    const entry = await appendEntry({
      convergenceId: TECHNE_CONVERGENCE_ID,
      eventType: 'people.member.created',
      aggregateId: memberId,
      aggregateType: 'member',
      payload: {
        memberNumber: member.number,
        displayName: member.name,
        tier: 'cooperative',
        joinedAt: '2026-02-06T00:00:00Z',
      } satisfies MemberCreatedPayload,
      patternLayer: 1, // Identity layer
      correlationId: genesisEntry.id, // All genesis-related
    })
    
    console.log(`✓ Entry #${entry.chain_index}: ${member.name} (Member #${member.number})`)
    console.log(`  ID: ${memberId}`)
    console.log(`  Hash: ${entry.content_hash.slice(0, 16)}...`)
  }
  
  console.log()
  console.log('=== Genesis Complete ===\n')
  
  // Verify chain integrity
  console.log('Verifying chain integrity...')
  const verification = await verifyChain(TECHNE_CONVERGENCE_ID)
  
  if (verification.valid) {
    console.log(`✓ Chain is valid (${verification.entriesChecked} entries verified)`)
  } else {
    console.error('✗ Chain verification failed:')
    verification.violations.forEach(v => console.error(`  - ${v}`))
    process.exit(1)
  }
  
  // Show chain stats
  console.log()
  const stats = await getChainStats(TECHNE_CONVERGENCE_ID)
  console.log('Chain statistics:')
  console.log(`  Total entries: ${stats.totalEntries}`)
  console.log(`  First entry: ${stats.firstEntry}`)
  console.log(`  Event types:`)
  Object.entries(stats.eventTypeCounts).forEach(([type, count]) => {
    console.log(`    ${type}: ${count}`)
  })
  console.log(`  Pattern layers:`)
  Object.entries(stats.layerCounts).forEach(([layer, count]) => {
    console.log(`    Layer ${layer}: ${count}`)
  })
  
  console.log()
  console.log('Next steps:')
  console.log('1. Verify chain entries in Supabase dashboard')
  console.log('2. Run Sprint Q36: ConvergenceProvider context')
  console.log('3. Run Sprint Q37: Replace hardcoded convergence ID')
}

// Run genesis
genesis().catch(error => {
  console.error('Genesis failed:', error)
  process.exit(1)
})
