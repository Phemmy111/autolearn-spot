/**
 * Streaming Fallback Tests
 */

import { ProviderRegistry } from '../provider-registry'
import { ProviderManager } from '../provider-manager'
import { AIProvider, AIProviderType } from '../provider-interface'

describe('Streaming Fallback', () => {
  it('should fallback to next provider before any content emitted', async () => {
    const registry = new ProviderRegistry()
    const providerManager = new ProviderManager(registry)

    // Mock failing provider
    const failingProvider: AIProvider = {
      id: 'failing-provider',
      name: 'Failing Provider',
      type: 'openai' as AIProviderType,
      priority: 1,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => { throw new Error('Connection timeout') },
      stream: async function* () { throw new Error('Connection timeout') },
      healthCheck: async () => ({ status: 'unavailable', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    // Mock successful provider
    const successProvider: AIProvider = {
      id: 'success-provider',
      name: 'Success Provider',
      type: 'groq' as AIProviderType,
      priority: 2,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'success', model: 'llama3', finishReason: 'stop' }),
      stream: async function* () {
        yield { type: 'start' }
        yield { type: 'delta', data: { text: 'success' } }
        yield { type: 'finish', data: { usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } }
      },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    registry.registerProvider(failingProvider)
    registry.registerProvider(successProvider)

    const events: any[] = []
    for await (const event of providerManager.executeStreamingWithFallback({
      messages: [{ role: 'user', content: 'test' }],
      model: 'test',
      stream: true,
    })) {
      events.push(event)
    }

    // Should have events from successful provider
    expect(events.length).toBeGreaterThan(0)
    expect(events.some(e => e.type === 'delta')).toBe(true)
  })

  it('should not fallback after content emitted', async () => {
    const registry = new ProviderRegistry()
    const providerManager = new ProviderManager(registry)

    // Mock provider that emits content then fails
    const partialProvider: AIProvider = {
      id: 'partial-provider',
      name: 'Partial Provider',
      type: 'openai' as AIProviderType,
      priority: 1,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'partial', model: 'gpt-4', finishReason: 'stop' }),
      stream: async function* () {
        yield { type: 'start' }
        yield { type: 'delta', data: { text: 'partial' } }
        throw new Error('Stream interrupted')
      },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    registry.registerProvider(partialProvider)

    const events: any[] = []
    let hadError = false
    try {
      for await (const event of providerManager.executeStreamingWithFallback({
        messages: [{ role: 'user', content: 'test' }],
        model: 'test',
        stream: true,
      })) {
        events.push(event)
      }
    } catch (error) {
      hadError = true
    }

    // Should have emitted content before error
    expect(events.some(e => e.type === 'delta')).toBe(true)
    expect(hadError).toBe(true)
  })

  it('should handle timeout errors as retryable', async () => {
    const registry = new ProviderRegistry()
    const providerManager = new ProviderManager(registry)

    const timeoutProvider: AIProvider = {
      id: 'timeout-provider',
      name: 'Timeout Provider',
      type: 'openai' as AIProviderType,
      priority: 1,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => { throw new Error('Request timeout') },
      stream: async function* () { throw new Error('Request timeout') },
      healthCheck: async () => ({ status: 'unavailable', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    const backupProvider: AIProvider = {
      id: 'backup-provider',
      name: 'Backup Provider',
      type: 'groq' as AIProviderType,
      priority: 2,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'backup', model: 'llama3', finishReason: 'stop' }),
      stream: async function* () {
        yield { type: 'start' }
        yield { type: 'delta', data: { text: 'backup' } }
        yield { type: 'finish', data: { usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 } } }
      },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    registry.registerProvider(timeoutProvider)
    registry.registerProvider(backupProvider)

    const events: any[] = []
    for await (const event of providerManager.executeStreamingWithFallback({
      messages: [{ role: 'user', content: 'test' }],
      model: 'test',
      stream: true,
    })) {
      events.push(event)
    }

    // Should have fallen back to backup provider
    expect(events.some(e => e.type === 'delta')).toBe(true)
  })
})
