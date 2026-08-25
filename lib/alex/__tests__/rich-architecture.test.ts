/**
 * Phase 3A: Rich Logical Architecture Tests
 * 
 * Tests five radically different automation scenarios to ensure
 * the AI-based architecture generation produces appropriate architectures
 * without using hardcoded templates.
 */

import { ArchitectureDesigner, LogicalArchitecture, LogicalStage } from '../artifact-generation/architecture-designer'
import { AutomationSpec, createEmptySpec } from '../artifact-generation/automation-spec'

describe('Phase 3A: Rich Logical Architecture', () => {
  
  /**
   * Test A — Simple
   * Create a workflow that sends me a daily reminder at 8 AM.
   * Expected: Simple architecture. No unnecessary AI, database, error system, etc.
   */
  describe('Test A: Simple Daily Reminder', () => {
    it('should generate a simple architecture for daily reminder', async () => {
      const spec: AutomationSpec = {
        ...createEmptySpec(),
        description: 'Create a workflow that sends me a daily reminder at 8 AM',
        automationType: 'workflow',
        domain: 'custom',
        schedule: {
          enabled: true,
          frequency: 'daily',
          time: '08:00'
        }
      }

      const architecture = await ArchitectureDesigner.design(spec)

      // Verify structure
      expect(architecture).toBeDefined()
      expect(architecture.id).toBeDefined()
      expect(architecture.name).toBeDefined()
      expect(architecture.goal).toBeDefined()
      expect(architecture.platformAgnostic).toBe(true)

      // Should be simple
      expect(architecture.complexity).toBe('simple')

      // Should have minimal stages (trigger, notification, maybe logging)
      expect(architecture.stages.length).toBeLessThanOrEqual(4)

      // Should not have AI stages
      const hasAI = architecture.stages.some(s => 
        s.category === 'processing' && s.purpose.toLowerCase().includes('ai')
      )
      expect(hasAI).toBe(false)

      // Should not have complex branching
      const hasBranching = architecture.stages.some(s => s.conditions)
      expect(hasBranching).toBe(false)

      console.log('Test A - Simple Reminder Architecture:', JSON.stringify(architecture, null, 2))
    })
  })

  /**
   * Test B — AI Customer Support
   * Build an AI customer support automation that receives emails, understands the customer's issue,
   * searches our knowledge base, drafts a response, checks confidence, escalates uncertain cases
   * to a human, replies when confident, and logs every interaction.
   * Expected: Rich architecture with email ingestion, normalization, understanding, retrieval,
   * response generation, confidence evaluation, branching, human escalation, reply, logging.
   */
  describe('Test B: AI Customer Support', () => {
    it('should generate a rich architecture for AI customer support', async () => {
      const spec: AutomationSpec = {
        ...createEmptySpec(),
        description: 'Build an AI customer support automation that receives emails, understands the customer\'s issue, searches our knowledge base, drafts a response, checks confidence, escalates uncertain cases to a human, replies when confident, and logs every interaction',
        automationType: 'workflow',
        domain: 'support',
        aiConfig: {
          enabled: true,
          task: 'generation',
          confidenceThreshold: 0.85,
          humanEscalation: true
        },
        integrations: {
          emailProvider: 'gmail',
          aiProvider: 'openai',
          aiModel: 'gpt-4',
          knowledgeBase: 'confluence'
        },
        humanApproval: {
          required: true,
          stages: ['response']
        },
        persistence: {
          enabled: true,
          auditTrail: true
        }
      }

      const architecture = await ArchitectureDesigner.design(spec)

      // Verify structure
      expect(architecture).toBeDefined()
      expect(architecture.id).toBeDefined()
      expect(architecture.goal).toBeDefined()
      expect(architecture.platformAgnostic).toBe(true)

      // Should be complex
      expect(architecture.complexity).toBe('complex')

      // Should have email trigger
      const hasEmailTrigger = architecture.stages.some(s => 
        s.category === 'trigger' && s.purpose.toLowerCase().includes('email')
      )
      expect(hasEmailTrigger).toBe(true)

      // Should have AI processing
      const hasAI = architecture.stages.some(s => 
        s.category === 'processing' && s.purpose.toLowerCase().includes('ai')
      )
      expect(hasAI).toBe(true)

      // Should have decision/branching for confidence
      const hasDecision = architecture.stages.some(s => 
        s.category === 'decision' && s.conditions
      )
      expect(hasDecision).toBe(true)

      // Should have human interaction
      const hasHumanInteraction = architecture.stages.some(s => 
        s.humanInteraction && s.humanInteraction.required
      )
      expect(hasHumanInteraction).toBe(true)

      // Should have state management (for duplicate detection)
      const hasState = architecture.stages.some(s => 
        s.stateRequirements && s.stateRequirements.required
      )
      expect(hasState).toBe(true)

      // Should have observability
      const hasObservability = architecture.stages.some(s => 
        s.observability && s.observability.logging
      )
      expect(hasObservability).toBe(true)

      // Should have data flow
      expect(architecture.dataFlow).toBeDefined()
      expect(architecture.dataFlow!.connections.length).toBeGreaterThan(0)

      console.log('Test B - AI Customer Support Architecture:', JSON.stringify(architecture, null, 2))
    })
  })

  /**
   * Test C — Unfamiliar Domain (Cryptocurrency)
   * Build an automation that monitors cryptocurrency prices, detects unusual movements,
   * explains significant movements with AI, and alerts me.
   * Expected: ALEX must reason dynamically. There must NOT be a cryptocurrency-specific template.
   */
  describe('Test C: Cryptocurrency Price Monitoring', () => {
    it('should generate appropriate architecture for crypto monitoring without templates', async () => {
      const spec: AutomationSpec = {
        ...createEmptySpec(),
        description: 'Build an automation that monitors cryptocurrency prices, detects unusual movements, explains significant movements with AI, and alerts me',
        automationType: 'workflow',
        domain: 'custom',
        aiConfig: {
          enabled: true,
          task: 'analysis'
        },
        schedule: {
          enabled: true,
          frequency: 'hourly'
        },
        integrations: {
          aiProvider: 'openai',
          aiModel: 'gpt-4'
        }
      }

      const architecture = await ArchitectureDesigner.design(spec)

      // Verify structure
      expect(architecture).toBeDefined()
      expect(architecture.id).toBeDefined()
      expect(architecture.goal).toBeDefined()
      expect(architecture.platformAgnostic).toBe(true)

      // Should have scheduled trigger
      const hasScheduleTrigger = architecture.stages.some(s => 
        s.category === 'trigger' && s.purpose.toLowerCase().includes('schedule')
      )
      expect(hasScheduleTrigger).toBe(true)

      // Should have data acquisition
      const hasDataAcquisition = architecture.stages.some(s => 
        s.category === 'input' || s.purpose.toLowerCase().includes('fetch') || s.purpose.toLowerCase().includes('acquire')
      )
      expect(hasDataAcquisition).toBe(true)

      // Should have anomaly detection
      const hasDetection = architecture.stages.some(s => 
        s.purpose.toLowerCase().includes('detect') || s.purpose.toLowerCase().includes('anomaly') || s.purpose.toLowerCase().includes('unusual')
      )
      expect(hasDetection).toBe(true)

      // Should have AI analysis
      const hasAI = architecture.stages.some(s => 
        s.category === 'processing' && s.purpose.toLowerCase().includes('ai')
      )
      expect(hasAI).toBe(true)

      // Should have alert/notification
      const hasAlert = architecture.stages.some(s => 
        s.category === 'output' && (s.purpose.toLowerCase().includes('alert') || s.purpose.toLowerCase().includes('notify'))
      )
      expect(hasAlert).toBe(true)

      // Should have data flow
      expect(architecture.dataFlow).toBeDefined()

      console.log('Test C - Crypto Monitoring Architecture:', JSON.stringify(architecture, null, 2))
    })
  })

  /**
   * Test D — Business Automation (Lead Qualification)
   * Build a lead qualification automation that receives new leads, enriches company information,
   * scores the lead, routes qualified leads to sales, and stores the outcome.
   * Expected: Different architecture from customer support.
   */
  describe('Test D: Lead Qualification', () => {
    it('should generate appropriate architecture for lead qualification', async () => {
      const spec: AutomationSpec = {
        ...createEmptySpec(),
        description: 'Build a lead qualification automation that receives new leads, enriches company information, scores the lead, routes qualified leads to sales, and stores the outcome',
        automationType: 'workflow',
        domain: 'sales',
        trigger: {
          type: 'webhook',
          source: 'web-form'
        },
        integrations: {
          apis: ['clearbit', 'hubspot'],
          crm: 'salesforce'
        }
      }

      const architecture = await ArchitectureDesigner.design(spec)

      // Verify structure
      expect(architecture).toBeDefined()
      expect(architecture.id).toBeDefined()
      expect(architecture.goal).toBeDefined()
      expect(architecture.platformAgnostic).toBe(true)

      // Should have webhook/form trigger
      const hasTrigger = architecture.stages.some(s => s.category === 'trigger')
      expect(hasTrigger).toBe(true)

      // Should have data enrichment
      const hasEnrichment = architecture.stages.some(s => 
        s.purpose.toLowerCase().includes('enrich') || s.purpose.toLowerCase().includes('company')
      )
      expect(hasEnrichment).toBe(true)

      // Should have scoring
      const hasScoring = architecture.stages.some(s => 
        s.purpose.toLowerCase().includes('score')
      )
      expect(hasScoring).toBe(true)

      // Should have routing/decision
      const hasRouting = architecture.stages.some(s => 
        s.category === 'decision' || s.purpose.toLowerCase().includes('route')
      )
      expect(hasRouting).toBe(true)

      // Should have storage
      const hasStorage = architecture.stages.some(s => 
        s.category === 'output' && s.purpose.toLowerCase().includes('store')
      )
      expect(hasStorage).toBe(true)

      console.log('Test D - Lead Qualification Architecture:', JSON.stringify(architecture, null, 2))
    })
  })

  /**
   * Test E — Multi-input Automation (Document Processing)
   * Build a document processing system that accepts invoices from email and uploads,
   * extracts invoice information, validates the totals, stores approved invoices,
   * and alerts finance when validation fails.
   * Expected: Multiple input paths and meaningful validation/error branching.
   */
  describe('Test E: Multi-input Document Processing', () => {
    it('should generate architecture with multiple input paths and validation branching', async () => {
      const spec: AutomationSpec = {
        ...createEmptySpec(),
        description: 'Build a document processing system that accepts invoices from email and uploads, extracts invoice information, validates the totals, stores approved invoices, and alerts finance when validation fails',
        automationType: 'workflow',
        domain: 'finance',
        inputs: {
          sources: ['email', 'file-upload']
        },
        outputs: {
          destinations: ['database', 'email-alert']
        },
        integrations: {
          emailProvider: 'gmail',
          databases: ['postgresql']
        }
      }

      const architecture = await ArchitectureDesigner.design(spec)

      // Verify structure
      expect(architecture).toBeDefined()
      expect(architecture.id).toBeDefined()
      expect(architecture.goal).toBeDefined()
      expect(architecture.platformAgnostic).toBe(true)

      // Should have extraction
      const hasExtraction = architecture.stages.some(s => 
        s.purpose.toLowerCase().includes('extract')
      )
      expect(hasExtraction).toBe(true)

      // Should have validation
      const hasValidation = architecture.stages.some(s => 
        s.purpose.toLowerCase().includes('validat')
      )
      expect(hasValidation).toBe(true)

      // Should have decision/branching for validation result
      const hasDecision = architecture.stages.some(s => 
        s.category === 'decision' && s.conditions
      )
      expect(hasDecision).toBe(true)

      // Should have error handling or alert for validation failure
      const hasErrorHandling = architecture.stages.some(s => 
        s.category === 'error_handling' || s.purpose.toLowerCase().includes('alert')
      )
      expect(hasErrorHandling).toBe(true)

      // Should have storage for approved invoices
      const hasStorage = architecture.stages.some(s => 
        s.category === 'output' && s.purpose.toLowerCase().includes('store')
      )
      expect(hasStorage).toBe(true)

      // Should have data flow showing validation branching
      expect(architecture.dataFlow).toBeDefined()

      console.log('Test E - Document Processing Architecture:', JSON.stringify(architecture, null, 2))
    })
  })

  /**
   * Architecture Validation Tests
   */
  describe('Architecture Validation', () => {
    it('should validate architecture structure correctly', async () => {
      const spec: AutomationSpec = {
        ...createEmptySpec(),
        description: 'Test automation',
        automationType: 'workflow'
      }

      const architecture = await ArchitectureDesigner.design(spec)

      // All stages should have required fields
      architecture.stages.forEach(stage => {
        expect(stage.id).toBeDefined()
        expect(stage.name).toBeDefined()
        expect(stage.purpose).toBeDefined()
        expect(stage.category).toBeDefined()
      })

      // Stage IDs should be unique
      const stageIds = architecture.stages.map(s => s.id)
      const uniqueIds = new Set(stageIds)
      expect(uniqueIds.size).toBe(stageIds.length)

      // Dependencies should reference existing stages
      architecture.stages.forEach(stage => {
        if (stage.dependencies) {
          stage.dependencies.forEach(dep => {
            expect(stageIds).toContain(dep)
          })
        }
      })

      // Data flow connections should reference existing stages
      if (architecture.dataFlow && architecture.dataFlow.connections) {
        architecture.dataFlow.connections.forEach(conn => {
          expect(stageIds).toContain(conn.from)
          expect(stageIds).toContain(conn.to)
        })
      }
    })
  })

  /**
   * Platform Independence Test
   */
  describe('Platform Independence', () => {
    it('should generate platform-agnostic architectures', async () => {
      const specs = [
        { ...createEmptySpec(), description: 'Email automation', automationType: 'workflow' },
        { ...createEmptySpec(), description: 'Scheduled task', automationType: 'workflow', schedule: { enabled: true } },
        { ...createEmptySpec(), description: 'AI processing', automationType: 'workflow', aiConfig: { enabled: true } }
      ]

      for (const spec of specs) {
        const architecture = await ArchitectureDesigner.design(spec)
        expect(architecture.platformAgnostic).toBe(true)
        
        // Stages should not reference platform-specific technologies
        architecture.stages.forEach(stage => {
          expect(stage.purpose.toLowerCase()).not.toContain('n8n')
          expect(stage.purpose.toLowerCase()).not.toContain('zapier')
          expect(stage.purpose.toLowerCase()).not.toContain('make')
        })
      }
    })
  })
})
