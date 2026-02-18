/**
 * Seed Sample Contribution — Sprint Q92
 * 
 * Appends a test contribution to the live Techne chain
 * to verify the full append → query pipeline in production.
 */

import { appendEntry, getChainHead, getChainStats } from '../lib/chain-engine'

const TECHNE_ID = '00000000-0000-0000-0000-000000000200'
const TODD_MEMBER_ID = '86ee04ba-03e9-45d9-95b0-a4e530b49522' // from genesis

async function seed() {
  console.log('=== Seed Sample Contribution ===\n')

  // Check current chain head
  const head = await getChainHead(TECHNE_ID)
  console.log(`Current chain head: #${head?.chain_index}`)

  // Append a contribution entry
  console.log('\nAppending contribution.submitted...')
  const contribId = crypto.randomUUID()
  const submitted = await appendEntry({
    convergenceId: TECHNE_ID,
    eventType: 'people.contribution.submitted',
    aggregateId: contribId,
    aggregateType: 'contribution',
    payload: {
      contributorId: TODD_MEMBER_ID,
      description: 'Built the commons.id patronage chain engine — 56 sprints across 8 cycles',
      category: 'engineering',
      effort: 'high',
      nlSource: 'Built the patronage chain engine for commons.id, major engineering effort over multiple sessions',
    },
    patternLayer: 4, // Event layer
    actorId: TODD_MEMBER_ID,
    schemaVersion: '1.0',
  })
  console.log(`✓ Entry #${submitted.chain_index}: contribution.submitted`)
  console.log(`  Contribution ID: ${contribId}`)
  console.log(`  Hash: ${submitted.content_hash.slice(0, 16)}...`)

  // Append approval
  console.log('\nAppending contribution.approved...')
  const approved = await appendEntry({
    convergenceId: TECHNE_ID,
    eventType: 'people.contribution.approved',
    aggregateId: contribId,
    aggregateType: 'contribution',
    payload: {
      contributorId: TODD_MEMBER_ID,
      creditAmount: 5600,
      approvedBy: 'system-genesis',
      approvalNote: 'Founding engineering contribution — chain infrastructure',
    },
    patternLayer: 5, // Flow layer
    actorId: 'system-genesis',
    schemaVersion: '1.0',
  })
  console.log(`✓ Entry #${approved.chain_index}: contribution.approved`)
  console.log(`  Credit: $5,600.00`)
  console.log(`  Hash: ${approved.content_hash.slice(0, 16)}...`)

  // Verify
  console.log('\n=== Chain Stats ===')
  const stats = await getChainStats(TECHNE_ID)
  console.log(`Total entries: ${stats.totalEntries}`)
  console.log('Event types:', JSON.stringify(stats.eventTypeCounts, null, 2))
}

seed().catch(console.error)
