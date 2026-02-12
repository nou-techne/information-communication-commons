// Import from Portable Format

import { validatePortableFormat, verifyPortableContent, deserializeContribution } from './portable-format'
import type { PortableContribution } from './portable-format'

export type ConflictStrategy = 'keep-both' | 'prefer-local' | 'prefer-remote' | 'reject'

export interface ImportOptions {
  conflictStrategy?: ConflictStrategy
  validateHash?: boolean
  convergenceId?: string
}

export interface ImportReport {
  total: number
  imported: number
  skipped: number
  failed: number
  conflicts: number
  errors: Array<{
    contributionId: string
    error: string
  }>
}

/**
 * Import contributions from portable format
 */
export async function importPortableContributions(
  portableItems: PortableContribution[],
  existingContributions: Array<{ id: string; contentHash: string }>,
  options: ImportOptions = {}
): Promise<ImportReport> {
  const {
    conflictStrategy = 'prefer-local',
    validateHash = true,
    convergenceId,
  } = options

  const report: ImportReport = {
    total: portableItems.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    conflicts: 0,
    errors: [],
  }

  const existingMap = new Map(existingContributions.map(c => [c.id, c.contentHash]))

  for (const item of portableItems) {
    try {
      // Validate format
      const validation = validatePortableFormat(item)
      if (!validation.valid) {
        report.failed++
        report.errors.push({
          contributionId: item.id,
          error: `Invalid format: ${validation.errors.join(', ')}`,
        })
        continue
      }

      // Verify content hash
      if (validateHash) {
        const hashValid = await verifyPortableContent(item)
        if (!hashValid) {
          report.failed++
          report.errors.push({
            contributionId: item.id,
            error: 'Content hash mismatch',
          })
          continue
        }
      }

      // Check for conflicts
      const existingHash = existingMap.get(item.id)
      if (existingHash) {
        report.conflicts++

        const resolution = await resolveConflict(
          item,
          existingHash,
          conflictStrategy
        )

        if (resolution === 'skip') {
          report.skipped++
          continue
        }

        if (resolution === 'reject') {
          report.failed++
          report.errors.push({
            contributionId: item.id,
            error: 'Conflict rejected by strategy',
          })
          continue
        }

        if (resolution === 'import-as-new') {
          // Generate new ID to keep both
          item.id = `${item.id}_imported_${Date.now()}`
        }
      }

      // Override convergence if specified
      if (convergenceId) {
        item.convergence = {
          id: convergenceId,
          name: item.convergence?.name,
        }
      }

      // Import succeeded
      report.imported++
    } catch (error) {
      report.failed++
      report.errors.push({
        contributionId: item.id,
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  }

  return report
}

/**
 * Resolve import conflict
 */
async function resolveConflict(
  imported: PortableContribution,
  existingHash: string,
  strategy: ConflictStrategy
): Promise<'skip' | 'replace' | 'import-as-new' | 'reject'> {
  // If hashes match, no conflict
  if (imported.contentHash === existingHash) {
    return 'skip'
  }

  switch (strategy) {
    case 'keep-both':
      return 'import-as-new'

    case 'prefer-local':
      return 'skip'

    case 'prefer-remote':
      return 'replace'

    case 'reject':
      return 'reject'
  }
}

/**
 * Import single contribution
 */
export async function importSingleContribution(
  portable: PortableContribution,
  options: ImportOptions = {}
): Promise<{
  success: boolean
  error?: string
  contribution?: ReturnType<typeof deserializeContribution>
}> {
  try {
    // Validate
    const validation = validatePortableFormat(portable)
    if (!validation.valid) {
      return {
        success: false,
        error: `Invalid format: ${validation.errors.join(', ')}`,
      }
    }

    // Verify hash if enabled
    if (options.validateHash !== false) {
      const hashValid = await verifyPortableContent(portable)
      if (!hashValid) {
        return {
          success: false,
          error: 'Content hash mismatch',
        }
      }
    }

    // Deserialize
    const contribution = deserializeContribution(portable)

    // Override convergence if specified
    if (options.convergenceId) {
      contribution.convergence_id = options.convergenceId
    }

    return {
      success: true,
      contribution,
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

/**
 * Batch import with progress callback
 */
export async function batchImport(
  portableItems: PortableContribution[],
  existingContributions: Array<{ id: string; contentHash: string }>,
  options: ImportOptions & {
    onProgress?: (completed: number, total: number) => void
  } = {}
): Promise<ImportReport> {
  const { onProgress, ...importOptions } = options

  const report: ImportReport = {
    total: portableItems.length,
    imported: 0,
    skipped: 0,
    failed: 0,
    conflicts: 0,
    errors: [],
  }

  for (let i = 0; i < portableItems.length; i++) {
    const result = await importSingleContribution(portableItems[i], importOptions)

    if (result.success) {
      report.imported++
    } else {
      report.failed++
      report.errors.push({
        contributionId: portableItems[i].id,
        error: result.error || 'Unknown error',
      })
    }

    onProgress?.(i + 1, portableItems.length)
  }

  return report
}
