/**
 * Dedicated AI Service for Workflow Generation
 *
 * This service bypasses AIEngine to avoid circular dependencies
 * when generating workflow-specific content (questions, architecture, blockers).
 * It uses the OpenAI-compatible adapter directly for Groq and OpenRouter.
 */

import { OpenAICompatibleAdapter } from '../provider/adapters/openai-compatible-adapter'

export class WorkflowAIService {
  private static instance: WorkflowAIService | null = null

  private constructor() {}

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
    console.log('[Workflow AI Service] Groq API key present:', !!process.env.GROQ_API_KEY)
    console.log('[Workflow AI Service] OpenRouter API key present:', !!process.env.OPENROUTER_API_KEY)

    try {
      // Try Groq first (faster, cheaper)
      console.log('[Workflow AI Service] Attempting Groq provider')
      const groqProvider = new OpenAICompatibleAdapter({
        providerType: 'groq',
        apiKey: process.env.GROQ_API_KEY || '',
        baseUrl: 'https://api.groq.com/openai/v1',
        currentModel: 'llama-3.3-70b-versatile',
        isActive: true,
        priority: 1,
        capabilities: ['chat', 'streaming'],
        requestTimeout: 30000,
        modelListMetadata: {},
        providerName: 'Groq',
        displayName: 'Groq',
        id: 'groq-workflow-ai',
        apiKeyEncrypted: '',
        healthStatus: 'unknown',
        fallbackEnabled: false,
        authType: 'api_key',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const response = await groqProvider.streamChat({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile'
      })

      let fullResponse = ''
      for await (const chunk of response) {
        if (chunk.content) {
          fullResponse += chunk.content
        }
      }
      console.log('[Workflow AI Service] Groq provider succeeded with response length:', fullResponse.length)
      return fullResponse
    } catch (error) {
      console.error('[Workflow AI Service] Groq provider failed:', error)
      console.error('[Workflow AI Service] Groq error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }

    try {
      // Fallback to OpenRouter
      console.log('[Workflow AI Service] Attempting OpenRouter provider')
      const openRouterProvider = new OpenAICompatibleAdapter({
        providerType: 'openrouter',
        apiKey: process.env.OPENROUTER_API_KEY || '',
        baseUrl: 'https://openrouter.ai/api/v1',
        currentModel: 'meta-llama/llama-3.1-8b-instruct:free',
        isActive: true,
        priority: 2,
        capabilities: ['chat', 'streaming'],
        requestTimeout: 30000,
        modelListMetadata: {},
        providerName: 'OpenRouter',
        displayName: 'OpenRouter',
        id: 'openrouter-workflow-ai',
        apiKeyEncrypted: '',
        healthStatus: 'unknown',
        fallbackEnabled: false,
        authType: 'api_key',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      })

      const response = await openRouterProvider.streamChat({
        messages: [{ role: 'user', content: prompt }],
        model: 'meta-llama/llama-3.1-8b-instruct:free'
      })

      let fullResponse = ''
      for await (const chunk of response) {
        if (chunk.content) {
          fullResponse += chunk.content
        }
      }
      console.log('[Workflow AI Service] OpenRouter provider succeeded with response length:', fullResponse.length)
      return fullResponse
    } catch (error) {
      console.error('[Workflow AI Service] OpenRouter provider failed:', error)
      console.error('[Workflow AI Service] OpenRouter error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined
      })
    }

    console.error('[Workflow AI Service] All AI providers failed')
    throw new Error('All AI providers failed')
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
