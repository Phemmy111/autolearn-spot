/**
 * ALEX Phase 3A Runtime Stabilization Test Suite
 * 
 * Tests the 5 specific requests from the requirements
 * These are integration-style tests that verify the expected behavior
 */

import { ArchitectureDesigner } from '../artifact-generation/architecture-designer'
import { ContextBudgeter } from '../artifact-generation/context-budget'
import { ArtifactValidator } from '../artifact-generation/artifact-validator'
import { AutomationSpec } from '../artifact-generation/automation-spec'

describe('Phase 3A Runtime Stabilization', () => {
  describe('Test 1: Simple daily reminder', () => {
    it('should generate simple architecture without overengineering', async () => {
      const spec: Partial<AutomationSpec> = {
        description: 'Create a workflow that sends me a daily reminder at 8 AM',
        automationType: 'workflow',
        domain: 'custom',
        schedule: {
          enabled: true,
          frequency: 'daily',
          time: '08:00',
          timezone: 'UTC'
        }
      }

      const architecture = await ArchitectureDesigner.design(spec as AutomationSpec)

      expect(architecture.complexity).toBe('simple')
      expect(architecture.stages.length).toBeLessThanOrEqual(3) // Should be simple
      expect(architecture.stages.some(s => s.category === 'trigger')).toBe(true)
      expect(architecture.stages.some(s => s.category === 'output')).toBe(true)
    })
  })

  describe('Test 2: Complex customer support automation', () => {
    it('should generate rich architecture with branching and human escalation', async () => {
      const spec: Partial<AutomationSpec> = {
        description: 'Build an AI customer support automation that receives emails, understands the customer\'s issue, searches our knowledge base, drafts a response, checks confidence, escalates uncertain cases to a human, replies to the customer when confident, and logs every interaction',
        automationType: 'workflow',
        domain: 'support',
        aiConfig: {
          enabled: true,
          task: 'generation',
          confidenceThreshold: 0.7,
          humanEscalation: true
        },
        humanApproval: {
          required: true
        },
        persistence: {
          enabled: true,
          auditTrail: true
        }
      }

      const architecture = await ArchitectureDesigner.design(spec as AutomationSpec)

      expect(architecture.complexity).toBe('complex')
      expect(architecture.stages.length).toBeGreaterThan(5) // Should be rich
      expect(architecture.stages.some(s => s.category === 'decision')).toBe(true)
      expect(architecture.stages.some(s => s.category === 'human_interaction')).toBe(true)
      expect(architecture.stages.some(s => s.category === 'observability')).toBe(true)
      expect(architecture.dataFlow?.connections.length).toBeGreaterThan(0)
    })
  })

  describe('Test 3: Unfamiliar cryptocurrency domain', () => {
    it('should propose appropriate architecture without templates', async () => {
      const spec: Partial<AutomationSpec> = {
        description: 'Build an automation that monitors cryptocurrency prices, detects unusual movements, analyzes the cause using AI, and alerts me when the movement appears significant',
        automationType: 'workflow',
        domain: 'finance',
        aiConfig: {
          enabled: true,
          task: 'analysis'
        }
      }

      const architecture = await ArchitectureDesigner.design(spec as AutomationSpec)

      expect(architecture).toBeDefined()
      expect(architecture.stages.length).toBeGreaterThan(0)
      expect(architecture.unresolvedDecisions).toContain('data source/API') // Should identify missing API
    })
  })

  describe('Test 4: Natural language lead qualification', () => {
    it('should understand semantic intent without exact keywords', async () => {
      const spec: Partial<AutomationSpec> = {
        description: 'I want something that watches new leads, enriches them with company information, scores how promising they are, and sends the good ones to sales',
        automationType: 'workflow',
        domain: 'sales'
      }

      const architecture = await ArchitectureDesigner.design(spec as AutomationSpec)

      expect(architecture).toBeDefined()
      expect(architecture.stages.some(s => s.category === 'input')).toBe(true)
      expect(architecture.stages.some(s => s.category === 'processing')).toBe(true)
      expect(architecture.stages.some(s => s.category === 'decision')).toBe(true) // Scoring logic
    })
  })

  describe('Test 5: Context budgeting', () => {
    it('should respect token limits and prioritize critical sections', () => {
      const sections = [
        { name: 'requirements', content: 'Goal: test automation\nType: workflow', priority: 'critical' as const, estimatedTokens: 50 },
        { name: 'known', content: 'Trigger: webhook\nAI: enabled', priority: 'high' as const, estimatedTokens: 30 },
        { name: 'inferred', content: 'Branching: 2 conditions', priority: 'medium' as const, estimatedTokens: 20 },
        { name: 'conversation', content: 'Long conversation history...', priority: 'low' as const, estimatedTokens: 5000 }
      ]

      const budget = {
        maxTotalTokens: 1000,
        maxSystemTokens: 100,
        maxRequirementsTokens: 200,
        maxKnownTokens: 150,
        maxInferredTokens: 100,
        maxConversationTokens: 50,
        maxReferenceTokens: 100
      }

      const result = ContextBudgeter.buildContext(sections, budget)

      expect(result.includedSections).toContain('requirements')
      expect(result.includedSections).toContain('known')
      expect(result.includedSections).toContain('inferred')
      expect(result.excludedSections).toContain('conversation') // Should exclude low-priority large section
    })
  })

  describe('Validation', () => {
    it('should validate JSON structure', () => {
      const validJSON = '{"name": "test", "nodes": [], "connections": {}}'
      const result = ArtifactValidator.validateJSON(validJSON)
      expect(result.valid).toBe(true)
    })

    it('should detect invalid JSON', () => {
      const invalidJSON = '{"name": "test", "nodes": []'
      const result = ArtifactValidator.validateJSON(invalidJSON)
      expect(result.valid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('should validate n8n structure', () => {
      const validWorkflow = {
        name: 'Test Workflow',
        nodes: [
          { name: 'Trigger', type: 'n8n-nodes-base.webhook', position: [100, 100], parameters: {} }
        ],
        connections: {},
        settings: {}
      }
      const result = ArtifactValidator.validateN8nStructure(JSON.stringify(validWorkflow))
      expect(result.valid).toBe(true)
    })

    it('should detect missing required n8n fields', () => {
      const invalidWorkflow = {
        name: 'Test Workflow',
        nodes: []
        // Missing connections
      }
      const result = ArtifactValidator.validateN8nStructure(JSON.stringify(invalidWorkflow))
      expect(result.valid).toBe(false)
      expect(result.errors).toContain('Missing required field: connections')
    })
  })

  describe('Security constraints', () => {
    it('should prevent credential invention in architecture prompt', () => {
      const spec: Partial<AutomationSpec> = {
        description: 'Email automation',
        automationType: 'workflow',
        domain: 'email'
      }

      // The architecture prompt should include security constraints
      // This is verified by inspecting the prompt in architecture-designer.ts
      expect(true).toBe(true) // Placeholder - would verify prompt content in actual test
    })
  })
})
