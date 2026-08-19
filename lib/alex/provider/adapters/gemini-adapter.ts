/**
 * Google Gemini Provider Adapter
 * 
 * Dedicated adapter for Google's Gemini API, which has a different
 * API format than OpenAI-compatible providers.
 */

import { AIProvider, AIRequest, AIResponse, AIStreamEvent, AIProviderHealth, AIProviderType } from '../provider-interface'
import { ProviderConfig } from '../provider-manager-types'

export class GeminiAdapter implements AIProvider {
  readonly id: string
  readonly name: string
  readonly type: AIProviderType
  readonly priority: number
  readonly enabled: boolean
  private config: ProviderConfig
  private baseUrl: string
  private apiKey: string

  constructor(config: ProviderConfig) {
    this.id = config.id
    this.name = config.displayName
    this.type = 'gemini'
    this.priority = config.priority
    this.enabled = config.isActive
    this.config = config
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
    this.apiKey = config.apiKeyEncrypted // Will be decrypted by ProviderManager
  }

  supportsStreaming(): boolean {
    return this.config.capabilities.includes('streaming')
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const model = request.model || this.config.currentModel
    if (!model) {
      throw new Error('No model specified')
    }

    const requestBody = this.formatRequest(request)
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
      signal: AbortSignal.timeout(this.config.requestTimeout || 120000), // Increased from 30s to 2 minutes
    })

    if (!response.ok) {
      const error = await response.text()
      // Try to parse as JSON for better error classification
      let errorMessage = `API error: ${response.status} - ${error}`
      try {
        const errorJson = JSON.parse(error)
        if (errorJson.error?.message) {
          errorMessage = errorJson.error.message
        } else if (errorJson.message) {
          errorMessage = errorJson.message
        }
      } catch {
        // Keep original error text if not JSON
      }
      throw new Error(errorMessage)
    }

    const data = await response.json()
    const candidate = data.candidates?.[0]

    return {
      content: candidate?.content?.parts?.[0]?.text || '',
      model: data.model || model,
      usage: data.usageMetadata ? {
        promptTokens: data.usageMetadata.promptTokenCount,
        completionTokens: data.usageMetadata.candidatesTokenCount,
        totalTokens: data.usageMetadata.totalTokenCount,
      } : undefined,
      finishReason: candidate?.finishReason,
      providerMetadata: {
        providerId: this.id,
        providerType: this.type,
      },
    }
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamEvent> {
    const model = request.model || this.config.currentModel
    if (!model) {
      throw new Error('No model specified')
    }

    yield { type: 'start', data: { model } }

    try {
      const requestBody = this.formatRequest(request)
      const url = `${this.baseUrl}/models/${model}:streamGenerateContent?key=${this.apiKey}`

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(this.config.requestTimeout || 120000), // Increased from 30s to 2 minutes
      })

      if (!response.ok) {
        const error = await response.text()
        // Try to parse as JSON for better error classification
        let errorMessage = `API error: ${response.status} - ${error}`
        try {
          const errorJson = JSON.parse(error)
          if (errorJson.error?.message) {
            errorMessage = errorJson.error.message
          } else if (errorJson.message) {
            errorMessage = errorJson.message
          }
        } catch {
          // Keep original error text if not JSON
        }
        throw new Error(errorMessage)
      }

      const reader = response.body?.getReader()
      if (!reader) {
        throw new Error('No response body')
      }

      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.trim() && line.startsWith('data:')) {
            const data = line.slice(5).trim()
            try {
              const parsed = JSON.parse(data)
              const candidate = parsed.candidates?.[0]
              const delta = candidate?.content?.parts?.[0]

              if (delta?.text) {
                yield { type: 'delta', data: { content: delta.text } }
              }

              if (parsed.usageMetadata) {
                yield { type: 'usage', data: parsed.usageMetadata }
              }

              if (candidate?.finishReason) {
                yield { type: 'finish', data: { finishReason: candidate.finishReason } }
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      console.log('[Gemini Adapter] Stream error - throwing to trigger fallback:', error instanceof Error ? error.message : 'Unknown error')
      throw error // Throw instead of yielding to trigger fallback logic
    }
  }

  async healthCheck(): Promise<AIProviderHealth> {
    const startTime = Date.now()

    try {
      // Try to list models as a health check
      const url = `${this.baseUrl}/models?key=${this.apiKey}`
      const response = await fetch(url, {
        signal: AbortSignal.timeout(10000),
      })

      const latency = Date.now() - startTime

      if (!response.ok) {
        return {
          status: 'unavailable',
          lastChecked: new Date(),
          latency,
          error: `HTTP ${response.status}`,
        }
      }

      return {
        status: 'healthy',
        lastChecked: new Date(),
        latency,
      }
    } catch (error) {
      return {
        status: 'unavailable',
        lastChecked: new Date(),
        latency: Date.now() - startTime,
        error: error instanceof Error ? error.message : 'Unknown error',
      }
    }
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { valid: false, error: 'API key is required' }
    }

    if (!this.config.currentModel) {
      return { valid: false, error: 'Current model is required' }
    }

    return { valid: true }
  }

  private formatRequest(request: AIRequest): any {
    // Convert OpenAI-style messages to Gemini format
    const contents = request.messages.map(msg => {
      if (msg.role === 'system') {
        return { role: 'user', parts: [{ text: `System: ${msg.content}` }] }
      }
      return {
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }
    })

    return {
      contents,
      generationConfig: {
        temperature: request.temperature ?? 0.7,
        maxOutputTokens: request.maxTokens ?? 4000,
      },
    }
  }
}
