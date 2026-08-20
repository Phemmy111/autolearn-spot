/**
 * ALEX Phase 4 - Memory Service Tests
 */

import { describe, it, expect, beforeEach, afterEach } from '@jest/globals'
import { MemoryService } from '../memory-service'
import { Memory, MemoryCreateInput, MemoryType } from '../types'

// Mock Supabase client
const mockSupabase = {
  from: jest.fn(() => mockSupabase),
  select: jest.fn(() => mockSupabase),
  insert: jest.fn(() => mockSupabase),
  update: jest.fn(() => mockSupabase),
  delete: jest.fn(() => mockSupabase),
  eq: jest.fn(() => mockSupabase),
  ilike: jest.fn(() => mockSupabase),
  rpc: jest.fn(() => mockSupabase),
  single: jest.fn(() => mockSupabase),
  order: jest.fn(() => mockSupabase),
  limit: jest.fn(() => mockSupabase),
  range: jest.fn(() => mockSupabase),
  in: jest.fn(() => mockSupabase),
  gte: jest.fn(() => mockSupabase),
  lt: jest.fn(() => mockSupabase),
  not: jest.fn(() => mockSupabase),
  then: jest.fn(),
  catch: jest.fn()
}

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => mockSupabase)
}))

describe('MemoryService', () => {
  let memoryService: MemoryService
  const testUserId = 'test-user-123'
  const testConversationId = 'test-conversation-456'

  beforeEach(() => {
    memoryService = new MemoryService()
    jest.clearAllMocks()
  })

  afterEach(() => {
    jest.resetAllMocks()
  })

  describe('createMemory', () => {
    it('should create a memory successfully', async () => {
      const input: MemoryCreateInput = {
        content: 'I prefer TypeScript over JavaScript',
        source: 'explicit',
        source_conversation_id: testConversationId
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'memory-123',
          user_id: testUserId,
          memory_type: 'preference',
          content: input.content,
          confidence: 1.0,
          importance: 0.5,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      })

      const memory = await memoryService.createMemory(testUserId, input)

      expect(memory).toBeDefined()
      expect(memory.content).toBe(input.content)
      expect(memory.memory_type).toBe('preference')
      expect(mockSupabase.insert).toHaveBeenCalled()
    })

    it('should reject memory with sensitive content', async () => {
      const input: MemoryCreateInput = {
        content: 'My password is secret123',
        source: 'explicit'
      }

      await expect(memoryService.createMemory(testUserId, input)).rejects.toThrow('sensitive')
    })

    it('should classify memory type automatically', async () => {
      const input: MemoryCreateInput = {
        content: 'I like TypeScript',
        source: 'explicit'
      }

      mockSupabase.insert.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: 'memory-123',
          user_id: testUserId,
          memory_type: 'preference',
          content: input.content,
          confidence: 1.0,
          importance: 0.5,
          is_active: true
        }
      })

      const memory = await memoryService.createMemory(testUserId, input)

      expect(memory.memory_type).toBe('preference')
    })
  })

  describe('getMemory', () => {
    it('should retrieve a memory by ID', async () => {
      const memoryId = 'memory-123'

      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: {
          id: memoryId,
          user_id: testUserId,
          content: 'Test memory',
          is_active: true
        }
      })

      const memory = await memoryService.getMemory(memoryId, testUserId)

      expect(memory).toBeDefined()
      expect(memory?.id).toBe(memoryId)
    })

    it('should return null for non-existent memory', async () => {
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      const memory = await memoryService.getMemory('non-existent', testUserId)

      expect(memory).toBeNull()
    })
  })

  describe('listMemories', () => {
    it('should list all memories for a user', async () => {
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockReturnValue(mockSupabase)
      mockSupabase.range.mockReturnValue(mockSupabase)
      mockSupabase.resolve.mockResolvedValue({
        data: [
          { id: 'memory-1', content: 'Memory 1' },
          { id: 'memory-2', content: 'Memory 2' }
        ],
        count: 2,
        error: null
      })

      const result = await memoryService.listMemories(testUserId)

      expect(result.memories).toHaveLength(2)
      expect(result.total).toBe(2)
    })

    it('should filter by memory type', async () => {
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.order.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockReturnValue(mockSupabase)
      mockSupabase.range.mockReturnValue(mockSupabase)
      mockSupabase.resolve.mockResolvedValue({
        data: [{ id: 'memory-1', memory_type: 'preference' }],
        count: 1,
        error: null
      })

      const result = await memoryService.listMemories(testUserId, { memoryType: 'preference' })

      expect(result.memories).toHaveLength(1)
      expect(result.memories[0].memory_type).toBe('preference')
    })
  })

  describe('updateMemory', () => {
    it('should update a memory', async () => {
      const memoryId = 'memory-123'

      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: { id: memoryId, content: 'Old content' }
      })

      mockSupabase.update.mockReturnValue(mockSupabase)
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: { id: memoryId, content: 'New content' }
      })

      const memory = await memoryService.updateMemory(memoryId, testUserId, { content: 'New content' })

      expect(memory.content).toBe('New content')
    })

    it('should reject update for non-existent memory', async () => {
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({ data: null, error: null })

      await expect(
        memoryService.updateMemory('non-existent', testUserId, { content: 'New content' })
      ).rejects.toThrow('not found')
    })
  })

  describe('deleteMemory', () => {
    it('should soft delete a memory', async () => {
      const memoryId = 'memory-123'

      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.single.mockResolvedValue({
        data: { id: memoryId, is_active: true }
      })

      mockSupabase.update.mockResolvedValue({ error: null })

      await memoryService.deleteMemory(memoryId, testUserId)

      expect(mockSupabase.update).toHaveBeenCalledWith(
        { is_active: false },
        expect.any(Object)
      )
    })
  })

  describe('deleteAllMemories', () => {
    it('should delete all memories for a user', async () => {
      mockSupabase.update.mockResolvedValue({ error: null })
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.resolve.mockResolvedValue({
        data: null,
        count: 5,
        error: null
      })

      const count = await memoryService.deleteAllMemories(testUserId)

      expect(count).toBe(5)
    })
  })

  describe('searchMemories', () => {
    it('should search memories by keyword', async () => {
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.ilike.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockReturnValue(mockSupabase)
      mockSupabase.resolve.mockResolvedValue({
        data: [{ id: 'memory-1', content: 'TypeScript preference' }],
        error: null
      })

      const memories = await memoryService.searchMemories(testUserId, 'TypeScript')

      expect(memories).toHaveLength(1)
      expect(memories[0].content).toContain('TypeScript')
    })
  })

  describe('retrieveRelevantMemories', () => {
    it('should retrieve memories with semantic search', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { memory_id: 'memory-1', content: 'TypeScript preference', similarity: 0.9 },
          { memory_id: 'memory-2', content: 'Fact about project', similarity: 0.8 }
        ],
        error: null
      })

      const result = await memoryService.retrieveRelevantMemories('I prefer TypeScript', testUserId)

      expect(result.memories).toHaveLength(2)
      expect(result.metadata.memoriesRetrieved).toBe(2)
    })

    it('should enforce token budget', async () => {
      mockSupabase.rpc.mockResolvedValue({
        data: [
          { memory_id: 'memory-1', content: 'A'.repeat(3000), similarity: 0.9 },
          { memory_id: 'memory-2', content: 'B'.repeat(3000), similarity: 0.8 }
        ],
        error: null
      })

      const result = await memoryService.retrieveRelevantMemories('query', testUserId, {
        maxTokens: 1000
      })

      // Should only include first memory due to token budget
      expect(result.memories.length).toBeLessThanOrEqual(1)
    })

    it('should fallback to keyword search if semantic search fails', async () => {
      mockSupabase.rpc.mockRejectedValue(new Error('RPC failed'))
      mockSupabase.select.mockReturnValue(mockSupabase)
      mockSupabase.eq.mockReturnValue(mockSupabase)
      mockSupabase.ilike.mockReturnValue(mockSupabase)
      mockSupabase.limit.mockReturnValue(mockSupabase)
      mockSupabase.resolve.mockResolvedValue({
        data: [{ id: 'memory-1', content: 'TypeScript' }],
        error: null
      })

      const result = await memoryService.retrieveRelevantMemories('TypeScript', testUserId)

      expect(result.memories).toHaveLength(1)
    })
  })

  describe('formatMemoryContext', () => {
    it('should format memory context for AI prompt', () => {
      const result = {
        memories: [
          { memory_type: 'preference', content: 'I prefer TypeScript' },
          { memory_type: 'fact', content: 'Building AutoLearn Spot' }
        ] as Memory[],
        metadata: {
          queryLength: 10,
          memoriesRetrieved: 2,
          totalTokens: 50,
          processingTimeMs: 100
        }
      }

      const context = memoryService.formatMemoryContext(result)

      expect(context).toContain('User Memories')
      expect(context).toContain('[Preference]')
      expect(context).toContain('[Fact]')
      expect(context).toContain('I prefer TypeScript')
      expect(context).toContain('Building AutoLearn Spot')
    })

    it('should return empty string for no memories', () => {
      const result = {
        memories: [],
        metadata: {
          queryLength: 10,
          memoriesRetrieved: 0,
          totalTokens: 0,
          processingTimeMs: 0
        }
      }

      const context = memoryService.formatMemoryContext(result)

      expect(context).toBe('')
    })
  })
})
