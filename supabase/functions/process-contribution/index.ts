import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const EXTRACTION_PROMPT = `Extract structured knowledge from this convergence event text.
Return ONLY valid JSON, no code fences.
IMPORTANT: "dimension" must be one of EXACTLY: "temporal", "social", "thematic", "energetic", "spatial". No other values.

Schema:
{"artifacts": [{"title": "short title", "summary": "1-2 sentences", "type": "idea|proposal|commitment|question|pattern|reflection", "tags": ["tag1", "hlamt:X"], "dimensions": [{"dimension": "temporal|social|thematic|energetic|spatial", "key": "key", "value": "value"}]}], "relationships": [{"from_title": "title", "to_title": "title", "type": "builds_on|extends|contradicts|related_to"}], "commitments": [{"participant": "name", "description": "what"}], "themes": [], "summary": "overall summary"}

Tag each artifact with hlamt:e (ecology), hlamt:H (human), hlamt:L (language), hlamt:A (artifacts), hlamt:M (methodology), or hlamt:T (training).

Text:
`

interface ErrorLog {
  timestamp: string
  stage: string
  message: string
  retry?: number
}

async function callClaudeWithRetry(content: string, maxRetries = 1): Promise<any> {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'x-api-key': ANTHROPIC_API_KEY,
          'anthropic-version': '2023-06-01',
          'content-type': 'application/json',
        },
        body: JSON.stringify({
          model: 'claude-sonnet-4-20250514',
          max_tokens: 4096,
          messages: [{ role: 'user', content: EXTRACTION_PROMPT + content }],
        }),
      })

      if (!claudeResponse.ok) {
        const err = await claudeResponse.text()
        const status = claudeResponse.status
        
        // Retry on timeout (408) or server errors (5xx)
        if ((status === 408 || status >= 500) && attempt < maxRetries) {
          console.log(`Claude API ${status}, retrying (${attempt + 1}/${maxRetries})...`)
          await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1))) // exponential backoff
          continue
        }
        
        throw new Error(`Claude API error: ${status} ${err}`)
      }

      return await claudeResponse.json()
    } catch (error) {
      if (attempt < maxRetries && (error instanceof TypeError || error.message.includes('timeout'))) {
        console.log(`Network error, retrying (${attempt + 1}/${maxRetries})...`)
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)))
        continue
      }
      throw error
    }
  }
}

function stripCodeFences(text: string): string {
  // Handle various code fence formats
  text = text.trim()
  
  // ```json ... ``` or ``` ... ```
  if (text.startsWith('```')) {
    const lines = text.split('\n')
    lines.shift() // remove first ```json or ```
    const withoutEnd = lines.join('\n').replace(/```\s*$/m, '').trim()
    return withoutEnd
  }
  
  return text
}

async function logError(supabase: any, contributionId: string, stage: string, message: string, retry?: number) {
  const errorEntry: ErrorLog = {
    timestamp: new Date().toISOString(),
    stage,
    message,
    ...(retry !== undefined && { retry })
  }
  
  // Append to errors array
  await supabase.rpc('jsonb_array_append', {
    table_name: 'contributions',
    column_name: 'errors',
    row_id: contributionId,
    new_value: JSON.stringify(errorEntry)
  }).catch(() => {
    // Fallback: set errors directly if function doesn't exist
    supabase.from('contributions')
      .update({ errors: [errorEntry] })
      .eq('id', contributionId)
  })
}

serve(async (req) => {
  let contributionId: string | undefined
  let supabase: any
  
  try {
    const payload = await req.json()

    // Support both direct calls and database webhook triggers
    const record = payload.record ?? payload
    contributionId = record.id
    const content = record.content
    const convergenceId = record.convergence_id

    if (!content) {
      return new Response(JSON.stringify({ error: 'No content' }), { status: 400 })
    }

    supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Mark as processing
    await supabase
      .from('contributions')
      .update({ status: 'processing' })
      .eq('id', contributionId)

    // Call Claude with retry
    let claudeResult
    try {
      claudeResult = await callClaudeWithRetry(content)
    } catch (error) {
      await logError(supabase, contributionId, 'claude_api', String(error))
      throw error
    }

    let extractionText = claudeResult.content[0].text
    extractionText = stripCodeFences(extractionText)

    // Parse extraction
    let extraction
    try {
      extraction = JSON.parse(extractionText)
    } catch (error) {
      await logError(supabase, contributionId, 'json_parse', `Invalid JSON: ${String(error)}. Raw: ${extractionText.substring(0, 200)}`)
      throw new Error(`JSON parse failed: ${error}`)
    }

    // Call ingest_extraction RPC
    let data, error
    try {
      const result = await supabase.rpc('ingest_extraction', {
        p_convergence_id: convergenceId,
        p_session_title: 'App contribution',
        p_extraction: extraction,
      })
      data = result.data
      error = result.error
    } catch (err) {
      await logError(supabase, contributionId, 'ingest_rpc', String(err))
      throw err
    }

    if (error) {
      await logError(supabase, contributionId, 'ingest_rpc', `RPC error: ${error.message}`)
      throw new Error(`Ingest error: ${error.message}`)
    }

    // Mark as complete
    await supabase
      .from('contributions')
      .update({
        status: 'complete',
        extraction: extraction,
        processed_at: new Date().toISOString(),
      })
      .eq('id', contributionId)

    return new Response(JSON.stringify({ success: true, result: data }), {
      headers: { 'Content-Type': 'application/json' },
    })
  } catch (err) {
    console.error('Processing error:', err)

    // Ensure status is marked as error
    if (contributionId && supabase) {
      try {
        await supabase
          .from('contributions')
          .update({ 
            status: 'error',
            processed_at: new Date().toISOString()
          })
          .eq('id', contributionId)
      } catch (updateErr) {
        console.error('Failed to mark contribution as error:', updateErr)
      }
    }

    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
