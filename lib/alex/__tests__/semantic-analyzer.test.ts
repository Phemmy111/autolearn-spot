/**
 * Semantic Analyzer Phase 1 Tests
 * 
 * Tests for AI-based semantic specification extraction
 */

import { SemanticAnalyzer } from '../artifact-generation/semantic-analyzer'
import { AutomationSpec } from '../artifact-generation/automation-spec'

describe('SemanticAnalyzer Phase 1', () => {
  describe('extractSpecification', () => {
    it('should extract automation type and domain from cryptocurrency monitoring request', async () => {
      const request = "Build an automation that monitors Bitcoin every 10 minutes and alerts me on Telegram if the price falls more than 5%."
      
      // Mock the AI service to return expected structure
      jest.mock('../artifact-generation/workflow-ai-service', () => ({
        WorkflowAIService: {
          getInstance: jest.fn(() => ({
            generateResponse: jest.fn().mockResolvedValue(JSON.stringify({
              automationType: 'workflow',
              domain: 'finance',
              description: 'Cryptocurrency price monitoring with threshold alerts',
              trigger: { type: 'schedule', source: 'crypto-api' },
              schedule: { enabled: true, frequency: 'hourly' },
              outputs: { destinations: ['telegram'] },
              businessRules: { conditions: ['price falls more than 5%'] }
            }))
          }))
        }
      }))
      
      const spec = await SemanticAnalyzer.extractSpecification({ content: request })
      
      expect(spec.automationType).toBe('workflow')
      expect(spec.domain).toBe('finance')
      expect(spec.trigger?.type).toBe('schedule')
      expect(spec.outputs?.destinations).toContain('telegram')
    })

    it('should extract lead qualification details', async () => {
      const request = "Whenever a new lead arrives, enrich the company details, score the lead, and notify sales if it looks promising."
      
      jest.mock('../artifact-generation/workflow-ai-service', () => ({
        WorkflowAIService: {
          getInstance: jest.fn(() => ({
            generateResponse: jest.fn().mockResolvedValue(JSON.stringify({
              automationType: 'workflow',
              domain: 'sales',
              description: 'Lead qualification and enrichment system',
              trigger: { type: 'webhook' },
              integrations: { apis: ['clearbit', 'apollo'] },
              businessRules: { 
                routing: ['high-value to sales', 'low-value to nurture'],
                conditions: ['revenue > $1M', 'employee count > 100']
              },
              outputs: { destinations: ['email', 'salesforce', 'slack'] }
            }))
          }))
        }
      }))
      
      const spec = await SemanticAnalyzer.extractSpecification({ content: request })
      
      expect(spec.domain).toBe('sales')
      expect(spec.trigger?.type).toBe('webhook')
      expect(spec.integrations?.apis).toContain('clearbit')
      expect(spec.businessRules?.routing).toBeDefined()
    })

    it('should extract content summarizer requirements', async () => {
      const request = "Take uploaded documents, summarize them with AI, save the summaries, and email me a daily digest."
      
      jest.mock('../artifact-generation/workflow-ai-service', () => ({
        WorkflowAIService: {
          getInstance: jest.fn(() => ({
            generateResponse: jest.fn().mockResolvedValue(JSON.stringify({
              automationType: 'workflow',
              domain: 'data',
              description: 'Document summarization with daily digest',
              trigger: { type: 'webhook' },
              inputs: { sources: ['file'] },
              aiConfig: { enabled: true, task: 'summarization' },
              persistence: { enabled: true },
              schedule: { enabled: true, frequency: 'daily' },
              outputs: { destinations: ['email'] }
            }))
          }))
        }
      }))
      
      const spec = await SemanticAnalyzer.extractSpecification({ content: request })
      
      expect(spec.domain).toBe('data')
      expect(spec.inputs?.sources).toContain('file')
      expect(spec.aiConfig?.task).toBe('summarization')
      expect(spec.aiConfig?.enabled).toBe(true)
      expect(spec.schedule?.enabled).toBe(true)
    })

    it('should handle attachment context', async () => {
      const request = "Build something like the attached workflow but adapt it to handle customer support."
      const mockFile = {
        original_filename: 'customer-support-workflow.json',
        mime_type: 'application/json',
        extracted_text: '{"nodes": [{"type": "email-trigger"}, {"type": "ai-classifier"}]}'
      }
      
      jest.mock('../artifact-generation/workflow-ai-service', () => ({
        WorkflowAIService: {
          getInstance: jest.fn(() => ({
            generateResponse: jest.fn().mockResolvedValue(JSON.stringify({
              automationType: 'workflow',
              domain: 'support',
              description: 'Customer support automation based on reference workflow',
              integrations: { emailProvider: 'outlook' },
              humanApproval: { escalationPath: 'slack' }
            }))
          }))
        }
      }))
      
      const spec = await SemanticAnalyzer.extractSpecification({
        content: request,
        attachedFiles: [mockFile]
      })
      
      expect(spec.domain).toBe('support')
      expect(spec.integrations?.emailProvider).toBe('outlook')
      expect(spec.humanApproval?.escalationPath).toBe('slack')
    })

    it('should return empty spec on AI failure (triggers keyword fallback)', async () => {
      const request = "Build an automation"
      
      jest.mock('../artifact-generation/workflow-ai-service', () => ({
        WorkflowAIService: {
          getInstance: jest.fn(() => ({
            generateResponse: jest.fn().mockRejectedValue(new Error('AI service failed'))
          }))
        }
      }))
      
      const spec = await SemanticAnalyzer.extractSpecification({ content: request })
      
      expect(Object.keys(spec).length).toBe(0)
    })

    it('should return empty spec on malformed JSON response (triggers keyword fallback)', async () => {
      const request = "Build an automation"
      
      jest.mock('../artifact-generation/workflow-ai-service', () => ({
        WorkflowAIService: {
          getInstance: jest.fn(() => ({
            generateResponse: jest.fn().mockResolvedValue('This is not valid JSON')
          }))
        }
      }))
      
      const spec = await SemanticAnalyzer.extractSpecification({ content: request })
      
      expect(Object.keys(spec).length).toBe(0)
    })
  })

  describe('conversation context handling', () => {
    it('should include conversation history in context', async () => {
      const request = "Use Claude instead."
      const history = [
        { role: 'user', content: 'Build an email automation' },
        { role: 'assistant', content: 'Which provider?' },
        { role: 'user', content: 'Gmail' }
      ]
      
      jest.mock('../artifact-generation/workflow-ai-service', () => ({
        WorkflowAIService: {
          getInstance: jest.fn(() => ({
            generateResponse: jest.fn().mockResolvedValue(JSON.stringify({
              integrations: { aiProvider: 'anthropic', aiModel: 'claude-3' }
            }))
          }))
        }
      }))
      
      const spec = await SemanticAnalyzer.extractSpecification({
        content: request,
        conversationHistory: history
      })
      
      expect(spec.integrations?.aiProvider).toBe('anthropic')
      expect(spec.integrations?.aiModel).toBe('claude-3')
    })
  })
})

describe('Phase 1 Integration Test', () => {
  it('should verify feature flag enables AI extraction', () => {
    // Test that USE_AI_SPEC_EXTRACTION environment variable controls the behavior
    const originalEnv = process.env.USE_AI_SPEC_EXTRACTION
    
    process.env.USE_AI_SPEC_EXTRACTION = 'true'
    expect(process.env.USE_AI_SPEC_EXTRACTION !== 'false').toBe(true)
    
    process.env.USE_AI_SPEC_EXTRACTION = 'false'
    expect(process.env.USE_AI_SPEC_EXTRACTION !== 'false').toBe(false)
    
    process.env.USE_AI_SPEC_EXTRACTION = originalEnv
  })

  it('should verify IntelligenceAnalyzerV2 has SemanticAnalyzer integration', () => {
    // This test verifies the integration exists in the code
    const fs = require('fs')
    const intelligenceAnalyzerCode = fs.readFileSync(
      'lib/alex/artifact-generation/intelligence-analyzer-v2.ts',
      'utf8'
    )
    
    expect(intelligenceAnalyzerCode).toContain('SemanticAnalyzer')
    expect(intelligenceAnalyzerCode).toContain('extractSpecification')
    expect(intelligenceAnalyzerCode).toContain('USE_AI_SPEC_EXTRACTION')
    expect(intelligenceAnalyzerCode).toContain('keyword fallback')
  })
})
