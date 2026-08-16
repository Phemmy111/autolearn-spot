/**
 * Request-Local Provider Isolation Tests
 */

import { ProviderRegistry } from '../provider-registry'
import { AIProvider, AIProviderType } from '../provider-interface'

describe('Request-Local Provider Isolation', () => {
  it('should create independent provider registries per request', () => {
    const registry1 = new ProviderRegistry()
    const registry2 = new ProviderRegistry()

    // Mock provider
    const mockProvider1: AIProvider = {
      id: 'provider-1',
      name: 'Provider 1',
      type: 'openai' as AIProviderType,
      priority: 1,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'test', model: 'gpt-4', finishReason: 'stop' }),
      stream: async function* () { yield { type: 'start' } },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    const mockProvider2: AIProvider = {
      id: 'provider-2',
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

    registry1.registerProvider(mockProvider1)
    registry2.registerProvider(mockProvider2)

    // Each registry should have only its own provider
    expect(registry1.getAllProviders()).toHaveLength(1)
    expect(registry2.getAllProviders()).toHaveLength(1)
    expect(registry1.getProvider('provider-1')).toBeDefined()
    expect(registry1.getProvider('provider-2')).toBeUndefined()
    expect(registry2.getProvider('provider-2')).toBeDefined()
    expect(registry2.getProvider('provider-1')).toBeUndefined()
  })

  it('should not share state between concurrent requests', () => {
    const registry1 = new ProviderRegistry()
    const registry2 = new ProviderRegistry()

    const mockProvider: AIProvider = {
      id: 'shared-provider',
      name: 'Shared Provider',
      type: 'openai' as AIProviderType,
      priority: 1,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'test', model: 'gpt-4', finishReason: 'stop' }),
      stream: async function* () { yield { type: 'start' } },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    registry1.registerProvider(mockProvider)

    // Simulate request 1 clearing registry
    registry1.clear()

    // Request 2 should not be affected
    expect(registry2.getAllProviders()).toHaveLength(0)
    expect(registry1.getAllProviders()).toHaveLength(0)
  })

  it('should maintain independent priority ordering per request', () => {
    const registry1 = new ProviderRegistry()
    const registry2 = new ProviderRegistry()

    const provider1: AIProvider = {
      id: 'p1',
      name: 'P1',
      type: 'openai' as AIProviderType,
      priority: 2,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'test', model: 'gpt-4', finishReason: 'stop' }),
      stream: async function* () { yield { type: 'start' } },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    const provider2: AIProvider = {
      id: 'p2',
      name: 'P2',
      type: 'groq' as AIProviderType,
      priority: 1,
      enabled: true,
      supportsStreaming: () => true,
      generate: async () => ({ content: 'test', model: 'llama3', finishReason: 'stop' }),
      stream: async function* () { yield { type: 'start' } },
      healthCheck: async () => ({ status: 'healthy', lastChecked: new Date() }),
      validateConfig: async () => ({ valid: true }),
    }

    registry1.registerProvider(provider1)
    registry1.registerProvider(provider2)

    registry2.registerProvider(provider1)
    registry2.registerProvider(provider2)

    // Both should have same priority ordering
    const active1 = registry1.getActiveProvider()
    const active2 = registry2.getActiveProvider()

    expect(active1?.id).toBe('p2') // Lower priority = higher precedence
    expect(active2?.id).toBe('p2')
  })
})
