// CSV Exporters

import type { HLAMTDimension } from '../../types/api'

/**
 * UTF-8 BOM for Excel compatibility
 */
const UTF8_BOM = '\uFEFF'

/**
 * Contribution for CSV export
 */
interface CSVContribution {
  id: string
  title?: string
  content: string
  dimension?: HLAMTDimension
  author?: string
  createdAt: string
  updatedAt?: string
  tags?: string[]
  score?: number
}

/**
 * Participant for CSV export
 */
interface CSVParticipant {
  id: string
  name: string
  email?: string
  role?: string
  contributionCount?: number
  firstSeen?: string
  lastSeen?: string
}

/**
 * Thread for CSV export
 */
interface CSVThread {
  id: string
  title: string
  description?: string
  messageCount?: number
  participantCount?: number
  status?: string
  createdAt: string
  resolvedAt?: string
  tags?: string[]
}

/**
 * Escape CSV value
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  const str = String(value)

  // If contains comma, quote, or newline, wrap in quotes and escape quotes
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`
  }

  return str
}

/**
 * Convert array to CSV row
 */
function arrayToCSVRow(values: any[]): string {
  return values.map(escapeCSVValue).join(',')
}

/**
 * Export contributions as CSV
 */
export function exportContributionsAsCSV(
  contributions: CSVContribution[],
  columns?: Array<keyof CSVContribution>
): string {
  if (contributions.length === 0) {
    return UTF8_BOM + 'No contributions to export'
  }

  const defaultColumns: Array<keyof CSVContribution> = [
    'id',
    'title',
    'content',
    'dimension',
    'author',
    'createdAt',
    'tags',
    'score',
  ]

  const selectedColumns = columns || defaultColumns
  const rows: string[] = []

  // Header row
  rows.push(arrayToCSVRow(selectedColumns))

  // Data rows
  contributions.forEach(contrib => {
    const values = selectedColumns.map(col => {
      const value = contrib[col]

      // Handle arrays (like tags)
      if (Array.isArray(value)) {
        return value.join('; ')
      }

      return value ?? ''
    })

    rows.push(arrayToCSVRow(values))
  })

  return UTF8_BOM + rows.join('\n')
}

/**
 * Export participants as CSV
 */
export function exportParticipantsAsCSV(
  participants: CSVParticipant[],
  columns?: Array<keyof CSVParticipant>
): string {
  if (participants.length === 0) {
    return UTF8_BOM + 'No participants to export'
  }

  const defaultColumns: Array<keyof CSVParticipant> = [
    'id',
    'name',
    'email',
    'role',
    'contributionCount',
    'firstSeen',
    'lastSeen',
  ]

  const selectedColumns = columns || defaultColumns
  const rows: string[] = []

  // Header row
  rows.push(arrayToCSVRow(selectedColumns))

  // Data rows
  participants.forEach(participant => {
    const values = selectedColumns.map(col => participant[col] ?? '')
    rows.push(arrayToCSVRow(values))
  })

  return UTF8_BOM + rows.join('\n')
}

/**
 * Export threads as CSV
 */
export function exportThreadsAsCSV(
  threads: CSVThread[],
  columns?: Array<keyof CSVThread>
): string {
  if (threads.length === 0) {
    return UTF8_BOM + 'No threads to export'
  }

  const defaultColumns: Array<keyof CSVThread> = [
    'id',
    'title',
    'description',
    'messageCount',
    'participantCount',
    'status',
    'createdAt',
    'resolvedAt',
    'tags',
  ]

  const selectedColumns = columns || defaultColumns
  const rows: string[] = []

  // Header row
  rows.push(arrayToCSVRow(selectedColumns))

  // Data rows
  threads.forEach(thread => {
    const values = selectedColumns.map(col => {
      const value = thread[col]

      // Handle arrays
      if (Array.isArray(value)) {
        return value.join('; ')
      }

      return value ?? ''
    })

    rows.push(arrayToCSVRow(values))
  })

  return UTF8_BOM + rows.join('\n')
}

/**
 * Generic CSV exporter for any data
 */
export function exportToCSV<T extends Record<string, any>>(
  data: T[],
  columns?: Array<keyof T>
): string {
  if (data.length === 0) {
    return UTF8_BOM + 'No data to export'
  }

  // Auto-detect columns from first object if not specified
  const selectedColumns = columns || (Object.keys(data[0]) as Array<keyof T>)
  const rows: string[] = []

  // Header row
  rows.push(arrayToCSVRow(selectedColumns as string[]))

  // Data rows
  data.forEach(item => {
    const values = selectedColumns.map(col => {
      const value = item[col]

      // Handle arrays
      if (Array.isArray(value)) {
        return value.join('; ')
      }

      // Handle objects
      if (typeof value === 'object' && value !== null) {
        return JSON.stringify(value)
      }

      return value ?? ''
    })

    rows.push(arrayToCSVRow(values))
  })

  return UTF8_BOM + rows.join('\n')
}

/**
 * Create downloadable CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', filename.endsWith('.csv') ? filename : `${filename}.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    URL.revokeObjectURL(url)
  }
}

/**
 * Parse CSV content back to objects
 */
export function parseCSV<T = Record<string, string>>(csvContent: string): T[] {
  // Remove BOM if present
  const content = csvContent.replace(/^\uFEFF/, '')
  
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // Parse header
  const headers = parseCSVLine(lines[0])
  
  // Parse data rows
  const data: T[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = parseCSVLine(lines[i])
    const obj: any = {}
    
    headers.forEach((header, index) => {
      obj[header] = values[index] || ''
    })
    
    data.push(obj)
  }

  return data
}

/**
 * Parse single CSV line handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = []
  let current = ''
  let inQuotes = false

  for (let i = 0; i < line.length; i++) {
    const char = line[i]
    const next = line[i + 1]

    if (char === '"') {
      if (inQuotes && next === '"') {
        // Escaped quote
        current += '"'
        i++ // Skip next quote
      } else {
        // Toggle quote mode
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      values.push(current)
      current = ''
    } else {
      current += char
    }
  }

  // Add final value
  values.push(current)

  return values
}
