/**
 * Lead Scoring Tool Tests
 * 
 * Tests for the AI-powered lead scoring tool
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { leadScoringToolDefinition, leadScoringToolExecutor, LeadScoringResponse } from '../tools/builtin/lead-scoring-tool'

describe('Lead Scoring Tool', () => {
  describe('Tool Definition', () => {
    it('should have correct name', () => {
      expect(leadScoringToolDefinition.name).toBe('lead_scoring')
    })

    it('should have required input schema', () => {
      expect(leadScoringToolDefinition.inputSchema).toBeDefined()
      expect(leadScoringToolDefinition.inputSchema.required).toContain('leadData')
      expect(leadScoringToolDefinition.inputSchema.properties.leadData).toBeDefined()
    })

    it('should have output schema', () => {
      expect(leadScoringToolDefinition.outputSchema).toBeDefined()
      expect(leadScoringToolDefinition.outputSchema.required).toContain('score')
      expect(leadScoringToolDefinition.outputSchema.required).toContain('reasoning')
    })

    it('should be enabled', () => {
      expect(leadScoringToolDefinition.enabled).toBe(true)
    })

    it('should have reasonable timeout', () => {
      expect(leadScoringToolDefinition.timeoutMs).toBe(15000)
    })
  })

  describe('Validation Logic', () => {
    const executor = leadScoringToolExecutor

    it('should validate correct response structure', () => {
      const validResponse = {
        score: 85,
        reasoning: 'Strong lead with good budget and timeline',
        positive_factors: ['High budget', 'Urgent timeline'],
        concerns: ['Competitor evaluation'],
        confidence: 0.85
      }

      const result = executor.validateLeadScoringResponse(validResponse)
      expect(result.score).toBe(85)
      expect(result.reasoning).toBe('Strong lead with good budget and timeline')
      expect(result.positive_factors).toEqual(['High budget', 'Urgent timeline'])
      expect(result.concerns).toEqual(['Competitor evaluation'])
      expect(result.confidence).toBe(0.85)
    })

    it('should accept minimal valid response', () => {
      const minimalResponse = {
        score: 50,
        reasoning: 'Average lead with mixed signals'
      }

      const result = executor.validateLeadScoringResponse(minimalResponse)
      expect(result.score).toBe(50)
      expect(result.reasoning).toBe('Average lead with mixed signals')
      expect(result.positive_factors).toBeUndefined()
      expect(result.concerns).toBeUndefined()
      expect(result.confidence).toBeUndefined()
    })

    it('should reject non-integer score', () => {
      const invalidResponse = {
        score: 85.5,
        reasoning: 'Test'
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('Score must be an integer')
    })

    it('should reject score outside 0-100 range - too high', () => {
      const invalidResponse = {
        score: 101,
        reasoning: 'Test'
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('Score must be between 0 and 100')
    })

    it('should reject score outside 0-100 range - negative', () => {
      const invalidResponse = {
        score: -5,
        reasoning: 'Test'
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('Score must be between 0 and 100')
    })

    it('should reject empty reasoning', () => {
      const invalidResponse = {
        score: 50,
        reasoning: '   '
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('Reasoning is required and must be non-empty')
    })

    it('should reject non-array positive_factors', () => {
      const invalidResponse = {
        score: 50,
        reasoning: 'Test',
        positive_factors: 'not an array'
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('positive_factors must be an array')
    })

    it('should reject non-string elements in positive_factors', () => {
      const invalidResponse = {
        score: 50,
        reasoning: 'Test',
        positive_factors: ['valid', 123]
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('positive_factors must contain only strings')
    })

    it('should reject non-array concerns', () => {
      const invalidResponse = {
        score: 50,
        reasoning: 'Test',
        concerns: 'not an array'
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('concerns must be an array')
    })

    it('should reject non-string elements in concerns', () => {
      const invalidResponse = {
        score: 50,
        reasoning: 'Test',
        concerns: ['valid', null]
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('concerns must contain only strings')
    })

    it('should reject confidence outside 0-1 range - too high', () => {
      const invalidResponse = {
        score: 50,
        reasoning: 'Test',
        confidence: 1.5
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('confidence must be between 0 and 1')
    })

    it('should reject confidence outside 0-1 range - negative', () => {
      const invalidResponse = {
        score: 50,
        reasoning: 'Test',
        confidence: -0.5
      }

      expect(() => executor.validateLeadScoringResponse(invalidResponse))
        .toThrow('confidence must be between 0 and 1')
    })

    it('should accept boundary score values', () => {
      const minScore = { score: 0, reasoning: 'Minimum score' }
      const maxScore = { score: 100, reasoning: 'Maximum score' }

      const minResult = executor.validateLeadScoringResponse(minScore)
      const maxResult = executor.validateLeadScoringResponse(maxScore)

      expect(minResult.score).toBe(0)
      expect(maxResult.score).toBe(100)
    })

    it('should accept boundary confidence values', () => {
      const minConfidence = { score: 50, reasoning: 'Test', confidence: 0 }
      const maxConfidence = { score: 50, reasoning: 'Test', confidence: 1 }

      const minResult = executor.validateLeadScoringResponse(minConfidence)
      const maxResult = executor.validateLeadScoringResponse(maxConfidence)

      expect(minResult.confidence).toBe(0)
      expect(maxResult.confidence).toBe(1)
    })
  })

  describe('Test Cases', () => {
    // Note: These are integration tests that require actual AI provider
    // They are marked as skip by default and can be enabled for manual testing

    it.skip('Test 1 - Strong lead', async () => {
      const strongLead = {
        name: 'Jane Doe',
        company: 'Acme Corp',
        industry: 'SaaS',
        requirements: 'Needs implementation for 500 employees',
        timeline: 'This month',
        budget: '$25,000',
        message: 'We are actively evaluating vendors and want to start immediately.'
      }

      const context = {
        userId: 'test-user',
        conversationId: 'test-conversation'
      }

      const result = await leadScoringToolExecutor.execute({ leadData: strongLead }, context)

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(typeof result.score).toBe('number')
      expect(Number.isInteger(result.score)).toBe(true)
      expect(result.reasoning).toBeTruthy()
      expect(result.reasoning.length).toBeGreaterThan(0)
    })

    it.skip('Test 2 - Weak/unclear lead', async () => {
      const weakLead = {
        name: 'John Smith',
        message: 'Just browsing'
      }

      const context = {
        userId: 'test-user',
        conversationId: 'test-conversation'
      }

      const result = await leadScoringToolExecutor.execute({ leadData: weakLead }, context)

      expect(result.score).toBeGreaterThanOrEqual(0)
      expect(result.score).toBeLessThanOrEqual(100)
      expect(result.reasoning).toBeTruthy()
      // Weak lead should acknowledge insufficient information
      expect(result.reasoning.toLowerCase()).toMatch(/insufficient|limited|sparse|unclear/)
    })

    it.skip('Test 3 - Invalid input handling', async () => {
      const context = {
        userId: 'test-user',
        conversationId: 'test-conversation'
      }

      await expect(leadScoringToolExecutor.execute({}, context))
        .rejects.toThrow('leadData is required')

      await expect(leadScoringToolExecutor.execute({ leadData: 'not an object' }, context))
        .rejects.toThrow('leadData is required and must be an object')
    })
  })
})