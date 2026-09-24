/**
 * Phase 8: Advanced Memory & Learning
 * 
 * Enhances memory with pattern learning, consolidation, and long-term retention
 */

import { Memory, MemoryType } from '../types'

export interface MemoryPattern {
  id: string
  userId: string
  pattern: string
  category: 'topic' | 'preference' | 'behavior' | 'skill' | 'goal'
  frequency: number
  lastSeen: string
  strength: number // 0-1, increases with frequency
  examples: string[] // Sample memories that match this pattern
}

export interface MemoryConsolidation {
  originalMemories: string[] // IDs of memories being consolidated
  consolidatedMemory: Memory
  consolidationStrategy: 'merge' | 'abstract' | 'summarize'
  timestamp: string
}

export interface LearningInsight {
  type: 'skill_progress' | 'interest_change' | 'behavior_pattern' | 'knowledge_gap'
  description: string
  confidence: number
  evidence: string[]
  actionable: boolean
  suggestedAction?: string
}

/**
 * Advanced Memory Learning Service
 */
export class AdvancedMemoryLearning {
  /**
   * Analyze memories to detect patterns
   */
  static async detectPatterns(memories: Memory[]): Promise<MemoryPattern[]> {
    const patterns: Map<string, MemoryPattern> = new Map()

    // Topic patterns - common subjects
    const topicKeywords = {
      automation: ['n8n', 'workflow', 'automation', 'webhook', 'api'],
      ai: ['llm', 'gpt', 'prompt', 'embedding', 'rag', 'ai'],
      web: ['website', 'html', 'css', 'javascript', 'react', 'next.js'],
      business: ['business', 'startup', 'revenue', 'pricing', 'market'],
      marketing: ['marketing', 'campaign', 'funnel', 'lead', 'conversion'],
      data: ['data', 'analysis', 'statistics', 'chart', 'analytics'],
      education: ['course', 'learn', 'tutorial', 'lesson', 'student'],
    }

    // Analyze each memory
    for (const memory of memories) {
      const content = memory.content.toLowerCase()

      // Detect topic patterns
      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        const matches = keywords.filter(keyword => content.includes(keyword)).length
        if (matches > 0) {
          const patternKey = `topic_${topic}`
          const existing = patterns.get(patternKey)

          if (existing) {
            existing.frequency++
            existing.lastSeen = memory.created_at
            existing.strength = Math.min(existing.strength + 0.1, 1)
            if (existing.examples.length < 5) {
              existing.examples.push(memory.content)
            }
          } else {
            patterns.set(patternKey, {
              id: patternKey,
              userId: memory.user_id,
              pattern: topic,
              category: 'topic',
              frequency: 1,
              lastSeen: memory.created_at,
              strength: 0.3,
              examples: [memory.content]
            })
          }
        }
      }

      // Detect preference patterns (likes/dislikes)
      if (content.includes('prefer') || content.includes('like') || content.includes('love')) {
        const patternKey = 'preference_positive'
        const existing = patterns.get(patternKey)

        if (existing) {
          existing.frequency++
          existing.lastSeen = memory.created_at
          existing.strength = Math.min(existing.strength + 0.1, 1)
        } else {
          patterns.set(patternKey, {
            id: patternKey,
            userId: memory.user_id,
            pattern: 'positive_preferences',
            category: 'preference',
            frequency: 1,
            lastSeen: memory.created_at,
            strength: 0.3,
            examples: [memory.content]
          })
        }
      }

      // Detect skill patterns (learning progress)
      if (content.includes('learn') || content.includes('studying') || content.includes('practice')) {
        const patternKey = 'behavior_learning'
        const existing = patterns.get(patternKey)

        if (existing) {
          existing.frequency++
          existing.lastSeen = memory.created_at
          existing.strength = Math.min(existing.strength + 0.1, 1)
        } else {
          patterns.set(patternKey, {
            id: patternKey,
            userId: memory.user_id,
            pattern: 'active_learning',
            category: 'behavior',
            frequency: 1,
            lastSeen: memory.created_at,
            strength: 0.3,
            examples: [memory.content]
          })
        }
      }

      // Detect goal patterns
      if (content.includes('goal') || content.includes('want to') || content.includes('aim to')) {
        const patternKey = 'goal_statement'
        const existing = patterns.get(patternKey)

        if (existing) {
          existing.frequency++
          existing.lastSeen = memory.created_at
          existing.strength = Math.min(existing.strength + 0.1, 1)
        } else {
          patterns.set(patternKey, {
            id: patternKey,
            userId: memory.user_id,
            pattern: 'goal_oriented',
            category: 'goal',
            frequency: 1,
            lastSeen: memory.created_at,
            strength: 0.3,
            examples: [memory.content]
          })
        }
      }
    }

    // Filter weak patterns
    return Array.from(patterns.values()).filter(p => p.strength >= 0.4)
  }

  /**
   * Consolidate similar memories
   */
  static async consolidateMemories(memories: Memory[]): Promise<MemoryConsolidation[]> {
    const consolidations: MemoryConsolidation[] = []
    const processed = new Set<string>()

    // Group memories by topic similarity
    const topicGroups = this.groupByTopic(memories)

    for (const [topic, groupMemories] of topicGroups) {
      if (groupMemories.length < 2) continue

      // Skip if already processed
      if (groupMemories.every(m => processed.has(m.id))) continue

      // Determine consolidation strategy
      const strategy = this.determineConsolidationStrategy(groupMemories)

      // Create consolidated memory
      const consolidatedMemory = this.createConsolidatedMemory(groupMemories, strategy)

      consolidations.push({
        originalMemories: groupMemories.map(m => m.id),
        consolidatedMemory,
        consolidationStrategy: strategy,
        timestamp: new Date().toISOString()
      })

      // Mark as processed
      groupMemories.forEach(m => processed.add(m.id))
    }

    return consolidations
  }

  /**
   * Group memories by topic
   */
  private static groupByTopic(memories: Memory[]): Map<string, Memory[]> {
    const groups = new Map<string, Memory[]>()

    const topicKeywords = {
      automation: ['n8n', 'workflow', 'automation', 'webhook', 'api'],
      ai: ['llm', 'gpt', 'prompt', 'embedding', 'rag', 'ai'],
      web: ['website', 'html', 'css', 'javascript', 'react', 'next.js'],
      business: ['business', 'startup', 'revenue', 'pricing', 'market'],
      marketing: ['marketing', 'campaign', 'funnel', 'lead', 'conversion'],
      data: ['data', 'analysis', 'statistics', 'chart', 'analytics'],
      education: ['course', 'learn', 'tutorial', 'lesson', 'student'],
    }

    for (const memory of memories) {
      const content = memory.content.toLowerCase()
      let assignedTopic = 'general'

      for (const [topic, keywords] of Object.entries(topicKeywords)) {
        const matches = keywords.filter(keyword => content.includes(keyword)).length
        if (matches > 0) {
          assignedTopic = topic
          break
        }
      }

      if (!groups.has(assignedTopic)) {
        groups.set(assignedTopic, [])
      }
      groups.get(assignedTopic)!.push(memory)
    }

    return groups
  }

  /**
   * Determine consolidation strategy
   */
  private static determineConsolidationStrategy(memories: Memory[]): 'merge' | 'abstract' | 'summarize' {
    if (memories.length <= 2) {
      return 'merge'
    }

    // Check if memories are fact-based or narrative
    const avgLength = memories.reduce((sum, m) => sum + m.content.length, 0) / memories.length

    if (avgLength > 200) {
      return 'summarize'
    }

    return 'abstract'
  }

  /**
   * Create consolidated memory
   */
  private static createConsolidatedMemory(
    memories: Memory[],
    strategy: 'merge' | 'abstract' | 'summarize'
  ): Memory {
    const baseMemory = memories[0]
    const userId = baseMemory.user_id

    let consolidatedContent: string

    switch (strategy) {
      case 'merge':
        consolidatedContent = memories.map(m => m.content).join(' ')
        break

      case 'abstract':
        const uniquePoints = memories.map(m => m.content.substring(0, 100))
        consolidatedContent = `Key points: ${uniquePoints.join('; ')}`
        break

      case 'summarize':
        consolidatedContent = `Summary of ${memories.length} related memories: ${memories[0].content.substring(0, 150)}...`
        break
    }

    return {
      id: `consolidated_${Date.now()}`,
      user_id: userId,
      memory_type: 'fact',
      content: consolidatedContent,
      embedding: [], // Would need to regenerate
      embedding_model: 'text-embedding-3-small',
      embedding_dimension: 1536,
      metadata: {
        consolidated_from: memories.map(m => m.id),
        consolidation_strategy: strategy,
        original_count: memories.length
      },
      source: 'consolidation',
      source_conversation_id: null,
      confidence: 0.8,
      importance: Math.max(...memories.map(m => m.importance)),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      last_accessed_at: new Date().toISOString(),
      access_count: 0,
      is_active: true
    }
  }

  /**
   * Apply forgetting curve to memories
   */
  static applyForgettingCurve(memories: Memory[]): Memory[] {
    const now = new Date()
    const updatedMemories: Memory[] = []

    for (const memory of memories) {
      const lastAccessed = new Date(memory.last_accessed_at)
      const daysSinceAccess = (now.getTime() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24)

      // Ebbinghaus forgetting curve approximation
      // Memory retention decreases over time if not accessed
      let retentionFactor = 1.0

      if (daysSinceAccess > 1) {
        retentionFactor = Math.exp(-daysSinceAccess / 30) // 30-day half-life
      }

      // Adjust importance based on retention
      const adjustedImportance = memory.importance * retentionFactor

      // If importance drops too low, deactivate
      const isActive = adjustedImportance >= 0.2

      updatedMemories.push({
        ...memory,
        importance: adjustedImportance,
        is_active: isActive
      })
    }

    return updatedMemories
  }

  /**
   * Generate learning insights from patterns
   */
  static generateLearningInsights(patterns: MemoryPattern[]): LearningInsight[] {
    const insights: LearningInsight[] = []

    for (const pattern of patterns) {
      if (pattern.category === 'topic' && pattern.strength > 0.7) {
        insights.push({
          type: 'skill_progress',
          description: `Strong interest in ${pattern.pattern} - consistent engagement detected`,
          confidence: pattern.strength,
          evidence: pattern.examples,
          actionable: true,
          suggestedAction: `Consider offering advanced ${pattern.pattern} content or projects`
        })
      }

      if (pattern.category === 'behavior' && pattern.pattern === 'active_learning') {
        insights.push({
          type: 'behavior_pattern',
          description: 'Active learning behavior detected - user consistently seeking knowledge',
          confidence: pattern.strength,
          evidence: pattern.examples,
          actionable: true,
          suggestedAction: 'Provide structured learning paths and progress tracking'
        })
      }

      if (pattern.category === 'goal' && pattern.strength > 0.6) {
        insights.push({
          type: 'behavior_pattern',
          description: 'Goal-oriented behavior detected - user has clear objectives',
          confidence: pattern.strength,
          evidence: pattern.examples,
          actionable: true,
          suggestedAction: 'Help track progress toward stated goals'
        })
      }
    }

    return insights
  }

  /**
   * Adjust memory importance based on access patterns
   */
  static adjustImportance(memories: Memory[]): Memory[] {
    const updatedMemories: Memory[] = []

    for (const memory of memories) {
      // Boost importance based on access frequency
      const accessBoost = Math.min(memory.access_count * 0.05, 0.3)

      // Recency boost - recently accessed memories get a boost
      const lastAccessed = new Date(memory.last_accessed_at)
      const daysSinceAccess = (Date.now() - lastAccessed.getTime()) / (1000 * 60 * 60 * 24)
      const recencyBoost = daysSinceAccess < 7 ? 0.1 : 0

      const adjustedImportance = Math.min(
        memory.importance + accessBoost + recencyBoost,
        1.0
      )

      updatedMemories.push({
        ...memory,
        importance: adjustedImportance
      })
    }

    return updatedMemories
  }

  /**
   * Identify knowledge gaps from patterns
   */
  static identifyKnowledgeGaps(patterns: MemoryPattern[], userGoals?: string[]): LearningInsight[] {
    const gaps: LearningInsight[] = []
    const coveredTopics = new Set(
      patterns
        .filter(p => p.category === 'topic')
        .map(p => p.pattern)
    )

    // Common prerequisite topics
    const prerequisiteTopics = ['automation', 'web', 'ai', 'data']

    for (const topic of prerequisiteTopics) {
      if (!coveredTopics.has(topic)) {
        gaps.push({
          type: 'knowledge_gap',
          description: `Potential knowledge gap in ${topic} - not frequently engaged with`,
          confidence: 0.5,
          evidence: [],
          actionable: true,
          suggestedAction: `Consider introducing ${topic} fundamentals if relevant to user goals`
        })
      }
    }

    return gaps
  }
}
