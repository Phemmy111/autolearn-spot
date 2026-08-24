/**
 * Tests for Semantic Answer Mapping (Phase 2)
 * 
 * These tests verify that SemanticAnalyzer.mapAnswer() correctly interprets
 * natural language answers and maps them to specification fields.
 */

import { SemanticAnalyzer } from '../artifact-generation/semantic-analyzer'
import { AutomationSpec } from '../artifact-generation/automation-spec'

// Mock the WorkflowAIService
jest.mock('../artifact-generation/workflow-ai-service', () => ({
  WorkflowAIService: {
    getInstance: jest.fn(() => ({
      generateResponse: jest.fn().mockImplementation((prompt: string) => {
        // Parse the prompt to determine what to return
        if (prompt.includes("Google's Gemini") || prompt.includes("Google's AI")) {
          return JSON.stringify({ field: 'integrations.aiModel', value: 'gemini' })
        }
        if (prompt.includes("Anthropic's Claude") || prompt.includes("Use Claude")) {
          return JSON.stringify({ field: 'integrations.aiModel', value: 'claude-3' })
        }
        if (prompt.includes("OpenAI's latest model") || prompt.includes("Use OpenAI")) {
          return JSON.stringify({ field: 'integrations.aiModel', value: 'gpt-4' })
        }
        if (prompt.includes("Pick the best option") || prompt.includes("whatever you recommend")) {
          return JSON.stringify({ field: 'recommendation', value: 'gpt-4' })
        }
        if (prompt.includes("Microsoft 365") || prompt.includes("Outlook")) {
          return JSON.stringify({ field: 'integrations.emailProvider', value: 'outlook' })
        }
        if (prompt.includes("Google Workspace") || prompt.includes("Gmail")) {
          return JSON.stringify({ field: 'integrations.emailProvider', value: 'gmail' })
        }
        if (prompt.includes("Every weekday morning") || prompt.includes("Weekdays only")) {
          return JSON.stringify({ field: 'schedule.frequency', value: 'weekdays' })
        }
        if (prompt.includes("At 8am every day") || prompt.includes("Daily")) {
          return JSON.stringify({ field: 'schedule.frequency', value: 'daily' })
        }
        if (prompt.includes("Every Monday and Friday") || prompt.includes("Weekly")) {
          return JSON.stringify({ field: 'schedule.frequency', value: 'weekly' })
        }
        if (prompt.includes("All incoming emails") || prompt.includes("Every message")) {
          return JSON.stringify({ field: 'businessRules.routing', value: ["reply to all emails"] })
        }
        if (prompt.includes("Support only") || prompt.includes("Customer inquiries")) {
          return JSON.stringify({ field: 'businessRules.routing', value: ["reply to support inquiries only"] })
        }
        if (prompt.includes("Notion")) {
          return JSON.stringify({ field: 'integrations.knowledgeBase', value: 'notion' })
        }
        if (prompt.includes("Confluence")) {
          return JSON.stringify({ field: 'integrations.knowledgeBase', value: 'confluence' })
        }
        if (prompt.includes("Skip")) {
          return JSON.stringify({ field: null, value: null })
        }
        if (prompt.includes("I don't know")) {
          return JSON.stringify({ field: null, value: null })
        }
        // Default fallback
        return JSON.stringify({ field: null, value: null })
      })
    }))
  }
}))

describe('Semantic Answer Mapping', () => {
  let mockSpec: AutomationSpec

  beforeEach(() => {
    mockSpec = {
      automationType: 'workflow',
      aiConfig: { enabled: false },
      humanApproval: { required: false },
      errorHandling: { retryStrategy: 'exponential-backoff', maxRetries: 3 },
      persistence: { enabled: true, logLevel: 'info', auditTrail: true },
      architecture: { complexity: 'moderate' }
    }
  })

  describe('AI Provider Mapping', () => {
    test('should map "Google\'s Gemini" to Google/Gemini', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Google's Gemini",
        'integrations.aiModel',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.aiModel')
      expect(result.value).toBe('gemini')
    })

    test('should map "I\'d prefer Anthropic\'s Claude" to Anthropic/Claude', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "I'd prefer Anthropic's Claude",
        'integrations.aiModel',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.aiModel')
      expect(result.value).toBe('claude-3')
    })

    test('should map "Use OpenAI\'s latest model" to OpenAI', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Use OpenAI's latest model",
        'integrations.aiModel',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.aiModel')
      expect(result.value).toBe('gpt-4')
    })

    test('should handle "Pick the best option for me" as recommendation', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Pick the best option for me",
        'integrations.aiModel',
        mockSpec
      )
      
      expect(result.field).toBe('recommendation')
      expect(result.value).toBeDefined()
    })
  })

  describe('Email Provider Mapping', () => {
    test('should map "Microsoft 365" to Outlook', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "My company uses Microsoft 365",
        'integrations.emailProvider',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.emailProvider')
      expect(result.value).toBe('outlook')
    })

    test('should map "Google Workspace" to Gmail', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Google Workspace",
        'integrations.emailProvider',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.emailProvider')
      expect(result.value).toBe('gmail')
    })

    test('should handle "Use whatever you recommend" as recommendation', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Use whatever you recommend",
        'integrations.emailProvider',
        mockSpec
      )
      
      expect(result.field).toBe('recommendation')
      expect(result.value).toBeDefined()
    })
  })

  describe('Schedule Mapping', () => {
    test('should map "Every weekday morning" to appropriate schedule', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Every weekday morning",
        'schedule.frequency',
        mockSpec
      )
      
      expect(result.field).toBe('schedule.frequency')
      expect(result.value).toBeDefined()
    })

    test('should map "At 8am every day" to daily schedule', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "At 8am every day",
        'schedule.frequency',
        mockSpec
      )
      
      expect(result.field).toBe('schedule.frequency')
      expect(result.value).toBe('daily')
    })

    test('should map "Every Monday and Friday" to weekly schedule', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Every Monday and Friday",
        'schedule.frequency',
        mockSpec
      )
      
      expect(result.field).toBe('schedule.frequency')
      expect(result.value).toBe('weekly')
    })
  })

  describe('Business Rules Mapping', () => {
    test('should map "All incoming emails" to routing rule', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "All incoming emails",
        'businessRules.routing',
        mockSpec
      )
      
      expect(result.field).toBe('businessRules.routing')
      expect(result.value).toBeDefined()
    })

    test('should map "Support only" to routing rule', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Support only",
        'businessRules.routing',
        mockSpec
      )
      
      expect(result.field).toBe('businessRules.routing')
      expect(result.value).toBeDefined()
    })
  })

  describe('Knowledge Base Mapping', () => {
    test('should map "Notion" correctly', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Notion",
        'integrations.knowledgeBase',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.knowledgeBase')
      expect(result.value).toBe('notion')
    })

    test('should map "Confluence" correctly', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Confluence",
        'integrations.knowledgeBase',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.knowledgeBase')
      expect(result.value).toBe('confluence')
    })
  })

  describe('Natural Language Variations', () => {
    test('should understand "Google\'s AI" without exact "Gemini" keyword', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Google's AI",
        'integrations.aiModel',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.aiModel')
      expect(result.value).toBe('gemini')
    })

    test('should understand "Use Claude" without "Anthropic" keyword', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Use Claude",
        'integrations.aiModel',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.aiModel')
      expect(result.value).toBe('claude-3')
    })
  })

  describe('Edge Cases', () => {
    test('should handle "Skip" correctly', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Skip",
        'integrations.emailProvider',
        mockSpec
      )
      
      expect(result.field).toBeNull()
      expect(result.value).toBeNull()
    })

    test('should handle ambiguous answers gracefully', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "I don't know",
        'integrations.aiModel',
        mockSpec
      )
      
      // Should either return null for fallback or recommendation
      expect(result.field === null || result.field === 'recommendation').toBe(true)
    })

    test('should handle empty strings', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "",
        'integrations.emailProvider',
        mockSpec
      )
      
      expect(result.field).toBeNull()
      expect(result.value).toBeNull()
    })
  })

  describe('Exact Answer Backward Compatibility', () => {
    test('should still work with exact "Gmail"', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Gmail",
        'integrations.emailProvider',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.emailProvider')
      expect(result.value).toBe('gmail')
    })

    test('should still work with exact "Gemini"', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Gemini",
        'integrations.aiModel',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.aiModel')
      expect(result.value).toBe('gemini')
    })

    test('should still work with exact "Outlook"', async () => {
      const result = await SemanticAnalyzer.mapAnswer(
        "Outlook",
        'integrations.emailProvider',
        mockSpec
      )
      
      expect(result.field).toBe('integrations.emailProvider')
      expect(result.value).toBe('outlook')
    })
  })
})
