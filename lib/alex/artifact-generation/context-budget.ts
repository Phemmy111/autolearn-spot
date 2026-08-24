/**
 * ALEX Context Budgeting
 * 
 * Phase 3A Runtime Stabilization: Controls AI prompt context size
 * Prevents token limit errors by budgeting context across AI calls
 */

export interface ContextBudget {
  // Budget limits (in approximate tokens)
  maxTotalTokens: number
  maxSystemTokens: number
  maxRequirementsTokens: number
  maxKnownTokens: number
  maxInferredTokens: number
  maxConversationTokens: number
  maxReferenceTokens: number
}

export interface ContextSection {
  name: string
  content: string
  priority: 'critical' | 'high' | 'medium' | 'low'
  estimatedTokens: number
}

export class ContextBudgeter {
  private static readonly DEFAULT_BUDGET: ContextBudget = {
    maxTotalTokens: 6000,  // Stay under 8000 limit with margin
    maxSystemTokens: 500,
    maxRequirementsTokens: 1000,
    maxKnownTokens: 800,
    maxInferredTokens: 500,
    maxConversationTokens: 800,
    maxReferenceTokens: 1000
  }

  /**
   * Estimate token count from text (rough approximation: ~4 chars per token)
   */
  static estimateTokens(text: string): number {
    return Math.ceil(text.length / 4)
  }

  /**
   * Build context string with budgeting
   */
  static buildContext(
    sections: ContextSection[],
    budget: ContextBudget = this.DEFAULT_BUDGET
  ): { context: string; includedSections: string[]; excludedSections: string[] } {
    const includedSections: string[] = []
    const excludedSections: string[] = []
    let currentTokens = 0

    // Sort sections by priority and size
    const sortedSections = [...sections].sort((a, b) => {
      const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority]
      if (priorityDiff !== 0) return priorityDiff
      return a.estimatedTokens - b.estimatedTokens
    })

    let context = ''

    for (const section of sortedSections) {
      const sectionTokens = this.estimateTokens(section.content)
      
      // Check budget limits for this section type
      let sectionLimit = budget.maxTotalTokens - currentTokens
      if (section.name === 'system') sectionLimit = Math.min(sectionLimit, budget.maxSystemTokens)
      if (section.name === 'requirements') sectionLimit = Math.min(sectionLimit, budget.maxRequirementsTokens)
      if (section.name === 'known') sectionLimit = Math.min(sectionLimit, budget.maxKnownTokens)
      if (section.name === 'inferred') sectionLimit = Math.min(sectionLimit, budget.maxInferredTokens)
      if (section.name === 'conversation') sectionLimit = Math.min(sectionLimit, budget.maxConversationTokens)
      if (section.name === 'reference') sectionLimit = Math.min(sectionLimit, budget.maxReferenceTokens)

      if (sectionTokens <= sectionLimit && currentTokens + sectionTokens <= budget.maxTotalTokens) {
        context += `${section.name.toUpperCase()}:\n${section.content}\n\n`
        currentTokens += sectionTokens
        includedSections.push(section.name)
      } else {
        excludedSections.push(section.name)
      }
    }

    return {
      context: context.trim(),
      includedSections,
      excludedSections
    }
  }

  /**
   * Truncate text to fit token budget
   */
  static truncateToBudget(text: string, maxTokens: number): string {
    const estimatedTokens = this.estimateTokens(text)
    if (estimatedTokens <= maxTokens) return text

    const targetLength = maxTokens * 4
    return text.substring(0, targetLength) + '... [truncated]'
  }

  /**
   * Check if context fits budget
   */
  static checkBudgetFit(sections: ContextSection[], budget: ContextBudget = this.DEFAULT_BUDGET): {
    fits: boolean
    totalTokens: number
    sectionsOverBudget: string[]
  } {
    let totalTokens = 0
    const sectionsOverBudget: string[] = []

    for (const section of sections) {
      const sectionTokens = this.estimateTokens(section.content)
      totalTokens += sectionTokens

      let sectionLimit = budget.maxTotalTokens
      if (section.name === 'system') sectionLimit = budget.maxSystemTokens
      if (section.name === 'requirements') sectionLimit = budget.maxRequirementsTokens
      if (section.name === 'known') sectionLimit = budget.maxKnownTokens
      if (section.name === 'inferred') sectionLimit = budget.maxInferredTokens
      if (section.name === 'conversation') sectionLimit = budget.maxConversationTokens
      if (section.name === 'reference') sectionLimit = budget.maxReferenceTokens

      if (sectionTokens > sectionLimit) {
        sectionsOverBudget.push(section.name)
      }
    }

    return {
      fits: totalTokens <= budget.maxTotalTokens && sectionsOverBudget.length === 0,
      totalTokens,
      sectionsOverBudget
    }
  }
}
