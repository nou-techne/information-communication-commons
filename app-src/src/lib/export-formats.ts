// Export Format Registry

export type ExportFormatId = 'json' | 'csv' | 'markdown' | 'html' | 'pdf-html'

export interface ExportFormat<T = any> {
  id: ExportFormatId
  name: string
  mimeType: string
  extension: string
  description: string
  serializer: (data: T, options?: ExportOptions) => string | Promise<string>
}

export interface ExportOptions {
  filename?: string
  pretty?: boolean
  includeMetadata?: boolean
  template?: string
  [key: string]: any
}

/**
 * JSON Export Format
 */
export const JSON_FORMAT: ExportFormat = {
  id: 'json',
  name: 'JSON',
  mimeType: 'application/json',
  extension: 'json',
  description: 'JavaScript Object Notation - structured data format',
  serializer: (data: any, options?: ExportOptions) => {
    if (options?.pretty) {
      return JSON.stringify(data, null, 2)
    }
    return JSON.stringify(data)
  },
}

/**
 * CSV Export Format
 */
export const CSV_FORMAT: ExportFormat = {
  id: 'csv',
  name: 'CSV',
  mimeType: 'text/csv',
  extension: 'csv',
  description: 'Comma-Separated Values - tabular data format',
  serializer: (data: any[], options?: ExportOptions) => {
    if (!Array.isArray(data) || data.length === 0) {
      return ''
    }

    // Extract headers from first object
    const headers = Object.keys(data[0])
    const rows = [headers.join(',')]

    // Convert each row
    data.forEach(item => {
      const values = headers.map(header => {
        const value = item[header]
        // Escape values containing commas or quotes
        if (typeof value === 'string' && (value.includes(',') || value.includes('"'))) {
          return `"${value.replace(/"/g, '""')}"`
        }
        return value ?? ''
      })
      rows.push(values.join(','))
    })

    return rows.join('\n')
  },
}

/**
 * Markdown Export Format
 */
export const MARKDOWN_FORMAT: ExportFormat = {
  id: 'markdown',
  name: 'Markdown',
  mimeType: 'text/markdown',
  extension: 'md',
  description: 'Markdown - human-readable text format',
  serializer: (data: any, options?: ExportOptions) => {
    // Default markdown serializer - can be overridden per content type
    if (typeof data === 'string') {
      return data
    }

    if (Array.isArray(data)) {
      return data.map((item, i) => `${i + 1}. ${JSON.stringify(item)}`).join('\n\n')
    }

    return '```json\n' + JSON.stringify(data, null, 2) + '\n```'
  },
}

/**
 * HTML Export Format
 */
export const HTML_FORMAT: ExportFormat = {
  id: 'html',
  name: 'HTML',
  mimeType: 'text/html',
  extension: 'html',
  description: 'HyperText Markup Language - web page format',
  serializer: (data: any, options?: ExportOptions) => {
    const title = options?.filename || 'Export'
    const content = typeof data === 'string' ? data : `<pre>${JSON.stringify(data, null, 2)}</pre>`

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    body {
      font-family: system-ui, -apple-system, sans-serif;
      max-width: 800px;
      margin: 2rem auto;
      padding: 0 1rem;
      line-height: 1.6;
    }
    pre {
      background: #f5f5f5;
      padding: 1rem;
      border-radius: 4px;
      overflow-x: auto;
    }
  </style>
</head>
<body>
${content}
</body>
</html>`
  },
}

/**
 * PDF-Ready HTML Export Format
 */
export const PDF_HTML_FORMAT: ExportFormat = {
  id: 'pdf-html',
  name: 'PDF-Ready HTML',
  mimeType: 'text/html',
  extension: 'html',
  description: 'HTML optimized for PDF conversion (print styles)',
  serializer: (data: any, options?: ExportOptions) => {
    const title = options?.filename || 'Export'
    const content = typeof data === 'string' ? data : `<pre>${JSON.stringify(data, null, 2)}</pre>`

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${escapeHtml(title)}</title>
  <style>
    @page {
      size: A4;
      margin: 2cm;
    }
    body {
      font-family: 'Georgia', serif;
      font-size: 12pt;
      line-height: 1.5;
      color: #000;
      max-width: 100%;
    }
    h1 {
      font-size: 18pt;
      margin-bottom: 1em;
      page-break-after: avoid;
    }
    h2 {
      font-size: 14pt;
      margin-top: 1.5em;
      page-break-after: avoid;
    }
    pre, code {
      font-family: 'Courier New', monospace;
      font-size: 10pt;
      background: #f5f5f5;
      padding: 0.5em;
      page-break-inside: avoid;
    }
    @media print {
      body {
        background: white;
      }
    }
  </style>
</head>
<body>
${content}
</body>
</html>`
  },
}

/**
 * Export format registry
 */
export const EXPORT_FORMATS: Record<ExportFormatId, ExportFormat> = {
  json: JSON_FORMAT,
  csv: CSV_FORMAT,
  markdown: MARKDOWN_FORMAT,
  html: HTML_FORMAT,
  'pdf-html': PDF_HTML_FORMAT,
}

/**
 * Get export format by ID
 */
export function getFormat(id: ExportFormatId): ExportFormat | undefined {
  return EXPORT_FORMATS[id]
}

/**
 * List all export formats
 */
export function listFormats(): ExportFormat[] {
  return Object.values(EXPORT_FORMATS)
}

/**
 * Escape HTML special characters
 */
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  }
  return text.replace(/[&<>"']/g, m => map[m])
}
