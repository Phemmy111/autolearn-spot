/**
 * Token Budget Manager for ALEX
 *
 * Centralized token budgeting to prevent oversized model requests.
 * Manages context priorities and dynamic truncation.
 */

import { estimateTokens, estimateMessageTokens, getModelContextLimit, getTPMLimit } from '../token-estimation'

export interface ContextSection {
  name: string
  content: string
  priority: number // 0 = never truncate, higher = lower priority
  originalTokens: number
  truncatedTokens: number
  isTruncated: boolean
}

export interface TokenBudgetPlan {
  modelContextLimit: number
  reservedOutputTokens: number
  safetyMargin: number
  availableInputBudget: number
  systemPromptTokens: number
  contextSections: ContextSection[]
  totalEstimatedTokens: number
  fitsInBudget: boolean
  requiredTruncation: boolean
  tpmLimit?: number // TPM limit used for budget calculation
  limitingFactor?: 'context_window' | 'tpm_limit' // Which limit was more restrictive
}

export interface TokenBudgetOptions {
  systemPrompt: string
  platformContext?: string
  memoryContext?: string
  webResearchContext?: string
  ragContext?: string
  fileContext?: string
  conversationHistory?: Array<{ role: string; content: string }>
  toolResults?: string
  modelName?: string
  reservedOutputTokens?: number
  safetyMargin?: number
  tpmLimit?: number // Optional TPM limit override
}

/**
 * Token Budget Manager
 */
export class TokenBudgetManager {
  private static DEFAULT_RESERVED_OUTPUT = 2000
  private static DEFAULT_SAFETY_MARGIN = 0.8 // Use 80% of context limit

  /**
   * Calculate token budget and determine if context fits
   */
  static calculateBudget(options: TokenBudgetOptions): TokenBudgetPlan {
    const {
      systemPrompt,
      platformContext = '',
      memoryContext = '',
      webResearchContext = '',
      ragContext = '',
      fileContext = '',
      conversationHistory = [],
      toolResults = '',
      modelName = 'default',
      reservedOutputTokens = this.DEFAULT_RESERVED_OUTPUT,
      safetyMargin = this.DEFAULT_SAFETY_MARGIN,
      tpmLimit
    } = options

    // Get model context limit
    const modelContextLimit = getModelContextLimit(modelName)
    const effectiveContextLimit = Math.floor(modelContextLimit * safetyMargin)
    const contextWindowBudget = effectiveContextLimit - reservedOutputTokens

    // Get TPM limit (if not provided, use model-specific default)
    const providerTPMLimit = tpmLimit || getTPMLimit(modelName)
    // Use conservative TPM budget: 80% of TPM limit
    const tpmBudget = Math.floor(providerTPMLimit * 0.8)

    // Use the more restrictive limit (context window vs TPM)
    const availableInputBudget = Math.min(contextWindowBudget, tpmBudget)

    console.log('[TokenBudget] Budget calculation:', {
      modelName,
      modelContextLimit,
      safetyMargin,
      effectiveContextLimit,
      providerTPMLimit,
      tpmBudget,
      contextWindowBudget,
      reservedOutputTokens,
      availableInputBudget,
      limitingFactor: contextWindowBudget < tpmBudget ? 'context_window' : 'tpm_limit'
    })

    // Define context sections with priorities
    const contextSections: ContextSection[] = [
      {
        name: 'system_prompt',
        content: systemPrompt,
        priority: 0, // Never truncate
        originalTokens: estimateTokens(systemPrompt),
        truncatedTokens: estimateTokens(systemPrompt),
        isTruncated: false
      },
      {
        name: 'platform_context',
        content: platformContext,
        priority: 1, // Very high priority
        originalTokens: estimateTokens(platformContext),
        truncatedTokens: estimateTokens(platformContext),
        isTruncated: false
      },
      {
        name: 'file_context',
        content: fileContext,
        priority: 2, // High priority
        originalTokens: estimateTokens(fileContext),
        truncatedTokens: estimateTokens(fileContext),
        isTruncated: false
      },
      {
        name: 'memory_context',
        content: memoryContext,
        priority: 3, // High priority
        originalTokens: estimateTokens(memoryContext),
        truncatedTokens: estimateTokens(memoryContext),
        isTruncated: false
      },
      {
        name: 'rag_context',
        content: ragContext,
        priority: 4, // Medium priority
        originalTokens: estimateTokens(ragContext),
        truncatedTokens: estimateTokens(ragContext),
        isTruncated: false
      },
      {
        name: 'web_research_context',
        content: webResearchContext,
        priority: 5, // Medium priority
        originalTokens: estimateTokens(webResearchContext),
        truncatedTokens: estimateTokens(webResearchContext),
        isTruncated: false
      },
      {
        name: 'tool_results',
        content: toolResults,
        priority: 5, // Medium priority (same as web research)
        originalTokens: estimateTokens(toolResults),
        truncatedTokens: estimateTokens(toolResults),
        isTruncated: false
      },
      {
        name: 'conversation_history',
        content: this.formatConversationHistory(conversationHistory),
        priority: 6, // Lower priority
        originalTokens: estimateMessageTokens(conversationHistory),
        truncatedTokens: estimateMessageTokens(conversationHistory),
        isTruncated: false
      }
    ]

    // Calculate total estimated tokens
    const totalEstimatedTokens = contextSections.reduce((sum, section) => sum + section.originalTokens, 0)

    console.log('[TokenBudget] Context breakdown:', {
      totalEstimatedTokens,
      availableInputBudget,
      sections: contextSections.map(s => ({
        name: s.name,
        tokens: s.originalTokens,
        priority: s.priority
      }))
    })

    // Check if fits in budget
    const fitsInBudget = totalEstimatedTokens <= availableInputBudget

    if (fitsInBudget) {
      console.log('[TokenBudget] Context fits in budget - no truncation needed')
      return {
        modelContextLimit,
        reservedOutputTokens,
        safetyMargin,
        availableInputBudget,
        systemPromptTokens: contextSections[0].originalTokens,
        contextSections,
        totalEstimatedTokens,
        fitsInBudget: true,
        requiredTruncation: false,
        tpmLimit: providerTPMLimit,
        limitingFactor: contextWindowBudget < tpmBudget ? 'context_window' : 'tpm_limit'
      }
    }

    // Need to truncate - perform dynamic reduction
    console.log('[TokenBudget] Context exceeds budget - performing truncation')
    return this.truncateContextToBudget(contextSections, availableInputBudget, modelContextLimit, reservedOutputTokens, safetyMargin, tpmLimit, contextWindowBudget, tpmBudget)
  }

  /**
   * Truncate context to fit within budget
   */
  private static truncateContextToBudget(
    sections: ContextSection[],
    budget: number,
    modelContextLimit: number,
    reservedOutputTokens: number,
    safetyMargin: number,
    tpmLimit: number,
    contextWindowBudget: number,
    tpmBudget: number
  ): TokenBudgetPlan {
    // Sort by priority (higher priority = lower number, processed last)
    const sortedSections = [...sections].sort((a, b) => b.priority - a.priority)

    let currentTokens = sections.reduce((sum, s) => sum + s.originalTokens, 0)
    let requiredTruncation = true

    // Truncate lower-priority sections first
    for (const section of sortedSections) {
      if (section.priority === 0) {
        // Never truncate system prompt
        continue
      }

      const sectionTokens = section.truncatedTokens
      const excessTokens = currentTokens - budget

      if (excessTokens <= 0) {
        break
      }

      // Calculate how much to truncate this section
      const canRemove = Math.min(sectionTokens, excessTokens)
      const keepRatio = (sectionTokens - canRemove) / sectionTokens

      if (keepRatio > 0) {
        // Truncate proportionally
        section.truncatedTokens = Math.floor(sectionTokens * keepRatio)
        section.isTruncated = true
        section.content = this.truncateContent(section.content, keepRatio)
      } else {
        // Remove entirely
        section.truncatedTokens = 0
        section.isTruncated = true
        section.content = ''
      }

      currentTokens = sections.reduce((sum, s) => sum + s.truncatedTokens, 0)

      console.log('[TokenBudget] Truncated section:', {
        name: section.name,
        originalTokens: section.originalTokens,
        truncatedTokens: section.truncatedTokens,
        isTruncated: section.isTruncated
      })
    }

    // Recalculate total
    const totalEstimatedTokens = sections.reduce((sum, s) => sum + s.truncatedTokens, 0)
    const fitsInBudget = totalEstimatedTokens <= budget

    console.log('[TokenBudget] Truncation complete:', {
      totalEstimatedTokens,
      budget,
      fitsInBudget,
      truncatedSections: sections.filter(s => s.isTruncated).map(s => s.name)
    })

    return {
      modelContextLimit,
      reservedOutputTokens,
      safetyMargin,
      availableInputBudget: budget,
      systemPromptTokens: sections[0].truncatedTokens,
      contextSections: sections,
      totalEstimatedTokens,
      fitsInBudget,
      requiredTruncation,
      tpmLimit: tpmLimit,
      limitingFactor: contextWindowBudget < tpmBudget ? 'context_window' : 'tpm_limit'
    }
  }

  /**
   * Truncate content to a percentage of original
   */
  private static truncateContent(content: string, keepRatio: number): string {
    if (keepRatio >= 1) return content
    if (keepRatio <= 0) return ''

    const maxLength = Math.floor(content.length * keepRatio)
    return content.substring(0, maxLength) + '... [truncated]'
  }

  /**
   * Format conversation history for token estimation
   */
  private static formatConversationHistory(history: Array<{ role: string; content: string }>): string {
    return history.map(msg => `${msg.role}: ${msg.content}`).join('\n')
  }

  /**
   * Get truncated context from budget plan
   */
  static getTruncatedContext(plan: TokenBudgetPlan): {
    systemPrompt: string
    platformContext: string
    memoryContext: string
    webResearchContext: string
    ragContext: string
    fileContext: string
    conversationHistory: string
    toolResults: string
  } {
    const getSection = (name: string) => plan.contextSections.find(s => s.name === name)?.content || ''

    return {
      systemPrompt: getSection('system_prompt'),
      platformContext: getSection('platform_context'),
      memoryContext: getSection('memory_context'),
      webResearchContext: getSection('web_research_context'),
      ragContext: getSection('rag_context'),
      fileContext: getSection('file_context'),
      conversationHistory: getSection('conversation_history'),
      toolResults: getSection('tool_results')
    }
  }
}
