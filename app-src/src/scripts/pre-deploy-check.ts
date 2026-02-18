/**
 * Pre-Deploy Validation — Sprint Q94
 * 
 * Run before deploying to verify system health.
 * Usage: npx tsx src/scripts/pre-deploy-check.ts
 */

import { getChainHead, verifyChain, getChainStats } from '../lib/chain-engine'
import { supabase } from '../lib/supabase'

const TECHNE_ID = '00000000-0000-0000-0000-000000000200'

interface Check {
  name: string
  status: 'pass' | 'fail' | 'warn'
  message: string
}

async function runChecks(): Promise<Check[]> {
  const checks: Check[] = []

  // 1. Supabase connection
  try {
    const { data, error } = await supabase.from('convergences').select('id').limit(1)
    checks.push({
      name: 'Supabase connection',
      status: error ? 'fail' : 'pass',
      message: error ? error.message : 'Connected',
    })
  } catch (e: any) {
    checks.push({ name: 'Supabase connection', status: 'fail', message: e.message })
  }

  // 2. Chain head exists
  try {
    const head = await getChainHead(TECHNE_ID)
    checks.push({
      name: 'Chain head',
      status: head ? 'pass' : 'warn',
      message: head ? `Head at #${head.chain_index}` : 'No chain entries',
    })
  } catch (e: any) {
    checks.push({ name: 'Chain head', status: 'fail', message: e.message })
  }

  // 3. Chain integrity
  try {
    const result = await verifyChain(TECHNE_ID)
    checks.push({
      name: 'Chain integrity',
      status: result.valid ? 'pass' : 'fail',
      message: result.valid ? `${result.entriesChecked} entries verified` : result.violations[0],
    })
  } catch (e: any) {
    checks.push({ name: 'Chain integrity', status: 'fail', message: e.message })
  }

  // 4. Required tables (some may require auth — warn instead of fail)
  const criticalTables = ['chain_entries', 'convergences', 'notifications']
  const authTables = ['participants', 'contributions']
  
  for (const table of criticalTables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    checks.push({
      name: `Table: ${table}`,
      status: error ? 'fail' : 'pass',
      message: error ? error.message : 'Accessible',
    })
  }
  for (const table of authTables) {
    const { error } = await supabase.from(table).select('id').limit(1)
    checks.push({
      name: `Table: ${table}`,
      status: error ? 'warn' : 'pass',
      message: error ? `${error.message} (may require auth)` : 'Accessible',
    })
  }

  return checks
}

async function main() {
  console.log('=== Pre-Deploy Validation ===\n')
  
  const checks = await runChecks()
  const icons = { pass: '✅', fail: '❌', warn: '⚠️' }
  
  for (const check of checks) {
    console.log(`${icons[check.status]} ${check.name}: ${check.message}`)
  }

  const failures = checks.filter(c => c.status === 'fail')
  console.log(`\n${checks.length} checks run. ${failures.length} failures.`)
  
  if (failures.length > 0) {
    console.log('\n❌ DEPLOY BLOCKED — fix failures before deploying.')
    process.exit(1)
  } else {
    console.log('\n✅ ALL CLEAR — safe to deploy.')
  }
}

main().catch(console.error)
