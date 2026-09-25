/**
 * Phase 9: Self-Improvement & Feedback
 * 
 * Enables ALEX to learn from user interactions and improve over time
 * Feedback collection, analysis, and adaptive behavior
 */

export interface UserFeedback {
  id: string
  userId: string
  conversationId: string
  messageId: string
  feedbackType: 'thumbs_up' | 'thumbs_down' | 'rating' | 'correction' | 'clarification'
  rating?: number // 1-5 for rating type
  comment?: string
  timestamp: string
  category?: 'accuracy' | 'helpfulness' | 'clarity' | 'relevance' | 'completeness'
}

export interface FeedbackAnalysis {
  totalFeedback: number
  positiveRatio: number
  commonIssues: string[]
  topCategories: { category: string; count: number }[]
  suggestedImprovements: string[]
  trend: 'improving' | 'declining' | 'stable'
}

export interface AdaptiveBehavior {
  adaptationType: 'response_style' | 'domain_emphasis' | 'tool_selection' | 'explanation_depth'
  trigger: string
  action: string
  confidence: number
  lastApplied: string
  effectiveness: number
}

/**
 * Self-Improvement Engine
 */
export class SelfImprovementEngine {
  private static feedbackHistory: Map<string, UserFeedback[]> = new Map()
  private static adaptiveBehaviors: Map<string, AdaptiveBehavior[]> = new Map()

  /**
   * Collect user feedback
   */
  static collectFeedback(feedback: UserFeedback): void {
    const userFeedback = this.feedbackHistory.get(feedback.userId) || []
    userFeedback.push(feedback)
    this.feedbackHistory.set(feedback.userId, userFeedback)

    console.log('[Self-Improvement] Feedback collected:', {
      userId: feedback.userId,
      type: feedback.feedbackType,
      category: feedback.category
    })
  }

  /**
   * Analyze feedback for a user
   */
  static analyzeFeedback(userId: string): FeedbackAnalysis {
    const feedback = this.feedbackHistory.get(userId) || []

    if (feedback.length === 0) {
      return {
        totalFeedback: 0,
        positiveRatio: 0,
        commonIssues: [],
        topCategories: [],
        suggestedImprovements: [],
        trend: 'stable'
      }
    }

    // Calculate positive ratio
    const positiveCount = feedback.filter(f =>
      f.feedbackType === 'thumbs_up' || (f.rating && f.rating >= 4)
    ).length
    const positiveRatio = positiveCount / feedback.length

    // Identify common issues from negative feedback
    const negativeFeedback = feedback.filter(f =>
      f.feedbackType === 'thumbs_down' || (f.rating && f.rating <= 2)
    )
    const commonIssues = this.extractCommonIssues(negativeFeedback)

    // Categorize feedback
    const categoryCounts = new Map<string, number>()
    for (const f of feedback) {
      if (f.category) {
        categoryCounts.set(f.category, (categoryCounts.get(f.category) || 0) + 1)
      }
    }
    const topCategories = Array.from(categoryCounts.entries())
      .map(([category, count]) => ({ category, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5)

    // Generate suggested improvements
    const suggestedImprovements = this.generateImprovements(commonIssues, topCategories)

    // Determine trend
    const trend = this.determineTrend(feedback)

    return {
      totalFeedback: feedback.length,
      positiveRatio,
      commonIssues,
      topCategories,
      suggestedImprovements,
      trend
    }
  }

  /**
   * Extract common issues from negative feedback
   */
  private static extractCommonIssues(negativeFeedback: UserFeedback[]): string[] {
    const issues: string[] = []

    for (const feedback of negativeFeedback) {
      if (feedback.comment) {
        const comment = feedback.comment.toLowerCase()

        // Common issue patterns
        if (comment.includes('confusing') || comment.includes('unclear')) {
          issues.push('Response clarity issues')
        }
        if (comment.includes('wrong') || comment.includes('incorrect') || comment.includes('inaccurate')) {
          issues.push('Accuracy issues')
        }
        if (comment.includes('too long') || comment.includes('verbose')) {
          issues.push('Response too verbose')
        }
        if (comment.includes('too short') || comment.includes('not enough')) {
          issues.push('Response insufficient')
        }
        if (comment.includes('irrelevant') || comment.includes('off topic')) {
          issues.push('Relevance issues')
        }
        if (comment.includes('incomplete') || comment.includes('missing')) {
          issues.push('Completeness issues')
        }
      }
    }

    // Count and return top issues
    const issueCounts = new Map<string, number>()
    for (const issue of issues) {
      issueCounts.set(issue, (issueCounts.get(issue) || 0) + 1)
    }

    return Array.from(issueCounts.entries())
      .filter(([_, count]) => count >= 2)
      .map(([issue]) => issue)
  }

  /**
   * Generate improvement suggestions
   */
  private static generateImprovements(
    commonIssues: string[],
    topCategories: { category: string; count: number }[]
  ): string[] {
    const improvements: string[] = []

    // Issue-based improvements
    if (commonIssues.includes('Response clarity issues')) {
      improvements.push('Improve response clarity with simpler language')
    }
    if (commonIssues.includes('Accuracy issues')) {
      improvements.push('Enhance fact-checking and source verification')
    }
    if (commonIssues.includes('Response too verbose')) {
      improvements.push('Reduce response length, focus on key points')
    }
    if (commonIssues.includes('Response insufficient')) {
      improvements.push('Provide more detailed explanations')
    }
    if (commonIssues.includes('Relevance issues')) {
      improvements.push('Improve context understanding and relevance')
    }
    if (commonIssues.includes('Completeness issues')) {
      improvements.push('Ensure responses address all aspects of the question')
    }

    // Category-based improvements
    const topCategory = topCategories[0]?.category
    if (topCategory === 'accuracy') {
      improvements.push('Prioritize accuracy over speed in responses')
    }
    if (topCategory === 'helpfulness') {
      improvements.push('Focus on actionable, practical advice')
    }
    if (topCategory === 'clarity') {
      improvements.push('Use clearer language and structure')
    }
    if (topCategory === 'relevance') {
      improvements.push('Better align responses with user intent')
    }
    if (topCategory === 'completeness') {
      improvements.push('Provide more comprehensive answers')
    }

    return improvements.slice(0, 5)
  }

  /**
   * Determine feedback trend
   */
  private static determineTrend(feedback: UserFeedback[]): 'improving' | 'declining' | 'stable' {
    if (feedback.length < 5) return 'stable'

    // Split feedback into recent and older
    const midPoint = Math.floor(feedback.length / 2)
    const recentFeedback = feedback.slice(midPoint)
    const olderFeedback = feedback.slice(0, midPoint)

    const recentPositive = recentFeedback.filter(f =>
      f.feedbackType === 'thumbs_up' || (f.rating && f.rating >= 4)
    ).length / recentFeedback.length

    const olderPositive = olderFeedback.filter(f =>
      f.feedbackType === 'thumbs_up' || (f.rating && f.rating >= 4)
    ).length / olderFeedback.length

    const diff = recentPositive - olderPositive

    if (diff > 0.1) return 'improving'
    if (diff < -0.1) return 'declining'
    return 'stable'
  }

  /**
   * Generate adaptive behavior based on feedback
   */
  static generateAdaptiveBehaviors(userId: string): AdaptiveBehavior[] {
    const analysis = this.analyzeFeedback(userId)
    const behaviors: AdaptiveBehavior[] = []

    // Response style adaptation
    if (analysis.commonIssues.includes('Response too verbose')) {
      behaviors.push({
        adaptationType: 'response_style',
        trigger: 'Complex question detected',
        action: 'Use concise, bullet-point responses',
        confidence: 0.7,
        lastApplied: new Date().toISOString(),
        effectiveness: 0
      })
    }

    if (analysis.commonIssues.includes('Response insufficient')) {
      behaviors.push({
        adaptationType: 'response_style',
        trigger: 'Question requiring detail',
        action: 'Provide comprehensive explanations with examples',
        confidence: 0.7,
        lastApplied: new Date().toISOString(),
        effectiveness: 0
      })
    }

    // Domain emphasis adaptation
    const topCategory = analysis.topCategories[0]?.category
    if (topCategory === 'accuracy') {
      behaviors.push({
        adaptationType: 'domain_emphasis',
        trigger: 'Factual question',
        action: 'Prioritize accuracy with source citations',
        confidence: 0.8,
        lastApplied: new Date().toISOString(),
        effectiveness: 0
      })
    }

    // Explanation depth adaptation
    if (analysis.commonIssues.includes('Response clarity issues')) {
      behaviors.push({
        adaptationType: 'explanation_depth',
        trigger: 'Technical explanation',
        action: 'Use analogies and step-by-step breakdowns',
        confidence: 0.6,
        lastApplied: new Date().toISOString(),
        effectiveness: 0
      })
    }

    this.adaptiveBehaviors.set(userId, behaviors)
    return behaviors
  }

  /**
   * Apply adaptive behavior to system prompt
   */
  static applyAdaptiveBehavior(
    systemPrompt: string,
    userId: string,
    currentContext?: string
  ): string {
    const behaviors = this.adaptiveBehaviors.get(userId) || []

    if (behaviors.length === 0) return systemPrompt

    let adaptedPrompt = systemPrompt

    for (const behavior of behaviors) {
      if (behavior.effectiveness < 0.5) continue // Skip ineffective behaviors

      switch (behavior.adaptationType) {
        case 'response_style':
          adaptedPrompt += `\n\nADAPTIVE BEHAVIOR: ${behavior.action}`
          break

        case 'domain_emphasis':
          adaptedPrompt += `\n\nADAPTIVE BEHAVIOR: ${behavior.action}`
          break

        case 'explanation_depth':
          adaptedPrompt += `\n\nADAPTIVE BEHAVIOR: ${behavior.action}`
          break

        case 'tool_selection':
          adaptedPrompt += `\n\nADAPTIVE BEHAVIOR: ${behavior.action}`
          break
      }
    }

    return adaptedPrompt
  }

  /**
   * Track behavior effectiveness
   */
  static trackBehaviorEffectiveness(
    userId: string,
    behaviorId: string,
    feedback: UserFeedback
  ): void {
    const behaviors = this.adaptiveBehaviors.get(userId) || []
    const behavior = behaviors.find(b => b.id === behaviorId)

    if (behavior) {
      // Update effectiveness based on feedback
      const isPositive = feedback.feedbackType === 'thumbs_up' || (feedback.rating && feedback.rating >= 4)
      const adjustment = isPositive ? 0.1 : -0.1
      behavior.effectiveness = Math.max(0, Math.min(1, behavior.effectiveness + adjustment))
      behavior.lastApplied = feedback.timestamp

      this.adaptiveBehaviors.set(userId, behaviors)
    }
  }

  /**
   * Get feedback summary for user
   */
  static getFeedbackSummary(userId: string): {
    totalFeedback: number
    averageRating: number
    positiveRatio: number
    recentFeedback: UserFeedback[]
  } {
    const feedback = this.feedbackHistory.get(userId) || []

    const ratings = feedback
      .filter(f => f.rating !== undefined)
      .map(f => f.rating!)

    const averageRating = ratings.length > 0
      ? ratings.reduce((sum, r) => sum + r, 0) / ratings.length
      : 0

    const positiveCount = feedback.filter(f =>
      f.feedbackType === 'thumbs_up' || (f.rating && f.rating >= 4)
    ).length

    const positiveRatio = feedback.length > 0 ? positiveCount / feedback.length : 0

    const recentFeedback = feedback.slice(-10)

    return {
      totalFeedback: feedback.length,
      averageRating,
      positiveRatio,
      recentFeedback
    }
  }

  /**
   * Clear feedback history for user (privacy)
   */
  static clearFeedbackHistory(userId: string): void {
    this.feedbackHistory.delete(userId)
    this.adaptiveBehaviors.delete(userId)
    console.log('[Self-Improvement] Feedback history cleared for user:', userId)
  }
}
