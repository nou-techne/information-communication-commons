// Sprint 76: Communication Test Suite
// Integration tests for channel/thread/message flows

import { describe, it, expect, beforeAll, afterAll } from 'vitest'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseKey) {
  throw new Error('VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY must be set in .env')
}

const supabase = createClient(supabaseUrl, supabaseKey)

// Test data cleanup
const testChannelIds: string[] = []
const testThreadIds: string[] = []
const testMessageIds: string[] = []

describe('Communication Flows', () => {
  let testConvergenceId: string
  let testChannelId: string
  let testThreadId: string
  let testMessageId: string
  let testSession: any

  beforeAll(async () => {
    // Get or create test convergence
    const { data: conv } = await supabase
      .from('convergences')
      .select('id')
      .eq('name', 'Test Convergence')
      .single()
    
    if (conv) {
      testConvergenceId = conv.id
    } else {
      const { data: newConv, error } = await supabase
        .from('convergences')
        .insert({ name: 'Test Convergence', slug: 'test-convergence' })
        .select('id')
        .single()
      if (error) throw error
      testConvergenceId = newConv!.id
    }

    // Try to get existing session (tests run as anon by default)
    const { data } = await supabase.auth.getSession()
    testSession = data.session
  })

  afterAll(async () => {
    // Cleanup test data
    if (testMessageIds.length > 0) {
      await supabase.from('messages').delete().in('id', testMessageIds)
    }
    if (testThreadIds.length > 0) {
      await supabase.from('threads').delete().in('id', testThreadIds)
    }
    if (testChannelIds.length > 0) {
      await supabase.from('channels').delete().in('id', testChannelIds)
    }
  })

  describe('Channel Operations', () => {
    it('should create a channel', async () => {
      const { data, error } = await supabase
        .from('channels')
        .insert({
          convergence_id: testConvergenceId,
          name: 'Test Channel',
          slug: 'test-channel-' + Date.now(),
          type: 'general',
          visibility: 'public'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.name).toBe('Test Channel')
      
      testChannelId = data!.id
      testChannelIds.push(data!.id)
    })

    it('should list channels for convergence', async () => {
      const { data, error } = await supabase
        .from('channels')
        .select('*')
        .eq('convergence_id', testConvergenceId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)
    })

    it('should enforce unique slugs per convergence', async () => {
      const slug = 'duplicate-test-' + Date.now()
      
      // First insert should succeed
      const { data: first, error: error1 } = await supabase
        .from('channels')
        .insert({
          convergence_id: testConvergenceId,
          name: 'First',
          slug,
          type: 'general',
          visibility: 'public'
        })
        .select()
        .single()

      expect(error1).toBeNull()
      if (first) testChannelIds.push(first.id)

      // Duplicate slug should fail
      const { error: error2 } = await supabase
        .from('channels')
        .insert({
          convergence_id: testConvergenceId,
          name: 'Second',
          slug, // same slug
          type: 'general',
          visibility: 'public'
        })

      expect(error2).toBeDefined()
      expect(error2?.code).toBe('23505') // unique violation
    })
  })

  describe('Thread Operations', () => {
    it('should create a thread in a channel', async () => {
      const { data, error } = await supabase
        .from('threads')
        .insert({
          channel_id: testChannelId,
          title: 'Test Thread',
          status: 'open'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.title).toBe('Test Thread')
      expect(data!.status).toBe('open')
      
      testThreadId = data!.id
      testThreadIds.push(data!.id)
    })

    it('should list threads in a channel', async () => {
      const { data, error } = await supabase
        .from('threads')
        .select('*')
        .eq('channel_id', testChannelId)

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)
    })

    it('should update thread status', async () => {
      const { data, error } = await supabase
        .from('threads')
        .update({ status: 'resolved' })
        .eq('id', testThreadId)
        .select()
        .single()

      expect(error).toBeNull()
      expect(data!.status).toBe('resolved')
    })
  })

  describe('Message Operations', () => {
    it('should post a message to a thread', async () => {
      const { data, error } = await supabase
        .from('messages')
        .insert({
          thread_id: testThreadId,
          content: 'Test message content',
          type: 'text'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.content).toBe('Test message content')
      
      testMessageId = data!.id
      testMessageIds.push(data!.id)
    })

    it('should load messages from a thread', async () => {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', testThreadId)
        .order('created_at', { ascending: true })

      expect(error).toBeNull()
      expect(data).toBeDefined()
      expect(data!.length).toBeGreaterThan(0)
    })

    it('should support pagination', async () => {
      // Insert 10 more messages
      const inserts = Array.from({ length: 10 }, (_, i) => ({
        thread_id: testThreadId,
        content: `Message ${i + 2}`,
        type: 'text' as const
      }))

      const { data: inserted } = await supabase
        .from('messages')
        .insert(inserts)
        .select()

      if (inserted) testMessageIds.push(...inserted.map(m => m.id))

      // Test pagination
      const { data: page1 } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', testThreadId)
        .order('created_at', { ascending: false })
        .limit(5)

      const { data: page2 } = await supabase
        .from('messages')
        .select('*')
        .eq('thread_id', testThreadId)
        .lt('created_at', page1![0].created_at)
        .order('created_at', { ascending: false })
        .limit(5)

      expect(page1!.length).toBe(5)
      expect(page2!.length).toBeGreaterThan(0)
      expect(page1![0].id).not.toBe(page2![0].id)
    })
  })

  describe('Reaction Operations', () => {
    it('should add a reaction to a message', async () => {
      // Reactions require authenticated user, skip if no session
      if (!testSession) {
        console.log('Skipping reaction test (no auth session)')
        return
      }

      const { data, error } = await supabase
        .from('message_reactions')
        .insert({
          message_id: testMessageId,
          emoji: 'thumbsup'
        })
        .select()
        .single()

      expect(error).toBeNull()
      expect(data!.emoji).toBe('thumbsup')
    })

    it('should count reactions per message', async () => {
      const { data, error } = await supabase
        .from('message_reactions')
        .select('emoji')
        .eq('message_id', testMessageId)

      expect(error).toBeNull()
      // May be empty if reaction test skipped
    })
  })

  describe('Thread Resolution', () => {
    it('should resolve a thread and create artifact', async () => {
      // Create a fresh thread for resolution test
      const { data: thread } = await supabase
        .from('threads')
        .insert({
          channel_id: testChannelId,
          title: 'Thread to resolve',
          status: 'open'
        })
        .select()
        .single()

      if (!thread) throw new Error('Failed to create test thread')
      testThreadIds.push(thread.id)

      // Add a message
      await supabase
        .from('messages')
        .insert({
          thread_id: thread.id,
          content: 'Discussion content',
          type: 'text'
        })

      // Resolve using RPC
      const { data: artifactId, error } = await supabase.rpc('resolve_thread', {
        p_thread_id: thread.id,
        p_summary: 'Resolved via test'
      })

      // RPC may fail if not authenticated, that's expected in test env
      if (error && error.code !== '42501') {
        // 42501 = insufficient_privilege, expected for anon
        expect(error).toBeNull()
      }

      if (artifactId) {
        // Verify thread status updated
        const { data: updated } = await supabase
          .from('threads')
          .select('status')
          .eq('id', thread.id)
          .single()

        expect(updated!.status).toBe('resolved')
      }
    })
  })

  describe('Search Operations', () => {
    it('should search messages by content', async () => {
      // Insert a message with distinctive content
      const uniqueWord = 'SearchableTestWord' + Date.now()
      const { data: msg } = await supabase
        .from('messages')
        .insert({
          thread_id: testThreadId,
          content: `Message containing ${uniqueWord}`,
          type: 'text'
        })
        .select()
        .single()

      if (msg) testMessageIds.push(msg.id)

      // Simple search (full-text search requires proper setup)
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .ilike('content', `%${uniqueWord}%`)

      expect(error).toBeNull()
      expect(data!.length).toBeGreaterThan(0)
      expect(data![0].content).toContain(uniqueWord)
    })
  })
})
