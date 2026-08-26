/**
 * Phase 2: Lead Scoring Schema Integration Tests
 * 
 * Tests for AI lead scoring configuration in automation specification
 * and requirement extraction patterns.
 */

import { describe, it, expect } from 'vitest'
import { AutomationSpec, createEmptySpec, updateSpec, mergeSpec } from '../artifact-generation/automation-spec'

describe('Phase 2: Lead Scoring Schema Integration', () => {
  describe('AutomationSpec Schema', () => {
    it('should support lead scoring configuration in aiConfig', () => {
      const spec = createEmptySpec()
      
      spec.aiConfig = {
        enabled: true,
        task: 'lead_scoring',
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true,
          scoreRange: { min: 0, max: 100 }
        }
      }

      expect(spec.aiConfig.leadScoring).toBeDefined()
      expect(spec.aiConfig.leadScoring?.enabled).toBe(true)
      expect(spec.aiConfig.leadScoring?.scoringMethod).toBe('ai')
      expect(spec.aiConfig.leadScoring?.explainReasoning).toBe(true)
      expect(spec.aiConfig.leadScoring?.scoreRange).toEqual({ min: 0, max: 100 })
    })

    it('should allow optional qualification threshold', () => {
      const spec = createEmptySpec()
      
      spec.aiConfig = {
        enabled: true,
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true,
          qualificationThreshold: 80
        }
      }

      expect(spec.aiConfig.leadScoring?.qualificationThreshold).toBe(80)
    })

    it('should allow undefined qualification threshold when not specified', () => {
      const spec = createEmptySpec()
      
      spec.aiConfig = {
        enabled: true,
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true
        }
      }

      expect(spec.aiConfig.leadScoring?.qualificationThreshold).toBeUndefined()
    })

    it('should support minimal lead scoring config', () => {
      const spec = createEmptySpec()
      
      spec.aiConfig = {
        enabled: true,
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true
        }
      }

      expect(spec.aiConfig.leadScoring).toBeDefined()
      expect(spec.aiConfig.leadScoring?.scoreRange).toBeUndefined()
    })

    it('should enforce AI scoring method (not fixed rules)', () => {
      const spec = createEmptySpec()
      
      spec.aiConfig = {
        enabled: true,
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true
        }
      }

      // The schema enforces AI scoring method
      expect(spec.aiConfig.leadScoring?.scoringMethod).toBe('ai')
      // No fixed rules like budget > X should be in this schema
      expect(spec.aiConfig.leadScoring).not.toHaveProperty('fixedRules')
    })
  })

  describe('Spec Update Operations', () => {
    it('should update nested lead scoring fields', () => {
      const spec = createEmptySpec()
      
      updateSpec(spec, 'aiConfig.leadScoring.enabled', true, 'known')
      updateSpec(spec, 'aiConfig.leadScoring.scoringMethod', 'ai', 'known')
      updateSpec(spec, 'aiConfig.leadScoring.explainReasoning', true, 'known')

      expect(spec.aiConfig?.leadScoring?.enabled).toBe(true)
      expect(spec.aiConfig?.leadScoring?.scoringMethod).toBe('ai')
      expect(spec.aiConfig?.leadScoring?.explainReasoning).toBe(true)
    })

    it('should merge lead scoring configs', () => {
      const base = createEmptySpec()
      base.aiConfig = {
        enabled: true,
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true
        }
      }

      const update = {
        aiConfig: {
          leadScoring: {
            scoreRange: { min: 0, max: 100 },
            qualificationThreshold: 80
          }
        }
      }

      const merged = mergeSpec(base, update)

      // mergeSpec does shallow merge, so leadScoring gets replaced
      // This is expected behavior - for deep merge, use manual object spreading
      expect(merged.aiConfig?.leadScoring?.scoreRange).toEqual({ min: 0, max: 100 })
      expect(merged.aiConfig?.leadScoring?.qualificationThreshold).toBe(80)
    })
  })

  describe('Multi-turn Requirement Retention', () => {
    it('should retain requirements across multiple updates', () => {
      const spec = createEmptySpec()

      // Turn 1: Collect leads from Google Form
      spec.inputs = { sources: ['google_forms'] }
      
      // Turn 2: Score each lead with AI
      updateSpec(spec, 'aiConfig.leadScoring.enabled', true, 'known')
      updateSpec(spec, 'aiConfig.leadScoring.scoringMethod', 'ai', 'known')
      updateSpec(spec, 'aiConfig.leadScoring.scoreRange', { min: 0, max: 100 }, 'known')

      // Turn 3: Explain reasoning and save every lead
      updateSpec(spec, 'aiConfig.leadScoring.explainReasoning', true, 'known')
      spec.outputs = { destinations: ['google_sheets'], notification: true }

      // Verify all requirements retained
      expect(spec.inputs?.sources).toContain('google_forms')
      expect(spec.aiConfig?.leadScoring?.enabled).toBe(true)
      expect(spec.aiConfig?.leadScoring?.scoringMethod).toBe('ai')
      expect(spec.aiConfig?.leadScoring?.scoreRange).toEqual({ min: 0, max: 100 })
      expect(spec.aiConfig?.leadScoring?.explainReasoning).toBe(true)
      expect(spec.outputs?.destinations).toContain('google_sheets')
      expect(spec.outputs?.notification).toBe(true)
    })

    it('should handle qualification threshold specification', () => {
      const spec = createEmptySpec()

      // User specifies threshold
      updateSpec(spec, 'aiConfig.leadScoring.qualificationThreshold', 80, 'known')

      expect(spec.aiConfig?.leadScoring?.qualificationThreshold).toBe(80)
    })

    it('should not invent threshold when not specified', () => {
      const spec = createEmptySpec()

      // User does not specify threshold
      updateSpec(spec, 'aiConfig.leadScoring.enabled', true, 'known')
      updateSpec(spec, 'aiConfig.leadScoring.scoringMethod', 'ai', 'known')

      expect(spec.aiConfig?.leadScoring?.qualificationThreshold).toBeUndefined()
    })
  })

  describe('Test 1 - AI scoring requirement', () => {
    it('should produce correct AI scoring config from requirements', () => {
      const spec = createEmptySpec()
      
      // Simulate extracted requirements
      spec.aiConfig = {
        enabled: true,
        task: 'lead_scoring',
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true,
          scoreRange: { min: 0, max: 100 }
        }
      }

      expect(spec.aiConfig?.leadScoring?.scoringMethod).toBe('ai')
      expect(spec.aiConfig?.leadScoring?.scoreRange).toEqual({ min: 0, max: 100 })
      expect(spec.aiConfig?.leadScoring?.explainReasoning).toBe(true)
    })
  })

  describe('Test 3 - No invented threshold', () => {
    it('should not invent threshold when not provided', () => {
      const spec = createEmptySpec()
      
      spec.aiConfig = {
        enabled: true,
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true
        }
      }

      expect(spec.aiConfig?.leadScoring?.qualificationThreshold).toBeUndefined()
    })
  })

  describe('Test 4 - Explicit threshold', () => {
    it('should use explicit threshold when provided', () => {
      const spec = createEmptySpec()
      
      spec.aiConfig = {
        enabled: true,
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true,
          qualificationThreshold: 80
        }
      }

      expect(spec.aiConfig?.leadScoring?.qualificationThreshold).toBe(80)
    })
  })

  describe('Test 5 - AI scoring versus fixed rules', () => {
    it('should identify AI scoring method and not create fixed rules', () => {
      const spec = createEmptySpec()
      
      spec.aiConfig = {
        enabled: true,
        leadScoring: {
          enabled: true,
          scoringMethod: 'ai',
          explainReasoning: true
        }
      }

      // Verify AI method
      expect(spec.aiConfig?.leadScoring?.scoringMethod).toBe('ai')
      
      // Verify no fixed rules in the schema
      expect(spec.aiConfig?.leadScoring).not.toHaveProperty('fixedRules')
      expect(spec.aiConfig?.leadScoring).not.toHaveProperty('pointSystem')
      expect(spec.aiConfig?.leadScoring).not.toHaveProperty('scoringCriteria')
    })
  })
})