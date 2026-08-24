/**
 * Dedicated AI Service for Workflow Generation
 * 
 * This service bypasses AIEngine to avoid circular dependencies
 * when generating workflow-specific content (questions, architecture, blockers).
 * It calls provider implementations directly.
 */

import { OpenRouterProvider } from '../provider/openrouter-provider'
import { GroqProvider } from '../provider/groq-provider'

export class WorkflowAIService {
  private static instance: WorkflowAIService | null = null
  private openRouterProvider: OpenRouterProvider | null = null
  private groqProvider: GroqProvider | null = null

  private constructor() {
    // Initialize providers
    this.openRouterProvider = new OpenRouterProvider()
    this.groqProvider = new GroqProvider()
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
    try {
      // Try Groq first (faster, cheaper)
      if (this.groqProvider) {
        const response = await this.groqProvider.streamChat({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile'
        })

        let fullResponse = ''
        for await (const chunk of response) {
          if (chunk.content) {
            fullResponse += chunk.content
          }
        }
        return fullResponse
      }
    } catch (error) {
      console.error('[Workflow AI Service] Groq provider failed:', error)
    }

    try {
      // Fallback to OpenRouter
      if (this.openRouterProvider) {
        const response = await this.openRouterProvider.streamChat({
          messages: [{ role: 'user', content: prompt }],
          model: 'meta-llama/llama-3.1-8b-instruct:free'
        })

        let fullResponse = ''
        for await (const chunk of response) {
          if (chunk.content) {
            fullResponse += chunk.content
          }
        }
        return fullResponse
      }
    } catch (error) {
      console.error('[Workflow AI Service] OpenRouter provider failed:', error)
    }

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
