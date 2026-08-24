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

    try {
      // Use ProviderManager's streaming capability with fallback
      const request: AIRequest = {
        messages: [{ role: 'user', content: prompt }],
        model: undefined, // Let provider manager select
        temperature: 0.7,
        maxTokens: 4000,
        stream: true,
      }

      let fullResponse = ''

      // Use ProviderManager's executeStreamingWithFallback method
      const response = this.providerManager.executeStreamingWithFallback(request)

      for await (const chunk of response) {
        if (chunk.content) {
          fullResponse += chunk.content
        }
      }

      console.log('[Workflow AI Service] Provider succeeded with response length:', fullResponse.length)
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
