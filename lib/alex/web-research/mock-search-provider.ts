/**
 * Mock Search Provider - Placeholder for development/testing
 * 
 * This is a mock provider that returns placeholder results.
 * In production, this should be replaced with a real search provider
 * (Tavily, Serper, Brave, Bing, Google, Exa, etc.)
 */

import {
  SearchProvider,
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchProviderHealth,
  SearchProviderConfig
} from './search-provider-interface';

export class MockSearchProvider implements SearchProvider {
  readonly id: string;
  readonly name: string;
  readonly type = 'custom' as const;
  readonly priority: number;
  readonly enabled: boolean;

  constructor(config: SearchProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.priority = config.priority;
    this.enabled = config.enabled;
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));

    // Return mock results
    const mockResults: SearchResult[] = [
      {
        title: 'Mock Search Result 1',
        url: 'https://example.com/mock1',
        source: 'example.com',
        content: 'This is a mock search result. In production, this would contain actual search results from a real search provider API.',
        relevance: 0.9,
        retrievedAt: new Date()
      },
      {
        title: 'Mock Search Result 2',
        url: 'https://example.com/mock2',
        source: 'example.com',
        content: 'Another mock result. Configure a real search provider (Tavily, Serper, etc.) to get actual web search results.',
        relevance: 0.8,
        retrievedAt: new Date()
      }
    ];

    return {
      query: query.query,
      results: mockResults.slice(0, query.maxResults || 5),
      totalResults: mockResults.length,
      metadata: {
        provider: 'mock',
        note: 'This is a mock provider. Configure a real search provider for production use.'
      }
    };
  }

  async healthCheck(): Promise<SearchProviderHealth> {
    return {
      status: 'healthy',
      lastChecked: new Date(),
      latency: 50
    };
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    return { valid: true };
  }
}