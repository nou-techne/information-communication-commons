import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')!
const SUPABASE_URL = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const PROFILE_EXTRACTION_PROMPT = `You are extracting a participant profile from a natural language self-introduction at a convergence event (ETHBoulder 2026).

The person is telling you about themselves. Extract structured profile information.

Return ONLY valid JSON, no code fences.

## Output Schema

{
  "name": "their full name (required — infer from context if they mention it)",
  "affiliation": "organization, company, project, or community they're part of (null if not mentioned)",
  "bio": "a concise 1-3 sentence bio synthesized from what they shared (not a copy — a clear, third-person summary)",
  "background": "longer narrative about their professional/personal background (null if not enough detail)",
  "experience": ["specific experience areas — e.g. 'smart contract development', '10 years community organizing'"],
  "skills": ["concrete skills — e.g. 'Solidity', 'facilitation', 'data visualization', 'grant writing'"],
  "capabilities": ["what they can do for others — e.g. 'technical architecture review', 'fundraising strategy'"],
  "interests": ["specific topics they're drawn to — e.g. 'regenerative finance', 'bioregional governance'"],
  "looking_for": ["what they want to find — e.g. 'co-founder for climate project', 'Rust developers', 'funding'],
  "offering": ["what they're offering — e.g. 'mentorship in web3', 'free design reviews', 'office space in Boulder'"],
  "location": "where they're based (city, region — null if not mentioned)",
  "hlamt_tags": ["hlamt:X tags that describe their dimensional focus — which domains of capacity they bring"],
  "rea_role_hint": "What kind of agent are they? Brief note like 'builder', 'researcher', 'organizer', 'artist', 'investor', 'educator'"
}

## e/H-LAM/T Dimension Tags
- hlamt:e — ecology, place, watershed, environmental context, natural systems
- hlamt:H — human capability, relationships, social capital, lived experience
- hlamt:L — language, shared vocabulary, frameworks, cultural capital, communication
- hlamt:A — artifacts, tools, infrastructure, software, financial capital
- hlamt:M — methodology, processes, workflows, coordination patterns
- hlamt:T — training, learning, skill development, education, transformation

## Guidance
- If they don't give their name, set name to null — the system will fall back to their email
- Bio should be third-person ("Sarah is a..." not "I am a...")
- All array fields should contain specific, actionable items — not generic categories
- skills vs capabilities: skills are what they know, capabilities are what they can do for others
- looking_for + offering are the coordination engine — extract these carefully, they enable matchmaking
- Background is the longer narrative; bio is the 1-3 sentence summary
- Tag them with the hlamt dimensions that best describe where their capability lives
- Most people touch 2-3 dimensions
- Omit any field where there's no signal (use null for strings, empty array for arrays)

Text:
`

function stripCodeFences(text: string): string {
  text = text.trim()
  if (text.startsWith('```')) {
    const lines = text.split('\n')
    lines.shift()
    return lines.join('\n').replace(/```\s*$/m, '').trim()
  }
  return text
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    })
  }

  try {
    const { content, auth_user_id } = await req.json()

    if (!content || content.length < 20) {
      return new Response(JSON.stringify({ error: 'Please tell us a bit more about yourself (at least 20 characters)' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
      })
    }

    // Call Claude to extract profile
    const claudeResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        messages: [{ role: 'user', content: PROFILE_EXTRACTION_PROMPT + content }],
      }),
    })

    if (!claudeResponse.ok) {
      const err = await claudeResponse.text()
      throw new Error(`Claude API error: ${claudeResponse.status} ${err}`)
    }

    const claudeResult = await claudeResponse.json()
    let extractionText = stripCodeFences(claudeResult.content[0].text)
    const profile = JSON.parse(extractionText)

    // Create Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

    // Check if participant already exists for this auth user
    let participantId: string | null = null
    if (auth_user_id) {
      const { data: existing } = await supabase
        .from('participants')
        .select('id')
        .eq('auth_user_id', auth_user_id)
        .maybeSingle()

      if (existing) {
        participantId = existing.id
      }
    }

    const profileData = {
      name: profile.name || 'Anonymous',
      affiliation: profile.affiliation || null,
      bio: profile.bio || null,
      background: profile.background || null,
      experience: profile.experience || [],
      skills: profile.skills || [],
      capabilities: profile.capabilities || [],
      interests: profile.interests || [],
      looking_for: profile.looking_for || [],
      offering: profile.offering || [],
      location: profile.location || null,
      ...(auth_user_id && { auth_user_id }),
    }

    let result
    if (participantId) {
      // Update existing participant
      const { data, error } = await supabase
        .from('participants')
        .update({ ...profileData, updated_at: new Date().toISOString() })
        .eq('id', participantId)
        .select()
        .single()
      if (error) throw error
      result = data
    } else {
      // Create new participant
      const { data, error } = await supabase
        .from('participants')
        .insert(profileData)
        .select()
        .single()
      if (error) throw error
      result = data
    }

    // Also create an agent artifact for this participant
    const convergenceId = '00000000-0000-0000-0000-000000000100' // ETHBoulder
    const { data: existingArtifact } = await supabase
      .from('artifacts')
      .select('id')
      .eq('created_by', result.id)
      .eq('rea_role', 'agent')
      .maybeSingle()

    if (!existingArtifact) {
      await supabase.from('artifacts').insert({
        title: profile.name || 'Anonymous Participant',
        summary: profile.bio || `Participant at ETHBoulder 2026`,
        convergence_id: convergenceId,
        created_by: result.id,
        rea_role: 'agent',
        agent_type: 'human',
        type: 'reflection',
      })

      // Tag the artifact with hlamt dimensions
      if (profile.hlamt_tags && profile.hlamt_tags.length > 0) {
        const { data: artifact } = await supabase
          .from('artifacts')
          .select('id')
          .eq('created_by', result.id)
          .eq('rea_role', 'agent')
          .single()

        if (artifact) {
          for (const tagName of profile.hlamt_tags) {
            // Find or create the tag
            let { data: tag } = await supabase.from('tags').select('id').eq('name', tagName).maybeSingle()
            if (!tag) {
              const { data: newTag } = await supabase.from('tags').insert({ name: tagName }).select('id').single()
              tag = newTag
            }
            if (tag) {
              await supabase.from('artifact_tags').upsert({ artifact_id: artifact.id, tag_id: tag.id }, { onConflict: 'artifact_id,tag_id' })
            }
          }
        }
      }
    }

    return new Response(JSON.stringify({
      success: true,
      participant: result,
      extracted: profile,
      isUpdate: !!participantId,
    }), {
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  } catch (err) {
    console.error('Profile processing error:', err)
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    })
  }
})
