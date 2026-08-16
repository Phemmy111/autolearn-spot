/**
 * Provider Factory
 * 
 * Creates the appropriate provider adapter based on provider type.
 */

import { AIProvider } from './provider-interface'
import { ProviderConfig } from './provider-manager-types'
import { OpenAICompatibleAdapter } from './adapters/openai-compatible-adapter'
import { GeminiAdapter } from './adapters/gemini-adapter'

export class ProviderFactory {
  /**
   * Create a provider adapter based on the provider configuration
   */
  static createProvider(config: ProviderConfig): AIProvider {
    switch (config.providerType) {
      case 'gemini':
        return new GeminiAdapter(config)

      case 'groq':
      case 'openrouter':
      case 'openai':
      case 'openai_compatible':
      case 'self_hosted':
        return new OpenAICompatibleAdapter(config)

      default:
        throw new Error(`Unsupported provider type: ${config.providerType}`)
    }
  }

  /**
   * Check if a provider type is supported
   */
  static isSupportedType(type: string): boolean {
    const supportedTypes = ['gemini', 'groq', 'openrouter', 'openai', 'openai_compatible', 'self_hosted']
    return supportedTypes.includes(type)
  }

  /**
   * Get list of supported provider types
   */
  static getSupportedTypes(): string[] {
    return ['gemini', 'groq', 'openrouter', 'openai', 'openai_compatible', 'self_hosted']
  }
}
