/**
 * Web Search Provider Interface - Provider-Agnostic Search Contract
 * 
 * This interface defines the contract that all web search providers must implement.
 * ALEX web research must not depend on any specific search provider implementation.
 */

export type SearchProviderType = 'tavily' | 'serper' | 'brave' | 'bing' | 'google' | 'exa' | 'custom';

export interface SearchResult {
  /**
   * Title of the search result
   */
  title: string;
  
  /**
   * URL of the search result
   */
  url: string;
  
  /**
   * Source/domain of the result
   */
  source: string;
  
  /**
   * Snippet or extracted content from the result
   */
  content: string;
  
  /**
   * Relevance score (0-1)
   */
  relevance?: number;
  
  /**
   * Publication date if available
   */
  publishedDate?: string;
  
  /**
   * Retrieval timestamp
   */
  retrievedAt: Date;
}

export interface SearchQuery {
  /**
   * The search query string
   */
  query: string;
  
  /**
   * Maximum number of results to return
   */
  maxResults?: number;
  
  /**
   * Whether to fetch full page content
   */
  fetchContent?: boolean;
  
  /**
   * Maximum content length per page
   */
  maxContentLength?: number;
}

export interface SearchResponse {
  /**
   * The original query
   */
  query: string;
  
  /**
   * Search results
   */
  results: SearchResult[];
  
  /**
   * Total results available (if provided by search provider)
   */
  totalResults?: number;
  
  /**
   * Search metadata
   */
  metadata?: Record<string, any>;
}

export type SearchProviderHealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'unknown';

export interface SearchProviderHealth {
  status: SearchProviderHealthStatus;
  lastChecked: Date;
  latency?: number;
  error?: string;
}

export interface SearchProviderConfig {
  id: string;
  name: string;
  type: SearchProviderType;
  priority: number;
  enabled: boolean;
  config: Record<string, any>;
}

/**
 * The core Search Provider interface that all providers must implement.
 */
export interface SearchProvider {
  /**
   * Unique identifier for this provider instance
   */
  readonly id: string;
  
  /**
   * Human-readable name for this provider
   */
  readonly name: string;
  
  /**
   * Provider type classification
   */
  readonly type: SearchProviderType;
  
  /**
   * Priority for provider selection (lower = higher priority)
   */
  readonly priority: number;
  
  /**
   * Whether this provider is currently enabled
   */
  readonly enabled: boolean;

  /**
   * Perform a web search
   */
  search(query: SearchQuery): Promise<SearchResponse>;

  /**
   * Perform a health check on this provider
   */
  healthCheck(): Promise<SearchProviderHealth>;

  /**
   * Validate the provider configuration
   */
  validateConfig(): Promise<{ valid: boolean; error?: string }>;
}
