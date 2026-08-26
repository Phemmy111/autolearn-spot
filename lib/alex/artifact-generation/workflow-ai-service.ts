/**
 * Dedicated AI Service for Workflow Generation
 *
 * This service bypasses AIEngine to avoid circular dependencies
 * when generating workflow-specific content (questions, architecture, blockers).
 * It uses the ProviderManager for credential management and fallback.
 */

import { ProviderManager } from '../provider/provider-manager'
import { ProviderRegistry } from '../provider/provider-registry'
import { AIRequest } from '../provider/provider-interface'
import { estimateTokens } from '../token-estimation'

export class WorkflowAIService {
  private static instance: WorkflowAIService | null = null
  private providerManager: ProviderManager

  private constructor() {
    const registry = new ProviderRegistry()
    this.providerManager = new ProviderManager(registry)
  }

  static getInstance(): WorkflowAIService {
    if (!this.instance) {
      this.instance = new WorkflowAIService()
    }
    return this.instance
  }

  /**
   * Generate a simple text response using a provider
   */
  async generateResponse(prompt: string): Promise<string> {
    console.log('[Workflow AI Service] Starting AI generation with prompt length:', prompt.length)
    console.log('[Workflow AI Service] Prompt preview:', prompt.substring(0, 200))

    // FINAL TOKEN SAFETY CHECK - Enforce hard limit before ProviderManager
    const providerInputBudget = 6400 // 80% of 8000 TPM limit
    const estimatedTokens = estimateTokens(prompt)
    
    console.log('[Workflow AI Service] FINAL TOKEN SAFETY CHECK:', {
      promptLength: prompt.length,
      estimatedTokens,
      providerInputBudget,
      withinBudget: estimatedTokens <= providerInputBudget
    })

    if (estimatedTokens > providerInputBudget) {
      console.error('[Workflow AI Service] PROMPT EXCEEDS BUDGET - Truncating to fit')
      const reductionRatio = providerInputBudget / estimatedTokens
      const newLength = Math.floor(prompt.length * reductionRatio)
      prompt = prompt.substring(0, newLength) + '... [truncated to meet TPM limit]'
      
      const retriedTokens = estimateTokens(prompt)
      console.log('[Workflow AI Service] Truncated prompt:', {
        originalLength: prompt.length,
        newLength,
        originalTokens: estimatedTokens,
        retriedTokens,
        providerInputBudget
      })
      
      if (retriedTokens > providerInputBudget) {
        throw new Error(`Prompt cannot be reduced to meet provider TPM limit of ${providerInputBudget}. Original: ${estimatedTokens} tokens, After truncation: ${retriedTokens} tokens.`)
      }
    }

    try {
      // Use ProviderManager's streaming capability with fallback
      const request: AIRequest = {
        messages: [{ role: 'user', content: prompt }],
        model: undefined, // Let provider manager select
        temperature: 0.7,
        maxTokens: 4000,
        stream: true,
      }

      console.log('[Workflow AI Service] Request structure:', {
        messageCount: request.messages.length,
        totalMessageLength: request.messages.reduce((sum, m) => sum + (typeof m.content === 'string' ? m.content.length : 0), 0),
        hasTools: !!request.tools,
        toolCount: request.tools?.length || 0
      })

      let fullResponse = ''
      let chunkCount = 0

      // Use ProviderManager's executeStreamingWithFallback method
      const response = this.providerManager.executeStreamingWithFallback(request)

      for await (const chunk of response) {
        chunkCount++
        console.log('[Workflow AI Service] Chunk received:', chunk.type, chunk.data)

        // Handle different stream event types
        if (chunk.type === 'delta' && chunk.data?.content) {
          fullResponse += chunk.data.content
        } else if (chunk.type === 'finish') {
          console.log('[Workflow AI Service] Stream finished')
        } else if (chunk.type === 'error') {
          console.error('[Workflow AI Service] Stream error:', chunk.data)
          throw new Error(chunk.data?.message || 'Stream error')
        }
      }

      console.log('[Workflow AI Service] Stream completed. Total chunks:', chunkCount, 'Response length:', fullResponse.length)

      if (chunkCount === 0) {
        throw new Error('No chunks received from provider')
      }

      if (fullResponse.length === 0) {
        throw new Error('Provider returned empty response')
      }

      return fullResponse
    } catch (error) {
      console.error('[Workflow AI Service] AI generation failed:', error)
      throw error
    }
  }

  /**
   * Generate JSON response
   */
  async generateJSON<T>(prompt: string): Promise<T> {
    const response = await this.generateResponse(prompt)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    throw new Error('Failed to extract JSON from AI response')
  }
}
