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

serve(async (req) => {
  try {
    const payload = await req.json()

    // Support both direct calls and database webhook triggers
    const record = payload.record ?? payload
    const contributionId = record.id
    const content = record.content
    const convergenceId = record.convergence_id

    if (!content) {
      return new Response(JSON.stringify({ error: 'No content' }), { status: 400 })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Mark as processing
    await supabase
      .from('contributions')
      .update({ status: 'processing' })
      .eq('id', contributionId)

    // Call Claude
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
      throw new Error(`Claude API error: ${claudeResponse.status} ${err}`)
    }

    const claudeResult = await claudeResponse.json()
    let extractionText = claudeResult.content[0].text

    // Strip code fences if present
    if (extractionText.startsWith('```')) {
      extractionText = extractionText.split('\n').slice(1).join('\n').replace(/```\s*$/, '').trim()
    }

    const extraction = JSON.parse(extractionText)

    // Call ingest_extraction RPC
    const { data, error } = await supabase.rpc('ingest_extraction', {
      p_convergence_id: convergenceId,
      p_session_title: 'App contribution',
      p_extraction: extraction,
    })

    if (error) throw new Error(`Ingest error: ${error.message}`)

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

    // Try to mark as error if we have the ID
    try {
      const payload = await req.clone().json().catch(() => ({}))
      const id = payload?.record?.id ?? payload?.id
      if (id) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)
        await supabase
          .from('contributions')
          .update({ status: 'error' })
          .eq('id', id)
      }
    } catch {}

    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
})
