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
  async generateResponse(
    prompt: string, 
    options?: { personalProvider?: string; personalApiKey?: string; personalModel?: string }
  ): Promise<string> {
    console.log('[Workflow AI Service] Starting AI generation with prompt length:', prompt.length)

    try {
      // Ensure providers are loaded
      await this.providerManager.loadProviders()

      // Add personal provider if specified
      if (options?.personalProvider && options?.personalApiKey) {
        try {
          const providerTypeMap: Record<string, { type: string; baseUrl?: string; defaultModel: string }> = {
            'openai': { type: 'openai', baseUrl: 'https://api.openai.com/v1', defaultModel: 'gpt-4o' },
            'anthropic': { type: 'openai_compatible', baseUrl: 'https://api.anthropic.com/v1', defaultModel: 'claude-3-5-sonnet-20240620' },
            'gemini': { type: 'gemini', defaultModel: 'gemini-2.0-flash' },
            'groq': { type: 'groq', baseUrl: 'https://api.groq.com/openai/v1', defaultModel: 'llama-3.3-70b-versatile' },
            'openrouter': { type: 'openrouter', baseUrl: 'https://openrouter.ai/api/v1', defaultModel: 'openai/gpt-4o' },
          }
          const mapping = providerTypeMap[options.personalProvider]
          if (mapping) {
            const { ProviderFactory } = await import('../provider/provider-factory')
            const adapter = ProviderFactory.createProvider({
              id: 'personal-provider',
              name: `Personal ${options.personalProvider}`,
              type: mapping.type as any,
              priority: 0,
              enabled: true,
              config: {
                apiKeyEncrypted: options.personalApiKey,
                baseUrl: mapping.baseUrl,
                currentModel: options.personalModel || mapping.defaultModel
              }
            })
            this.providerManager.getRegistry().register(adapter)
            console.log(`[Workflow AI Service] Registered personal provider: ${options.personalProvider} with model ${options.personalModel || mapping.defaultModel}`)
          }
        } catch (e) {
          console.error('[Workflow AI Service] Failed to register personal provider', e)
        }
      }

      // Use ProviderManager's streaming capability with fallback
      const request: AIRequest = {
        messages: [{ role: 'user', content: prompt }],
        model: options?.personalModel || undefined, // Let provider manager select if not passed
        temperature: 0.7,
        maxTokens: 8000,
        stream: true,
      }

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
  async generateJSON<T>(
    prompt: string,
    options?: { personalProvider?: string; personalApiKey?: string; personalModel?: string }
  ): Promise<T> {
    const response = await this.generateResponse(prompt, options)
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]) as T
    }
    throw new Error('Failed to extract JSON from AI response')
  }
}
