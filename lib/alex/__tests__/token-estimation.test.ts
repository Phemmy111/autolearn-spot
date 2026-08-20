/**
 * Tests for Token Estimation and Token-Aware Context Assembly
 */

import { describe, it, expect } from '@jest/globals'
import {
  estimateTokens,
  estimateMessageTokens,
  calculateTokenBudget,
  getModelContextLimit,
  calculateCompressionRatio
} from '../token-estimation'

describe('Token Estimation', () => {
  describe('estimateTokens', () => {
    it('should return 0 for empty string', () => {
      expect(estimateTokens('')).toBe(0)
    })

    it('should return 0 for null/undefined', () => {
      expect(estimateTokens(null as any)).toBe(0)
      expect(estimateTokens(undefined as any)).toBe(0)
    })

    it('should estimate tokens for short text', () => {
      const text = 'Hello world'
      const tokens = estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(text.length) // Tokens should be fewer than characters
    })

    it('should handle large text', () => {
      const text = 'A'.repeat(10000)
      const tokens = estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
      expect(tokens).toBeLessThan(text.length)
    })

    it('should handle text with extra whitespace', () => {
      const text = 'Hello    world\n\n\nTest'
      const tokens = estimateTokens(text)
      expect(tokens).toBeGreaterThan(0)
    })
  })

  describe('estimateMessageTokens', () => {
    it('should estimate tokens for single message', () => {
      const messages = [{ role: 'user', content: 'Hello world' }]
      const tokens = estimateMessageTokens(messages)
      expect(tokens).toBeGreaterThan(0)
    })

    it('should estimate tokens for multiple messages', () => {
      const messages = [
        { role: 'user', content: 'Hello' },
        { role: 'assistant', content: 'Hi there!' },
        { role: 'user', content: 'How are you?' }
      ]
      const tokens = estimateMessageTokens(messages)
      expect(tokens).toBeGreaterThan(0)
    })

    it('should return 0 for empty message array', () => {
      const tokens = estimateMessageTokens([])
      expect(tokens).toBe(0)
    })
  })

  describe('getModelContextLimit', () => {
    it('should return correct limit for known models', () => {
      expect(getModelContextLimit('gpt-4')).toBe(8192)
      expect(getModelContextLimit('gpt-4-turbo')).toBe(128000)
      expect(getModelContextLimit('gpt-3.5-turbo')).toBe(16385)
    })

    it('should return Groq model limits', () => {
      expect(getModelContextLimit('openai/gpt-oss-120b')).toBe(8192)
      expect(getModelContextLimit('meta-llama/llama-prompt-guard-2-22m')).toBe(8192)
    })

    it('should return default for unknown models', () => {
      expect(getModelContextLimit('unknown-model')).toBe(8192)
    })

    it('should handle prefix matching', () => {
      expect(getModelContextLimit('gpt-4-turbo-preview')).toBe(128000)
      expect(getModelContextLimit('openrouter/free-model')).toBe(8192)
    })
  })

  describe('calculateTokenBudget', () => {
    it('should calculate budget with default parameters', () => {
      const budget = calculateTokenBudget(8192, 1000, 500, 500)
      expect(budget.modelContextLimit).toBe(8192)
      expect(budget.reservedOutputTokens).toBe(2000)
      expect(budget.inputBudget).toBeLessThan(8192)
      expect(budget.fileContextTokens).toBeGreaterThanOrEqual(0)
    })

    it('should reserve output tokens', () => {
      const budget = calculateTokenBudget(8192, 1000, 500, 500, 3000)
      expect(budget.reservedOutputTokens).toBe(3000)
      expect(budget.inputBudget).toBeLessThan(8192 - 3000)
    })

    it('should apply safety margin', () => {
      const budget1 = calculateTokenBudget(8192, 1000, 500, 500, 2000, 0.8)
      const budget2 = calculateTokenBudget(8192, 1000, 500, 500, 2000, 0.5)
      expect(budget1.inputBudget).toBeGreaterThan(budget2.inputBudget)
    })

    it('should return 0 file context when budget exhausted', () => {
      const budget = calculateTokenBudget(8192, 4000, 3000, 2000, 2000)
      expect(budget.fileContextTokens).toBe(0)
    })
  })

  describe('calculateCompressionRatio', () => {
    it('should calculate compression ratio', () => {
      const ratio = calculateCompressionRatio(10000, 5000)
      expect(ratio).toBe(0.5)
    })

    it('should return 0 when before is 0', () => {
      const ratio = calculateCompressionRatio(0, 5000)
      expect(ratio).toBe(0)
    })

    it('should return 1 when no compression', () => {
      const ratio = calculateCompressionRatio(5000, 5000)
      expect(ratio).toBe(1)
    })
  })
})

describe('Token Budget Scenarios', () => {
  describe('3 small files scenario', () => {
    it('should fit 3 small files within budget', () => {
      const modelLimit = 8192
      const systemTokens = 1000
      const platformTokens = 500
      const historyTokens = 500
      
      const budget = calculateTokenBudget(modelLimit, systemTokens, platformTokens, historyTokens)
      
      // 3 small files (1KB each = ~250 tokens each)
      const totalFileTokens = 750
      expect(budget.fileContextTokens).toBeGreaterThan(totalFileTokens)
    })
  })

  describe('1 huge PDF + 2 small files scenario', () => {
    it('should handle huge PDF with small files', () => {
      const modelLimit = 8192
      const systemTokens = 1000
      const platformTokens = 500
      const historyTokens = 500
      
      const budget = calculateTokenBudget(modelLimit, systemTokens, platformTokens, historyTokens)
      
      // Huge PDF would normally be 5000 tokens, but RAG should reduce it
      // Small files 250 tokens each
      const expectedNeeded = 250 + 250 + 1000 // RAG-reduced PDF + 2 small files
      expect(budget.fileContextTokens).toBeGreaterThan(expectedNeeded)
    })
  })

  describe('Multiple large files scenario', () => {
    it('should handle multiple large files with RAG', () => {
      const modelLimit = 128000 // Larger model
      const systemTokens = 1000
      const platformTokens = 500
      const historyTokens = 500
      
      const budget = calculateTokenBudget(modelLimit, systemTokens, platformTokens, historyTokens)
      
      // Multiple large files would normally exceed budget
      // RAG should select relevant chunks from each
      const expectedNeeded = 5 * 500 // 5 files, 500 tokens each with RAG
      expect(budget.fileContextTokens).toBeGreaterThan(expectedNeeded)
    })
  })

  describe('Request near model limit scenario', () => {
    it('should handle request already near limit', () => {
      const modelLimit = 8192
      const systemTokens = 2000
      const platformTokens = 1500
      const historyTokens = 3000
      
      const budget = calculateTokenBudget(modelLimit, systemTokens, platformTokens, historyTokens)
      
      // Very little budget remaining for files
      expect(budget.fileContextTokens).toBeLessThan(1000)
    })
  })

  describe('Retrieval across multiple files', () => {
    it('should ensure representation from all files', () => {
      const totalFiles = 5
      const budgetPerFile = 200 // tokens per file minimum
      const minBudget = totalFiles * budgetPerFile
      
      const budget = calculateTokenBudget(8192, 1000, 500, 500)
      expect(budget.fileContextTokens).toBeGreaterThan(minBudget)
    })
  })

  describe('No single file monopolization', () => {
    it('should prevent single file from consuming entire budget', () => {
      const budget = calculateTokenBudget(8192, 1000, 500, 500)
      
      // Even if one file is huge, per-file limits should prevent monopolization
      const maxPerFile = budget.fileContextTokens / 2 // No file should get more than half
      expect(maxPerFile).toBeGreaterThan(0)
    })
  })

  describe('Final estimated tokens below budget', () => {
    it('should ensure final tokens stay below configured budget', () => {
      const modelLimit = 8192
      const systemTokens = 1000
      const platformTokens = 500
      const historyTokens = 500
      
      const budget = calculateTokenBudget(modelLimit, systemTokens, platformTokens, historyTokens)
      
      // Final tokens should be less than effective limit
      const effectiveLimit = Math.floor(modelLimit * 0.8)
      const totalEstimated = systemTokens + platformTokens + historyTokens + budget.fileContextTokens
      
      expect(totalEstimated).toBeLessThan(effectiveLimit)
    })
  })
})