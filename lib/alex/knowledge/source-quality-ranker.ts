/**
 * Phase 5: Knowledge Engine - Source Quality Ranker
 * 
 * Ranks information sources by quality and reliability
 * Prioritizes authoritative sources and current information
 */

export interface SourceQuality {
  score: number
  confidence: number
  reasoning: string
  category: 'official' | 'primary' | 'reputable' | 'community' | 'unverified'
}

export interface SourceMetadata {
  url?: string
  title?: string
  author?: string
  date?: string
  domain?: string
  type?: 'documentation' | 'api' | 'article' | 'blog' | 'forum' | 'unknown'
}

/**
 * Source Quality Ranker
 */
export class SourceQualityRanker {
  private static officialDomains = [
    'docs.',
    'developer.',
    'api.',
    'official',
    'github.com',
    'gitlab.com',
    'stackoverflow.com',
    'mdn.',
    'w3.org',
    'developer.mozilla.org',
  ]

  private static reputableDomains = [
    'medium.com',
    'dev.to',
    'hashnode.com',
    'freeCodeCamp',
    'css-tricks.com',
    'smashingmagazine.com',
  ]

  /**
   * Rank a source by quality
   */
  static rankSource(metadata: SourceMetadata): SourceQuality {
    let score = 0.5 // Base score
    let confidence = 0.5
    const reasons: string[] = []

    // Check domain quality
    if (metadata.domain) {
      const domainScore = this.scoreDomain(metadata.domain)
      score += domainScore.score
      confidence += domainScore.confidence
      reasons.push(domainScore.reasoning)
    }

    // Check source type
    if (metadata.type) {
      const typeScore = this.scoreSourceType(metadata.type)
      score += typeScore.score
      confidence += typeScore.confidence
      reasons.push(typeScore.reasoning)
    }

    // Check if it's official documentation
    if (metadata.url && this.isOfficialDocumentation(metadata.url)) {
      score += 0.3
      confidence += 0.2
      reasons.push('Official documentation detected')
    }

    // Check date for freshness
    if (metadata.date) {
      const freshnessScore = this.scoreFreshness(metadata.date)
      score += freshnessScore.score
      confidence += freshnessScore.confidence
      reasons.push(freshnessScore.reasoning)
    }

    // Normalize score
    score = Math.min(Math.max(score, 0), 1)
    confidence = Math.min(Math.max(confidence, 0), 1)

    // Determine category
    const category = this.determineCategory(score, metadata)

    return {
      score,
      confidence,
      reasoning: reasons.join('; '),
      category,
    }
  }

  /**
   * Score a domain
   */
  private static scoreDomain(domain: string): { score: number; confidence: number; reasoning: string } {
    const lowerDomain = domain.toLowerCase()

    // Check for official domains
    for (const officialDomain of this.officialDomains) {
      if (lowerDomain.includes(officialDomain)) {
        return {
          score: 0.3,
          confidence: 0.2,
          reasoning: `Official domain: ${officialDomain}`,
        }
      }
    }

    // Check for reputable domains
    for (const reputableDomain of this.reputableDomains) {
      if (lowerDomain.includes(reputableDomain)) {
        return {
          score: 0.15,
          confidence: 0.1,
          reasoning: `Reputable domain: ${reputableDomain}`,
        }
      }
    }

    return {
      score: 0,
      confidence: 0,
      reasoning: 'Unknown domain quality',
    }
  }

  /**
   * Score source type
   */
  private static scoreSourceType(type: string): { score: number; confidence: number; reasoning: string } {
    switch (type) {
      case 'documentation':
        return { score: 0.25, confidence: 0.15, reasoning: 'Official documentation' }
      case 'api':
        return { score: 0.2, confidence: 0.15, reasoning: 'API documentation' }
      case 'article':
        return { score: 0.1, confidence: 0.1, reasoning: 'Technical article' }
      case 'blog':
        return { score: 0.05, confidence: 0.05, reasoning: 'Blog post' }
      case 'forum':
        return { score: 0.02, confidence: 0.05, reasoning: 'Forum discussion' }
      default:
        return { score: 0, confidence: 0, reasoning: 'Unknown source type' }
    }
  }

  /**
   * Check if URL is official documentation
   */
  private static isOfficialDocumentation(url: string): boolean {
    const lowerUrl = url.toLowerCase()
    const docIndicators = ['/docs/', '/documentation/', '/api/', '/developer/', '/reference/']
    return docIndicators.some(indicator => lowerUrl.includes(indicator))
  }

  /**
   * Score freshness based on date
   */
  private static scoreFreshness(date: string): { score: number; confidence: number; reasoning: string } {
    try {
      const sourceDate = new Date(date)
      const now = new Date()
      const daysOld = (now.getTime() - sourceDate.getTime()) / (1000 * 60 * 60 * 24)

      if (daysOld < 7) {
        return { score: 0.1, confidence: 0.1, reasoning: 'Very recent (< 7 days)' }
      } else if (daysOld < 30) {
        return { score: 0.05, confidence: 0.05, reasoning: 'Recent (< 30 days)' }
      } else if (daysOld < 90) {
        return { score: 0.02, confidence: 0.02, reasoning: 'Moderately recent (< 90 days)' }
      } else if (daysOld < 365) {
        return { score: 0, confidence: 0, reasoning: 'Older than 90 days' }
      } else {
        return { score: -0.05, confidence: 0.05, reasoning: 'Very old (> 1 year)' }
      }
    } catch (error) {
      return { score: 0, confidence: 0, reasoning: 'Could not parse date' }
    }
  }

  /**
   * Determine source category
   */
  private static determineCategory(score: number, metadata: SourceMetadata): 'official' | 'primary' | 'reputable' | 'community' | 'unverified' {
    if (score >= 0.8) return 'official'
    if (score >= 0.6) return 'primary'
    if (score >= 0.4) return 'reputable'
    if (score >= 0.2) return 'community'
    return 'unverified'
  }

  /**
   * Rank multiple sources
   */
  static rankSources(sources: SourceMetadata[]): SourceQuality[] {
    return sources
      .map(source => this.rankSource(source))
      .sort((a, b) => b.score - a.score)
  }

  /**
   * Filter sources by minimum quality
   */
  static filterByQuality(sources: SourceMetadata[], minScore: number = 0.4): SourceMetadata[] {
    return sources.filter(source => {
      const quality = this.rankSource(source)
      return quality.score >= minScore
    })
  }
}
