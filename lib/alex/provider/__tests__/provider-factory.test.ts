/**
 * Provider Factory Tests
 */

import { ProviderFactory } from '../provider-factory'
import { ProviderConfig } from '../provider-manager-types'

describe('ProviderFactory', () => {
  const mockConfig: ProviderConfig = {
    id: 'test-id',
    providerName: 'test-provider',
    displayName: 'Test Provider',
    providerType: 'openai',
    apiKeyEncrypted: 'encrypted-key',
    currentModel: 'gpt-4',
    isActive: true,
    priority: 1,
    healthStatus: 'healthy',
    fallbackEnabled: true,
    capabilities: ['streaming'],
    requestTimeout: 30000,
    modelListMetadata: {},
    authType: 'bearer',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  }

  describe('createProvider', () => {
    it('should create OpenAI-compatible adapter for openai type', () => {
      const config = { ...mockConfig, providerType: 'openai' as any }
      const provider = ProviderFactory.createProvider(config)
      expect(provider).toBeDefined()
      expect(provider.type).toBe('openai')
    })

    it('should create OpenAI-compatible adapter for groq type', () => {
      const config = { ...mockConfig, providerType: 'groq' as any }
      const provider = ProviderFactory.createProvider(config)
      expect(provider).toBeDefined()
      expect(provider.type).toBe('groq')
    })

    it('should create OpenAI-compatible adapter for openrouter type', () => {
      const config = { ...mockConfig, providerType: 'openrouter' as any }
      const provider = ProviderFactory.createProvider(config)
      expect(provider).toBeDefined()
      expect(provider.type).toBe('openrouter')
    })

    it('should create OpenAI-compatible adapter for self_hosted type', () => {
      const config = { ...mockConfig, providerType: 'self_hosted' as any }
      const provider = ProviderFactory.createProvider(config)
      expect(provider).toBeDefined()
      expect(provider.type).toBe('self_hosted')
    })

    it('should create OpenAI-compatible adapter for openai_compatible type', () => {
      const config = { ...mockConfig, providerType: 'openai_compatible' as any }
      const provider = ProviderFactory.createProvider(config)
      expect(provider).toBeDefined()
      expect(provider.type).toBe('openai_compatible')
    })

    it('should create Gemini adapter for gemini type', () => {
      const config = { ...mockConfig, providerType: 'gemini' as any }
      const provider = ProviderFactory.createProvider(config)
      expect(provider).toBeDefined()
      expect(provider.type).toBe('gemini')
    })

    it('should throw error for unsupported provider type', () => {
      const config = { ...mockConfig, providerType: 'unsupported' as any }
      expect(() => ProviderFactory.createProvider(config)).toThrow('Unsupported provider type')
    })
  })

  describe('isSupportedType', () => {
    it('should return true for supported types', () => {
      expect(ProviderFactory.isSupportedType('openai')).toBe(true)
      expect(ProviderFactory.isSupportedType('groq')).toBe(true)
      expect(ProviderFactory.isSupportedType('openrouter')).toBe(true)
      expect(ProviderFactory.isSupportedType('gemini')).toBe(true)
      expect(ProviderFactory.isSupportedType('self_hosted')).toBe(true)
      expect(ProviderFactory.isSupportedType('openai_compatible')).toBe(true)
    })

    it('should return false for unsupported types', () => {
      expect(ProviderFactory.isSupportedType('unsupported')).toBe(false)
      expect(ProviderFactory.isSupportedType('')).toBe(false)
    })
  })

  describe('getSupportedTypes', () => {
    it('should return all supported provider types', () => {
      const types = ProviderFactory.getSupportedTypes()
      expect(types).toContain('openai')
      expect(types).toContain('groq')
      expect(types).toContain('openrouter')
      expect(types).toContain('gemini')
      expect(types).toContain('self_hosted')
      expect(types).toContain('openai_compatible')
      expect(types.length).toBe(6)
    })
  })
})
