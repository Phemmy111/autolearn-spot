/**
 * ALEX Provider Registry
 * 
 * Manages provider registration, selection, and fallback logic.
 * ALEX communicates with providers through this registry only.
 * 
 * IMPORTANT: This is NOT a singleton. Each request should create
 * its own instance to ensure request-local isolation and concurrency safety.
 */

import { AIProvider, AIProviderType, AIProviderHealth } from './provider-interface';

export class ProviderRegistry {
  private providers: Map<string, AIProvider> = new Map();
  private providerConfigs: Map<string, any> = new Map();

  constructor() {}

  /**
   * Register a provider
   */
  registerProvider(provider: AIProvider): void {
    this.providers.set(provider.id, provider);
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(providerId: string): void {
    this.providers.delete(providerId);
  }

  /**
   * Get a specific provider by ID
   */
  getProvider(providerId: string): AIProvider | undefined {
    return this.providers.get(providerId);
  }

  /**
   * Get all registered providers
   */
  getAllProviders(): AIProvider[] {
    return Array.from(this.providers.values());
  }

  /**
   * Get providers by type
   */
  getProvidersByType(type: AIProviderType): AIProvider[] {
    return this.getAllProviders().filter(p => p.type === type);
  }

  /**
   * Get enabled providers sorted by priority
   */
  getEnabledProviders(): AIProvider[] {
    return this.getAllProviders()
      .filter(p => p.enabled)
      .sort((a, b) => a.priority - b.priority);
  }

  /**
   * Get the active provider (highest priority enabled provider)
   */
  getActiveProvider(): AIProvider | undefined {
    const enabledProviders = this.getEnabledProviders();
    return enabledProviders.length > 0 ? enabledProviders[0] : undefined;
  }

  /**
   * Get provider by type with fallback to next available
   */
  getProviderByTypeWithFallback(
    preferredType: AIProviderType,
    excludeProviderIds: string[] = []
  ): AIProvider | undefined {
    // Try to get enabled provider of preferred type
    const preferredProviders = this.getProvidersByType(preferredType)
      .filter(p => p.enabled && !excludeProviderIds.includes(p.id))
      .sort((a, b) => a.priority - b.priority);

    if (preferredProviders.length > 0) {
      return preferredProviders[0];
    }

    // Fallback to any enabled provider
    const fallbackProviders = this.getEnabledProviders()
      .filter(p => !excludeProviderIds.includes(p.id));

    return fallbackProviders.length > 0 ? fallbackProviders[0] : undefined;
  }

  /**
   * Check health of all providers
   */
  async checkAllProvidersHealth(): Promise<Map<string, AIProviderHealth>> {
    const healthMap = new Map<string, AIProviderHealth>();
    
    for (const provider of this.getAllProviders()) {
      try {
        const health = await provider.healthCheck();
        healthMap.set(provider.id, health);
      } catch (error) {
        healthMap.set(provider.id, {
          status: 'unavailable',
          lastChecked: new Date(),
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    return healthMap;
  }

  /**
   * Get health of a specific provider
   */
  async getProviderHealth(providerId: string): Promise<AIProviderHealth | undefined> {
    const provider = this.getProvider(providerId);
    if (!provider) {
      return undefined;
    }

    try {
      return await provider.healthCheck();
    } catch (error) {
      return {
        status: 'unavailable',
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Clear all registered providers
   */
  clear(): void {
    this.providers.clear();
    this.providerConfigs.clear();
  }
}
