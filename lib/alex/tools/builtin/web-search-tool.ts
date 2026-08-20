/**
 * Web Search Tool - Integrate with existing Phase 3C web research
 * 
 * This tool provides web search capabilities using the existing Tavily-backed
 * web research infrastructure. It reuses the Phase 3C WebResearchService.
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'
import { WebResearchService } from '../../web-research/web-research-service'

export const webSearchToolDefinition: ToolDefinition = {
  name: 'web_search',
  description: 'Search the web for current information. Returns search results with titles, URLs, and content snippets. Use this for finding up-to-date information, verifying facts, or researching current events.',
  inputSchema: {
    type: 'object',
    required: ['query'],
    properties: {
      query: {
        type: 'string',
        description: 'Search query to execute (e.g., "latest information about OpenAI")',
        minLength: 1,
        maxLength: 500
      },
      maxResults: {
        type: 'number',
        description: 'Maximum number of results to return (default: 5, max: 10)',
        minimum: 1,
        maximum: 10,
        default: 5
      }
    }
  },
  category: 'information',
  permissions: [],
  enabled: true,
  timeoutMs: 30000 // 30 second timeout
}

/**
 * Create web search tool executor with a web research service
 */
export function createWebSearchToolExecutor(webResearchService: WebResearchService): ToolExecutor {
  return {
    name: 'web_search',
    async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
      const { query, maxResults = 5 } = args

      if (!query || typeof query !== 'string') {
        throw new Error('Query is required and must be a string')
      }

      if (maxResults < 1 || maxResults > 10) {
        throw new Error('maxResults must be between 1 and 10')
      }

      try {
        const result = await webResearchService.performResearch(query, {
          maxResults,
          maxQueries: 2,
          maxContentLength: 8000,
          timeout: 25000,
          enableMultiQuery: true
        })

        if (!result.success) {
          throw new Error(result.error || 'Web search failed')
        }

        // Return structured results
        return {
          query,
          results: result.results.map(r => ({
            title: r.title,
            url: r.url,
            source: r.source,
            content: r.content,
            publishedDate: r.publishedDate,
            relevance: r.relevance
          })),
          totalResults: result.totalResults,
          queries: result.queries,
          metadata: result.metadata
        }
      } catch (error) {
        throw new Error(`Web search failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
    }
  }
}
