// Knowledge Graph API Handlers

import { supabase } from '../lib/supabase'
import type { GetGraphRequest, GetGraphResponse } from '../types/api'

export async function getGraph(
  req: GetGraphRequest = {}
): Promise<GetGraphResponse> {
  // Get artifacts (nodes)
  let artifactQuery = supabase
    .from('artifacts')
    .select('id, title, type, rea_role')

  if (req.convergence_id) {
    artifactQuery = artifactQuery.eq('convergence_id', req.convergence_id)
  }

  const { data: artifacts, error: artifactsError } = await artifactQuery

  if (artifactsError) {
    throw new Error(`Failed to get artifacts: ${artifactsError.message}`)
  }

  // Get relationships (edges)
  const artifactIds = artifacts?.map(a => a.id) || []
  const { data: relationships, error: relError } = await supabase
    .from('artifact_relationships')
    .select('from_artifact_id, to_artifact_id, relationship_type')
    .or(`from_artifact_id.in.(${artifactIds.join(',')}),to_artifact_id.in.(${artifactIds.join(',')})`)

  if (relError) {
    throw new Error(`Failed to get relationships: ${relError.message}`)
  }

  return {
    nodes: artifacts?.map(a => ({
      id: a.id,
      title: a.title,
      type: a.type || 'unknown',
      rea_role: a.rea_role,
    })) || [],
    links: relationships?.map(r => ({
      source: r.from_artifact_id,
      target: r.to_artifact_id,
      type: r.relationship_type,
    })) || [],
  }
}

export async function getNode(nodeId: string) {
  const { data: artifact, error } = await supabase
    .from('artifacts')
    .select('id, title, description, type, rea_role, created_at')
    .eq('id', nodeId)
    .single()

  if (error) {
    throw new Error(`Failed to get node: ${error.message}`)
  }

  // Get tags
  const { data: tags } = await supabase
    .from('artifact_tags')
    .select('tag_id, tags(name)')
    .eq('artifact_id', nodeId)

  // Get relationships
  const { data: outgoing } = await supabase
    .from('artifact_relationships')
    .select('to_artifact_id, relationship_type')
    .eq('from_artifact_id', nodeId)

  const { data: incoming } = await supabase
    .from('artifact_relationships')
    .select('from_artifact_id, relationship_type')
    .eq('to_artifact_id', nodeId)

  return {
    ...artifact,
    tags: tags?.map(t => (t.tags as any)?.name).filter(Boolean) || [],
    outgoing: outgoing || [],
    incoming: incoming || [],
  }
}

export async function getNeighbors(nodeId: string, depth: number = 1) {
  const visited = new Set<string>()
  const nodes: any[] = []
  const links: any[] = []

  async function explore(id: string, currentDepth: number) {
    if (currentDepth > depth || visited.has(id)) return
    visited.add(id)

    // Get node
    const { data: node } = await supabase
      .from('artifacts')
      .select('id, title, type, rea_role')
      .eq('id', id)
      .single()

    if (node) nodes.push(node)

    // Get relationships
    const { data: rels } = await supabase
      .from('artifact_relationships')
      .select('from_artifact_id, to_artifact_id, relationship_type')
      .or(`from_artifact_id.eq.${id},to_artifact_id.eq.${id}`)

    for (const rel of rels || []) {
      links.push({
        source: rel.from_artifact_id,
        target: rel.to_artifact_id,
        type: rel.relationship_type,
      })

      const nextId = rel.from_artifact_id === id ? rel.to_artifact_id : rel.from_artifact_id
      await explore(nextId, currentDepth + 1)
    }
  }

  await explore(nodeId, 1)

  return { nodes, links }
}
