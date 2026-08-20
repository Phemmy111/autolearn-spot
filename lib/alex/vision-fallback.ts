/**
 * Fallback Vision Provider
 * 
 * Provides vision capabilities using OpenAI or Gemini as a dedicated vision provider
 * when the primary AI model doesn't support image analysis.
 */

import { AIRequest, AIResponse, AIProvider } from './provider/provider-interface'

export class FallbackVisionProvider implements AIProvider {
  id: string
  name: string
  type: string
  priority: number
  apiKey: string
  baseUrl: string

  constructor(type: 'openai' | 'gemini') {
    this.id = `fallback-vision-${type}`
    this.name = `Fallback Vision (${type})`
    this.type = type
    this.priority = 100 // High priority for fallback
    this.apiKey = this.getApiKey(type)
    this.baseUrl = this.getBaseUrl(type)
  }

  private getApiKey(type: 'openai' | 'gemini'): string {
    if (type === 'openai') {
      return process.env.OPENAI_API_KEY || ''
    }
    return process.env.GEMINI_API_KEY || ''
  }

  private getBaseUrl(type: 'openai' | 'gemini'): string {
    if (type === 'openai') {
      return process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    }
    return 'https://generativelanguage.googleapis.com/v1beta'
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    if (!this.apiKey) {
      throw new Error(`No API key configured for fallback vision provider (${this.type}). Set ${this.type.toUpperCase()}_API_KEY environment variable.`)
    }

    if (this.type === 'openai') {
      return this.generateWithOpenAI(request)
    } else if (this.type === 'gemini') {
      return this.generateWithGemini(request)
    }

    throw new Error(`Unsupported fallback vision provider type: ${this.type}`)
  }

  private async generateWithOpenAI(request: AIRequest): Promise<AIResponse> {
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o', // Use GPT-4o for vision
        messages: request.messages,
        max_tokens: request.maxTokens || 1000,
        stream: false
      })
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`OpenAI vision API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.choices[0].message.content,
      model: data.model,
      usage: {
        promptTokens: data.usage.prompt_tokens,
        completionTokens: data.usage.completion_tokens,
        totalTokens: data.usage.total_tokens
      }
    }
  }

  private async generateWithGemini(request: AIRequest): Promise<AIResponse> {
    // Convert OpenAI-style messages to Gemini format
    const geminiMessages = this.convertToGeminiFormat(request.messages)

    const response = await fetch(
      `${this.baseUrl}/models/gemini-pro-vision:generateContent?key=${this.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          contents: geminiMessages,
          generationConfig: {
            maxOutputTokens: request.maxTokens || 1000
          }
        })
      }
    )

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`Gemini vision API error: ${response.status} - ${error}`)
    }

    const data = await response.json()

    return {
      content: data.candidates[0].content.parts[0].text,
      model: 'gemini-pro-vision',
      usage: {
        promptTokens: data.usageMetadata?.promptTokenCount || 0,
        completionTokens: data.usageMetadata?.candidatesTokenCount || 0,
        totalTokens: data.usageMetadata?.totalTokenCount || 0
      }
    }
  }

  private convertToGeminiFormat(messages: any[]): any[] {
    // Convert OpenAI-style messages with image_url to Gemini format
    return messages.map(msg => {
      if (Array.isArray(msg.content)) {
        const parts: any[] = []

        msg.content.forEach((item: any) => {
          if (item.type === 'text') {
            parts.push({ text: item.text })
          } else if (item.type === 'image_url') {
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg',
                data: item.image_url.url.replace(/^data:image\/[a-z]+;base64,/, '')
              }
            })
          }
        })

        return { role: 'user', parts }
      }

      return { role: 'user', parts: [{ text: msg.content }] }
    })
  }

  async *stream(request: AIRequest): AsyncGenerator<AIResponse> {
    // Streaming not supported for fallback vision provider
    const response = await this.generate(request)
    yield response
  }
}
