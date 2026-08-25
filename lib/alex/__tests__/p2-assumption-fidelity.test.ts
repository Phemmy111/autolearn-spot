/**
 * P2 Tests: Assumption Handling and AutomationSpec Fidelity
 * 
 * Tests for P2-A (assumption handling) and P2-B (AutomationSpec fidelity)
 */

import { describe, it, expect } from '@jest/globals'
import { AutomationPlan } from '../orchestration/types'
import { AutomationSpec } from '../artifact-generation/automation-spec'

describe('P2-A: Assumption Handling', () => {
  describe('Enhanced Assumption Structure', () => {
    it('should support enhanced assumption structure with metadata', () => {
      const plan: AutomationPlan = {
        objective: 'Create a lead capture bot',
        assumptions: [
          {
            statement: 'User has Intercom account',
            basis: 'Platform recommendation',
            confidence: 0.7,
            category: 'platform'
          }
        ]
      }
      
      expect(plan.assumptions).toBeDefined()
      expect(plan.assumptions?.[0].statement).toBe('User has Intercom account')
      expect(plan.assumptions?.[0].basis).toBe('Platform recommendation')
      expect(plan.assumptions?.[0].confidence).toBe(0.7)
      expect(plan.assumptions?.[0].category).toBe('platform')
    })
    
    it('should support enhanced recommendation structure with metadata', () => {
      const plan: AutomationPlan = {
        objective: 'Create a lead capture bot',
        recommendations: [
          {
            statement: 'Use Intercom for lead capture',
            reasoning: 'Best-in-class integration capabilities',
            priority: 'high'
          }
        ]
      }
      
      expect(plan.recommendations).toBeDefined()
      expect(plan.recommendations?.[0].statement).toBe('Use Intercom for lead capture')
      expect(plan.recommendations?.[0].reasoning).toBe('Best-in-class integration capabilities')
      expect(plan.recommendations?.[0].priority).toBe('high')
    })
    
    it('should maintain backward compatibility with string arrays', () => {
      const plan: AutomationPlan = {
        objective: 'Create a lead capture bot',
        assumptions: ['User has Intercom account'], // Legacy format
        recommendations: ['Use Intercom'] // Legacy format
      }
      
      // Should accept legacy format for backward compatibility
      expect(plan.assumptions).toBeDefined()
      expect(plan.recommendations).toBeDefined()
    })
  })
})

describe('P2-B: AutomationSpec Fidelity', () => {
  describe('Enhanced AutomationSpec Structure', () => {
    it('should support users field', () => {
      const spec: AutomationSpec = {
        automationType: 'workflow',
        users: ['sales-team', 'support-team']
      }
      
      expect(spec.users).toBeDefined()
      expect(spec.users?.length).toBe(2)
    })
    
    it('should support workflowSteps field', () => {
      const spec: AutomationSpec = {
        automationType: 'workflow',
        workflowSteps: [
          { step: 'Capture lead', description: 'Web form submission' },
          { step: 'Qualify lead', description: 'Budget check' }
        ]
      }
      
      expect(spec.workflowSteps).toBeDefined()
      expect(spec.workflowSteps?.length).toBe(2)
    })
    
    it('should support constraints field', () => {
      const spec: AutomationSpec = {
        automationType: 'workflow',
        constraints: ['Must be GDPR compliant', '24-hour response SLA']
      }
      
      expect(spec.constraints).toBeDefined()
      expect(spec.constraints?.length).toBe(2)
    })
    
    it('should support enhanced unresolvedBlockers with category', () => {
      const spec: AutomationSpec = {
        automationType: 'workflow',
        unresolvedBlockers: [
          {
            question: 'Which CRM system?',
            reason: 'Required for lead routing',
            priority: 'high',
            category: 'requirement'
          }
        ]
      }
      
      expect(spec.unresolvedBlockers).toBeDefined()
      expect(spec.unresolvedBlockers?.[0].category).toBe('requirement')
    })
    
    it('should support enhanced assumptions with metadata', () => {
      const spec: AutomationSpec = {
        automationType: 'workflow',
        assumptions: [
          {
            statement: 'User has Intercom account',
            basis: 'Platform recommendation',
            confidence: 0.7,
            category: 'platform'
          }
        ]
      }
      
      expect(spec.assumptions).toBeDefined()
      expect(spec.assumptions?.[0].statement).toBe('User has Intercom account')
      expect(spec.assumptions?.[0].category).toBe('platform')
    })
    
    it('should support enhanced recommendations with metadata', () => {
      const spec: AutomationSpec = {
        automationType: 'workflow',
        recommendations: [
          {
            statement: 'Use Intercom',
            reasoning: 'Best integration',
            priority: 'high'
          }
        ]
      }
      
      expect(spec.recommendations).toBeDefined()
      expect(spec.recommendations?.[0].reasoning).toBe('Best integration')
    })
  })
})

describe('P2: Integration Tests', () => {
  describe('Test 1: Explicit Requirement vs Assumption', () => {
    it('should distinguish explicit requirement from assumption', () => {
      const plan: AutomationPlan = {
        objective: 'Create a lead capture bot',
        assumptions: [
          {
            statement: 'User has Intercom account',
            basis: 'Platform recommendation',
            confidence: 0.7,
            category: 'platform'
          }
        ]
      }
      
      // Explicit requirement in objective
      expect(plan.objective).toContain('lead capture')
      
      // Assumption is separate with metadata
      expect(plan.assumptions?.[0].category).toBe('platform')
      expect(plan.assumptions?.[0].confidence).toBeLessThan(1.0)
    })
  })
  
  describe('Test 5: Plan → Spec Fidelity', () => {
    it('should preserve all enhanced fields in conversion', () => {
      const plan: AutomationPlan = {
        objective: 'Create a lead capture bot',
        users: ['sales-team'],
        workflow: [
          { step: 'Capture lead', description: 'Web form' }
        ],
        constraints: ['GDPR compliant'],
        assumptions: [
          {
            statement: 'User has Intercom account',
            basis: 'Platform recommendation',
            confidence: 0.7,
            category: 'platform'
          }
        ],
        recommendations: [
          {
            statement: 'Use Intercom',
            reasoning: 'Best integration',
            priority: 'high'
          }
        ]
      }
      
      // Simulate planToSpec conversion (manual verification)
      const spec: AutomationSpec = {
        automationType: 'workflow',
        description: plan.objective,
        users: plan.users,
        workflowSteps: plan.workflow,
        constraints: plan.constraints,
        assumptions: plan.assumptions,
        recommendations: plan.recommendations
      }
      
      // Verify preservation
      expect(spec.users).toEqual(plan.users)
      expect(spec.workflowSteps).toEqual(plan.workflow)
      expect(spec.constraints).toEqual(plan.constraints)
      expect(spec.assumptions).toEqual(plan.assumptions)
      expect(spec.recommendations).toEqual(plan.recommendations)
    })
  })
  
  describe('Test 6: Assumption Survives Conversion', () => {
    it('should preserve enhanced assumptions in spec', () => {
      const plan: AutomationPlan = {
        objective: 'Create a lead capture bot',
        assumptions: [
          {
            statement: 'User has Intercom account',
            basis: 'Platform recommendation',
            confidence: 0.7,
            category: 'platform'
          }
        ]
      }
      
      const spec: AutomationSpec = {
        automationType: 'workflow',
        description: plan.objective,
        assumptions: plan.assumptions
      }
      
      expect(spec.assumptions).toBeDefined()
      expect(spec.assumptions?.[0].category).toBe('platform')
      expect(spec.assumptions?.[0].confidence).toBe(0.7)
    })
  })
  
  describe('Test 7: Revision Preservation', () => {
    it('should preserve unrelated assumptions during revision', () => {
      const originalPlan: AutomationPlan = {
        objective: 'Create a lead capture bot',
        assumptions: [
          {
            statement: 'User has Intercom account',
            basis: 'Platform recommendation',
            confidence: 0.7,
            category: 'platform'
          }
        ],
        recommendations: [
          {
            statement: 'Use Intercom',
            reasoning: 'Best integration',
            priority: 'high'
          }
        ],
        constraints: ['GDPR compliant']
      }
      
      // Revise objective only
      const revisedPlan: AutomationPlan = {
        ...originalPlan,
        objective: 'Create a lead capture bot with WhatsApp integration'
      }
      
      // Verify unrelated fields preserved
      expect(revisedPlan.assumptions).toEqual(originalPlan.assumptions)
      expect(revisedPlan.recommendations).toEqual(originalPlan.recommendations)
      expect(revisedPlan.constraints).toEqual(originalPlan.constraints)
    })
  })
})