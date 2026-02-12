// Contribution API Handlers

import { supabase } from '../lib/supabase'
import type {
  CreateContributionRequest,
  CreateContributionResponse,
  GetContributionRequest,
  GetContributionResponse,
} from '../types/api'

export async function createContribution(
  req: CreateContributionRequest
): Promise<CreateContributionResponse> {
  const { data, error } = await supabase
    .from('contributions')
    .insert({
      content: req.content,
      participant_id: req.participant_id || null,
      status: 'pending',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create contribution: ${error.message}`)
  }

  return {
    contribution_id: data.id,
    status: 'processing',
  }
}

export async function getContribution(
  req: GetContributionRequest
): Promise<GetContributionResponse> {
  const { data: contribution, error } = await supabase
    .from('contributions')
    .select('id, content, participant_id, status, created_at')
    .eq('id', req.id)
    .single()

  if (error) {
    throw new Error(`Failed to get contribution: ${error.message}`)
  }

  // Get associated artifacts
  const { data: artifacts } = await supabase
    .from('artifacts')
    .select('id, title')
    .eq('contribution_id', req.id)

  return {
    id: contribution.id,
    content: contribution.content,
    participant_id: contribution.participant_id,
    status: contribution.status,
    created_at: contribution.created_at,
    artifacts: artifacts?.map(a => ({ id: a.id, title: a.title })) || [],
  }
}

export async function listContributions(
  limit: number = 50,
  offset: number = 0
): Promise<GetContributionResponse[]> {
  const { data, error } = await supabase
    .from('contributions')
    .select('id, content, participant_id, status, created_at')
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    throw new Error(`Failed to list contributions: ${error.message}`)
  }

  // For each contribution, get artifacts (simplified - could batch this)
  const contributions: GetContributionResponse[] = []
  for (const contrib of data || []) {
    const { data: artifacts } = await supabase
      .from('artifacts')
      .select('id, title')
      .eq('contribution_id', contrib.id)

    contributions.push({
      id: contrib.id,
      content: contrib.content,
      participant_id: contrib.participant_id,
      status: contrib.status,
      created_at: contrib.created_at,
      artifacts: artifacts?.map(a => ({ id: a.id, title: a.title })) || [],
    })
  }

  return contributions
}
