/**
 * ALEX Phase 3B - Indexing Orchestration
 * 
 * Coordinates the complete indexing lifecycle: chunking, embedding generation,
 * database operations, and verification for semantic document indexing.
 */

import { createClient } from '@supabase/supabase-js'
import { chunkText, Chunk } from './chunking'
import { generateEmbeddings, EmbeddedChunk, validateEmbeddedChunks } from './embeddings'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create client lazily to avoid module-level errors
function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for indexing')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

export interface IndexingOptions {
  chunkSize?: number
  chunkOverlap?: number
  embeddingModel?: string
  embeddingApiKey?: string
}

export interface IndexingResult {
  success: boolean
  fileId: string
  indexingStatus: string
  chunksCreated: number
  error?: string
  metadata?: {
    totalChunks: number
    embeddingModel: string
    embeddingDimension: number
    processingTimeMs: number
  }
}

/**
 * Index a file for semantic search
 */
export async function indexFile(
  fileId: string,
  userId: string,
  options: IndexingOptions = {}
): Promise<IndexingResult> {
  const startTime = Date.now()

  try {
    console.log('[Indexing] Starting indexing for file:', fileId, 'user:', userId)

    // Step 1: Load file with ownership verification
    const file = await loadFileWithOwnership(fileId, userId)
    
    // Step 2: Verify file is ready for indexing
    verifyFileReadyForIndexing(file)

    // Step 3: Check for concurrent indexing
    await preventConcurrentIndexing(fileId)

    // Step 4: Set indexing status to 'indexing'
    await setIndexingStatus(fileId, 'indexing')

    // Step 5: Generate chunks from extracted text
    const chunks = await generateChunks(file.extracted_text!, options)

    // Step 6: Generate embeddings for chunks
    const embeddedChunks = await generateEmbeddingsForChunks(chunks, options)

    // Step 7: Validate embedded chunk set
    validateEmbeddedChunks(embeddedChunks)

    // Step 8: Replace existing chunks in database
    await replaceChunks(fileId, file, embeddedChunks)

    // Step 9: Verify final database state
    await verifyFinalState(fileId, file, embeddedChunks)

    // Step 10: Mark as indexed only after all verification passes
    await markAsIndexed(fileId, embeddedChunks, options.embeddingModel)

    const processingTimeMs = Date.now() - startTime

    console.log('[Indexing] Successfully indexed file:', fileId, 'chunks:', embeddedChunks.length)

    return {
      success: true,
      fileId,
      indexingStatus: 'indexed',
      chunksCreated: embeddedChunks.length,
      metadata: {
        totalChunks: embeddedChunks.length,
        embeddingModel: options.embeddingModel || 'text-embedding-3-small',
        embeddingDimension: 1536,
        processingTimeMs
      }
    }
  } catch (error) {
    const processingTimeMs = Date.now() - startTime
    const errorMessage = error instanceof Error ? error.message : 'Unknown indexing error'

    console.error('[Indexing] Indexing failed for file:', fileId, 'error:', errorMessage)

    // Step 11: On failure, mark as failed and cleanup
    await markAsFailed(fileId, errorMessage)

    return {
      success: false,
      fileId,
      indexingStatus: 'failed',
      chunksCreated: 0,
      error: errorMessage
    }
  }
}

/**
 * Load file with ownership verification
 */
async function loadFileWithOwnership(fileId: string, userId: string): Promise<any> {
  const { data: file, error } = await getSupabaseClient()
    .from('alex_files')
    .select('*')
    .eq('id', fileId)
    .eq('user_id', userId)
    .single()

  if (error || !file) {
    throw new Error(`File not found or access denied: ${fileId}`)
  }

  return file
}

/**
 * Verify file is ready for indexing
 */
function verifyFileReadyForIndexing(file: any): void {
  if (file.status !== 'ready') {
    throw new Error(`File is not ready for indexing. Current status: ${file.status}`)
  }

  if (file.extraction_status !== 'completed') {
    throw new Error(`File extraction is not completed. Current status: ${file.extraction_status}`)
  }

  if (!file.extracted_text || file.extracted_text.trim().length === 0) {
    throw new Error('File has no extracted text')
  }
}

/**
 * Prevent concurrent indexing of the same file
 */
async function preventConcurrentIndexing(fileId: string): Promise<void> {
  const { data: file } = await getSupabaseClient()
    .from('alex_files')
    .select('indexing_status')
    .eq('id', fileId)
    .single()

  if (file && file.indexing_status === 'indexing') {
    throw new Error('File is already being indexed. Concurrent indexing is not allowed.')
  }
}

/**
 * Set indexing status
 */
async function setIndexingStatus(fileId: string, status: string): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('alex_files')
    .update({
      indexing_status: status,
      indexing_metadata: {
        ...getFreshIndexingMetadata(),
        statusChange: status,
        timestamp: new Date().toISOString()
      }
    })
    .eq('id', fileId)

  if (error) {
    throw new Error(`Failed to set indexing status to ${status}: ${error.message}`)
  }
}

/**
 * Get fresh indexing metadata
 */
function getFreshIndexingMetadata(): any {
  return {
    attemptedAt: new Date().toISOString()
  }
}

/**
 * Generate chunks from extracted text
 */
async function generateChunks(extractedText: string, options: IndexingOptions): Promise<Chunk[]> {
  try {
    const result = chunkText(extractedText, {
      chunkSize: options.chunkSize,
      chunkOverlap: options.chunkOverlap
    })

    console.log('[Indexing] Generated chunks:', result.chunks.length)

    return result.chunks
  } catch (error) {
    throw new Error(`Chunking failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Generate embeddings for chunks
 */
async function generateEmbeddingsForChunks(chunks: Chunk[], options: IndexingOptions): Promise<EmbeddedChunk[]> {
  try {
    const result = await generateEmbeddings(chunks, {
      model: options.embeddingModel,
      apiKey: options.embeddingApiKey
    })

    console.log('[Indexing] Generated embeddings for chunks:', result.chunks.length)

    return result.chunks
  } catch (error) {
    throw new Error(`Embedding generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}

/**
 * Replace existing chunks in database
 * Delete-then-insert pattern (safe without transactions)
 */
async function replaceChunks(
  fileId: string,
  file: any,
  embeddedChunks: EmbeddedChunk[]
): Promise<void> {
  console.log('[Indexing] Replacing chunks for file:', fileId)

  // Step 1: Delete existing chunks for this file
  const { error: deleteError } = await getSupabaseClient()
    .from('alex_document_chunks')
    .delete()
    .eq('file_id', fileId)

  if (deleteError) {
    throw new Error(`Failed to delete existing chunks: ${deleteError.message}`)
  }

  console.log('[Indexing] Deleted existing chunks')

  // Step 2: Insert new chunks
  const chunkRecords = embeddedChunks.map(chunk => ({
    file_id: fileId,
    user_id: file.user_id,
    conversation_id: file.conversation_id,
    chunk_index: chunk.chunkIndex,
    content: chunk.content,
    embedding: chunk.embedding,
    metadata: {
      charStart: chunk.charStart,
      charEnd: chunk.charEnd,
      sourceFile: file.original_filename
    },
    embedding_model: chunk.embeddingModel,
    embedding_dimension: chunk.embeddingDimension
  }))

  const { error: insertError } = await getSupabaseClient()
    .from('alex_document_chunks')
    .insert(chunkRecords)

  if (insertError) {
    // If insert fails, we have a partial state - attempt cleanup
    console.error('[Indexing] Failed to insert new chunks, attempting cleanup:', insertError)
    await getSupabaseClient()
      .from('alex_document_chunks')
      .delete()
      .eq('file_id', fileId)
    
    throw new Error(`Failed to insert new chunks: ${insertError.message}`)
  }

  console.log('[Indexing] Inserted new chunks:', chunkRecords.length)
}

/**
 * Verify final database state
 */
async function verifyFinalState(
  fileId: string,
  file: any,
  embeddedChunks: EmbeddedChunk[]
): Promise<void> {
  console.log('[Indexing] Verifying final state for file:', fileId)

  // Step 1: Verify chunk count matches
  const { data: storedChunks, error: fetchError } = await getSupabaseClient()
    .from('alex_document_chunks')
    .select('*')
    .eq('file_id', fileId)

  if (fetchError) {
    throw new Error(`Failed to fetch stored chunks for verification: ${fetchError.message}`)
  }

  if (!storedChunks || storedChunks.length !== embeddedChunks.length) {
    throw new Error(`Chunk count mismatch: expected ${embeddedChunks.length}, got ${storedChunks?.length || 0}`)
  }

  // Step 2: Verify sequential indices
  const storedIndices = storedChunks.map(c => c.chunk_index).sort((a, b) => a - b)
  for (let i = 0; i < storedIndices.length; i++) {
    if (storedIndices[i] !== i) {
      throw new Error(`Chunk index mismatch: expected ${i}, got ${storedIndices[i]}`)
    }
  }

  // Step 3: Verify ownership matches parent file
  for (const chunk of storedChunks) {
    if (chunk.user_id !== file.user_id) {
      throw new Error(`Chunk ownership mismatch: expected ${file.user_id}, got ${chunk.user_id}`)
    }
    if (chunk.conversation_id !== file.conversation_id) {
      throw new Error(`Conversation ID mismatch: expected ${file.conversation_id}, got ${chunk.conversation_id}`)
    }
  }

  // Step 4: Verify every chunk has embedding
  const chunksWithoutEmbedding = storedChunks.filter(c => !c.embedding)
  if (chunksWithoutEmbedding.length > 0) {
    throw new Error(`${chunksWithoutEmbedding.length} chunks missing embeddings`)
  }

  // Step 5: Verify embedding dimension consistency
  const uniqueDimensions = [...new Set(storedChunks.map(c => c.embedding_dimension))]
  if (uniqueDimensions.length !== 1 || uniqueDimensions[0] !== 1536) {
    throw new Error(`Embedding dimension inconsistency: ${uniqueDimensions.join(', ')}`)
  }

  // Step 6: Verify embedding model consistency
  const uniqueModels = [...new Set(storedChunks.map(c => c.embedding_model))]
  if (uniqueModels.length !== 1) {
    throw new Error(`Embedding model inconsistency: ${uniqueModels.join(', ')}`)
  }

  // Step 7: Verify no stale chunks remain (unique constraint handles this)
  // The UNIQUE(file_id, chunk_index) constraint prevents duplicate chunks
  // Since we deleted all chunks before insertion, no stale chunks can remain

  console.log('[Indexing] Final state verification passed')
}

/**
 * Mark file as indexed with metadata
 */
async function markAsIndexed(
  fileId: string,
  embeddedChunks: EmbeddedChunk[],
  embeddingModel?: string
): Promise<void> {
  const { error } = await getSupabaseClient()
    .from('alex_files')
    .update({
      indexing_status: 'indexed',
      chunk_count: embeddedChunks.length,
      last_indexed_at: new Date().toISOString(),
      embedding_model: embeddingModel || 'text-embedding-3-small',
      indexing_metadata: {
        ...getFreshIndexingMetadata(),
        status: 'indexed',
        chunksGenerated: embeddedChunks.length,
        completedAt: new Date().toISOString()
      }
    })
    .eq('id', fileId)

  if (error) {
    throw new Error(`Failed to mark file as indexed: ${error.message}`)
  }
}

/**
 * Mark file as failed with error information
 */
async function markAsFailed(fileId: string, errorMessage: string): Promise<void> {
  console.log('[Indexing] Marking file as failed:', fileId, 'error:', errorMessage)

  // Attempt to clean up partial chunks
  try {
    await getSupabaseClient()
      .from('alex_document_chunks')
      .delete()
      .eq('file_id', fileId)
    console.log('[Indexing] Cleaned up partial chunks for failed file')
  } catch (cleanupError) {
    console.error('[Indexing] Failed to clean up partial chunks:', cleanupError)
    // Continue with marking as failed even if cleanup fails
  }

  const { error } = await getSupabaseClient()
    .from('alex_files')
    .update({
      indexing_status: 'failed',
      indexing_error: errorMessage,
      indexing_metadata: {
        ...getFreshIndexingMetadata(),
        status: 'failed',
        failedAt: new Date().toISOString(),
        error: errorMessage
      }
    })
    .eq('id', fileId)

  if (error) {
    console.error('[Indexing] Failed to mark file as failed:', error)
    // Don't throw - we've done our best
  }
}

/**
 * Re-index an existing file
 */
export async function reindexFile(
  fileId: string,
  userId: string,
  options: IndexingOptions = {}
): Promise<IndexingResult> {
  console.log('[Indexing] Re-indexing file:', fileId)

  // Re-indexing uses the same process as indexing
  // The delete-then-insert pattern ensures old chunks are replaced
  // Chunk indices restart at 0 automatically
  return await indexFile(fileId, userId, options)
}

/**
 * Check if a file can be indexed
 */
export async function canIndexFile(fileId: string, userId: string): Promise<boolean> {
  try {
    const file = await loadFileWithOwnership(fileId, userId)
    verifyFileReadyForIndexing(file)
    return true
  } catch (error) {
    console.log('[Indexing] File cannot be indexed:', error)
    return false
  }
}
