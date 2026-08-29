/**
 * Dedicated AI Service for Workflow Generation
 *
 * This service bypasses AIEngine to avoid circular dependencies
 * when generating workflow-specific content (questions, architecture, blockers).
 * It uses the ProviderManager for credential management and fallback.
 * 
 * Uses NON-STREAMING (generate) by default for reliability, since
 * workflow JSON generation needs complete, parseable responses.
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
   * Register a personal provider if credentials are provided
   */
  private async registerPersonalProvider(
    options?: { personalProvider?: string; personalApiKey?: string; personalModel?: string }
  ): Promise<void> {
    if (!options?.personalProvider || !options?.personalApiKey) return

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

  /**
   * Generate a response using NON-STREAMING first (more reliable for JSON),
   * with streaming as fallback if non-streaming fails.
   */
  async generateResponse(
    prompt: string, 
    options?: { personalProvider?: string; personalApiKey?: string; personalModel?: string }
  ): Promise<string> {
    console.log('[Workflow AI Service] Starting AI generation with prompt length:', prompt.length)

    // Ensure providers are loaded
    await this.providerManager.loadProviders()
    await this.registerPersonalProvider(options)

    const request: AIRequest = {
      messages: [{ role: 'user', content: prompt }],
      model: options?.personalModel || undefined,
      temperature: 0.2, // Low temperature for structured JSON output
      maxTokens: 16000,
      stream: false,
    }

    // ATTEMPT 1: Non-streaming via provider.generate() directly
    // (executeWithFallback discards the AI content, so we call generate() directly)
    try {
      console.log('[Workflow AI Service] Attempting non-streaming generation...')
      const activeProviders = this.providerManager.getRegistry().getEnabledProviders()
      
      for (const provider of activeProviders) {
        try {
          console.log(`[Workflow AI Service] Trying provider: ${provider.name}`)
          const result = await provider.generate(request)
          
          if (result?.content && result.content.length > 0) {
            console.log(`[Workflow AI Service] Non-streaming succeeded via ${provider.name}. Response length:`, result.content.length)
            return result.content
          }
          console.warn(`[Workflow AI Service] Provider ${provider.name} returned empty content, trying next...`)
        } catch (providerError) {
          console.warn(`[Workflow AI Service] Provider ${provider.name} failed:`,
            providerError instanceof Error ? providerError.message : String(providerError))
          // Try next provider
        }
      }
      
      console.warn('[Workflow AI Service] All providers failed non-streaming, falling back to streaming...')
    } catch (nonStreamError) {
      console.warn('[Workflow AI Service] Non-streaming setup failed, falling back to streaming:', 
        nonStreamError instanceof Error ? nonStreamError.message : String(nonStreamError))
    }

    // ATTEMPT 2: Streaming fallback (in case non-streaming is not supported by the provider)
    try {
      console.log('[Workflow AI Service] Attempting streaming generation...')
      const streamRequest: AIRequest = { ...request, stream: true }

      let fullResponse = ''
      let chunkCount = 0
      const response = this.providerManager.executeStreamingWithFallback(streamRequest)

      for await (const chunk of response) {
        chunkCount++
        if (chunk.type === 'delta' && chunk.data?.content) {
          fullResponse += chunk.data.content
        } else if (chunk.type === 'error') {
          console.error('[Workflow AI Service] Stream error chunk:', chunk.data)
          throw new Error(chunk.data?.message || 'Stream error')
        }
      }

      console.log('[Workflow AI Service] Streaming completed. Chunks:', chunkCount, 'Length:', fullResponse.length)

      if (fullResponse.length === 0) {
        throw new Error('Streaming returned empty response')
      }

      return fullResponse
    } catch (streamError) {
      console.error('[Workflow AI Service] Streaming also failed:', 
        streamError instanceof Error ? streamError.message : String(streamError))
      throw streamError
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
