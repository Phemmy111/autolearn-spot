/**
 * ALEX Phase 3B - Semantic Retrieval for RAG
 * 
 * Retrieves relevant document chunks using vector similarity search.
 * Uses the match_document_chunks() database function for efficient retrieval.
 */

import { createClient } from '@supabase/supabase-js'
import { generateEmbeddings, Chunk } from './embeddings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create client lazily to avoid module-level errors
function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for retrieval')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface RetrievalOptions {
  conversationId?: string
  limit?: number
  minSimilarity?: number
  embeddingModel?: string
  embeddingApiKey?: string
  fileIds?: string[] // Specific file IDs to retrieve from
  userId?: string // Required for file-specific retrieval
  preferLatest?: boolean // Prefer newer chunks when multiple versions exist
}

export interface RetrievedChunk {
  chunkId: string
  fileId: string
  userId: string
  conversationId: string | null
  chunkIndex: number
  content: string
  metadata: Record<string, any>
  similarity: number
  filename?: string
}

export interface RetrievalResult {
  chunks: RetrievedChunk[]
  metadata: {
    queryLength: number
    chunksRetrieved: number
    embeddingModel: string
    processingTimeMs: number
  }
}

// Default configuration
const DEFAULT_LIMIT = 10
const DEFAULT_MIN_SIMILARITY = 0.7
const MAX_LIMIT = 100
const MIN_SIMILARITY = 0.0
const MAX_SIMILARITY = 1.0

/**
 * Retrieve relevant chunks for a query
 */
export async function retrieveChunks(
  query: string,
  userId: string,
  options: RetrievalOptions = {}
): Promise<RetrievalResult> {
  const startTime = Date.now()

  try {
    console.log('[Retrieval] Starting retrieval for user:', userId, 'query length:', query.length)

    // Step 1: Validate inputs
    validateRetrievalInputs(query, userId, options)

    // Step 2: Generate embedding for query
    const queryEmbedding = await generateQueryEmbedding(query, options)

    console.log('[Retrieval] Generated query embedding')

    // Step 3: Call database function for similarity search
    const chunks = await performSimilaritySearch(
      queryEmbedding,
      userId,
      options.conversationId,
      options.fileIds,
      options.limit || DEFAULT_LIMIT,
      options.minSimilarity || DEFAULT_MIN_SIMILARITY
    )

    console.log('[Retrieval] Retrieved chunks:', chunks.length)

    // Step 3.5: Apply freshness ranking if enabled
    const rankedChunks = options.preferLatest 
      ? await applyFreshnessRanking(chunks, userId)
      : chunks

    if (options.preferLatest) {
      console.log('[Retrieval] Applied freshness ranking:', {
        originalCount: chunks.length,
        rankedCount: rankedChunks.length,
        preferLatest: true
      })
    }

    // Step 4: Format results with filenames
    const formattedChunks = await formatRetrievedChunks(rankedChunks)

    const processingTimeMs = Date.now() - startTime

    return {
      chunks: formattedChunks,
      metadata: {
        queryLength: query.length,
        chunksRetrieved: formattedChunks.length,
        embeddingModel: options.embeddingModel || 'text-embedding-3-small',
        processingTimeMs
      }
    }
  } catch (error) {
    console.error('[Retrieval] Retrieval failed:', error)
    throw error
  }
}

/**
 * Validate retrieval inputs
 */
function validateRetrievalInputs(
  query: string,
  userId: string,
  options: RetrievalOptions
): void {
  if (!query || typeof query !== 'string') {
    throw new Error('Query must be a non-empty string')
  }

  if (query.trim().length === 0) {
    throw new Error('Query cannot be empty or whitespace-only')
  }

  if (query.length > 10000) {
    throw new Error('Query exceeds maximum length of 10,000 characters')
  }

  if (!userId || typeof userId !== 'string') {
    throw new Error('User ID must be a non-empty string')
  }

  if (options.limit !== undefined) {
    if (typeof options.limit !== 'number' || options.limit < 1 || options.limit > MAX_LIMIT) {
      throw new Error(`Limit must be between 1 and ${MAX_LIMIT}`)
    }
  }

  if (options.minSimilarity !== undefined) {
    if (typeof options.minSimilarity !== 'number' || options.minSimilarity < MIN_SIMILARITY || options.minSimilarity > MAX_SIMILARITY) {
      throw new Error(`Min similarity must be between ${MIN_SIMILARITY} and ${MAX_SIMILARITY}`)
    }
  }

  if (options.conversationId !== undefined && typeof options.conversationId !== 'string') {
    throw new Error('Conversation ID must be a string if provided')
  }

  if (options.fileIds !== undefined) {
    if (!Array.isArray(options.fileIds)) {
      throw new Error('File IDs must be an array if provided')
    }
    if (options.fileIds.some(id => typeof id !== 'string')) {
      throw new Error('All file IDs must be strings')
    }
  }
}

/**
 * Generate embedding for query
 */
async function generateQueryEmbedding(
  query: string,
  options: RetrievalOptions
): Promise<number[]> {
  // Create a single chunk from the query
  const queryChunk: Chunk = {
    content: query,
    chunkIndex: 0,
    charStart: 0,
    charEnd: query.length
  }

  // Generate embedding using existing embeddings implementation
  const result = await generateEmbeddings([queryChunk], {
    model: options.embeddingModel,
    apiKey: options.embeddingApiKey
  })

  if (result.chunks.length === 0) {
    throw new Error('Failed to generate query embedding')
  }

  return result.chunks[0].embedding
}

/**
 * Perform similarity search using database function
 */
async function performSimilaritySearch(
  queryEmbedding: number[],
  userId: string,
  conversationId: string | undefined,
  fileIds: string[] | undefined,
  limit: number,
  minSimilarity: number
): Promise<any[]> {
  // Build the RPC call parameters
  const rpcParams: any = {
    p_query_embedding: queryEmbedding,
    p_user_id: userId,
    p_conversation_id: conversationId || null,
    p_limit: limit,
    p_min_similarity: minSimilarity
  }

  // Only add p_file_ids if the database function supports it
  // Try with p_file_ids first, if it fails, fall back to without it
  try {
    const { data, error } = await getSupabaseClient().rpc('match_document_chunks', {
      ...rpcParams,
      p_file_ids: fileIds || null
    })

    if (error) {
      // If error mentions p_file_ids, try without it
      if (error.message?.includes('p_file_ids') || error.code === 'PGRST202') {
        console.log('[Retrieval] Database function does not support p_file_ids, filtering results client-side')
        const { data: allData, error: allError } = await getSupabaseClient().rpc('match_document_chunks', rpcParams)
        
        if (allError) {
          throw new Error(`Similarity search failed: ${allError.message}`)
        }

        // Filter results to only include specified file IDs
        const filteredData = fileIds 
          ? (allData || []).filter((chunk: any) => fileIds.includes(chunk.file_id))
          : allData

        return filteredData
      }
      throw new Error(`Similarity search failed: ${error.message}`)
    }

    return data || []
  } catch (error) {
    // If the RPC call fails completely, try without p_file_ids
    if (fileIds && fileIds.length > 0) {
      console.log('[Retrieval] Falling back to client-side file filtering')
      const { data, error: fallbackError } = await getSupabaseClient().rpc('match_document_chunks', rpcParams)
      
      if (fallbackError) {
        throw new Error(`Similarity search failed: ${fallbackError.message}`)
      }

      // Filter results to only include specified file IDs
      const filteredData = (data || []).filter((chunk: any) => fileIds.includes(chunk.file_id))
      return filteredData
    }
    
    throw error
  }
}

/**
 * Format retrieved chunks with filenames
 */
async function formatRetrievedChunks(chunks: any[]): Promise<RetrievedChunk[]> {
  // Collect unique file IDs
  const fileIds = [...new Set(chunks.map(c => c.file_id))]

  // Fetch filenames for all files
  const { data: files, error: filesError } = await getSupabaseClient()
    .from('alex_files')
    .select('id, original_filename')
    .in('id', fileIds)

  if (filesError) {
    console.error('[Retrieval] Failed to fetch filenames:', filesError)
    // Continue without filenames - this is not a critical error
  }

  // Create filename lookup map
  const filenameMap = new Map<string, string>()
  if (files) {
    for (const file of files) {
      filenameMap.set(file.id, file.original_filename)
    }
  }

  // Format chunks with filenames
  return chunks.map(chunk => ({
    chunkId: chunk.chunk_id,
    fileId: chunk.file_id,
    userId: chunk.user_id,
    conversationId: chunk.conversation_id,
    chunkIndex: chunk.chunk_index,
    content: chunk.content,
    metadata: chunk.metadata || {},
    similarity: chunk.similarity,
    filename: filenameMap.get(chunk.file_id)
  }))
}

/**
 * Apply freshness ranking to chunks
 * Boosts scores for newer chunks to prefer latest source versions
 */
async function applyFreshnessRanking(chunks: any[], userId: string): Promise<any[]> {
  if (chunks.length === 0) {
    return chunks
  }

  try {
    // Fetch file metadata including timestamps for all chunks
    const fileIds = [...new Set(chunks.map(c => c.file_id))]
    
    const { data: files, error: filesError } = await getSupabaseClient()
      .from('alex_files')
      .select('id, original_filename, created_at, updated_at')
      .in('id', fileIds)
      .eq('user_id', userId)

    if (filesError) {
      console.error('[Retrieval] Failed to fetch file timestamps for freshness ranking:', filesError)
      return chunks // Fall back to original ranking
    }

    // Create file timestamp lookup
    const fileTimestamps = new Map<string, { created_at: string; updated_at: string }>()
    if (files) {
      for (const file of files) {
        fileTimestamps.set(file.id, {
          created_at: file.created_at,
          updated_at: file.updated_at
        })
      }
    }

    // Find the most recent timestamp across all files for normalization
    const allTimestamps = Array.from(fileTimestamps.values()).map(f => 
      new Date(f.updated_at || f.created_at).getTime()
    )
    const maxTimestamp = Math.max(...allTimestamps)
    const minTimestamp = Math.min(...allTimestamps)
    const timeRange = maxTimestamp - minTimestamp || 1 // Avoid division by zero

    // Apply time decay boost to similarity scores
    // More recent files get a boost, older files get a penalty
    const TIME_DECAY_WEIGHT = 0.3 // 30% weight for freshness, 70% for similarity
    
    const rankedChunks = chunks.map(chunk => {
      const fileTimestamp = fileTimestamps.get(chunk.file_id)
      if (!fileTimestamp) {
        return chunk // No timestamp info, keep original score
      }

      const chunkTime = new Date(fileTimestamp.updated_at || fileTimestamp.created_at).getTime()
      const timeNormalized = (chunkTime - minTimestamp) / timeRange // 0.0 (oldest) to 1.0 (newest)
      
      // Calculate freshness score (1.0 for newest, 0.0 for oldest)
      const freshnessScore = timeNormalized
      
      // Combine similarity and freshness scores
      const originalSimilarity = chunk.similarity || 0
      const combinedScore = (originalSimilarity * (1 - TIME_DECAY_WEIGHT)) + (freshnessScore * TIME_DECAY_WEIGHT)
      
      console.log('[Retrieval] Freshness ranking for chunk:', {
        chunkId: chunk.chunk_id,
        fileId: chunk.file_id,
        originalSimilarity: originalSimilarity.toFixed(3),
        freshnessScore: freshnessScore.toFixed(3),
        combinedScore: combinedScore.toFixed(3),
        timestamp: new Date(chunkTime).toISOString()
      })

      return {
        ...chunk,
        similarity: combinedScore, // Replace similarity with combined score
        originalSimilarity, // Keep original for debugging
        freshnessScore
      }
    })

    // Sort by combined score (descending)
    rankedChunks.sort((a, b) => (b.similarity || 0) - (a.similarity || 0))

    return rankedChunks
  } catch (error) {
    console.error('[Retrieval] Freshness ranking failed, using original order:', error)
    return chunks // Fall back to original ranking
  }
}

/**
 * Check if retrieval is available for a user
 */
export async function isRetrievalAvailable(userId: string): Promise<boolean> {
  try {
    // Check if user has any indexed files
    const { data, error } = await getSupabaseClient()
      .from('alex_files')
      .select('id')
      .eq('user_id', userId)
      .eq('indexing_status', 'indexed')
    .limit(1)

    if (error) {
      console.error('[Retrieval] Failed to check retrieval availability:', error)
      return false
    }

    return (data && data.length > 0) || false
  } catch (error) {
    console.error('[Retrieval] Error checking retrieval availability:', error)
    return false
  }
}

/**
 * Get count of indexed chunks for a user
 */
export async function getIndexedChunkCount(userId: string, conversationId?: string): Promise<number> {
  try {
    let query = getSupabaseClient()
      .from('alex_document_chunks')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)

    if (conversationId) {
      query = query.eq('conversation_id', conversationId)
    }

    const { count, error } = await query

    if (error) {
      console.error('[Retrieval] Failed to get chunk count:', error)
      return 0
    }

    return count || 0
  } catch (error) {
    console.error('[Retrieval] Error getting chunk count:', error)
    return 0
  }
}
