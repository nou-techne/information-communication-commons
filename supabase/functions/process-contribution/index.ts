import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const EXTRACTION_PROMPT = `You are extracting structured knowledge from a convergence event observation.
Return ONLY valid JSON, no code fences.

## The Grammar: REA (Resource, Event, Agent)

Every observation decomposes into three entity types:

**Resource** — a stock of organizational capacity at a point in time. Resources come in seven forms of capital: financial, human, temporal, social, produced, natural, cultural. A resource observation captures what exists, in what form, and at what level of vitality.

**Event** — a transformation that changes resource stocks. Classify events as:
- "extractive" (reducing capacity without replenishment)
- "regenerative" (enhancing future value creation)  
- "reciprocal" (balanced exchange)

**Agent** — an individual, team, or organization with capacity for action. Agency distributes through structure rather than concentrating at the top.

## Classification Layers

Each artifact gets THREE orthogonal classifications:

1. **rea_role** (grammatical role): "resource" | "event" | "agent"
2. **type** (observation pattern): "idea" | "proposal" | "commitment" | "question" | "pattern" | "reflection"
3. **e/H-LAM/T tags** (dimensional lens — which domain of capacity):
   - hlamt:e — ecology, place, watershed, environmental context, natural capital
   - hlamt:H — human capability, relationships, social capital, lived experience
   - hlamt:L — language, shared vocabulary, frameworks, cultural capital, definitions
   - hlamt:A — artifacts, tools, infrastructure, produced/financial capital
   - hlamt:M — methodology, processes, workflows, coordination patterns
   - hlamt:T — training, learning, skill development, transformation

## Dimension Details
IMPORTANT: "dimension" must be one of EXACTLY: "temporal", "social", "thematic", "energetic", "spatial". No other values.

## Output Schema

{"contribution_title": "A short, descriptive title for this contribution (5-10 words, like a headline)", "artifacts": [{"title": "short title", "summary": "1-2 sentences", "rea_role": "resource|event|agent", "agent_type": "human|non-human (only when rea_role is agent)", "event_temporality": "past|present|future (only when rea_role is event)", "type": "idea|proposal|commitment|question|pattern|reflection", "confidence": 0.0-1.0, "tags": ["descriptive-tag", "hlamt:X"], "dimensions": [{"dimension": "temporal|social|thematic|energetic|spatial", "key": "key", "value": "value", "weight": 0.0-1.0}]}], "relationships": [{"from_title": "title", "to_title": "title", "type": "builds_on|extends|contradicts|related_to"}], "commitments": [{"participant": "name", "description": "what"}], "themes": [], "summary": "overall summary"}

## Confidence Scoring
Rate each artifact 0.0-1.0 for extraction confidence:
- 1.0: Explicitly stated, unambiguous
- 0.7-0.9: Clearly implied, minor inference
- 0.4-0.6: Moderate inference required
- 0.1-0.3: Speculative, loosely derived
Only extract artifacts with confidence >= 0.4. Quality over quantity.

## Dimension Weighting
Assign weight (0.0-1.0) to EACH dimension tag based on relevance/intensity:
- 1.0: Central to the artifact's purpose or identity
- 0.7-0.9: Strong relevance, explicit connection
- 0.4-0.6: Moderate relevance, implied connection
- 0.1-0.3: Tangential, minor aspect
An artifact about "regenerative finance training in Boulder" would get: hlamt:T=1.0, hlamt:A=0.8, hlamt:e=0.6, hlamt:H=0.4

## Guidance

- When someone describes a skill, tool, funding source, or available capacity → rea_role: "resource"
- When someone describes something that happened, a session, a decision, an action → rea_role: "event"
- When someone is identified as a participant, speaker, organizer, team → rea_role: "agent"
- For agents, also classify agent_type: "human" (people) or "non-human" (AI agents, bots, DAOs, protocols, software systems, organizations-as-actors)
- For events, also classify event_temporality: "past" (already happened — recaps, reports, reviews), "present" (happening now — live sessions, ongoing activities), "future" (planned or proposed — upcoming talks, proposals, commitments)
- One observation often contains all three: "Maria (agent) presented (event) a regenerative finance framework (resource)"
- Tag EVERY artifact with at least one hlamt: tag. Most artifacts touch 1-2 dimensions.
- Prefer specificity: a person teaching a workshop is H/ (human) + T/ (training), not just H/

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
          model: 'claude-sonnet-4-5-20250929',
          max_tokens: 8192,
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
  try {
    await supabase.rpc('jsonb_array_append', {
      table_name: 'contributions',
      column_name: 'errors',
      row_id: contributionId,
      new_value: JSON.stringify(errorEntry)
    })
  } catch {
    // Fallback: set errors directly if function doesn't exist
    try {
      await supabase.from('contributions')
        .update({ errors: [errorEntry] })
        .eq('id', contributionId)
    } catch { /* best effort */ }
  }
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

    // Validate extraction structure
    const validTypes = ['idea', 'proposal', 'commitment', 'question', 'pattern', 'reflection']
    const validReaRoles = ['resource', 'event', 'agent']
    const validAgentTypes = ['human', 'non-human']
    const validRelTypes = ['builds_on', 'extends', 'contradicts', 'related_to']

    if (extraction.artifacts && Array.isArray(extraction.artifacts)) {
      extraction.artifacts = extraction.artifacts.filter((a: any) => {
        // Must have title and summary
        if (!a.title || !a.summary) return false
        // Validate type
        if (a.type && !validTypes.includes(a.type)) a.type = 'idea'
        // Validate rea_role
        if (a.rea_role && !validReaRoles.includes(a.rea_role)) a.rea_role = 'resource'
        // Validate agent_type
        if (a.agent_type && !validAgentTypes.includes(a.agent_type)) delete a.agent_type
        // Filter low confidence if present
        if (typeof a.confidence === 'number' && a.confidence < 0.4) return false
        // Ensure tags is an array
        if (!Array.isArray(a.tags)) a.tags = []
        // Ensure at least one hlamt tag
        const hasHlamt = a.tags.some((t: string) => t.startsWith('hlamt:'))
        if (!hasHlamt) a.tags.push('hlamt:A')
        return true
      })
    }

    if (extraction.relationships && Array.isArray(extraction.relationships)) {
      extraction.relationships = extraction.relationships.filter((r: any) => {
        if (!r.from_title || !r.to_title) return false
        if (r.type && !validRelTypes.includes(r.type)) r.type = 'related_to'
        return true
      })
    }

    // Log validation stats
    const stats = {
      artifacts: extraction.artifacts?.length ?? 0,
      relationships: extraction.relationships?.length ?? 0,
      commitments: extraction.commitments?.length ?? 0,
      avgConfidence: extraction.artifacts?.length > 0
        ? (extraction.artifacts.reduce((sum: number, a: any) => sum + (a.confidence || 0.7), 0) / extraction.artifacts.length).toFixed(2)
        : 'N/A'
    }
    console.log(`Extraction validated: ${JSON.stringify(stats)}`)

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
        title: extraction.contribution_title || null,
        processed_at: new Date().toISOString(),
      })
      .eq('id', contributionId)

    // Issue cloud reward for sealed contribution (best-effort, non-fatal)
    try {
      const participantId: string | null = record.participant_id ?? (
        await supabase.from('contributions').select('participant_id').eq('id', contributionId).single()
      ).data?.participant_id ?? null

      if (participantId) {
        // Infer category from first artifact (same logic as UI inferCategory)
        const firstArtifact = extraction.artifacts?.[0]
        const t = (firstArtifact?.type || '').toLowerCase()
        const r = (firstArtifact?.rea_role || '').toLowerCase()
        let cloudAmount = 5 // observation / reflection / pattern (default)
        if (t === 'commitment')              cloudAmount = 30
        else if (t === 'idea' || t === 'proposal') cloudAmount = 10
        else if (r === 'event')              cloudAmount = 50

        const rewardTitle = (extraction.contribution_title || 'Contribution').slice(0, 60)

        await supabase.from('cloud_transactions').insert({
          from_id: null,
          to_id: participantId,
          amount: cloudAmount,
          reason: `Contribution sealed: ${rewardTitle}`,
        })

        // Increment balance (fetch + upsert to avoid race)
        const { data: bal } = await supabase
          .from('cloud_balances')
          .select('balance')
          .eq('participant_id', participantId)
          .single()

        await supabase.from('cloud_balances').upsert({
          participant_id: participantId,
          balance: (bal?.balance ?? 0) + cloudAmount,
          updated_at: new Date().toISOString(),
        })

        console.log(`Cloud reward: +${cloudAmount} to ${participantId} for "${rewardTitle}"`)
      }
    } catch (cloudErr) {
      console.warn('Cloud reward failed (non-fatal):', String(cloudErr))
    }

    // Set event_temporality on event artifacts (post-ingestion)
    if (extraction.artifacts && Array.isArray(extraction.artifacts)) {
      for (const artifact of extraction.artifacts) {
        if (artifact.rea_role === 'event' && artifact.event_temporality) {
          const validTemporalities = ['past', 'present', 'future']
          if (validTemporalities.includes(artifact.event_temporality)) {
            await supabase
              .from('artifacts')
              .update({ event_temporality: artifact.event_temporality })
              .eq('title', artifact.title)
              .eq('rea_role', 'event')
          }
        }
      }
    }

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
