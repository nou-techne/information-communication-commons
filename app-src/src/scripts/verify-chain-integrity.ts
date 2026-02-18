/**
 * Chain Integrity Verification Script
 * 
 * Sprint Q47: Periodic chain verification for all convergences.
 * Designed to run as a cron job — verifies merkle chain integrity,
 * reports violations, and logs results.
 * 
 * Usage: npx tsx src/scripts/verify-chain-integrity.ts
 * Cron: Run daily or after bulk operations
 */

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://hvbdpgkdcdskhpbdeeim.supabase.co'
const supabaseAnonKey = 'sb_publishable_kB69BlNpkNhOllwGMOE6xg_i4l1VHMv'
const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function computeHash(
  prevHash: string,
  eventType: string,
  aggregateId: string,
  payload: Record<string, unknown>
): Promise<string> {
  const sortedKeys = Object.keys(payload).sort()
  const canonical = JSON.stringify(payload, sortedKeys)
  const input = `${prevHash}|${eventType}|${aggregateId}|${canonical}`
  const encoder = new TextEncoder()
  const data = encoder.encode(input)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('')
}

interface VerificationReport {
  convergenceId: string
  convergenceName: string
  entriesChecked: number
  valid: boolean
  violations: string[]
  verifiedAt: string
  durationMs: number
}

async function verifyConvergence(convergenceId: string, name: string): Promise<VerificationReport> {
  const start = Date.now()
  const violations: string[] = []

  const { data: entries, error } = await supabase
    .from('chain_entries')
    .select('*')
    .eq('convergence_id', convergenceId)
    .order('chain_index', { ascending: true })

  if (error) {
    return {
      convergenceId, convergenceName: name,
      entriesChecked: 0, valid: false,
      violations: [`Fetch error: ${error.message}`],
      verifiedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    }
  }

  if (!entries || entries.length === 0) {
    return {
      convergenceId, convergenceName: name,
      entriesChecked: 0, valid: true, violations: [],
      verifiedAt: new Date().toISOString(),
      durationMs: Date.now() - start,
    }
  }

  // Verify genesis
  if (entries[0].prev_hash !== 'genesis') {
    violations.push(`Entry #0: prev_hash should be 'genesis', got '${entries[0].prev_hash}'`)
  }

  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i]

    // Sequential index
    if (entry.chain_index !== i) {
      violations.push(`Entry #${i}: expected chain_index ${i}, got ${entry.chain_index}`)
    }

    // prev_hash linkage
    const expectedPrev = i === 0 ? 'genesis' : entries[i - 1].content_hash
    if (entry.prev_hash !== expectedPrev) {
      violations.push(`Entry #${i}: prev_hash mismatch`)
    }

    // Content hash verification
    const recomputed = await computeHash(
      entry.prev_hash,
      entry.event_type,
      entry.aggregate_id,
      entry.payload as Record<string, unknown>
    )
    if (entry.content_hash !== recomputed) {
      violations.push(`Entry #${i}: content_hash tampered (stored vs computed mismatch)`)
    }
  }

  return {
    convergenceId, convergenceName: name,
    entriesChecked: entries.length,
    valid: violations.length === 0,
    violations,
    verifiedAt: new Date().toISOString(),
    durationMs: Date.now() - start,
  }
}

async function main() {
  console.log('🔗 Chain Integrity Verification')
  console.log('================================\n')

  // Get all convergences
  const { data: convergences, error } = await supabase
    .from('convergences')
    .select('id, name')

  if (error || !convergences) {
    console.error('Failed to fetch convergences:', error?.message)
    process.exit(1)
  }

  console.log(`Found ${convergences.length} convergence(s)\n`)

  const reports: VerificationReport[] = []

  for (const conv of convergences) {
    const report = await verifyConvergence(conv.id, conv.name)
    reports.push(report)

    const status = report.valid ? '✅' : '❌'
    console.log(`${status} ${conv.name}`)
    console.log(`   Entries: ${report.entriesChecked} | Duration: ${report.durationMs}ms`)
    if (report.violations.length > 0) {
      report.violations.forEach(v => console.log(`   ⚠️  ${v}`))
    }
    console.log()
  }

  // Summary
  const allValid = reports.every(r => r.valid)
  const totalEntries = reports.reduce((sum, r) => sum + r.entriesChecked, 0)
  const totalViolations = reports.reduce((sum, r) => sum + r.violations.length, 0)

  console.log('================================')
  console.log(`Summary: ${totalEntries} entries across ${reports.length} convergences`)
  console.log(`Status: ${allValid ? '✅ All chains valid' : `❌ ${totalViolations} violation(s) found`}`)

  if (!allValid) process.exit(1)
}

main().catch(err => {
  console.error('Verification failed:', err)
  process.exit(1)
})
