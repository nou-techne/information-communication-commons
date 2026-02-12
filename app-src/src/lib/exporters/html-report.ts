// HTML Report Exporter

import type { HLAMTDimension } from '../../types/api'

interface ReportContribution {
  id: string
  title?: string
  content: string
  dimension?: HLAMTDimension
  author?: string
  createdAt: string
  score?: number
}

interface DimensionStats {
  dimension: HLAMTDimension
  count: number
  percentage: number
}

interface ReportData {
  title: string
  convergence?: string
  dateRange?: { start: string; end: string }
  totalContributions: number
  totalParticipants: number
  topContributions?: ReportContribution[]
  dimensionBreakdown?: DimensionStats[]
  graphImageUrl?: string
}

/**
 * Generate self-contained HTML report
 */
export function generateHTMLReport(data: ReportData): string {
  const {
    title,
    convergence,
    dateRange,
    totalContributions,
    totalParticipants,
    topContributions = [],
    dimensionBreakdown = [],
    graphImageUrl,
  } = data

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(title)}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      background: #f5f5f5;
      padding: 2rem 1rem;
    }
    
    .container {
      max-width: 1200px;
      margin: 0 auto;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }
    
    header {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      padding: 3rem 2rem;
    }
    
    header h1 {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }
    
    header p {
      font-size: 1.125rem;
      opacity: 0.95;
    }
    
    .section {
      padding: 2rem;
      border-bottom: 1px solid #e5e5e5;
    }
    
    .section:last-child {
      border-bottom: none;
    }
    
    h2 {
      font-size: 1.75rem;
      margin-bottom: 1.5rem;
      color: #1a1a1a;
    }
    
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;
    }
    
    .stat-card {
      background: #f8f9fa;
      padding: 1.5rem;
      border-radius: 6px;
      border-left: 4px solid #667eea;
    }
    
    .stat-label {
      font-size: 0.875rem;
      color: #666;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 0.5rem;
    }
    
    .stat-value {
      font-size: 2rem;
      font-weight: bold;
      color: #1a1a1a;
    }
    
    .contribution-card {
      background: #fafafa;
      border: 1px solid #e5e5e5;
      border-radius: 6px;
      padding: 1.5rem;
      margin-bottom: 1rem;
    }
    
    .contribution-header {
      display: flex;
      justify-content: space-between;
      align-items: start;
      margin-bottom: 1rem;
    }
    
    .contribution-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: #1a1a1a;
    }
    
    .contribution-meta {
      font-size: 0.875rem;
      color: #666;
      margin-bottom: 1rem;
    }
    
    .contribution-content {
      color: #444;
      line-height: 1.7;
    }
    
    .dimension-badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    
    .dimension-human { background: #e3f2fd; color: #1976d2; }
    .dimension-language { background: #f3e5f5; color: #7b1fa2; }
    .dimension-artifact { background: #fff3e0; color: #ef6c00; }
    .dimension-methodology { background: #e8f5e9; color: #388e3c; }
    .dimension-training { background: #fce4ec; color: #c2185b; }
    
    .dimension-chart {
      display: grid;
      gap: 1rem;
    }
    
    .dimension-row {
      display: flex;
      align-items: center;
      gap: 1rem;
    }
    
    .dimension-label {
      width: 120px;
      font-weight: 600;
      text-transform: capitalize;
    }
    
    .dimension-bar {
      flex: 1;
      height: 32px;
      background: #f0f0f0;
      border-radius: 4px;
      overflow: hidden;
      position: relative;
    }
    
    .dimension-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      padding: 0 0.75rem;
      color: white;
      font-weight: 600;
      font-size: 0.875rem;
    }
    
    .graph-placeholder {
      background: #f8f9fa;
      border: 2px dashed #ccc;
      border-radius: 6px;
      padding: 3rem;
      text-align: center;
      color: #666;
    }
    
    .graph-placeholder img {
      max-width: 100%;
      height: auto;
      border-radius: 4px;
    }
    
    footer {
      padding: 2rem;
      background: #f8f9fa;
      text-align: center;
      color: #666;
      font-size: 0.875rem;
    }
    
    @media print {
      body {
        background: white;
        padding: 0;
      }
      
      .container {
        box-shadow: none;
        border-radius: 0;
      }
      
      .section {
        page-break-inside: avoid;
      }
    }
  </style>
</head>
<body>
  <div class="container">
    <header>
      <h1>${escapeHtml(title)}</h1>
      ${convergence ? `<p>${escapeHtml(convergence)}</p>` : ''}
      ${dateRange ? `<p>${formatDate(dateRange.start)} – ${formatDate(dateRange.end)}</p>` : ''}
    </header>

    <section class="section">
      <h2>Summary Statistics</h2>
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-label">Total Contributions</div>
          <div class="stat-value">${totalContributions}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Participants</div>
          <div class="stat-value">${totalParticipants}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Dimensions</div>
          <div class="stat-value">${dimensionBreakdown.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-label">Report Generated</div>
          <div class="stat-value" style="font-size: 1rem;">${new Date().toLocaleDateString()}</div>
        </div>
      </div>
    </section>

    ${topContributions.length > 0 ? `
    <section class="section">
      <h2>Top Contributions</h2>
      ${topContributions.map(contrib => `
        <div class="contribution-card">
          <div class="contribution-header">
            ${contrib.title ? `<h3 class="contribution-title">${escapeHtml(contrib.title)}</h3>` : ''}
            ${contrib.dimension ? `<span class="dimension-badge dimension-${contrib.dimension}">${contrib.dimension}</span>` : ''}
          </div>
          <div class="contribution-meta">
            ${contrib.author ? `By ${escapeHtml(contrib.author)} • ` : ''}
            ${formatDate(contrib.createdAt)}
            ${contrib.score ? ` • Score: ${contrib.score}` : ''}
          </div>
          <div class="contribution-content">
            ${escapeHtml(contrib.content.slice(0, 300))}${contrib.content.length > 300 ? '...' : ''}
          </div>
        </div>
      `).join('')}
    </section>
    ` : ''}

    ${dimensionBreakdown.length > 0 ? `
    <section class="section">
      <h2>Dimension Breakdown</h2>
      <div class="dimension-chart">
        ${dimensionBreakdown.map(dim => `
          <div class="dimension-row">
            <div class="dimension-label">${dim.dimension}</div>
            <div class="dimension-bar">
              <div class="dimension-bar-fill" style="width: ${dim.percentage}%">
                ${dim.count} (${dim.percentage}%)
              </div>
            </div>
          </div>
        `).join('')}
      </div>
    </section>
    ` : ''}

    ${graphImageUrl ? `
    <section class="section">
      <h2>Knowledge Graph</h2>
      <div class="graph-placeholder">
        <img src="${escapeHtml(graphImageUrl)}" alt="Knowledge graph visualization" />
      </div>
    </section>
    ` : `
    <section class="section">
      <h2>Knowledge Graph</h2>
      <div class="graph-placeholder">
        <p>Graph visualization placeholder</p>
        <p style="font-size: 0.875rem; margin-top: 0.5rem;">
          Export graph separately or provide image URL
        </p>
      </div>
    </section>
    `}

    <footer>
      <p>Generated by Information & Communications Commons</p>
      <p>commons.id • ${new Date().toLocaleString()}</p>
    </footer>
  </div>
</body>
</html>`
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

/**
 * Format date for display
 */
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}
