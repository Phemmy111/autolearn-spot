/**
 * ALEX Phase 4 - Memory Service
 * 
 * Provides persistent user memory across conversations.
 * Handles memory creation, retrieval, deletion, and management.
 */

import { createClient } from '@supabase/supabase-js'
import { generateEmbeddings, Chunk } from '../embeddings'
import { estimateTokens } from '../token-estimation'
import { Memory, MemoryCreateInput, MemoryUpdateInput, MemoryRetrievalOptions, MemoryRetrievalResult, MemoryType } from '../types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create client lazily to avoid module-level errors
function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for memory service')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

// Default configuration
const DEFAULT_LIMIT = 5
const DEFAULT_MIN_SIMILARITY = 0.7
const DEFAULT_MIN_IMPORTANCE = 0.0
const DEFAULT_MAX_TOKENS = 2000
const MAX_MEMORY_LENGTH = 1000

// Sensitive patterns to reject
const SENSITIVE_PATTERNS = [
  /password/i,
  /api[_-]?key/i,
  /secret/i,
  /token/i,
  /auth[_-]?token/i,
  /session[_-]?id/i,
  /credit[_-]?card/i,
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card format
]

/**
 * Memory Service Class
 */
export class MemoryService {
  /**
   * Create a new memory
   */
  async createMemory(userId: string, input: MemoryCreateInput): Promise<Memory> {
    // Validate input
    this.validateMemoryContent(input.content)
    
    // Classify memory type if not provided
    const memoryType = input.memory_type || this.classifyMemory(input.content)
    
    // Generate embedding
    const embedding = await this.generateEmbedding(input.content)
    
    // Create memory record
    const memoryData = {
      user_id: userId,
      memory_type: memoryType,
      content: input.content,
      embedding: embedding,
      embedding_model: 'text-embedding-3-small',
      embedding_dimension: 1536,
      metadata: {},
      source: input.source || 'explicit',
      source_conversation_id: input.source_conversation_id || null,
      confidence: 1.0, // Explicit memories have full confidence
      importance: input.importance || 0.5,
      last_accessed_at: new Date().toISOString(),
      access_count: 0,
      is_active: true
    }
    
    const { data, error } = await getSupabaseClient()
      .from('alex_memories')
      .insert(memoryData)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to create memory: ${error.message}`)
    }
    
    return data as Memory
  }

  /**
   * Get a specific memory by ID
   */
  async getMemory(memoryId: string, userId: string): Promise<Memory | null> {
    const { data, error } = await getSupabaseClient()
      .from('alex_memories')
      .select('*')
      .eq('id', memoryId)
      .eq('user_id', userId)
      .eq('is_active', true)
      .single()
    
    if (error) {
      return null
    }
    
    return data as Memory
  }

  /**
   * List all memories for a user
   */
  async listMemories(
    userId: string,
    options: {
      memoryType?: MemoryType
      limit?: number
      offset?: number
    } = {}
  ): Promise<{ memories: Memory[]; total: number }> {
    let query = getSupabaseClient()
      .from('alex_memories')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .eq('is_active', true)
    
    if (options.memoryType) {
      query = query.eq('memory_type', options.memoryType)
    }
    
    if (options.limit) {
      query = query.limit(options.limit)
    }
    
    if (options.offset) {
      query = query.range(options.offset, options.offset + (options.limit || 50) - 1)
    }
    
    query = query.order('created_at', { ascending: false })
    
    const { data, error, count } = await query
    
    if (error) {
      throw new Error(`Failed to list memories: ${error.message}`)
    }
    
    return {
      memories: (data || []) as Memory[],
      total: count || 0
    }
  }

  /**
   * Update a memory
   */
  async updateMemory(memoryId: string, userId: string, updates: MemoryUpdateInput): Promise<Memory> {
    // Verify ownership
    const existing = await this.getMemory(memoryId, userId)
    if (!existing) {
      throw new Error('Memory not found or access denied')
    }
    
    // Prepare update data
    const updateData: any = {
      updated_at: new Date().toISOString()
    }
    
    if (updates.content !== undefined) {
      this.validateMemoryContent(updates.content)
      updateData.content = updates.content
      // Regenerate embedding if content changes
      updateData.embedding = await this.generateEmbedding(updates.content)
    }
    
    if (updates.importance !== undefined) {
      if (updates.importance < 0 || updates.importance > 1) {
        throw new Error('Importance must be between 0 and 1')
      }
      updateData.importance = updates.importance
    }
    
    if (updates.is_active !== undefined) {
      updateData.is_active = updates.is_active
    }
    
    const { data, error } = await getSupabaseClient()
      .from('alex_memories')
      .update(updateData)
      .eq('id', memoryId)
      .eq('user_id', userId)
      .select()
      .single()
    
    if (error) {
      throw new Error(`Failed to update memory: ${error.message}`)
    }
    
    return data as Memory
  }

  /**
   * Delete a memory (soft delete)
   */
  async deleteMemory(memoryId: string, userId: string): Promise<void> {
    // Verify ownership
    const existing = await this.getMemory(memoryId, userId)
    if (!existing) {
      throw new Error('Memory not found or access denied')
    }
    
    const { error } = await getSupabaseClient()
      .from('alex_memories')
      .update({ is_active: false })
      .eq('id', memoryId)
      .eq('user_id', userId)
    
    if (error) {
      throw new Error(`Failed to delete memory: ${error.message}`)
    }
  }

  /**
   * Delete all memories for a user
   */
  async deleteAllMemories(userId: string): Promise<number> {
    const { error } = await getSupabaseClient()
      .from('alex_memories')
      .update({ is_active: false })
      .eq('user_id', userId)
    
    if (error) {
      throw new Error(`Failed to delete all memories: ${error.message}`)
    }
    
    // Return count
    const { count } = await getSupabaseClient()
      .from('alex_memories')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('is_active', false)
    
    return count || 0
  }

  /**
   * Search memories by content (keyword search)
   */
  async searchMemories(userId: string, query: string, options: {
    memoryType?: MemoryType
    limit?: number
  } = {}): Promise<Memory[]> {
    let dbQuery = getSupabaseClient()
      .from('alex_memories')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .ilike('content', `%${query}%`)
    
    if (options.memoryType) {
      dbQuery = dbQuery.eq('memory_type', options.memoryType)
    }
    
    if (options.limit) {
      dbQuery = dbQuery.limit(options.limit)
    }
    
    const { data, error } = await dbQuery
    
    if (error) {
      throw new Error(`Failed to search memories: ${error.message}`)
    }
    
    return (data || []) as Memory[]
  }

  /**
   * Retrieve relevant memories for a query using semantic search
   */
  async retrieveRelevantMemories(
    query: string,
    userId: string,
    options: MemoryRetrievalOptions = {}
  ): Promise<MemoryRetrievalResult> {
    const startTime = Date.now()
    
    // Validate inputs
    if (!query || query.trim().length === 0) {
      return {
        memories: [],
        metadata: {
          queryLength: 0,
          memoriesRetrieved: 0,
          totalTokens: 0,
          processingTimeMs: 0
        }
      }
    }
    
    // Generate query embedding
    const queryEmbedding = await this.generateEmbedding(query)
    
    // Build RPC parameters
    const rpcParams: any = {
      p_query_embedding: queryEmbedding,
      p_user_id: userId,
      p_limit: options.maxResults || DEFAULT_LIMIT,
      p_min_similarity: options.minSimilarity || DEFAULT_MIN_SIMILARITY,
      p_min_importance: options.minImportance || DEFAULT_MIN_IMPORTANCE
    }
    
    if (options.memoryTypes && options.memoryTypes.length > 0) {
      rpcParams.p_memory_types = options.memoryTypes
    }
    
    // Call database function
    const { data, error } = await getSupabaseClient()
      .rpc('match_memories', rpcParams)
    
    if (error) {
      console.error('[Memory Service] Semantic search failed:', error)
      // Fall back to keyword search
      return this.fallbackKeywordSearch(query, userId, options, startTime)
    }
    
    const memories = (data || []) as Memory[]
    
    // Update access statistics
    for (const memory of memories) {
      await this.updateAccessStats(memory.id)
    }
    
    // Apply token budget
    const budgetedMemories = this.enforceTokenBudget(memories, options.maxTokens || DEFAULT_MAX_TOKENS)
    
    const processingTimeMs = Date.now() - startTime
    const totalTokens = budgetedMemories.reduce((sum, m) => sum + estimateTokens(m.content), 0)
    
    return {
      memories: budgetedMemories,
      metadata: {
        queryLength: query.length,
        memoriesRetrieved: budgetedMemories.length,
        totalTokens,
        processingTimeMs
      }
    }
  }

  /**
   * Record memory usage (called after retrieval)
   */
  async recordMemoryUsage(memoryIds: string[]): Promise<void> {
    for (const memoryId of memoryIds) {
      await this.updateAccessStats(memoryId)
    }
  }

  /**
   * Classify memory type based on content
   */
  private classifyMemory(content: string): MemoryType {
    const lower = content.toLowerCase()
    
    // Preference indicators
    if (lower.includes('prefer') || lower.includes('like') || lower.includes('want') || lower.includes('prefer to')) {
      return 'preference'
    }
    
    // Instruction indicators
    if (lower.includes('always') || lower.includes('never') || lower.includes('should') || lower.includes('must')) {
      return 'instruction'
    }
    
    // Default to fact
    return 'fact'
  }

  /**
   * Validate memory content
   */
  private validateMemoryContent(content: string): void {
    if (!content || content.trim().length === 0) {
      throw new Error('Memory content cannot be empty')
    }
    
    if (content.length > MAX_MEMORY_LENGTH) {
      throw new Error(`Memory content too long (max ${MAX_MEMORY_LENGTH} characters)`)
    }
    
    // Check for sensitive patterns
    for (const pattern of SENSITIVE_PATTERNS) {
      if (pattern.test(content)) {
        throw new Error('Memory contains potentially sensitive information and cannot be stored')
      }
    }
  }

  /**
   * Generate embedding for text
   */
  private async generateEmbedding(text: string): Promise<number[]> {
    const chunk: Chunk = {
      content: text,
      chunkIndex: 0,
      charStart: 0,
      charEnd: text.length
    }
    
    const result = await generateEmbeddings([chunk])
    
    if (result.chunks.length === 0) {
      throw new Error('Failed to generate embedding')
    }
    
    return result.chunks[0].embedding
  }

  /**
   * Update memory access statistics
   */
  private async updateAccessStats(memoryId: string): Promise<void> {
    await getSupabaseClient().rpc('update_memory_access', { p_memory_id: memoryId })
  }

  /**
   * Enforce token budget on memories
   */
  private enforceTokenBudget(memories: Memory[], maxTokens: number): Memory[] {
    let totalTokens = 0
    const budgetedMemories: Memory[] = []
    
    for (const memory of memories) {
      const memoryTokens = estimateTokens(memory.content)
      
      if (totalTokens + memoryTokens <= maxTokens) {
        budgetedMemories.push(memory)
        totalTokens += memoryTokens
      } else {
        break // Budget exhausted
      }
    }
    
    return budgetedMemories
  }

  /**
   * Fallback to keyword search if semantic search fails
   */
  private async fallbackKeywordSearch(
    query: string,
    userId: string,
    options: MemoryRetrievalOptions,
    startTime: number
  ): Promise<MemoryRetrievalResult> {
    const memories = await this.searchMemories(userId, query, {
      memoryType: options.memoryTypes?.[0],
      limit: options.maxResults
    })
    
    const budgetedMemories = this.enforceTokenBudget(memories, options.maxTokens || DEFAULT_MAX_TOKENS)
    
    const processingTimeMs = Date.now() - startTime
    const totalTokens = budgetedMemories.reduce((sum, m) => sum + estimateTokens(m.content), 0)
    
    return {
      memories: budgetedMemories,
      metadata: {
        queryLength: query.length,
        memoriesRetrieved: budgetedMemories.length,
        totalTokens,
        processingTimeMs
      }
    }
  }

  /**
   * Format memory context for AI prompt
   */
  formatMemoryContext(result: MemoryRetrievalResult): string {
    if (result.memories.length === 0) {
      return ''
    }
    
    let context = '\nUser Memories:\n'
    context += 'The following information about your preferences and facts is available:\n\n'
    
    for (const memory of result.memories) {
      const typeLabel = memory.memory_type.charAt(0).toUpperCase() + memory.memory_type.slice(1)
      context += `[${typeLabel}] ${memory.content}\n`
    }
    
    context += '\n[End of user memories]\n'
    context += 'IMPORTANT: These memories provide personalization context. '
    context += 'For current factual questions, prioritize web research and attached documents over memory.\n'
    
    return context
  }
}

// Export singleton instance
export const memoryService = new MemoryService()
