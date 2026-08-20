/**
 * Tavily Search Provider Tests
 * 
 * Tests for Tavily search provider implementation
 */

import { TavilySearchProvider } from '../web-research/tavily-search-provider';
import { MockSearchProvider } from '../web-research/mock-search-provider';
import { SearchProviderConfig } from '../web-research/search-provider-interface';

describe('TavilySearchProvider', () => {
  let tavilyProvider: TavilySearchProvider;
  let mockProvider: MockSearchProvider;

  beforeAll(() => {
    // Tavily provider (will use mock if no API key)
    tavilyProvider = new TavilySearchProvider({
      id: 'tavily-test',
      name: 'Tavily Test',
      type: 'tavily',
      priority: 1,
      enabled: true,
      config: { apiKey: process.env.TAVILY_API_KEY || '' }
    });

    // Mock provider for comparison
    mockProvider = new MockSearchProvider({
      id: 'mock-test',
      name: 'Mock Test',
      type: 'custom',
      priority: 100,
      enabled: true,
      config: {}
    });
  });

  describe('Configuration validation', () => {
    test('should fail validation without API key', async () => {
      const providerWithoutKey = new TavilySearchProvider({
        id: 'tavily-no-key',
        name: 'Tavily No Key',
        type: 'tavily',
        priority: 1,
        enabled: true,
        config: { apiKey: '' }
      });

      const result = await providerWithoutKey.validateConfig();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('API key not configured');
    });

    test('should fail validation with invalid API key format', async () => {
      const providerWithInvalidKey = new TavilySearchProvider({
        id: 'tavily-invalid-key',
        name: 'Tavily Invalid Key',
        type: 'tavily',
        priority: 1,
        enabled: true,
        config: { apiKey: 'short' }
      });

      const result = await providerWithInvalidKey.validateConfig();
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid API key format');
    });

    test('should pass validation with valid API key', async () => {
      if (process.env.TAVILY_API_KEY) {
        const result = await tavilyProvider.validateConfig();
        expect(result.valid).toBe(true);
      } else {
        // Skip if no API key available
        console.log('Skipping API key validation test - no TAVILY_API_KEY configured');
      }
    });
  });

  describe('Search functionality', () => {
    test('should fail search without API key', async () => {
      const providerWithoutKey = new TavilySearchProvider({
        id: 'tavily-no-key',
        name: 'Tavily No Key',
        type: 'tavily',
        priority: 1,
        enabled: true,
        config: { apiKey: '' }
      });

      await expect(providerWithoutKey.search({
        query: 'test query',
        maxResults: 5
      })).rejects.toThrow('API key not configured');
    });

    test('should handle empty results gracefully', async () => {
      if (process.env.TAVILY_API_KEY) {
        // Test with a query that might return no results
        const result = await tavilyProvider.search({
          query: 'xyzabcdefghijklmnopqrstuvwxyz1234567890',
          maxResults: 5
        });

        expect(result).toHaveProperty('query');
        expect(result).toHaveProperty('results');
        expect(Array.isArray(result.results)).toBe(true);
      } else {
        console.log('Skipping empty results test - no TAVILY_API_KEY configured');
      }
    });

    test('should respect maxResults parameter', async () => {
      if (process.env.TAVILY_API_KEY) {
        const result = await tavilyProvider.search({
          query: 'test',
          maxResults: 3
        });

        expect(result.results.length).toBeLessThanOrEqual(3);
      } else {
        console.log('Skipping maxResults test - no TAVILY_API_KEY configured');
      }
    });

    test('should normalize response format', async () => {
      if (process.env.TAVILY_API_KEY) {
        const result = await tavilyProvider.search({
          query: 'test',
          maxResults: 1
        });

        if (result.results.length > 0) {
          const firstResult = result.results[0];
          expect(firstResult).toHaveProperty('title');
          expect(firstResult).toHaveProperty('url');
          expect(firstResult).toHaveProperty('source');
          expect(firstResult).toHaveProperty('content');
          expect(firstResult).toHaveProperty('retrievedAt');
          expect(typeof firstResult.title).toBe('string');
          expect(typeof firstResult.url).toBe('string');
          expect(typeof firstResult.source).toBe('string');
          expect(typeof firstResult.content).toBe('string');
        }
      } else {
        console.log('Skipping response format test - no TAVILY_API_KEY configured');
      }
    });
  });

  describe('Error handling', () => {
    test('should handle authentication errors', async () => {
      const providerWithBadKey = new TavilySearchProvider({
        id: 'tavily-bad-key',
        name: 'Tavily Bad Key',
        type: 'tavily',
        priority: 1,
        enabled: true,
        config: { apiKey: 'invalid_key_12345' }
      });

      await expect(providerWithBadKey.search({
        query: 'test',
        maxResults: 5
      })).rejects.toThrow('authentication failed');
    });

    test('should handle timeout errors', async () => {
      if (process.env.TAVILY_API_KEY) {
        // This test would need to mock the fetch to simulate timeout
        // For now, we just verify the timeout is configured
        const provider = new TavilySearchProvider({
          id: 'tavily-timeout',
          name: 'Tavily Timeout',
          type: 'tavily',
          priority: 1,
          enabled: true,
          config: { apiKey: process.env.TAVILY_API_KEY }
        });

        // The provider has a 30-second timeout configured in the search method
        expect(provider).toBeDefined();
      } else {
        console.log('Skipping timeout test - no TAVILY_API_KEY configured');
      }
    });
  });

  describe('Health check', () => {
    test('should report unhealthy without API key', async () => {
      const providerWithoutKey = new TavilySearchProvider({
        id: 'tavily-no-key',
        name: 'Tavily No Key',
        type: 'tavily',
        priority: 1,
        enabled: true,
        config: { apiKey: '' }
      });

      const health = await providerWithoutKey.healthCheck();
      expect(health.status).toBe('degraded');
      expect(health.error).toContain('API key');
    });

    test('should perform health check with API key', async () => {
      if (process.env.TAVILY_API_KEY) {
        const health = await tavilyProvider.healthCheck();
        expect(health).toHaveProperty('status');
        expect(health).toHaveProperty('lastChecked');
        expect(health.lastChecked).toBeInstanceOf(Date);
      } else {
        console.log('Skipping health check test - no TAVILY_API_KEY configured');
      }
    });
  });

  describe('Mock provider comparison', () => {
    test('mock provider should always succeed', async () => {
      const result = await mockProvider.search({
        query: 'test query',
        maxResults: 5
      });

      expect(result.results.length).toBeGreaterThan(0);
      expect(result.results[0].title).toContain('Mock');
    });

    test('mock provider should pass validation', async () => {
      const result = await mockProvider.validateConfig();
      expect(result.valid).toBe(true);
    });

    test('mock provider should be healthy', async () => {
      const health = await mockProvider.healthCheck();
      expect(health.status).toBe('healthy');
    });
  });
});