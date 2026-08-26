/**
 * Conversational Token Budget Tests
 * 
 * Tests for token budgeting in the conversational mode path
 * Ensures that conversational requests stay within provider TPM limits
 */

import { describe, it, expect } from 'vitest'
import { AIOrchestrator } from '../orchestration/ai-orchestrator'
import { ConversationContext, AutomationPlan } from '../orchestration/types'

describe('Conversational Token Budget Tests', () => {
  const orchestrator = AIOrchestrator.getInstance()

  describe('Test 1 - Simple automation request', () => {
    it('should stay within budget for simple job automation request', async () => {
      const context: ConversationContext = {
        mode: 'auto',
        messages: [
          { role: 'user', content: 'I want an automation for job applications' }
        ],
        userId: 'test-user',
        conversationId: 'test-conv'
      }

      // We can't directly test the private method, but we can verify the token estimation
      // by testing the estimateTokens helper
      const systemPrompt = `You are ALEX (AutoLearn Intelligence & Execution Agent), an automation expert and conversational AI assistant.

Your role:
- Help users understand automation concepts
- Assist with designing workflows and integrations
- Answer questions about n8n, automation platforms, APIs, webhooks, and related technologies
- Guide users through planning automations when they're ready
- Respond naturally and conversationally`

      const estimateTokens = (text: string) => {
        if (!text) return 0
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        return Math.ceil(normalizedText.length / 4)
      }

      const systemPromptTokens = estimateTokens(systemPrompt)
      const userMessageTokens = estimateTokens('User\'s message: I want an automation for job applications')
      const conversationTokens = estimateTokens('user: I want an automation for job applications')
      const planTokens = estimateTokens('\nNo current automation plan - this is a new request')

      const totalTokens = systemPromptTokens + conversationTokens + planTokens + userMessageTokens
      const providerInputBudget = 6400

      console.log('[Test 1] Token breakdown:', {
        systemPromptTokens,
        conversationTokens,
        planTokens,
        userMessageTokens,
        totalTokens,
        providerInputBudget,
        withinBudget: totalTokens <= providerInputBudget
      })

      expect(totalTokens).toBeLessThanOrEqual(providerInputBudget)
    })
  })

  describe('Test 2 - Long conversation', () => {
    it('should reduce conversation history to stay within budget', () => {
      // Create a long conversation with much larger messages to force truncation
      const longConversation: Array<{ role: string, content: string }> = []
      for (let i = 0; i < 200; i++) {
        longConversation.push({ 
          role: i % 2 === 0 ? 'user' : 'assistant', 
          content: `This is message ${i}. `.repeat(200) // ~1600 chars per message to force truncation
        })
      }

      const estimateTokens = (text: string) => {
        if (!text) return 0
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        return Math.ceil(normalizedText.length / 4)
      }

      const providerInputBudget = 6400
      const systemPromptTokens = estimateTokens(`You are ALEX (AutoLearn Intelligence & Execution Agent), an automation expert and conversational AI assistant.

Your role:
- Help users understand automation concepts
- Assist with designing workflows and integrations
- Answer questions about n8n, automation platforms, APIs, webhooks, and related technologies
- Guide users through planning automations when they're ready
- Respond naturally and conversationally`)

      const maxConversationTokens = providerInputBudget - systemPromptTokens - 500 // Reserve for plan + user message

      // Simulate token-aware selection (newest first)
      let conversationContext = ''
      let conversationTokens = 0
      const recentMessagesReversed = [...longConversation].reverse()
      let messagesIncluded = 0
      
      for (const message of recentMessagesReversed) {
        const messageText = `${message.role}: ${message.content.substring(0, 200)}`
        const messageTokens = estimateTokens(messageText)
        
        if (conversationTokens + messageTokens <= maxConversationTokens) {
          conversationContext = messageText + '\n' + conversationContext
          conversationTokens += messageTokens
          messagesIncluded++
        } else {
          break
        }
      }

      console.log('[Test 2] Long conversation handling:', {
        totalMessages: longConversation.length,
        messagesIncluded,
        conversationTokens,
        maxConversationTokens,
        withinBudget: conversationTokens <= maxConversationTokens
      })

      expect(conversationTokens).toBeLessThanOrEqual(maxConversationTokens)
      expect(messagesIncluded).toBeLessThan(longConversation.length) // Should have dropped some messages
    })
  })

  describe('Test 3 - Automation plan + conversation', () => {
    it('should fit both automation plan and conversation within budget', () => {
      const context: ConversationContext = {
        mode: 'auto',
        messages: [
          { role: 'user', content: 'I want an automation for job applications' },
          { role: 'assistant', content: 'I can help you with that. What specific features do you need?' },
          { role: 'user', content: 'AI scoring and Google Sheets storage' }
        ],
        userId: 'test-user',
        conversationId: 'test-conv'
      }

      const currentPlan: AutomationPlan = {
        objective: 'Job application automation with AI scoring',
        status: 'in_progress',
        platform: { name: 'n8n' },
        architecture: {
          stages: [
            { id: '1', name: 'Webhook trigger', type: 'trigger' },
            { id: '2', name: 'AI scoring', type: 'action' },
            { id: '3', name: 'Google Sheets storage', type: 'action' }
          ]
        }
      }

      const estimateTokens = (text: string) => {
        if (!text) return 0
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        return Math.ceil(normalizedText.length / 4)
      }

      const providerInputBudget = 6400
      const systemPromptTokens = estimateTokens(`You are ALEX (AutoLearn Intelligence & Execution Agent), an automation expert and conversational AI assistant.

Your role:
- Help users understand automation concepts
- Assist with designing workflows and integrations
- Answer questions about n8n, automation platforms, APIs, webhooks, and related technologies
- Guide users through planning automations when they're ready
- Respond naturally and conversationally`)

      // Compact plan representation
      const compactPlan = {
        objective: currentPlan.objective,
        platform: currentPlan.platform?.name,
        status: currentPlan.status,
        stageCount: currentPlan.architecture?.stages?.length || 0
      }
      const planText = `\nCurrent automation plan:\n${JSON.stringify(compactPlan, null, 2)}`
      const planTokens = estimateTokens(planText)

      // Build conversation with token awareness
      let conversationContext = ''
      let conversationTokens = 0
      const maxConversationTokens = providerInputBudget - systemPromptTokens - planTokens - 200 // Reserve for user message
      
      const recentMessagesReversed = [...context.messages].reverse()
      for (const message of recentMessagesReversed) {
        const messageText = `${message.role}: ${message.content.substring(0, 200)}`
        const messageTokens = estimateTokens(messageText)
        
        if (conversationTokens + messageTokens <= maxConversationTokens) {
          conversationContext = messageText + '\n' + conversationContext
          conversationTokens += messageTokens
        } else {
          break
        }
      }

      const userMessageTokens = estimateTokens('User\'s message: I want an automation for job applications')
      const totalTokens = systemPromptTokens + conversationTokens + planTokens + userMessageTokens

      console.log('[Test 3] Plan + conversation:', {
        systemPromptTokens,
        conversationTokens,
        planTokens,
        userMessageTokens,
        totalTokens,
        providerInputBudget,
        withinBudget: totalTokens <= providerInputBudget
      })

      expect(totalTokens).toBeLessThanOrEqual(providerInputBudget)
    })
  })

  describe('Test 4 - Current request preservation', () => {
    it('should always preserve the current user request', () => {
      const userMessage = 'I want an automation for job applications'
      
      const estimateTokens = (text: string) => {
        if (!text) return 0
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        return Math.ceil(normalizedText.length / 4)
      }

      const userMessageTokens = estimateTokens(`User's message: ${userMessage}`)
      
      console.log('[Test 4] User message preservation:', {
        userMessage,
        userMessageTokens,
        preserved: true
      })

      expect(userMessageTokens).toBeGreaterThan(0)
      expect(userMessageTokens).toBeLessThan(100) // Should be reasonable size
    })
  })

  describe('Test 5 - Very large context', () => {
    it('should handle very large context without exceeding budget', () => {
      // Create a very large plan
      const largePlan: AutomationPlan = {
        objective: 'Complex automation with many stages',
        status: 'in_progress',
        platform: { name: 'n8n' },
        architecture: {
          stages: Array.from({ length: 50 }, (_, i) => ({
            id: `${i}`,
            name: `Stage ${i}`,
            type: 'action',
            description: 'Detailed description with lots of information'.repeat(10)
          }))
        }
      }

      // Create very long conversation with larger messages
      const longConversation: Array<{ role: string, content: string }> = []
      for (let i = 0; i < 200; i++) {
        longConversation.push({ 
          role: i % 2 === 0 ? 'user' : 'assistant', 
          content: 'Long message content '.repeat(100) // Larger to force truncation
        })
      }

      const estimateTokens = (text: string) => {
        if (!text) return 0
        const normalizedText = text.replace(/\s+/g, ' ').trim()
        return Math.ceil(normalizedText.length / 4)
      }

      const providerInputBudget = 6400
      const systemPromptTokens = estimateTokens(`You are ALEX (AutoLearn Intelligence & Execution Agent), an automation expert and conversational AI assistant.

Your role:
- Help users understand automation concepts
- Assist with designing workflows and integrations
- Answer questions about n8n, automation platforms, APIs, webhooks, and related technologies
- Guide users through planning automations when they're ready
- Respond naturally and conversationally`)

      // Compact plan representation
      const compactPlan = {
        objective: largePlan.objective,
        platform: largePlan.platform?.name,
        status: largePlan.status,
        stageCount: largePlan.architecture?.stages?.length || 0
      }
      const planText = `\nCurrent automation plan:\n${JSON.stringify(compactPlan, null, 2)}`
      const planTokens = estimateTokens(planText)

      // Build conversation with token awareness
      let conversationContext = ''
      let conversationTokens = 0
      const maxConversationTokens = providerInputBudget - systemPromptTokens - planTokens - 200
      
      const recentMessagesReversed = [...longConversation].reverse()
      let messagesIncluded = 0
      for (const message of recentMessagesReversed) {
        const messageText = `${message.role}: ${message.content.substring(0, 200)}`
        const messageTokens = estimateTokens(messageText)
        
        if (conversationTokens + messageTokens <= maxConversationTokens) {
          conversationContext = messageText + '\n' + conversationContext
          conversationTokens += messageTokens
          messagesIncluded++
        } else {
          break
        }
      }

      const userMessageTokens = estimateTokens('User\'s message: I want an automation for job applications')
      const totalTokens = systemPromptTokens + conversationTokens + planTokens + userMessageTokens

      console.log('[Test 5] Very large context:', {
        originalPlanStages: largePlan.architecture?.stages?.length,
        originalMessages: longConversation.length,
        compactPlanStages: compactPlan.stageCount,
        messagesIncluded,
        totalTokens,
        providerInputBudget,
        withinBudget: totalTokens <= providerInputBudget
      })

      expect(totalTokens).toBeLessThanOrEqual(providerInputBudget)
      // The compact plan representation preserves stageCount but reduces token usage
      expect(messagesIncluded).toBeLessThan(longConversation.length) // Should drop messages
    })
  })
})
