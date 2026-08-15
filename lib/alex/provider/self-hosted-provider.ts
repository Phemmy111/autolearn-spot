/**
 * Self-Hosted AI Provider
 * 
 * Provider for self-hosted/open-weight models.
 * Can operate without API key and supports OpenAI-compatible endpoints.
 */

import {
  AIProvider,
  AIProviderType,
  AIRequest,
  AIResponse,
  AIStreamEvent,
  AIProviderHealth,
  MessageRole
} from './provider-interface';

export interface SelfHostedProviderConfig {
  endpoint: string;
  model: string;
  apiKey?: string; // Optional - self-hosted may not require authentication
  timeout?: number;
}

export class SelfHostedProvider implements AIProvider {
  readonly id: string;
  readonly name: string;
  readonly type: AIProviderType = 'self_hosted';
  readonly priority: number;
  readonly enabled: boolean;
  
  private config: SelfHostedProviderConfig;

  constructor(config: SelfHostedProviderConfig & { id?: string; name?: string; priority?: number; enabled?: boolean }) {
    this.id = config.id || 'self-hosted-default';
    this.name = config.name || 'Self-Hosted Provider';
    this.priority = config.priority ?? 1; // Default high priority
    this.enabled = config.enabled ?? true;
    this.config = {
      endpoint: config.endpoint,
      model: config.model,
      apiKey: config.apiKey,
      timeout: config.timeout || 30000,
    };
  }

  supportsStreaming(): boolean {
    return true;
  }

  async generate(request: AIRequest): Promise<AIResponse> {
    try {
      const response = await this.makeRequest(request, false);
      return this.parseResponse(response);
    } catch (error) {
      throw new Error(`Self-hosted provider error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async *stream(request: AIRequest): AsyncIterable<AIStreamEvent> {
    try {
      yield { type: 'start' };

      const response = await this.makeRequest(request, true);
      
      if (!response.body) {
        throw new Error('No response body for streaming');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (line.trim() === '') continue;
          if (line.trim() === 'data: [DONE]') continue;

          if (line.startsWith('data: ')) {
            try {
              const data = JSON.parse(line.slice(6));
              const content = this.extractContent(data);
              
              if (content) {
                yield { type: 'delta', data: { text: content } };
              }
            } catch (e) {
              // Skip invalid JSON
            }
          }
        }
      }

      yield { type: 'finish' };
    } catch (error) {
      yield { 
        type: 'error', 
        data: { error: error instanceof Error ? error.message : 'Unknown error' } 
      };
    }
  }

  async healthCheck(): Promise<AIProviderHealth> {
    const startTime = Date.now();
    
    try {
      // Simple health check - try to reach the endpoint
      const response = await fetch(`${this.config.endpoint}/models`, {
        method: 'GET',
        headers: this.getHeaders(),
        signal: AbortSignal.timeout(5000),
      });

      const latency = Date.now() - startTime;

      if (response.ok) {
        return {
          status: 'healthy',
          lastChecked: new Date(),
          latency,
        };
      } else {
        return {
          status: 'degraded',
          lastChecked: new Date(),
          latency,
          error: `HTTP ${response.status}`,
        };
      }
    } catch (error) {
      return {
        status: 'unavailable',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    if (!this.config.endpoint) {
      return { valid: false, error: 'Endpoint is required' };
    }

    if (!this.config.model) {
      return { valid: false, error: 'Model is required' };
    }

    try {
      new URL(this.config.endpoint);
    } catch {
      return { valid: false, error: 'Invalid endpoint URL' };
    }

    return { valid: true };
  }

  private async makeRequest(request: AIRequest, stream: boolean): Promise<Response> {
    const headers = this.getHeaders();
    
    const body = {
      model: this.config.model,
      messages: request.messages,
      stream,
      ...(request.temperature !== undefined && { temperature: request.temperature }),
      ...(request.maxTokens !== undefined && { max_tokens: request.maxTokens }),
    };

    const response = await fetch(`${this.config.endpoint}/chat/completions`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(this.config.timeout || 30000),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response;
  }

  private parseResponse(response: Response): AIResponse {
    // For non-streaming, we'd need to parse the JSON response
    // This is a simplified implementation
    return {
      content: 'Response from self-hosted provider',
      model: this.config.model,
      usage: {
        promptTokens: 0,
        completionTokens: 0,
        totalTokens: 0,
      },
      finishReason: 'stop',
    };
  }

  private extractContent(data: any): string | null {
    // Handle OpenAI-compatible streaming format
    if (data.choices && data.choices[0] && data.choices[0].delta) {
      return data.choices[0].delta.content || null;
    }
    return null;
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.config.apiKey) {
      headers['Authorization'] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }
}
