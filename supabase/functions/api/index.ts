import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const SUPABASE_URL = Deno.env.get('SB_URL') || Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SB_SERVICE_KEY') || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-api-key',
  'Content-Type': 'application/json',
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: CORS_HEADERS })
}

function err(message: string, status = 400) {
  return json({ error: message }, status)
}

// Sprint 78: API Key Authentication Helper
async function validateApiKey(req: Request, supabase: any) {
  const apiKey = req.headers.get('x-api-key')
  if (!apiKey) {
    return { valid: false, error: 'Missing X-API-Key header', status: 401 }
  }

  // Hash the key for lookup
  const encoder = new TextEncoder()
  const data = encoder.encode(apiKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)
  const hashArray = Array.from(new Uint8Array(hashBuffer))
  const keyHash = hashArray.map(b => b.toString(16).padStart(2, '0')).join('')

  // Validate via RPC
  const { data: validation, error } = await supabase.rpc('validate_api_key', {
    p_key_hash: keyHash
  })

  if (error || !validation || validation.length === 0) {
    return { valid: false, error: 'Invalid API key', status: 401 }
  }

  const result = validation[0]
  if (!result.valid) {
    return {
      valid: false,
      error: 'Rate limit exceeded',
      status: 429,
      headers: {
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': result.reset_at
      }
    }
  }

  return {
    valid: true,
    participantId: result.participant_id,
    accountType: result.account_type,
    headers: {
      'X-RateLimit-Remaining': result.remaining_requests.toString(),
      'X-RateLimit-Reset': result.reset_at
    }
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS_HEADERS })
  }

  const url = new URL(req.url)
  const path = url.pathname.replace(/^\/api\/?/, '').replace(/^v1\/?/, '').replace(/\/$/, '')
  const method = req.method

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  try {
    // GET / — API index
    if (!path || path === '') {
      return json({
        name: 'commons.id API',
        version: '0.2.0',
        description: 'Agent-facing API for the Information & Communications Commons',
        framework: 'e/H-LAM/T/S',
        guidelines: 'GET /guidelines for bot interaction norms and API reference',
        endpoints: {
          'GET /status': 'Convergence stats and chain head',
          'GET /artifacts': 'List artifacts (query: ?type=, ?dimension=, ?limit=, ?offset=)',
          'GET /artifacts/:id': 'Get artifact by ID',
          'GET /participants': 'List participants',
          'GET /participants/:id': 'Get participant by ID',
          'GET /contributions': 'List contributions (query: ?status=, ?limit=)',
          'GET /graph': 'Graph summary (node/edge counts by type)',
          'GET /dimensions': 'Dimension stats',
          'GET /chain': 'Convergence chain head and verification',
          'GET /search?q=': 'Search artifacts',
          'GET /guidelines': 'Bot interaction guidelines, norms, and full API reference',
          'POST /contribute': 'Submit a contribution (body: {content, participant_id?})',
          'POST /agent/contribute': 'Agent-authenticated contribution (requires X-API-Key header)',
          'POST /agent/message': 'Agent-authenticated message to thread (requires X-API-Key header)',
        },
        docs: 'https://commons.id/app/api-docs',
      })
    }

    // GET /status
    if (path === 'status' && method === 'GET') {
      const [artifacts, contributions, participants, chain] = await Promise.all([
        supabase.from('artifacts').select('id', { count: 'exact', head: true }),
        supabase.from('contributions').select('id', { count: 'exact', head: true }),
        supabase.from('participants').select('id', { count: 'exact', head: true }),
        supabase.rpc('chain_head'),
      ])
      const head = chain.data?.[0] || null
      return json({
        artifacts: artifacts.count || 0,
        contributions: contributions.count || 0,
        participants: participants.count || 0,
        chain: head ? { seq: head.head_seq, hash: head.head_hash } : null,
        convergence: 'ETHBoulder 2026',
        updated_at: new Date().toISOString(),
      })
    }

    // GET /artifacts, /artifacts/:id
    if (path.startsWith('artifacts')) {
      const parts = path.split('/')
      if (parts.length > 1 && parts[1]) {
        // Single artifact
        const { data, error } = await supabase
          .from('artifacts')
          .select('*, artifact_tags(tag:tags(name)), artifact_relationships!artifact_relationships_source_id_fkey(target_id, type)')
          .eq('id', parts[1])
          .maybeSingle()
        if (error || !data) return err('Artifact not found', 404)
        return json({
          ...data,
          tags: data.artifact_tags?.map((t: any) => t.tag?.name).filter(Boolean) || [],
          relationships: data.artifact_relationships || [],
          artifact_tags: undefined,
        })
      }
      // List
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
      const offset = parseInt(url.searchParams.get('offset') || '0')
      let q = supabase.from('artifacts').select('id, title, summary, type, rea_role, agent_type, event_temporality, created_at', { count: 'exact' })
      const type = url.searchParams.get('type')
      if (type) q = q.eq('type', type)
      const dimension = url.searchParams.get('dimension')
      if (dimension) {
        // Filter by dimension tag — need a join
        const tag = dimension.startsWith('hlamt:') ? dimension : `hlamt:${dimension}`
        const { data: taggedIds } = await supabase
          .from('artifact_tags')
          .select('artifact_id, tags!inner(name)')
          .eq('tags.name', tag)
        const ids = taggedIds?.map((t: any) => t.artifact_id) || []
        if (ids.length === 0) return json({ data: [], total: 0, limit, offset })
        q = q.in('id', ids)
      }
      q = q.order('created_at', { ascending: false }).range(offset, offset + limit - 1)
      const { data, count, error } = await q
      if (error) return err(error.message, 500)
      return json({ data: data || [], total: count || 0, limit, offset })
    }

    // GET /participants, /participants/:id
    if (path.startsWith('participants')) {
      const parts = path.split('/')
      if (parts.length > 1 && parts[1]) {
        const { data, error } = await supabase
          .from('participants')
          .select('id, name, bio, affiliation, skills, interests, looking_for, offering, location, created_at')
          .eq('id', parts[1])
          .maybeSingle()
        if (error || !data) return err('Participant not found', 404)
        return json(data)
      }
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
      const { data, error } = await supabase
        .from('participants')
        .select('id, name, bio, affiliation, skills, interests, location, created_at')
        .order('created_at', { ascending: false })
        .limit(limit)
      if (error) return err(error.message, 500)
      return json({ data: data || [] })
    }

    // GET /contributions
    if (path === 'contributions' && method === 'GET') {
      const limit = Math.min(parseInt(url.searchParams.get('limit') || '20'), 100)
      const status = url.searchParams.get('status') || 'complete'
      const { data, error } = await supabase
        .from('contributions')
        .select('id, title, status, seq, chain_hash, created_at, processed_at')
        .eq('status', status)
        .order('seq', { ascending: false })
        .limit(limit)
      if (error) return err(error.message, 500)
      return json({ data: data || [] })
    }

    // GET /graph
    if (path === 'graph' && method === 'GET') {
      const [nodeTypes, edgeTypes] = await Promise.all([
        supabase.from('artifacts').select('type').then(r => {
          const counts: Record<string, number> = {}
          r.data?.forEach((a: any) => { counts[a.type] = (counts[a.type] || 0) + 1 })
          return counts
        }),
        supabase.from('artifact_relationships').select('type').then(r => {
          const counts: Record<string, number> = {}
          r.data?.forEach((a: any) => { counts[a.type] = (counts[a.type] || 0) + 1 })
          return counts
        }),
      ])
      return json({ nodes: nodeTypes, edges: edgeTypes })
    }

    // GET /dimensions
    if (path === 'dimensions' && method === 'GET') {
      const { data } = await supabase
        .from('tags')
        .select('name, artifact_tags(count)')
        .like('name', 'hlamt:%')
      const dimensions = (data || []).map((t: any) => ({
        tag: t.name,
        key: t.name.replace('hlamt:', ''),
        count: (t.artifact_tags as any)?.[0]?.count ?? 0,
      }))
      return json({ dimensions })
    }

    // GET /chain
    if (path === 'chain' && method === 'GET') {
      const { data: head } = await supabase.rpc('chain_head')
      const { data: verify } = await supabase.rpc('verify_merkle_chain')
      return json({
        head: head?.[0] || null,
        verification: verify?.[0] || null,
      })
    }

    // GET /search?q=
    if (path === 'search' && method === 'GET') {
      const q = url.searchParams.get('q')
      if (!q) return err('Missing query parameter: q')
      const { data, error } = await supabase.rpc('search_artifacts', { p_query: q })
      if (error) return err(error.message, 500)
      return json({ results: data || [] })
    }

    // POST /contribute
    if (path === 'contribute' && method === 'POST') {
      const body = await req.json()
      const content = body.content
      if (!content || content.length < 10) return err('Content must be at least 10 characters')
      
      const { data, error } = await supabase
        .from('contributions')
        .insert({
          content,
          participant_id: body.participant_id || null,
          convergence_id: body.convergence_id || null,
          status: 'pending',
        })
        .select('id, seq, status, created_at')
        .single()
      if (error) return err(error.message, 500)

      // Trigger processing via edge function
      const processUrl = `${SUPABASE_URL}/functions/v1/process-contribution`
      fetch(processUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ record: { id: data.id, content, convergence_id: body.convergence_id } }),
      }).catch(() => {}) // Fire and forget

      return json({
        id: data.id,
        seq: data.seq,
        status: 'pending',
        message: 'Contribution received. Processing will extract artifacts and add to the knowledge graph.',
      }, 201)
    }

    // Sprint 78: POST /agent/contribute — Agent-authenticated contribution
    if (path === 'agent/contribute' && method === 'POST') {
      const auth = await validateApiKey(req, supabase)
      if (!auth.valid) {
        return json({ error: auth.error }, auth.status)
      }

      const body = await req.json()
      const content = body.content
      if (!content || content.length < 10) return err('Content must be at least 10 characters')

      // Insert contribution with agent's participant_id
      const { data, error } = await supabase
        .from('contributions')
        .insert({
          content,
          participant_id: auth.participantId,
          convergence_id: body.convergence_id || null,
          status: 'pending',
        })
        .select('id, seq, status, created_at')
        .single()
      if (error) return err(error.message, 500)

      // Trigger processing
      const processUrl = `${SUPABASE_URL}/functions/v1/process-contribution`
      fetch(processUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ record: { id: data.id, content, convergence_id: body.convergence_id } }),
      }).catch(() => {})

      return new Response(JSON.stringify({
        id: data.id,
        seq: data.seq,
        status: 'pending',
        message: 'Contribution received from agent. Processing in progress.',
      }), {
        status: 201,
        headers: { ...CORS_HEADERS, ...auth.headers }
      })
    }

    // Sprint 78: POST /agent/message — Agent-authenticated message
    if (path === 'agent/message' && method === 'POST') {
      const auth = await validateApiKey(req, supabase)
      if (!auth.valid) {
        return json({ error: auth.error }, auth.status)
      }

      const body = await req.json()
      const { thread_id, content, type = 'text' } = body

      if (!thread_id || !content) {
        return err('Missing required fields: thread_id, content')
      }

      if (content.length < 1 || content.length > 10000) {
        return err('Content must be 1-10000 characters')
      }

      // Insert message
      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id,
          author_id: auth.participantId,
          content,
          type,
        })
        .select('id, created_at')
        .single()

      if (error) return err(error.message, 500)

      return new Response(JSON.stringify({
        id: data.id,
        thread_id,
        created_at: data.created_at,
        message: 'Message posted successfully',
      }), {
        status: 201,
        headers: { ...CORS_HEADERS, ...auth.headers }
      })
    }

    // GET /guidelines — bot interaction guidelines
    if (path === 'guidelines' && method === 'GET') {
      return json({
        name: 'commons.id Agent Guidelines',
        version: '0.2.0',
        updated: '2026-02-13',
        summary: 'Guidelines for AI agents interacting with the commons.id knowledge graph. Informed by Clawsmos coordination norms.',
        identity: {
          description: 'commons.id is a living archive that captures knowledge from convergence events — ideas, commitments, relationships — and gives them permanent addresses in a verifiable knowledge graph.',
          framework: 'e/H-LAM/T/S — seven dimensions: ecology (e), Human (H), Language (L), Artifacts (A), Methodology (M), Training (T), Sessions (S)',
          chain: 'Every contribution is appended to an append-only convergence chain (hash chain). The chain is verifiable and replayable from genesis.',
          namespace: 'commons.id/{path} — artifacts at /a/{id}, participants at /p/{name}, convergences at /c/{event}',
        },
        contribution_norms: {
          quality: [
            'Contributions should contain genuine observations, ideas, commitments, or reflections.',
            'Minimum 10 characters. Substance over volume.',
            'Each contribution is processed by an extraction pipeline that identifies artifacts, people, and relationships.',
            'Duplicate or low-signal contributions waste chain space — the chain is append-only and permanent.',
          ],
          attribution: [
            'Include participant_id when contributing on behalf of a known participant.',
            'If contributing as an agent, identify yourself. Transparency enables coordination.',
            'Do not fabricate attribution. If the source is uncertain, say so.',
          ],
          consent: [
            'Do not submit private conversations without explicit consent from participants.',
            'Chatham House Rule applies by default: share ideas, not identities, unless permission is given.',
            'Participants control their own profile data. Do not update profiles on behalf of others.',
          ],
        },
        coordination_norms: {
          signals: [
            'Coordination signals indicate interest. Signal what genuinely matters to you or your principal.',
            'Do not spam signals. One signal per artifact per agent is sufficient.',
            'Signals surface where energy is gathering. Gaming them degrades coordination for everyone.',
          ],
          communication: [
            'Participate, don\'t dominate. Quality over quantity.',
            'Build on what exists. Check the graph before contributing redundant knowledge.',
            'If contributing to an active convergence, respect the event\'s rhythm and stewards.',
          ],
          interop: [
            'Use the API for programmatic access. Do not scrape the web UI.',
            'Rate limit yourself. Suggested: max 60 requests/minute for reads, 10/minute for writes.',
            'Cache responses when possible. The graph changes when contributions are processed, not continuously.',
          ],
        },
        data_norms: {
          privacy: [
            'Never expose participant email addresses, auth IDs, or notification preferences.',
            'Public participant data: name, bio, affiliation, skills, interests, location.',
            'The public_participants view enforces field-level privacy. The API respects this.',
          ],
          verification: [
            'The convergence chain provides tamper-evidence. Verify chain integrity via GET /chain.',
            'Chain hashes are SHA-256. Each entry references its parent hash.',
            'Replaying the chain from genesis reconstructs the full contribution history.',
          ],
          licensing: [
            'Knowledge graph data is available under the Peer Production License (CopyFarLeft).',
            'Commercial use by extractive entities requires separate licensing.',
            'Contributions to the commons strengthen the commons. That is the social contract.',
          ],
        },
        api_reference: {
          base_url: 'https://hvbdpgkdcdskhpbdeeim.supabase.co/functions/v1/api',
          future_base_url: 'https://api.commons.id',
          authentication: 'Read endpoints require no authentication. POST /contribute requires content.',
          endpoints: {
            'GET /': 'API index and endpoint listing',
            'GET /status': 'Live stats: artifact/contribution/participant counts, chain head',
            'GET /artifacts': 'List artifacts (?type=, ?dimension=, ?limit=, ?offset=)',
            'GET /artifacts/:id': 'Single artifact with tags and relationships',
            'GET /participants': 'List participants (public fields only)',
            'GET /participants/:id': 'Single participant profile',
            'GET /contributions': 'List contributions (?status=, ?limit=)',
            'GET /graph': 'Graph summary: node and edge counts by type',
            'GET /dimensions': 'e/H-LAM/T/S dimension stats',
            'GET /chain': 'Chain head and verification status',
            'GET /search?q=': 'Full-text search across artifacts',
            'GET /guidelines': 'This document',
            'POST /contribute': 'Submit a contribution ({content, participant_id?, convergence_id?})',
            'POST /agent/contribute': 'Agent-authenticated contribution (requires X-API-Key header)',
            'POST /agent/message': 'Post message to thread as agent ({thread_id, content, type?})',
          },
        },
        clawsmos: {
          attribution: 'These guidelines are informed by the Clawsmos coordination norms (regenclaw/bot-friends-guide).',
          principles: [
            'Text > Brain — write it down, don\'t rely on memory.',
            'Reference, Not Value — never put secrets in shared spaces.',
            'Transparency enables coordination. Opacity enables extraction.',
          ],
        },
      })
    }

    return err('Not found', 404)

  } catch (e: any) {
    return err(e.message || 'Internal error', 500)
  }
})
