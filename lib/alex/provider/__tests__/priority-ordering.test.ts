/**
 * Priority Ordering Tests
 */

import { ProviderRegistry } from '../provider-registry'
import { AIProvider, AIProviderType } from '../provider-interface'

describe('Priority Ordering', () => {
  it('should select provider with lowest priority number', () => {
    const registry = new ProviderRegistry()

    const provider1: AIProvider = {
      id: 'p1',
      name: 'Provider 1',
      type: 'openai' as AIProviderType,
      priority: 3,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'test', model: 'gpt-4', finishReason: 'stop' }),
      stream: async function* () { yield { type: 'start' } },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    const provider2: AIProvider = {
      id: 'p2',
      name: 'Provider 2',
      type: 'groq' as AIProviderType,
      priority: 1,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'test', model: 'llama3', finishReason: 'stop' }),
      stream: async function* () { yield { type: 'start' } },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    const provider3: AIProvider = {
      id: 'p3',
      name: 'Provider 3',
      type: 'gemini' as AIProviderType,
      priority: 2,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'test', model: 'gemini-pro', finishReason: 'stop' }),
      stream: async function* () { yield { type: 'start' } },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    registry.registerProvider(provider1)
    registry.registerProvider(provider2)
    registry.registerProvider(provider3)

    const active = registry.getActiveProvider()
    expect(active?.id).toBe('p2') // Priority 1 is highest
  })

  it('should sort enabled providers by priority', () => {
    const registry = new ProviderRegistry()

    const providers: AIProvider[] = [
      {
        id: 'p3',
        name: 'Provider 3',
        type: 'openai' as AIProviderType,
        priority: 3,
        enabled: true,
        supportsStreaming: () => true,
        generate: async () => ({ content: 'test', model: 'gpt-4', finishReason: 'stop' }),
        stream: async function* () { yield { type: 'start' } },
        healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
        validateConfig: async () => ({ valid: true }),
      },
      {
        id: 'p1',
        name: 'Provider 1',
        type: 'groq' as AIProviderType,
        priority: 1,
        enabled: true,
        supportsStreaming: () => true,
        generate: async () => ({ content: 'test', model: 'llama3', finishReason: 'stop' }),
        stream: async function* () { yield { type: 'start' } },
        healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
        validateConfig: async () => ({ valid: true }),
      },
      {
        id: 'p2',
        name: 'Provider 2',
        type: 'gemini' as AIProviderType,
        priority: 2,
        enabled: true,
        supportsStreaming: () => true,
        generate: async () => ({ content: 'test', model: 'gemini-pro', finishReason: 'stop' }),
        stream: async function* () { yield { type: 'start' } },
        healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
        validateConfig: async () => ({ valid: true }),
      },
    ]

    providers.forEach(p => registry.registerProvider(p))

    const enabled = registry.getEnabledProviders()
    expect(enabled[0].id).toBe('p1')
    expect(enabled[1].id).toBe('p2')
    expect(enabled[2].id).toBe('p3')
  })

  it('should skip disabled providers in priority ordering', () => {
    const registry = new ProviderRegistry()

    const provider1: AIProvider = {
      id: 'p1',
      name: 'Provider 1',
      type: 'openai' as AIProviderType,
      priority: 1,
      enabled: false, // Disabled
      supportsStreaming: () => true,
      generate: async () => ({ content: 'test', model: 'gpt-4', finishReason: 'stop' }),
      stream: async function* () { yield { type: 'start' } },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    const provider2: AIProvider = {
      id: 'p2',
      name: 'Provider 2',
      type: 'groq' as AIProviderType,
      priority: 2,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'test', model: 'llama3', finishReason: 'stop' }),
      stream: async function* () { yield { type: 'start' } },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    registry.registerProvider(provider1)
    registry.registerProvider(provider2)

    const active = registry.getActiveProvider()
    expect(active?.id).toBe('p2') // Skips disabled p1
  })
})
