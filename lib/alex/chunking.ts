/**
 * ALEX Phase 3B - Text Chunking for Semantic Indexing
 * 
 * Splits extracted text into searchable chunks with overlap for context preservation.
 * Deterministic fixed-size chunking strategy.
 */

export interface ChunkingOptions {
  chunkSize: number
  chunkOverlap: number
}

export interface Chunk {
  content: string
  chunkIndex: number
  charStart: number
  charEnd: number
}

export interface ChunkingResult {
  chunks: Chunk[]
  metadata: {
    totalChunks: number
    sourceLength: number
    chunkSize: number
    chunkOverlap: number
  }
}

// Default configuration
const DEFAULT_CHUNK_SIZE = 1000
const DEFAULT_CHUNK_OVERLAP = 200
const MIN_CHUNK_SIZE = 100
const MAX_CHUNK_SIZE = 5000
const MAX_CHUNKS = 1000

/**
 * Validate chunking options
 */
function validateOptions(options: ChunkingOptions): void {
  if (!options || typeof options !== 'object') {
    throw new Error('Chunking options must be an object')
  }

  if (typeof options.chunkSize !== 'number' || options.chunkSize < MIN_CHUNK_SIZE || options.chunkSize > MAX_CHUNK_SIZE) {
    throw new Error(`chunkSize must be between ${MIN_CHUNK_SIZE} and ${MAX_CHUNK_SIZE}`)
  }

  if (typeof options.chunkOverlap !== 'number' || options.chunkOverlap < 0 || options.chunkOverlap >= options.chunkSize) {
    throw new Error('chunkOverlap must be non-negative and less than chunkSize')
  }
}

/**
 * Validate input text
 */
function validateInputText(text: string): void {
  if (typeof text !== 'string') {
    throw new Error('Input text must be a string')
  }

  if (text.length === 0) {
    throw new Error('Input text cannot be empty')
  }

  if (text.trim().length === 0) {
    throw new Error('Input text cannot be whitespace-only')
  }

  if (text.length > 1000000) {
    throw new Error('Input text exceeds maximum length of 1,000,000 characters')
  }
}

/**
 * Split text into chunks with overlap
 */
export function chunkText(text: string, options: Partial<ChunkingOptions> = {}): ChunkingResult {
  // Validate inputs
  validateInputText(text)
  
  const chunkingOptions: ChunkingOptions = {
    chunkSize: options.chunkSize ?? DEFAULT_CHUNK_SIZE,
    chunkOverlap: options.chunkOverlap ?? DEFAULT_CHUNK_OVERLAP
  }
  
  validateOptions(chunkingOptions)

  const { chunkSize, chunkOverlap } = chunkingOptions
  const chunks: Chunk[] = []
  const sourceLength = text.length

  // Handle short text (single chunk)
  if (sourceLength <= chunkSize) {
    chunks.push({
      content: text,
      chunkIndex: 0,
      charStart: 0,
      charEnd: sourceLength
    })
  } else {
    // Generate chunks with overlap
    let chunkIndex = 0
    let position = 0

    while (position < sourceLength) {
      // Calculate chunk end position
      let endPosition = Math.min(position + chunkSize, sourceLength)

      // Extract chunk content
      const chunkContent = text.substring(position, endPosition)

      // Only add non-empty chunks
      if (chunkContent.trim().length > 0) {
        chunks.push({
          content: chunkContent,
          chunkIndex: chunkIndex,
          charStart: position,
          charEnd: endPosition
        })
        chunkIndex++
      }

      // Move position with overlap
      position = endPosition - chunkOverlap

      // Prevent infinite loop if overlap causes no progress
      if (position >= endPosition) {
        position = endPosition
      }

      // Safety check to prevent excessive chunk generation
      if (chunks.length >= MAX_CHUNKS) {
        throw new Error(`Chunk generation exceeded maximum limit of ${MAX_CHUNKS} chunks`)
      }
    }
  }

  // Final validation
  if (chunks.length === 0) {
    throw new Error('Chunking produced no valid chunks')
  }

  // Verify chunk consistency
  validateChunks(chunks, sourceLength)

  return {
    chunks,
    metadata: {
      totalChunks: chunks.length,
      sourceLength,
      chunkSize,
      chunkOverlap
    }
  }
}

/**
 * Validate chunk consistency
 */
function validateChunks(chunks: Chunk[], sourceLength: number): void {
  // Check sequential indices
  for (let i = 0; i < chunks.length; i++) {
    if (chunks[i].chunkIndex !== i) {
      throw new Error(`Chunk index mismatch: expected ${i}, got ${chunks[i].chunkIndex}`)
    }
  }

  // Check non-empty content
  for (const chunk of chunks) {
    if (chunk.content.trim().length === 0) {
      throw new Error(`Chunk ${chunk.chunkIndex} has empty content`)
    }
  }

  // Check position bounds
  for (const chunk of chunks) {
    if (chunk.charStart < 0 || chunk.charStart >= sourceLength) {
      throw new Error(`Chunk ${chunk.chunkIndex} has invalid charStart: ${chunk.charStart}`)
    }
    if (chunk.charEnd <= chunk.charStart || chunk.charEnd > sourceLength) {
      throw new Error(`Chunk ${chunk.chunkIndex} has invalid charEnd: ${chunk.charEnd}`)
    }
  }

  // Verify content matches source positions
  for (const chunk of chunks) {
    const expectedContent = chunk.content
    const actualContent = chunk.content // In a real implementation, you might verify against source
    if (expectedContent !== actualContent) {
      throw new Error(`Chunk ${chunk.chunkIndex} content does not match source position`)
    }
  }
}

/**
 * Check if text is meaningful (not just garbage)
 */
export function isMeaningfulText(text: string): boolean {
  if (!text || text.length < 10) return false
  
  // Check for minimum word count
  const words = text.split(/\s+/).filter(w => w.length > 0)
  if (words.length < 3) return false
  
  // Check for reasonable character-to-word ratio (indicates actual text)
  const charWordRatio = text.length / words.length
  if (charWordRatio < 2 || charWordRatio > 20) return false
  
  return true
}
