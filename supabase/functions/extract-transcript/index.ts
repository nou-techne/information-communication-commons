// Sprint 10-11: Transcript Extraction Edge Function
// Receives transcript text, extracts entities via Claude, writes to knowledge graph
// Called by Make.com webhook scenario or directly

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!

const EXTRACTION_PROMPT = `You are a knowledge graph extraction agent for the Information & Communications Commons — a living archive that carries ideas, relationships, and commitments across convergence events.

Extract structured knowledge from this convergence conversation transcript. Be precise and conservative — only extract what is clearly present.

Return ONLY valid JSON with this exact structure:

{
  "artifacts": [
    {
      "title": "Short descriptive title (max 80 chars)",
      "summary": "1-2 sentence summary of the idea/proposal/question",
      "type": "idea|proposal|commitment|question|pattern|reflection",
      "tags": ["tag1", "tag2"],
      "dimensions": [
        {"dimension": "energetic", "key": "energy", "value": "high|medium|low"},
        {"dimension": "thematic", "key": "theme", "value": "theme name"},
        {"dimension": "spatial", "key": "location", "value": "if mentioned"},
        {"dimension": "social", "key": "stakeholder", "value": "who cares about this"}
      ]
    }
  ],
  "relationships": [
    {
      "from_title": "exact artifact title from above",
      "to_title": "exact artifact title from above",
      "type": "builds_on|extends|contradicts|related_to",
      "description": "brief description of the relationship"
    }
  ],
  "commitments": [
    {
      "participant": "person's name",
      "description": "what they committed to do",
      "due_date": "YYYY-MM-DD if mentioned, null otherwise"
    }
  ],
  "participants_mentioned": ["Name 1", "Name 2"],
  "themes": ["theme1", "theme2"],
  "energy_level": "high|medium|low",
  "summary": "2-3 sentence overall summary of the conversation"
}

Rules:
- "commitment" type artifacts are explicit statements of intent ("I will...", "We should...", "Let's...")
- "question" type artifacts are open threads that need answers
- "pattern" type artifacts are recurring themes observed across contexts
- Tags should use lowercase, existing vocabulary where possible
- Only create relationships between artifacts you're extracting (from this transcript)
- Be conservative: if unsure, don't extract it`

interface ExtractionResult {
  artifacts: Array<{
    title: string
    summary: string
    type: string
    tags: string[]
    dimensions: Array<{ dimension: string; key: string; value: string }>
  }>
  relationships: Array<{
    from_title: string
    to_title: string
    type: string
    description?: string
  }>
  commitments: Array<{
    participant: string
    description: string
    due_date?: string | null
  }>
  participants_mentioned: string[]
  themes: string[]
  energy_level: string
  summary: string
}

Deno.serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
      },
    })
  }

  try {
    const { transcript, session_title, convergence_id, session_id, actor_id, actor_type } = await req.json()

    if (!transcript) {
      return new Response(JSON.stringify({ error: 'transcript is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    const targetConvergenceId = convergence_id || '00000000-0000-0000-0000-000000000100' // default: ETHBoulder 2026

    // Step 1: Call Claude for extraction
    console.log(`Extracting from transcript (${transcript.length} chars)...`)

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
        messages: [
          {
            role: 'user',
            content: `${EXTRACTION_PROMPT}\n\nTranscript:\n${transcript}`,
          },
        ],
      }),
    })

    if (!claudeResponse.ok) {
      const err = await claudeResponse.text()
      throw new Error(`Claude API error: ${claudeResponse.status} — ${err}`)
    }

    const claudeData = await claudeResponse.json()
    const extractedText = claudeData.content[0].text

    // Parse the JSON response
    let extraction: ExtractionResult
    try {
      // Handle potential markdown code blocks
      const jsonStr = extractedText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim()
      extraction = JSON.parse(jsonStr)
    } catch (e) {
      throw new Error(`Failed to parse Claude response as JSON: ${e.message}\n\nRaw: ${extractedText.substring(0, 500)}`)
    }

    // Step 2: Write to Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    const createdArtifacts: Record<string, string> = {} // title → id mapping
    const results = {
      artifacts_created: 0,
      relationships_created: 0,
      commitments_created: 0,
      errors: [] as string[],
    }

    // Create artifacts
    for (const artifact of extraction.artifacts) {
      try {
        const { data, error } = await supabase.rpc('create_artifact', {
          p_title: artifact.title,
          p_summary: artifact.summary,
          p_type: artifact.type,
          p_convergence_id: targetConvergenceId,
          p_session_id: session_id || null,
          p_created_by: actor_type === 'human' ? actor_id : null,
          p_created_by_agent: actor_type === 'agent' ? actor_id : null,
          p_steward_id: actor_type === 'human' ? actor_id : null,
          p_tags: artifact.tags || [],
          p_dimensions: artifact.dimensions || [],
        })

        if (error) throw error
        createdArtifacts[artifact.title] = data
        results.artifacts_created++
      } catch (e) {
        results.errors.push(`Artifact "${artifact.title}": ${e.message}`)
      }
    }

    // Create relationships
    for (const rel of extraction.relationships || []) {
      try {
        const fromId = createdArtifacts[rel.from_title]
        const toId = createdArtifacts[rel.to_title]
        if (!fromId || !toId) {
          results.errors.push(`Relationship: could not find artifacts "${rel.from_title}" → "${rel.to_title}"`)
          continue
        }

        const { error } = await supabase.rpc('link_artifacts', {
          p_from_id: fromId,
          p_to_id: toId,
          p_type: rel.type,
          p_actor_id: actor_id || '00000000-0000-0000-0000-000000002001', // default: Nou
          p_actor_type: actor_type || 'agent',
          p_description: rel.description || null,
        })

        if (error) throw error
        results.relationships_created++
      } catch (e) {
        results.errors.push(`Relationship: ${e.message}`)
      }
    }

    // Create commitments
    for (const commitment of extraction.commitments || []) {
      try {
        // Try to find participant by name
        const { data: participant } = await supabase
          .from('participants')
          .select('id')
          .ilike('name', `%${commitment.participant}%`)
          .limit(1)
          .single()

        if (!participant) {
          results.errors.push(`Commitment: participant "${commitment.participant}" not found`)
          continue
        }

        // Find the most relevant artifact for this commitment
        const relatedArtifactId = Object.values(createdArtifacts)[0] || null

        const { error } = await supabase.rpc('record_commitment', {
          p_artifact_id: relatedArtifactId,
          p_participant_id: participant.id,
          p_description: commitment.description,
          p_due_date: commitment.due_date || null,
        })

        if (error) throw error
        results.commitments_created++
      } catch (e) {
        results.errors.push(`Commitment: ${e.message}`)
      }
    }

    // Log extraction event
    await supabase.from('events').insert({
      type: 'extraction.completed',
      entity_type: 'convergence',
      entity_id: targetConvergenceId,
      actor_type: 'agent',
      actor_id: '00000000-0000-0000-0000-000000002001', // Nou
      convergence_id: targetConvergenceId,
      data: {
        session_title: session_title || 'Unknown session',
        transcript_length: transcript.length,
        ...results,
        extraction_summary: extraction.summary,
        themes: extraction.themes,
        energy_level: extraction.energy_level,
      },
    })

    return new Response(JSON.stringify({
      success: true,
      ...results,
      extraction_summary: extraction.summary,
      themes: extraction.themes,
      artifacts: Object.entries(createdArtifacts).map(([title, id]) => ({ title, id })),
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  } catch (error) {
    console.error('Extraction error:', error)

    return new Response(JSON.stringify({
      success: false,
      error: error.message,
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    })
  }
})
