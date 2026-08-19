/**
 * OpenAI-Compatible Provider Adapter
 * 
 * Generic adapter for providers that follow the OpenAI API format:
 * - Groq
 * - OpenRouter
 * - OpenAI
 * - Self-hosted OpenAI-compatible servers (Ollama, vLLM, etc.)
 * - Custom OpenAI-compatible endpoints
 */

import { AIProvider, AIRequest, AIResponse, AIStreamEvent, AIProviderHealth, AIProviderType } from '../provider-interface'
import { ProviderConfig } from '../provider-manager-types'

export class OpenAICompatibleAdapter implements AIProvider {
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
    this.type = config.providerType as AIProviderType
    this.priority = config.priority
    this.enabled = config.isActive
    this.config = config
    this.baseUrl = config.baseUrl || this.getDefaultBaseUrl(config.providerType)
    this.apiKey = config.apiKeyEncrypted // Will be decrypted by ProviderManager
  }

  private getDefaultBaseUrl(providerType: string): string {
    const defaults: Record<string, string> = {
      groq: 'https://api.groq.com/openai/v1',
      openrouter: 'https://openrouter.ai/api/v1',
      openai: 'https://api.openai.com/v1',
      openai_compatible: '',
      self_hosted: '',
    }
    return defaults[providerType] || ''
  }

  supportsStreaming(): boolean {
    return this.config.capabilities.includes('streaming')
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    const model = request.model || this.config.currentModel
    if (!model) {
      throw new Error('No model specified')
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
        stream: false,
      }),
      signal: AbortSignal.timeout(this.config.requestTimeout || 120000), // Increased from 30s to 2 minutes
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`API error: ${response.status} - ${error}`)
    }

    const data = await response.json()
    const choice = data.choices?.[0]

    return {
      content: choice?.message?.content || '',
      model: data.model || model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens,
      } : undefined,
      finishReason: choice?.finish_reason,
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
      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          model,
          messages: request.messages,
          temperature: request.temperature ?? 0.7,
          max_tokens: request.maxTokens ?? 4000,
          stream: true,
        }),
        signal: AbortSignal.timeout(this.config.requestTimeout || 120000), // Increased from 30s to 2 minutes
      })

      if (!response.ok) {
        const error = await response.text()
        throw new Error(`API error: ${response.status} - ${error}`)
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
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            console.log('[OpenAI Adapter] Received line:', data)

            try {
              const parsed = JSON.parse(data)
              console.log('[OpenAI Adapter] Parsed:', parsed)
              const delta = parsed.choices?.[0]?.delta
              console.log('[OpenAI Adapter] Delta:', delta)

              if (delta?.content) {
                console.log('[OpenAI Adapter] Yielding delta content:', delta.content)
                yield { type: 'delta', data: { content: delta.content } }
              }

              if (parsed.usage) {
                yield { type: 'usage', data: parsed.usage }
              }

              if (parsed.choices?.[0]?.finish_reason) {
                yield { type: 'finish', data: { finishReason: parsed.choices[0].finish_reason } }
              }
            } catch (e) {
              console.log('[OpenAI Adapter] Parse error:', e)
              // Skip invalid JSON
            }
          }
        }
      }
    } catch (error) {
      yield { type: 'error', data: { error: error instanceof Error ? error.message : 'Unknown error' } }
    }
  }

  async healthCheck(): Promise<AIProviderHealth> {
    const startTime = Date.now()

    try {
      // Try to fetch models as a health check
      const response = await fetch(`${this.baseUrl}/models`, {
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(10000), // 10 second timeout for health check
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
    if (!this.baseUrl) {
      return { valid: false, error: 'Base URL is required' }
    }

    if (this.config.authType !== 'none' && !this.apiKey) {
      return { valid: false, error: 'API key is required for this auth type' }
    }

    if (!this.config.currentModel) {
      return { valid: false, error: 'Current model is required' }
    }

    return { valid: true }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    }

    if (this.config.authType === 'bearer' && this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`
    } else if (this.config.authType === 'api_key' && this.apiKey) {
      headers['Authorization'] = `Key ${this.apiKey}`
    } else if (this.config.authType === 'custom' && this.apiKey) {
      headers['Authorization'] = this.apiKey
    }

    // Add OpenRouter-specific headers
    if (this.type === 'openrouter') {
      headers['HTTP-Referer'] = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
      headers['X-Title'] = 'Autolearn ALEX'
    }

    return headers
  }
}
