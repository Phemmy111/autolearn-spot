/**
 * Phase 5: Knowledge Engine - Contextual Retrieval
 * 
 * Enhances retrieval with context-aware chunk selection
 * Improves relevance by considering conversation context and task type
 */

import { RetrievedChunk, RetrievalOptions } from '../retrieval'

export interface ContextualRetrievalOptions extends RetrievalOptions {
  taskType?: string
  conversationContext?: string
  recentQueries?: string[]
}

export interface ContextualChunk extends RetrievedChunk {
  contextualScore: number
  relevanceReason: string
}

/**
 * Contextual Retrieval Enhancer
 */
export class ContextualRetrieval {
  /**
   * Enhance retrieval results with contextual scoring
   */
  static enhanceRetrieval(
    chunks: RetrievedChunk[],
    options: ContextualRetrievalOptions
  ): ContextualChunk[] {
    const contextualChunks = chunks.map(chunk => ({
      ...chunk,
      contextualScore: this.calculateContextualScore(chunk, options),
      relevanceReason: this.generateRelevanceReason(chunk, options),
    }))

    // Sort by contextual score
    return contextualChunks.sort((a, b) => b.contextualScore - a.contextualScore)
  }

  /**
   * Calculate contextual score for a chunk
   */
  private static calculateContextualScore(
    chunk: RetrievedChunk,
    options: ContextualRetrievalOptions
  ): number {
    let score = chunk.similarity // Base score from semantic similarity

    // Boost score if chunk matches task type keywords
    if (options.taskType) {
      const taskBoost = this.getTaskTypeBoost(chunk.content, options.taskType)
      score += taskBoost
    }

    // Boost score if chunk is from recent conversation
    if (options.conversationId && chunk.conversationId === options.conversationId) {
      score += 0.1
    }

    // Boost score if chunk matches recent query patterns
    if (options.recentQueries && options.recentQueries.length > 0) {
      const queryBoost = this.getQueryPatternBoost(chunk.content, options.recentQueries)
      score += queryBoost
    }

    return Math.min(score, 1)
  }

  /**
   * Get task type-specific boost
   */
  private static getTaskTypeBoost(content: string, taskType: string): number {
    const taskKeywords: Record<string, string[]> = {
      coding: ['function', 'class', 'const', 'let', 'import', 'export', 'async', 'await'],
      research: ['study', 'analysis', 'found', 'research', 'according to', 'source'],
      writing: ['paragraph', 'section', 'chapter', 'introduction', 'conclusion'],
      data_analysis: ['data', 'analysis', 'chart', 'graph', 'statistics', 'numbers'],
    }

    const keywords = taskKeywords[taskType] || []
    const lowerContent = content.toLowerCase()

    const matchCount = keywords.filter(keyword => lowerContent.includes(keyword)).length
    return matchCount * 0.02 // Small boost per matching keyword
  }

  /**
   * Get query pattern boost
   */
  private static getQueryPatternBoost(content: string, recentQueries: string[]): number {
    const lowerContent = content.toLowerCase()
    let boost = 0

    for (const query of recentQueries) {
      const lowerQuery = query.toLowerCase()
      const queryWords = lowerQuery.split(/\s+/).filter(w => w.length > 3)

      for (const word of queryWords) {
        if (lowerContent.includes(word)) {
          boost += 0.01
        }
      }
    }

    return Math.min(boost, 0.1)
  }

  /**
   * Generate relevance reason
   */
  private static generateRelevanceReason(
    chunk: RetrievedChunk,
    options: ContextualRetrievalOptions
  ): string {
    const reasons: string[] = []

    reasons.push(`Semantic similarity: ${chunk.similarity.toFixed(2)}`)

    if (options.conversationId && chunk.conversationId === options.conversationId) {
      reasons.push('From current conversation')
    }

    if (options.taskType) {
      reasons.push(`Task-relevant: ${options.taskType}`)
    }

    return reasons.join(', ')
  }

  /**
   * Apply context-aware deduplication
   */
  static deduplicateByContext(chunks: ContextualChunk[]): ContextualChunk[] {
    const seen = new Set<string>()
    const deduplicated: ContextualChunk[] = []

    for (const chunk of chunks) {
      const signature = this.createChunkSignature(chunk)
      if (!seen.has(signature)) {
        seen.add(signature)
        deduplicated.push(chunk)
      }
    }

    return deduplicated
  }

  /**
   * Create signature for deduplication
   */
  private static createChunkSignature(chunk: ContextualChunk): string {
    // Create a simple signature based on content hash and file
    const contentHash = chunk.content.substring(0, 100).replace(/\s+/g, '')
    return `${chunk.fileId}-${contentHash}`
  }

  /**
   * Apply relevance filtering
   */
  static filterByRelevance(chunks: ContextualChunk[], minScore: number = 0.5): ContextualChunk[] {
    return chunks.filter(chunk => chunk.contextualScore >= minScore)
  }
}
