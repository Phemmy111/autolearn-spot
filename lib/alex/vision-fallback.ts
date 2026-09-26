/**
 * Fallback Vision Provider
 * 
 * Provides vision capabilities across OpenAI, Gemini, Groq, and OpenRouter
 * to allow text-only models to effortlessly understand and analyze images.
 */

import { AIRequest, AIResponse, AIProvider } from './provider/provider-interface'

export interface FallbackVisionOptions {
  type?: 'gemini' | 'groq' | 'openai' | 'openrouter'
  apiKey?: string
  baseUrl?: string
  model?: string
}

export class FallbackVisionProvider implements AIProvider {
  id: string
  name: string
  type: string
  priority: number
  apiKey: string
  baseUrl: string
  model: string

  constructor(optionsOrType?: FallbackVisionOptions | 'openai' | 'gemini' | 'groq' | 'openrouter') {
    const opts: FallbackVisionOptions = typeof optionsOrType === 'string' 
      ? { type: optionsOrType } 
      : (optionsOrType || {})

    // Auto-detect provider if not specified
    const resolvedType = opts.type || this.detectAvailableProvider()

    this.id = `fallback-vision-${resolvedType}`
    this.name = `Fallback Vision (${resolvedType})`
    this.type = resolvedType
    this.priority = 100
    this.apiKey = opts.apiKey || this.getApiKey(resolvedType)
    this.baseUrl = opts.baseUrl || this.getBaseUrl(resolvedType)
    this.model = opts.model || this.getDefaultModel(resolvedType)
  }

  private detectAvailableProvider(): 'gemini' | 'groq' | 'openai' | 'openrouter' {
    if (process.env.GEMINI_API_KEY) return 'gemini'
    if (process.env.GROQ_API_KEY || process.env.ALEX_SELF_HOSTED_API_KEY) return 'groq'
    if (process.env.OPENAI_API_KEY) return 'openai'
    if (process.env.OPENROUTER_API_KEY) return 'openrouter'
    return 'gemini' // Default fallback
  }

  private getApiKey(type: string): string {
    switch (type) {
      case 'gemini':
        return process.env.GEMINI_API_KEY || ''
      case 'groq':
        return process.env.GROQ_API_KEY || process.env.ALEX_SELF_HOSTED_API_KEY || ''
      case 'openai':
        return process.env.OPENAI_API_KEY || ''
      case 'openrouter':
        return process.env.OPENROUTER_API_KEY || ''
      default:
        return ''
    }
  }

  private getBaseUrl(type: string): string {
    switch (type) {
      case 'gemini':
        return 'https://generativelanguage.googleapis.com/v1beta'
      case 'groq':
        return 'https://api.groq.com/openai/v1'
      case 'openai':
        return process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
      case 'openrouter':
        return 'https://openrouter.ai/api/v1'
      default:
        return 'https://generativelanguage.googleapis.com/v1beta'
    }
  }

  private getDefaultModel(type: string): string {
    switch (type) {
      case 'gemini':
        return 'gemini-1.5-flash'
      case 'groq':
        return 'llama-3.2-11b-vision-preview'
      case 'openai':
        return 'gpt-4o-mini'
      case 'openrouter':
        return 'google/gemini-flash-1.5'
      default:
        return 'gemini-1.5-flash'
    }
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      // Check if another key is available
      const altType = this.detectAvailableProvider()
      if (altType !== this.type && this.getApiKey(altType)) {
        console.log(`[FallbackVision] Switching to alternative provider ${altType}`)
        this.type = altType
        this.apiKey = this.getApiKey(altType)
        this.baseUrl = this.getBaseUrl(altType)
        this.model = this.getDefaultModel(altType)
      } else {
        throw new Error(`No API key configured for vision provider (${this.type}). Please configure an active provider with vision capability or set GEMINI_API_KEY / GROQ_API_KEY / OPENAI_API_KEY.`)
      }
    }

    if (this.type === 'gemini') {
      return this.generateWithGemini(request)
    }

    // Groq, OpenAI, and OpenRouter use the standard OpenAI-compatible completions API
    return this.generateWithOpenAICompatible(request)
  }

  private async generateWithOpenAICompatible(request: AIRequest): Promise<AIResponse> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.apiKey}`
    }

    if (this.type === 'openrouter') {
      headers['HTTP-Referer'] = 'https://autolearn-spot.vercel.app'
      headers['X-Title'] = 'ALEX Intelligence'
    }

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        model: request.model || this.model,
        messages: request.messages,
        max_tokens: request.maxTokens || 1000,
        temperature: 0.2,
        stream: false
      }),
      signal: AbortSignal.timeout(60000) // 60s timeout
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`${this.type.toUpperCase()} vision API error (${response.status}): ${error}`)
    }

    const data = await response.json()
    const content = data.choices?.[0]?.message?.content || ''

    return {
      content,
      model: data.model || this.model,
      usage: data.usage ? {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      } : undefined
    }
  }

  private async generateWithGemini(request: AIRequest): Promise<AIResponse> {
    const geminiMessages = this.convertToGeminiFormat(request.messages)
    const normalizedModel = this.model.startsWith('models/') ? this.model.replace('models/', '') : this.model

    const response = await fetch(
      `${this.baseUrl}/models/${normalizedModel}:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: request.maxTokens || 1000,
            temperature: 0.2
          }
        }),
        signal: AbortSignal.timeout(60000)
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini vision API error (${response.status}): ${error}`)
    }

    const data = await response.json()
    const content = data.candidates?.[0]?.content?.parts?.[0]?.text || ''

    return {
      content,
      model: normalizedModel,
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      }
    }
  }

  private convertToGeminiFormat(messages: any[]): any[] {
    return messages.map(msg => {
      if (Array.isArray(msg.content)) {
        const parts: any[] = []

        msg.content.forEach((item: any) => {
          if (item.type === 'text') {
            parts.push({ text: item.text })
          } else if (item.type === 'image_url') {
            const rawUrl = item.image_url?.url || ''
            const mimeMatch = rawUrl.match(/^data:(image\/[a-zA-Z0-9+.-]+);base64,/)
            const mimeType = mimeMatch ? mimeMatch[1] : 'image/jpeg'
            const base64Data = rawUrl.replace(/^data:image\/[a-zA-Z0-9+.-]+;base64,/, '')

            parts.push({
              inlineData: {
                mimeType,
                data: base64Data
              }
            })
          }
        })

        return { role: 'user', parts }
      }

      return { role: 'user', parts: [{ text: msg.content || '' }] }
    })
  }

  async *stream(request: AIRequest): AsyncGenerator<AIResponse> {
    const response = await this.generate(request)
    yield response
  }
}
