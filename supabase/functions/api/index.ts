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
        version: '0.1.0',
        description: 'Agent-facing API for the Information & Communications Commons',
        framework: 'e/H-LAM/T/S',
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
          'POST /contribute': 'Submit a contribution (body: {content, participant_id?})',
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

    return err('Not found', 404)

  } catch (e: any) {
    return err(e.message || 'Internal error', 500)
  }
})
