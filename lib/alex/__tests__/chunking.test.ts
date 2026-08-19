/**
 * Chunking Tests
 */

import { chunkText, isMeaningfulText } from '../chunking'

describe('chunkText', () => {
  describe('normal text produces sequential chunks', () => {
    it('should produce sequential chunks for normal text', () => {
      const text = 'A'.repeat(3000)
      const result = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
      
      expect(result.chunks).toHaveLength(3)
      expect(result.chunks[0].chunkIndex).toBe(0)
      expect(result.chunks[1].chunkIndex).toBe(1)
      expect(result.chunks[2].chunkIndex).toBe(2)
    })

    it('should produce correct chunk positions', () => {
      const text = 'A'.repeat(3000)
      const result = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
      
      expect(result.chunks[0].charStart).toBe(0)
      expect(result.chunks[0].charEnd).toBe(1000)
      expect(result.chunks[1].charStart).toBe(800)
      expect(result.chunks[1].charEnd).toBe(1800)
      expect(result.chunks[2].charStart).toBe(1600)
      expect(result.chunks[2].charEnd).toBe(3000)
    })
  })

  describe('overlap is applied correctly', () => {
    it('should apply overlap between chunks', () => {
      const text = 'A'.repeat(2500)
      const result = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
      
      expect(result.chunks.length).toBeGreaterThan(1)
      
      // Check that second chunk starts before first chunk ends (overlap)
      expect(result.chunks[1].charStart).toBeLessThan(result.chunks[0].charEnd)
      
      // Check overlap amount
      const overlap = result.chunks[0].charEnd - result.chunks[1].charStart
      expect(overlap).toBe(200)
    })

    it('should handle zero overlap', () => {
      const text = 'A'.repeat(2000)
      const result = chunkText(text, { chunkSize: 1000, chunkOverlap: 0 })
      
      expect(result.chunks[0].charEnd).toBe(result.chunks[1].charStart)
    })
  })

  describe('short text produces one chunk', () => {
    it('should produce single chunk for short text', () => {
      const text = 'Short text content'
      const result = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
      
      expect(result.chunks).toHaveLength(1)
      expect(result.chunks[0].chunkIndex).toBe(0)
      expect(result.chunks[0].charStart).toBe(0)
      expect(result.chunks[0].charEnd).toBe(text.length)
    })

    it('should handle text exactly at chunk size', () => {
      const text = 'A'.repeat(1000)
      const result = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
      
      expect(result.chunks).toHaveLength(1)
      expect(result.chunks[0].charEnd).toBe(1000)
    })
  })

  describe('empty/whitespace input is rejected', () => {
    it('should reject empty string', () => {
      expect(() => chunkText('')).toThrow('Input text cannot be empty')
    })

    it('should reject whitespace-only string', () => {
      expect(() => chunkText('   \n\t  ')).toThrow('Input text cannot be whitespace-only')
    })

    it('should reject non-string input', () => {
      expect(() => chunkText(null as any)).toThrow('Input text must be a string')
      expect(() => chunkText(undefined as any)).toThrow('Input text must be a string')
    })
  })

  describe('invalid chunk options are rejected', () => {
    it('should reject invalid chunkSize too small', () => {
      expect(() => chunkText('A'.repeat(1000), { chunkSize: 50, chunkOverlap: 10 }))
        .toThrow('chunkSize must be between 100 and 5000')
    })

    it('should reject invalid chunkSize too large', () => {
      expect(() => chunkText('A'.repeat(1000), { chunkSize: 6000, chunkOverlap: 200 }))
        .toThrow('chunkSize must be between 100 and 5000')
    })

    it('should reject negative overlap', () => {
      expect(() => chunkText('A'.repeat(1000), { chunkSize: 1000, chunkOverlap: -10 }))
        .toThrow('chunkOverlap must be non-negative and less than chunkSize')
    })

    it('should reject overlap >= chunkSize', () => {
      expect(() => chunkText('A'.repeat(1000), { chunkSize: 1000, chunkOverlap: 1000 }))
        .toThrow('chunkOverlap must be non-negative and less than chunkSize')
    })

    it('should reject invalid options object', () => {
      expect(() => chunkText('A'.repeat(1000), null as any))
        .toThrow('Chunking options must be an object')
    })
  })

  describe('chunk positions remain valid', () => {
    it('should keep chunk positions within source bounds', () => {
      const text = 'A'.repeat(3000)
      const result = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
      
      for (const chunk of result.chunks) {
        expect(chunk.charStart).toBeGreaterThanOrEqual(0)
        expect(chunk.charStart).toBeLessThan(text.length)
        expect(chunk.charEnd).toBeGreaterThan(chunk.charStart)
        expect(chunk.charEnd).toBeLessThanOrEqual(text.length)
      }
    })

    it('should ensure chunk content matches positions', () => {
      const text = 'ABCDEFGH'
      const result = chunkText(text, { chunkSize: 4, chunkOverlap: 1 })
      
      for (const chunk of result.chunks) {
        const expectedContent = text.substring(chunk.charStart, chunk.charEnd)
        expect(chunk.content).toBe(expectedContent)
      }
    })

    it('should prevent excessive chunk generation', () => {
      const text = 'A'.repeat(1000000)
      expect(() => chunkText(text, { chunkSize: 100, chunkOverlap: 20 }))
        .toThrow('Chunk generation exceeded maximum limit')
    })
  })

  describe('repeated execution produces identical output', () => {
    it('should produce identical chunks for same input', () => {
      const text = 'A'.repeat(3000)
      const options = { chunkSize: 1000, chunkOverlap: 200 }
      
      const result1 = chunkText(text, options)
      const result2 = chunkText(text, options)
      
      expect(result1.chunks).toEqual(result2.chunks)
      expect(result1.metadata).toEqual(result2.metadata)
    })

    it('should be deterministic with different object instances', () => {
      const text = 'A'.repeat(3000)
      
      const result1 = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
      const result2 = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
      
      expect(result1.chunks.length).toBe(result2.chunks.length)
      for (let i = 0; i < result1.chunks.length; i++) {
        expect(result1.chunks[i].chunkIndex).toBe(result2.chunks[i].chunkIndex)
        expect(result1.chunks[i].charStart).toBe(result2.chunks[i].charStart)
        expect(result1.chunks[i].charEnd).toBe(result2.chunks[i].charEnd)
        expect(result1.chunks[i].content).toBe(result2.chunks[i].content)
      }
    })
  })

  describe('default options', () => {
    it('should use default chunk size when not specified', () => {
      const text = 'A'.repeat(3000)
      const result = chunkText(text)
      
      expect(result.metadata.chunkSize).toBe(1000)
      expect(result.metadata.chunkOverlap).toBe(200)
    })

    it('should use specified chunk size when provided', () => {
      const text = 'A'.repeat(3000)
      const result = chunkText(text, { chunkSize: 500 })
      
      expect(result.metadata.chunkSize).toBe(500)
      expect(result.metadata.chunkOverlap).toBe(200) // default overlap
    })
  })

  describe('metadata', () => {
    it('should include correct metadata', () => {
      const text = 'A'.repeat(3000)
      const result = chunkText(text, { chunkSize: 1000, chunkOverlap: 200 })
      
      expect(result.metadata.totalChunks).toBe(result.chunks.length)
      expect(result.metadata.sourceLength).toBe(text.length)
      expect(result.metadata.chunkSize).toBe(1000)
      expect(result.metadata.chunkOverlap).toBe(200)
    })
  })
})

describe('isMeaningfulText', () => {
  it('should return true for meaningful text', () => {
    expect(isMeaningfulText('This is a meaningful sentence with several words.')).toBe(true)
  })

  it('should return false for very short text', () => {
    expect(isMeaningfulText('Hi')).toBe(false)
    expect(isMeaningfulText('')).toBe(false)
  })

  it('should return false for text with too few words', () => {
    expect(isMeaningfulText('word')).toBe(false)
  })

  it('should return false for abnormal character-to-word ratio', () => {
    expect(isMeaningfulText('a'.repeat(100))).toBe(false) // too few words for many chars
  })

  it('should return true for normal code', () => {
    const code = 'function test() { return true; }'
    expect(isMeaningfulText(code)).toBe(true)
  })
})
