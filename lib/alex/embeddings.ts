/**
 * ALEX Phase 3B - Text Embeddings for Semantic Search
 * 
 * Generates vector embeddings for text chunks using OpenAI's embedding API.
 * Uses text-embedding-3-small model with 1536 dimensions.
 */

import { Chunk } from './chunking'

export interface EmbeddingOptions {
  model?: string
  apiKey?: string
  batchSize?: number
  timeout?: number
}

export interface EmbeddedChunk {
  content: string
  chunkIndex: number
  charStart: number
  charEnd: number
  embedding: number[]
  embeddingModel: string
  embeddingDimension: number
}

export interface EmbeddingResult {
  chunks: EmbeddedChunk[]
  metadata: {
    totalChunks: number
    embeddingModel: string
    embeddingDimension: number
    totalTokens?: number
    processingTimeMs: number
  }
}

// Default configuration
const DEFAULT_MODEL = 'text-embedding-3-small'
const DEFAULT_DIMENSION = 1536
const DEFAULT_BATCH_SIZE = 100
const DEFAULT_TIMEOUT = 30000 // 30 seconds
const MAX_TEXT_LENGTH = 8191 // OpenAI embedding API limit

/**
 * Validate embedding options
 */
function validateOptions(options: EmbeddingOptions): void {
  if (options && typeof options !== 'object') {
    throw new Error('Embedding options must be an object')
  }

  if (options?.batchSize !== undefined) {
    if (typeof options.batchSize !== 'number' || options.batchSize < 1 || options.batchSize > 1000) {
      throw new Error('batchSize must be between 1 and 1000')
    }
  }

  if (options?.timeout !== undefined) {
    if (typeof options.timeout !== 'number' || options.timeout < 1000 || options.timeout > 120000) {
      throw new Error('timeout must be between 1000 and 120000 milliseconds')
    }
  }
}

/**
 * Validate input chunks
 */
function validateChunks(chunks: Chunk[]): void {
  if (!Array.isArray(chunks)) {
    throw new Error('Chunks must be an array')
  }

  if (chunks.length === 0) {
    throw new Error('Cannot embed empty chunk array')
  }

  if (chunks.length > 10000) {
    throw new Error('Chunk count exceeds maximum limit of 10,000')
  }

  for (const chunk of chunks) {
    if (!chunk || typeof chunk !== 'object') {
      throw new Error('Each chunk must be an object')
    }

    if (typeof chunk.content !== 'string') {
      throw new Error('Chunk content must be a string')
    }

    if (chunk.content.length === 0) {
      throw new Error('Chunk content cannot be empty')
    }

    if (chunk.content.length > MAX_TEXT_LENGTH) {
      throw new Error(`Chunk content exceeds maximum length of ${MAX_TEXT_LENGTH} characters`)
    }

    if (typeof chunk.chunkIndex !== 'number' || chunk.chunkIndex < 0) {
      throw new Error('Chunk must have valid chunkIndex')
    }
  }
}

/**
 * Get API key from environment or options
 */
function getApiKey(options?: EmbeddingOptions): string {
  const apiKey = options?.apiKey || process.env.OPENAI_API_KEY

  if (!apiKey) {
    throw new Error('OpenAI API key is required. Set OPENAI_API_KEY environment variable or provide apiKey option.')
  }

  if (typeof apiKey !== 'string' || apiKey.length === 0) {
    throw new Error('API key must be a non-empty string')
  }

  return apiKey
}

/**
 * Generate embeddings for a batch of chunks
 */
async function generateEmbeddingsBatch(
  chunks: Chunk[],
  apiKey: string,
  model: string,
  timeout: number
): Promise<{ embeddings: number[]; totalTokens: number }> {
  const response = await fetch('https://api.openai.com/v1/embeddings', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: chunks.map(chunk => chunk.content),
    }),
    signal: AbortSignal.timeout(timeout),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText}`)
  }

  const data = await response.json()

  if (!data.data || !Array.isArray(data.data)) {
    throw new Error('Invalid response format: missing or invalid data array')
  }

  if (data.data.length !== chunks.length) {
    throw new Error(`Embedding count mismatch: expected ${chunks.length}, got ${data.data.length}`)
  }

  const embeddings: number[] = []
  let totalTokens = 0

  for (let i = 0; i < data.data.length; i++) {
    const embeddingData = data.data[i]

    if (!embeddingData.embedding || !Array.isArray(embeddingData.embedding)) {
      throw new Error(`Invalid embedding format for chunk ${i}`)
    }

    embeddings.push(...embeddingData.embedding)
    totalTokens += embeddingData.usage?.total_tokens || 0
  }

  return { embeddings, totalTokens }
}

/**
 * Generate embeddings for text chunks
 */
export async function generateEmbeddings(
  chunks: Chunk[],
  options: EmbeddingOptions = {}
): Promise<EmbeddingResult> {
  const startTime = Date.now()

  // Validate inputs
  validateChunks(chunks)
  validateOptions(options)

  const model = options.model || DEFAULT_MODEL
  const apiKey = getApiKey(options)
  const batchSize = options.batchSize || DEFAULT_BATCH_SIZE
  const timeout = options.timeout || DEFAULT_TIMEOUT

  const allEmbeddings: number[] = []
  let totalTokens = 0

  // Process chunks in batches
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize)
    
    try {
      const { embeddings, totalTokens: batchTokens } = await generateEmbeddingsBatch(
        batch,
        apiKey,
        model,
        timeout
      )
      
      allEmbeddings.push(...embeddings)
      totalTokens += batchTokens
    } catch (error) {
      throw new Error(`Failed to generate embeddings for chunks ${i}-${Math.min(i + batchSize, chunks.length)}: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  // Validate embedding dimensions
  const expectedDimension = DEFAULT_DIMENSION
  const actualDimension = allEmbeddings.length / chunks.length

  if (actualDimension !== expectedDimension) {
    throw new Error(`Embedding dimension mismatch: expected ${expectedDimension}, got ${actualDimension}`)
  }

  // Reconstruct chunks with embeddings
  const embeddedChunks: EmbeddedChunk[] = chunks.map((chunk, index) => {
    const startIndex = index * expectedDimension
    const endIndex = startIndex + expectedDimension
    const embedding = allEmbeddings.slice(startIndex, endIndex)

    if (embedding.length !== expectedDimension) {
      throw new Error(`Invalid embedding length for chunk ${index}: expected ${expectedDimension}, got ${embedding.length}`)
    }

    return {
      content: chunk.content,
      chunkIndex: chunk.chunkIndex,
      charStart: chunk.charStart,
      charEnd: chunk.charEnd,
      embedding,
      embeddingModel: model,
      embeddingDimension: expectedDimension,
    }
  })

  const processingTimeMs = Date.now() - startTime

  return {
    chunks: embeddedChunks,
    metadata: {
      totalChunks: chunks.length,
      embeddingModel: model,
      embeddingDimension: expectedDimension,
      totalTokens,
      processingTimeMs,
    },
  }
}

/**
 * Validate that all chunks have valid embeddings
 */
export function validateEmbeddedChunks(chunks: EmbeddedChunk[]): void {
  if (!Array.isArray(chunks) || chunks.length === 0) {
    throw new Error('Embedded chunks must be a non-empty array')
  }

  const expectedDimension = DEFAULT_DIMENSION

  for (const chunk of chunks) {
    if (!chunk.embedding || !Array.isArray(chunk.embedding)) {
      throw new Error(`Chunk ${chunk.chunkIndex} has missing or invalid embedding`)
    }

    if (chunk.embedding.length !== expectedDimension) {
      throw new Error(`Chunk ${chunk.chunkIndex} has invalid embedding dimension: expected ${expectedDimension}, got ${chunk.embedding.length}`)
    }

    if (chunk.embeddingModel !== DEFAULT_MODEL && chunk.embeddingModel !== 'text-embedding-3-small') {
      throw new Error(`Chunk ${chunk.chunkIndex} has unexpected embedding model: ${chunk.embeddingModel}`)
    }

    if (chunk.embeddingDimension !== expectedDimension) {
      throw new Error(`Chunk ${chunk.chunkIndex} has invalid embeddingDimension: expected ${expectedDimension}, got ${chunk.embeddingDimension}`)
    }
  }
}
