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
  hasPlatformContext?: boolean; // Whether platform context is available
  hasFileContext?: boolean; // Whether file context is available
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
   * Enhanced detection based on question type + entity + context
   */
  detectResearchIntent(content: string, hasPlatformContext: boolean = false, hasFileContext: boolean = false): ResearchIntent {
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

    // Keywords that indicate research is NOT needed (conceptual explanations)
    const nonResearchKeywords = [
      'explain', 'teach', 'how to', 'tutorial', 'learn',
      'help me understand', 'example', 'analogy',
      'code', 'debug', 'error', 'fix', 'implement',
      'write a', 'create a', 'build a', 'define', 'describe'
    ];

    // Platform context keywords - should use platform context instead of web
    const platformContextKeywords = [
      'my progress', 'my course', 'my lessons', 'my learning',
      'completed', 'enrolled', 'my account', 'my profile',
      'my dashboard', 'my subscription', 'my payment'
    ];

    // File context keywords - should use uploaded files instead of web
    const fileContextKeywords = [
      'this document', 'this file', 'this pdf', 'the uploaded',
      'in the document', 'in the file', 'the attachment',
      'summarize this', 'analyze this'
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

    // Priority 1: Platform context available and question is about platform data
    if (hasPlatformContext) {
      for (const keyword of platformContextKeywords) {
        if (lowerContent.includes(keyword)) {
          return {
            requiresResearch: false,
            confidence: 0.9,
            reason: 'Platform context available for platform-specific question'
          };
        }
      }
    }

    // Priority 2: File context available and question is about the file
    if (hasFileContext) {
      for (const keyword of fileContextKeywords) {
        if (lowerContent.includes(keyword)) {
          // Exception: if explicitly asking to compare with current info or research
          if (lowerContent.includes('compare with current') || 
              lowerContent.includes('verify online') ||
              lowerContent.includes('check online') ||
              lowerContent.includes('current information online') ||
              lowerContent.includes('online information')) {
            return {
              requiresResearch: true,
              confidence: 0.8,
              reason: 'Explicit request to compare file content with current online information',
              suggestedQueries: this.extractSearchQueries(content)
            };
          }
          return {
            requiresResearch: false,
            confidence: 0.85,
            reason: 'File context available for document-specific question'
          };
        }
      }
    }

    // Priority 3: Explicit research request - highest confidence
    if (lowerContent.includes('research') || lowerContent.includes('search') || lowerContent.includes('find')) {
      return {
        requiresResearch: true,
        confidence: 0.95,
        reason: 'Explicit research request detected',
        suggestedQueries: this.extractSearchQueries(content)
      };
    }

    // Priority 4: Current/timely information request
    if (lowerContent.includes('latest') || lowerContent.includes('current') || lowerContent.includes('recent') ||
        lowerContent.includes('news') || lowerContent.includes('breaking') || lowerContent.includes('update')) {
      return {
        requiresResearch: true,
        confidence: 0.9,
        reason: 'Request for current/timely information',
        suggestedQueries: this.extractSearchQueries(content)
      };
    }

    // Priority 5: Entity-based factual questions (who/when about real-world entities)
    const entityPatterns = [
      { pattern: /who (is|was|founded|founds|created|started|leads|led|owns|owned)/i, reason: 'Entity-based person/organization question' },
      { pattern: /when (was|were|did|is)/i, reason: 'Time-based factual question' },
      { pattern: /where (is|was|are|were)/i, reason: 'Location-based factual question' },
      { pattern: /what (is|are) the (current|latest|new)/i, reason: 'Current status question' },
      { pattern: /is (this|that|it) still (operating|active|available|valid)/i, reason: 'Status verification question' },
      { pattern: /compare (this|that|the|autolearn spot|openai|n8n|coursera|github)/i, reason: 'Comparison question' },
      { pattern: /what (do|are) people (say|think) about/i, reason: 'Public opinion question' },
      { pattern: /what are the (latest|recent) developments/i, reason: 'Developments/trends question' }
    ];

    for (const { pattern, reason } of entityPatterns) {
      if (pattern.test(content)) {
        // Check if it's a conceptual question (should not trigger research)
        if (this.isConceptualQuestion(content)) {
          return {
            requiresResearch: false,
            confidence: 0.7,
            reason: 'Conceptual/educational question - does not require web research'
          };
        }
        return {
          requiresResearch: true,
          confidence: 0.75,
          reason: reason,
          suggestedQueries: this.extractSearchQueries(content)
        };
      }
    }

    // Priority 6: Comparison questions
    if (lowerContent.includes('compare') || lowerContent.includes('difference') || lowerContent.includes('versus')) {
      return {
        requiresResearch: true,
        confidence: 0.8,
        reason: 'Comparison request detected',
        suggestedQueries: this.extractSearchQueries(content)
      };
    }

    // Priority 7: Pricing/availability questions
    if (lowerContent.includes('pricing') || lowerContent.includes('cost') || lowerContent.includes('price') ||
        lowerContent.includes('available') || lowerContent.includes('support')) {
      return {
        requiresResearch: true,
        confidence: 0.8,
        reason: 'Pricing/availability question detected',
        suggestedQueries: this.extractSearchQueries(content)
      };
    }

    // Priority 8: Conceptual/educational questions - NO research
    if (this.isConceptualQuestion(content)) {
      return {
        requiresResearch: false,
        confidence: 0.8,
        reason: 'Conceptual/educational question - does not require web research'
      };
    }

    // Priority 9: Keyword-based scoring
    if (researchScore > nonResearchScore) {
      return {
        requiresResearch: true,
        confidence: 0.6,
        reason: 'Research-related keywords detected',
        suggestedQueries: this.extractSearchQueries(content)
      };
    }

    // Default: no research needed
    return {
      requiresResearch: false,
      confidence: 0.8,
      reason: 'Query does not require web research'
    };
  }

  /**
   * Check if a question is conceptual/educational (not factual)
   */
  private isConceptualQuestion(content: string): boolean {
    const lowerContent = content.toLowerCase();
    
    const conceptualPatterns = [
      'explain', 'how does', 'how do', 'how to', 'what is', 'help me understand',
      'teach me', 'learn about', 'tutorial', 'example', 'analogy',
      'define', 'describe', 'how would you', 'how can i',
      'write a', 'create a', 'build a', 'implement', 'debug', 'fix'
    ];

    // Check for conceptual patterns
    for (const pattern of conceptualPatterns) {
      if (lowerContent.includes(pattern)) {
        // But make sure it's not asking about current info
        if (!lowerContent.includes('latest') && !lowerContent.includes('current') && 
            !lowerContent.includes('recent') && !lowerContent.includes('version')) {
          return true;
        }
      }
    }

    return false;
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
    const intent = this.detectResearchIntent(content, opts.hasPlatformContext, opts.hasFileContext);

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