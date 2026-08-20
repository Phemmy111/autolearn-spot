/**
 * Web Research Service - Research Intent Detection and Execution
 * 
 * This service handles:
 * - Determining when web research is appropriate
 * - Executing web searches through configured providers
 * - Managing research context and source attribution
 * - Implementing safety limits and error handling
 */

import { SearchProvider, SearchQuery, SearchResult, SearchResponse } from './search-provider-interface';

export interface ResearchIntent {
  requiresResearch: boolean;
  confidence: number;
  reason: string;
  suggestedQueries?: string[];
}

export interface ResearchOptions {
  maxResults?: number;
  maxQueries?: number;
  maxContentLength?: number;
  timeout?: number;
  enableMultiQuery?: boolean;
}

export interface ResearchResult {
  success: boolean;
  queries: string[];
  results: SearchResult[];
  totalResults: number;
  metadata?: Record<string, any>;
  error?: string;
}

/**
 * Web Research Service
 */
export class WebResearchService {
  private searchProvider: SearchProvider | null = null;
  private defaultOptions: ResearchOptions = {
    maxResults: 5,
    maxQueries: 3,
    maxContentLength: 10000,
    timeout: 30000,
    enableMultiQuery: true
  };

  constructor(searchProvider?: SearchProvider) {
    this.searchProvider = searchProvider || null;
  }

  /**
   * Set the search provider
   */
  setSearchProvider(provider: SearchProvider): void {
    this.searchProvider = provider;
  }

  /**
   * Determine if web research is appropriate for the given query
   */
  detectResearchIntent(content: string): ResearchIntent {
    const lowerContent = content.toLowerCase();

    // Keywords that indicate research is needed
    const researchKeywords = [
      'latest', 'current', 'recent', 'up to date', 'now', 'today',
      'news', 'breaking', 'update', 'version', 'release',
      'compare', 'difference between', 'versus', 'vs',
      'find', 'search', 'research', 'look up', 'information about',
      'official documentation', 'sources', 'verify', 'check',
      'pricing', 'cost', 'price', 'available', 'support',
      'what changed', 'new in', 'status of', 'state of'
    ];

    // Keywords that indicate research is NOT needed
    const nonResearchKeywords = [
      'explain', 'teach', 'how to', 'tutorial', 'learn',
      'what is', 'help me understand', 'example', 'analogy',
      'code', 'debug', 'error', 'fix', 'implement'
    ];

    let researchScore = 0;
    let nonResearchScore = 0;

    for (const keyword of researchKeywords) {
      if (lowerContent.includes(keyword)) {
        researchScore += 1;
      }
    }

    for (const keyword of nonResearchKeywords) {
      if (lowerContent.includes(keyword)) {
        nonResearchScore += 1;
      }
    }

    // If explicitly asking for research, high confidence
    if (lowerContent.includes('research') || lowerContent.includes('search') || lowerContent.includes('find')) {
      return {
        requiresResearch: true,
        confidence: 0.9,
        reason: 'Explicit research request detected',
        suggestedQueries: this.extractSearchQueries(content)
      };
    }

    // If asking for current/latest information, high confidence
    if (lowerContent.includes('latest') || lowerContent.includes('current') || lowerContent.includes('recent')) {
      return {
        requiresResearch: true,
        confidence: 0.85,
        reason: 'Request for current/timely information',
        suggestedQueries: this.extractSearchQueries(content)
      };
    }

    // If comparing things, medium confidence
    if (lowerContent.includes('compare') || lowerContent.includes('difference') || lowerContent.includes('versus')) {
      return {
        requiresResearch: true,
        confidence: 0.75,
        reason: 'Comparison request detected',
        suggestedQueries: this.extractSearchQueries(content)
      };
    }

    // If research keywords outweigh non-research keywords
    if (researchScore > nonResearchScore) {
      return {
        requiresResearch: true,
        confidence: 0.6,
        reason: 'Research-related keywords detected',
        suggestedQueries: this.extractSearchQueries(content)
      };
    }

    // Otherwise, no research needed
    return {
      requiresResearch: false,
      confidence: 0.8,
      reason: 'Query does not require web research'
    };
  }

  /**
   * Extract search queries from user content
   */
  private extractSearchQueries(content: string): string[] {
    const queries: string[] = [];
    const lowerContent = content.toLowerCase();

    // Simple extraction - in production, use more sophisticated NLP
    // Remove common words and extract key phrases
    const stopWords = ['the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'shall', 'can', 'need', 'dare', 'ought', 'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from', 'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'between', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very', 'just', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very'];

    let cleanContent = content
      .replace(/[?.,!;:'"()]/g, '')
      .toLowerCase()
      .split(' ')
      .filter(word => !stopWords.includes(word))
      .join(' ');

    // Extract main query
    if (cleanContent.length > 0) {
      queries.push(cleanContent);
    }

    // For comparison queries, extract entities to compare
    if (lowerContent.includes('compare') || lowerContent.includes('versus') || lowerContent.includes('vs')) {
      const parts = content.split(/compare|versus|vs|and/i);
      for (const part of parts) {
        const cleanPart = part.trim().replace(/[?.,!;:'"()]/g, '');
        if (cleanPart.length > 2) {
          queries.push(cleanPart);
        }
      }
    }

    return queries.slice(0, 3); // Max 3 queries
  }

  /**
   * Perform web research
   */
  async performResearch(content: string, options?: ResearchOptions): Promise<ResearchResult> {
    if (!this.searchProvider) {
      return {
        success: false,
        queries: [],
        results: [],
        totalResults: 0,
        error: 'No search provider configured'
      };
    }

    const opts = { ...this.defaultOptions, ...options };
    const intent = this.detectResearchIntent(content);

    if (!intent.requiresResearch) {
      return {
        success: false,
        queries: [],
        results: [],
        totalResults: 0,
        error: 'Research not required for this query'
      };
    }

    const queries = intent.suggestedQueries || [content];
    const limitedQueries = queries.slice(0, opts.maxQueries || 3);
    const allResults: SearchResult[] = [];

    try {
      for (const query of limitedQueries) {
        const searchQuery: SearchQuery = {
          query,
          maxResults: opts.maxResults,
          fetchContent: true,
          maxContentLength: opts.maxContentLength
        };

        const response = await Promise.race([
          this.searchProvider.search(searchQuery),
          new Promise<SearchResponse>((_, reject) => 
            setTimeout(() => reject(new Error('Research timeout')), opts.timeout || 30000)
          )
        ]) as SearchResponse;

        allResults.push(...response.results);
      }

      // Deduplicate results by URL
      const uniqueResults = this.deduplicateResults(allResults);

      // Sort by relevance
      uniqueResults.sort((a, b) => (b.relevance || 0) - (a.relevance || 0));

      // Limit total results
      const limitedResults = uniqueResults.slice(0, opts.maxResults * limitedQueries.length);

      return {
        success: true,
        queries: limitedQueries,
        results: limitedResults,
        totalResults: limitedResults.length,
        metadata: {
          intent: intent.reason,
          confidence: intent.confidence
        }
      };
    } catch (error) {
      console.error('[Web Research Service] Research failed:', error);
      return {
        success: false,
        queries: limitedQueries,
        results: [],
        totalResults: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Deduplicate search results by URL
   */
  private deduplicateResults(results: SearchResult[]): SearchResult[] {
    const seen = new Set<string>();
    return results.filter(result => {
      const url = result.url.toLowerCase();
      if (seen.has(url)) {
        return false;
      }
      seen.add(url);
      return true;
    });
  }

  /**
   * Format research results for context injection
   */
  formatResearchContext(results: ResearchResult): string {
    if (!results.success || results.results.length === 0) {
      return '';
    }

    let context = '=== WEB RESEARCH CONTEXT ===\n\n';

    for (let i = 0; i < results.results.length; i++) {
      const result = results.results[i];
      context += `Source ${i + 1}:\n`;
      context += `Title: ${result.title}\n`;
      context += `URL: ${result.url}\n`;
      context += `Source: ${result.source}\n`;
      
      if (result.publishedDate) {
        context += `Published: ${result.publishedDate}\n`;
      }
      
      context += `Content: ${result.content}\n`;
      
      if (result.relevance) {
        context += `Relevance: ${result.relevance}\n`;
      }
      
      context += '\n';
    }

    context += '=== END WEB RESEARCH CONTEXT ===\n';

    return context;
  }

  /**
   * Extract sources for citation
   */
  extractSources(results: ResearchResult): Array<{ title: string; url: string; source: string }> {
    return results.results.map(result => ({
      title: result.title,
      url: result.url,
      source: result.source
    }));
  }
}