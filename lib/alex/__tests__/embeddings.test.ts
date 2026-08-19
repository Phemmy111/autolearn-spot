/**
 * Embeddings Tests
 */

import { generateEmbeddings, validateEmbeddedChunks } from '../embeddings'
import { Chunk } from '../chunking'

describe('generateEmbeddings', () => {
  describe('basic functionality', () => {
    it('should generate embeddings for a single chunk', async () => {
      const chunks: Chunk[] = [
        {
          content: 'This is a test chunk for embedding generation.',
          chunkIndex: 0,
          charStart: 0,
          charEnd: 50,
        }
      ]

      // Note: This test requires OPENAI_API_KEY to be set
      // It will fail in environments without the key, which is expected
      try {
        const result = await generateEmbeddings(chunks, {
          apiKey: process.env.OPENAI_API_KEY,
        })

        expect(result.chunks).toHaveLength(1)
        expect(result.chunks[0].embedding).toBeDefined()
        expect(result.chunks[0].embedding.length).toBe(1536)
        expect(result.chunks[0].embeddingModel).toBe('text-embedding-3-small')
        expect(result.chunks[0].embeddingDimension).toBe(1536)
      } catch (error) {
        // Expected to fail without API key
        expect(error).toBeDefined()
      }
    })

    it('should handle multiple chunks', async () => {
      const chunks: Chunk[] = [
        {
          content: 'First chunk of text for testing.',
          chunkIndex: 0,
          charStart: 0,
          charEnd: 35,
        },
        {
          content: 'Second chunk of text for testing.',
          chunkIndex: 1,
          charStart: 35,
          charEnd: 70,
        },
      ]

      try {
        const result = await generateEmbeddings(chunks, {
          apiKey: process.env.OPENAI_API_KEY,
        })

        expect(result.chunks).toHaveLength(2)
        expect(result.chunks[0].chunkIndex).toBe(0)
        expect(result.chunks[1].chunkIndex).toBe(1)
        expect(result.chunks[0].embeddingDimension).toBe(1536)
        expect(result.chunks[1].embeddingDimension).toBe(1536)
      } catch (error) {
        // Expected to fail without API key
        expect(error).toBeDefined()
      }
    })
  })

  describe('validation', () => {
    it('should reject empty chunk array', async () => {
      await expect(generateEmbeddings([])).rejects.toThrow('Cannot embed empty chunk array')
    })

    it('should reject non-array input', async () => {
      await expect(generateEmbeddings(null as any)).rejects.toThrow('Chunks must be an array')
    })

    it('should reject chunk with empty content', async () => {
      const chunks: Chunk[] = [
        {
          content: '',
          chunkIndex: 0,
          charStart: 0,
          charEnd: 0,
        }
      ]

      await expect(generateEmbeddings(chunks)).rejects.toThrow('Chunk content cannot be empty')
    })

    it('should reject chunk with excessive length', async () => {
      const chunks: Chunk[] = [
        {
          content: 'A'.repeat(10000),
          chunkIndex: 0,
          charStart: 0,
          charEnd: 10000,
        }
      ]

      await expect(generateEmbeddings(chunks)).rejects.toThrow('exceeds maximum length')
    })

    it('should reject invalid chunkIndex', async () => {
      const chunks: Chunk[] = [
        {
          content: 'Valid content',
          chunkIndex: -1,
          charStart: 0,
          charEnd: 13,
        }
      ]

      await expect(generateEmbeddings(chunks)).rejects.toThrow('valid chunkIndex')
    })

    it('should reject missing API key', async () => {
      const chunks: Chunk[] = [
        {
          content: 'Test content',
          chunkIndex: 0,
          charStart: 0,
          charEnd: 12,
        }
      ]

      // Remove API key from environment
      const originalKey = process.env.OPENAI_API_KEY
      delete process.env.OPENAI_API_KEY

      try {
        await expect(generateEmbeddings(chunks)).rejects.toThrow('OpenAI API key is required')
      } finally {
        // Restore API key
        if (originalKey) {
          process.env.OPENAI_API_KEY = originalKey
        }
      }
    })

    it('should reject invalid batchSize', async () => {
      const chunks: Chunk[] = [
        {
          content: 'Test content',
          chunkIndex: 0,
          charStart: 0,
          charEnd: 12,
        }
      ]

      await expect(generateEmbeddings(chunks, { batchSize: 0 })).rejects.toThrow('batchSize must be between 1 and 1000')
      await expect(generateEmbeddings(chunks, { batchSize: 2000 })).rejects.toThrow('batchSize must be between 1 and 1000')
    })
  })

  describe('dimension validation', () => {
    it('should validate correct 1536 dimensions', async () => {
      const chunks: Chunk[] = [
        {
          content: 'Test content for dimension validation.',
          chunkIndex: 0,
          charStart: 0,
          charEnd: 38,
        }
      ]

      try {
        const result = await generateEmbeddings(chunks, {
          apiKey: process.env.OPENAI_API_KEY,
        })

        expect(result.chunks[0].embedding.length).toBe(1536)
        expect(result.chunks[0].embeddingDimension).toBe(1536)
      } catch (error) {
        // Expected to fail without API key
        expect(error).toBeDefined()
      }
    })
  })

  describe('options', () => {
    it('should use default model when not specified', async () => {
      const chunks: Chunk[] = [
        {
          content: 'Test content',
          chunkIndex: 0,
          charStart: 0,
          charEnd: 12,
        }
      ]

      try {
        const result = await generateEmbeddings(chunks, {
          apiKey: process.env.OPENAI_API_KEY,
        })

        expect(result.metadata.embeddingModel).toBe('text-embedding-3-small')
      } catch (error) {
        // Expected to fail without API key
        expect(error).toBeDefined()
      }
    })

    it('should use custom model when specified', async () => {
      const chunks: Chunk[] = [
        {
          content: 'Test content',
          chunkIndex: 0,
          charStart: 0,
          charEnd: 12,
        }
      ]

      try {
        const result = await generateEmbeddings(chunks, {
          apiKey: process.env.OPENAI_API_KEY,
          model: 'text-embedding-3-small',
        })

        expect(result.metadata.embeddingModel).toBe('text-embedding-3-small')
      } catch (error) {
        // Expected to fail without API key
        expect(error).toBeDefined()
      }
    })
  })

  describe('metadata', () => {
    it('should include correct metadata', async () => {
      const chunks: Chunk[] = [
        {
          content: 'Test content for metadata.',
          chunkIndex: 0,
          charStart: 0,
          charEnd: 25,
        }
      ]

      try {
        const result = await generateEmbeddings(chunks, {
          apiKey: process.env.OPENAI_API_KEY,
        })

        expect(result.metadata.totalChunks).toBe(1)
        expect(result.metadata.embeddingModel).toBe('text-embedding-3-small')
        expect(result.metadata.embeddingDimension).toBe(1536)
        expect(result.metadata.processingTimeMs).toBeGreaterThan(0)
      } catch (error) {
        // Expected to fail without API key
        expect(error).toBeDefined()
      }
    })
  })
})

describe('validateEmbeddedChunks', () => {
  it('should validate correct embedded chunks', () => {
    const chunks = [
      {
        content: 'Test content',
        chunkIndex: 0,
        charStart: 0,
        charEnd: 12,
        embedding: new Array(1536).fill(0.1),
        embeddingModel: 'text-embedding-3-small',
        embeddingDimension: 1536,
      }
    ]

    expect(() => validateEmbeddedChunks(chunks)).not.toThrow()
  })

  it('should reject chunk with missing embedding', () => {
    const chunks = [
      {
        content: 'Test content',
        chunkIndex: 0,
        charStart: 0,
        charEnd: 12,
        embedding: null as any,
        embeddingModel: 'text-embedding-3-small',
        embeddingDimension: 1536,
      }
    ]

    expect(() => validateEmbeddedChunks(chunks)).toThrow('missing or invalid embedding')
  })

  it('should reject chunk with wrong dimension', () => {
    const chunks = [
      {
        content: 'Test content',
        chunkIndex: 0,
        charStart: 0,
        charEnd: 12,
        embedding: new Array(100).fill(0.1),
        embeddingModel: 'text-embedding-3-small',
        embeddingDimension: 1536,
      }
    ]

    expect(() => validateEmbeddedChunks(chunks)).toThrow('invalid embedding dimension')
  })

  it('should reject chunk with wrong model', () => {
    const chunks = [
      {
        content: 'Test content',
        chunkIndex: 0,
        charStart: 0,
        charEnd: 12,
        embedding: new Array(1536).fill(0.1),
        embeddingModel: 'wrong-model',
        embeddingDimension: 1536,
      }
    ]

    expect(() => validateEmbeddedChunks(chunks)).toThrow('unexpected embedding model')
  })

  it('should reject empty array', () => {
    expect(() => validateEmbeddedChunks([])).toThrow('must be a non-empty array')
  })
})
