/**
 * Tavily Search Provider - Real Web Search Implementation
 * 
 * Implements the search provider interface using Tavily's Search API
 * Optimized for AI-powered search with source attribution and content extraction
 */

import {
  SearchProvider,
  SearchQuery,
  SearchResponse,
  SearchResult,
  SearchProviderHealth,
  SearchProviderConfig
} from './search-provider-interface';

export class TavilySearchProvider implements SearchProvider {
  readonly id: string;
  readonly name: string;
  readonly type = 'tavily' as const;
  readonly priority: number;
  readonly enabled: boolean;
  private apiKey: string;
  private baseUrl: string = 'https://api.tavily.com/search';

  constructor(config: SearchProviderConfig) {
    this.id = config.id;
    this.name = config.name;
    this.priority = config.priority;
    this.enabled = config.enabled;
    this.apiKey = config.config.apiKey || process.env.TAVILY_API_KEY || '';
  }

  async search(query: SearchQuery): Promise<SearchResponse> {
    if (!this.apiKey) {
      throw new Error('Tavily API key not configured. Set TAVILY_API_KEY environment variable.');
    }

    try {
      const requestBody = {
        api_key: this.apiKey,
        query: query.query,
        max_results: query.maxResults || 10,
        search_depth: query.fetchContent ? 'advanced' : 'basic',
        include_answer: false,
        include_raw_content: query.fetchContent,
        include_images: false,
        include_image_descriptions: false
      };

      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        
        if (response.status === 401 || response.status === 403) {
          throw new Error('Tavily API authentication failed. Check API key.');
        } else if (response.status === 429) {
          throw new Error('Tavily API rate limit exceeded. Please try again later.');
        } else if (response.status >= 500) {
          throw new Error(`Tavily server error: ${response.status} - ${errorText}`);
        } else {
          throw new Error(`Tavily API error: ${response.status} - ${errorText}`);
        }
      }

      const data = await response.json();

      if (!data.results || !Array.isArray(data.results)) {
        throw new Error('Invalid response format from Tavily API');
      }

      // Normalize Tavily results to internal format
      const normalizedResults: SearchResult[] = data.results.map((result: any) => ({
        title: result.title || 'Untitled',
        url: result.url || '',
        source: this.extractDomain(result.url) || 'unknown',
        content: this.extractContent(result, query.maxContentLength),
        relevance: result.score || 0.8,
        publishedDate: result.published_date || undefined,
        retrievedAt: new Date()
      }));

      return {
        query: query.query,
        results: normalizedResults,
        totalResults: data.results.length,
        metadata: {
          provider: 'tavily',
          answer: data.answer,
          queryTime: data.query_execution_time
        }
      };
    } catch (error) {
      if (error instanceof Error) {
        // Re-throw known errors
        if (error.message.includes('authentication') || 
            error.message.includes('rate limit') || 
            error.message.includes('server error')) {
          throw error;
        }
        
        // Wrap other errors
        throw new Error(`Tavily search failed: ${error.message}`);
      }
      throw new Error('Unknown error during Tavily search');
    }
  }

  /**
   * Extract domain from URL for source attribution
   */
  private extractDomain(url: string): string {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return 'unknown';
    }
  }

  /**
   * Extract content from Tavily result with length limit
   */
  private extractContent(result: any, maxLength?: number): string {
    let content = '';
    
    // Prefer content over snippet for more detailed information
    if (result.content) {
      content = result.content;
    } else if (result.snippet) {
      content = result.snippet;
    } else {
      content = 'No content available';
    }

    // Apply length limit if specified
    if (maxLength && content.length > maxLength) {
      content = content.substring(0, maxLength) + '...';
    }

    return content;
  }

  async healthCheck(): Promise<SearchProviderHealth> {
    const startTime = Date.now();
    
    try {
      // Perform a simple search to test connectivity
      await this.search({
        query: 'test',
        maxResults: 1,
        fetchContent: false
      });

      const latency = Date.now() - startTime;
      
      return {
        status: 'healthy',
        lastChecked: new Date(),
        latency
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      // Determine health status based on error type
      let status: SearchProviderHealthStatus = 'unavailable';
      
      if (errorMessage.includes('authentication') || errorMessage.includes('API key')) {
        status = 'degraded'; // Config issue, not service down
      } else if (errorMessage.includes('rate limit')) {
        status = 'degraded'; // Service up but rate limited
      } else if (errorMessage.includes('timeout') || errorMessage.includes('network')) {
        status = 'degraded'; // Network issue
      }
      
      return {
        status,
        lastChecked: new Date(),
        error: errorMessage
      };
    }
  }

  async validateConfig(): Promise<{ valid: boolean; error?: string }> {
    if (!this.apiKey) {
      return { 
        valid: false, 
        error: 'Tavily API key not configured. Set TAVILY_API_KEY environment variable.' 
      };
    }

    if (this.apiKey.length < 10) {
      return { 
        valid: false, 
        error: 'Invalid Tavily API key format.' 
      };
    }

    return { valid: true };
  }
}