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
        // Disable tool/function calling to prevent unwanted function use
        tool_choice: request.disableTools ? 'none' : undefined,
      }),
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
      console.log('[OpenAI Adapter] HTTP error in generate() - throwing to trigger fallback:', errorMessage)
      throw new Error(errorMessage)
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

    // Tool call accumulation state
    const pendingToolCalls = new Map<number, { id?: string; name?: string; arguments: Record<string, any> }>()

    try {
      const requestBody: any = {
        model,
        messages: request.messages,
        temperature: request.temperature ?? 0.7,
        max_tokens: request.maxTokens ?? 4000,
        stream: true,
      }

      // Add tool definitions if provided and tools not disabled
      if (request.tools && !request.disableTools) {
        requestBody.tools = request.tools.map(tool => ({
          type: 'function',
          function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.inputSchema
          }
        }))
        requestBody.tool_choice = 'auto' // Let model decide when to use tools
      } else if (request.disableTools) {
        requestBody.tool_choice = 'none'
      }

      const response = await fetch(`${this.baseUrl}/chat/completions`, {
        method: 'POST',
        headers: this.getHeaders(),
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
        console.log('[OpenAI Adapter] HTTP error - throwing to trigger fallback:', errorMessage)
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
          if (line.startsWith('data: ')) {
            const data = line.slice(6)
            if (data === '[DONE]') continue

            try {
              const parsed = JSON.parse(data)
              const delta = parsed.choices?.[0]?.delta
              const index = parsed.choices?.[0]?.index ?? 0

              // Handle tool calls
              if (delta?.tool_calls) {
                for (const toolCallDelta of delta.tool_calls) {
                  const callIndex = toolCallDelta.index ?? index
                  if (!pendingToolCalls.has(callIndex)) {
                    pendingToolCalls.set(callIndex, { arguments: {} })
                  }

                  const pending = pendingToolCalls.get(callIndex)!

                  // Accumulate tool call ID
                  if (toolCallDelta.id) {
                    pending.id = toolCallDelta.id
                  }

                  // Accumulate function name
                  if (toolCallDelta.function?.name) {
                    pending.name = toolCallDelta.function.name
                  }

                  // Accumulate arguments (may be fragmented)
                  if (toolCallDelta.function?.arguments) {
                    const argsSoFar = pending.arguments
                    const newArgs = toolCallDelta.function.arguments

                    try {
                      // Try to parse as JSON and merge
                      if (newArgs.startsWith('{')) {
                        const parsedArgs = JSON.parse(newArgs)
                        Object.assign(argsSoFar, parsedArgs)
                      } else {
                        // Fragmented JSON - accumulate and parse at end
                        const currentString = JSON.stringify(argsSoFar) || '{}'
                        const mergedString = currentString.slice(0, -1) + newArgs
                        try {
                          Object.assign(argsSoFar, JSON.parse(mergedString))
                        } catch {
                          // Not yet complete, continue accumulating
                        }
                      }
                    } catch {
                      // Arguments may be incomplete, continue accumulating
                    }
                  }
                }
              }

              // When finish_reason is 'tool_calls', emit accumulated tool calls
              if (parsed.choices?.[0]?.finish_reason === 'tool_calls') {
                for (const [index, toolCall] of pendingToolCalls) {
                  if (toolCall.id && toolCall.name && Object.keys(toolCall.arguments).length > 0) {
                    yield {
                      type: 'tool_call',
                      data: {
                        toolCall: {
                          id: toolCall.id,
                          toolName: toolCall.name,
                          arguments: toolCall.arguments
                        }
                      }
                    }
                  }
                }
                pendingToolCalls.clear()
                yield { type: 'finish', data: { finishReason: 'tool_calls' } }
                continue
              }

              // Normal content delta
              if (delta?.content) {
                yield { type: 'delta', data: { content: delta.content } }
              }

              if (parsed.usage) {
                yield { type: 'usage', data: parsed.usage }
              }

              if (parsed.choices?.[0]?.finish_reason && parsed.choices[0].finish_reason !== 'tool_calls') {
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
      console.log('[OpenAI Adapter] Stream error - throwing to trigger fallback:', error instanceof Error ? error.message : 'Unknown error')
      throw error // Throw instead of yielding to trigger fallback logic
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
