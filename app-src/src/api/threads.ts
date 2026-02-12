// Thread API Handlers

import { supabase } from '../lib/supabase'
import type {
  CreateThreadRequest,
  CreateThreadResponse,
  ListThreadsRequest,
  ListThreadsResponse,
} from '../types/api'

export async function createThread(
  req: CreateThreadRequest
): Promise<CreateThreadResponse> {
  const { data, error } = await supabase
    .from('threads')
    .insert({
      channel_id: req.channel_id,
      title: req.title,
      status: 'open',
    })
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to create thread: ${error.message}`)
  }

  // Create initial message if provided
  if (req.initial_message) {
    const { error: msgError } = await supabase
      .from('messages')
      .insert({
        thread_id: data.id,
        content: req.initial_message,
        type: 'text',
      })

    if (msgError) {
      console.error('Failed to create initial message:', msgError)
    }
  }

  return {
    thread_id: data.id,
    status: 'open',
  }
}

export async function getThread(threadId: string) {
  const { data: thread, error } = await supabase
    .from('threads')
    .select('*')
    .eq('id', threadId)
    .single()

  if (error) {
    throw new Error(`Failed to get thread: ${error.message}`)
  }

  // Get message count
  const { count } = await supabase
    .from('messages')
    .select('*', { count: 'exact', head: true })
    .eq('thread_id', threadId)

  return {
    ...thread,
    message_count: count || 0,
  }
}

export async function listThreads(
  req: ListThreadsRequest
): Promise<ListThreadsResponse> {
  let query = supabase
    .from('threads')
    .select('id, title, status, created_at, updated_at')
    .eq('channel_id', req.channel_id)
    .order('updated_at', { ascending: false })

  if (req.status) {
    query = query.eq('status', req.status)
  }

  if (req.limit) {
    const offset = req.offset || 0
    query = query.range(offset, offset + req.limit - 1)
  }

  const { data, error, count } = await query

  if (error) {
    throw new Error(`Failed to list threads: ${error.message}`)
  }

  // Get message counts for each thread
  const threads = await Promise.all(
    (data || []).map(async (thread) => {
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('thread_id', thread.id)

      return {
        ...thread,
        message_count: count || 0,
      }
    })
  )

  return {
    threads,
    total: count || threads.length,
  }
}

export async function resolveThread(
  threadId: string,
  resolution: { reason: string; summary: string }
) {
  // Post resolution summary as system message
  const { error: msgError } = await supabase
    .from('messages')
    .insert({
      thread_id: threadId,
      content: `**Resolved:** ${resolution.reason}\n\n${resolution.summary}`,
      type: 'system',
    })

  if (msgError) {
    console.error('Failed to create resolution message:', msgError)
  }

  // Update thread status
  const { data, error } = await supabase
    .from('threads')
    .update({ status: 'resolved' })
    .eq('id', threadId)
    .select()
    .single()

  if (error) {
    throw new Error(`Failed to resolve thread: ${error.message}`)
  }

  return data
}
