/**
 * Phase 7: Multi-Agent Coordination
 * 
 * Enables multiple domain experts to collaborate on complex tasks
 * Agent selection, coordination, and result synthesis
 */

import { ExpertiseProfile, ExpertiseProfileRegistry } from '../expertise'

export interface AgentTask {
  id: string
  description: string
  domain: string
  priority: number
  dependencies: string[] // IDs of tasks this depends on
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: any
  error?: string
}

export interface AgentCollaborationPlan {
  taskId: string
  description: string
  primaryDomain: string
  supportingDomains: string[]
  tasks: AgentTask[]
  coordinationStrategy: 'sequential' | 'parallel' | 'hierarchical'
  synthesisStrategy: 'merge' | 'vote' | 'cascade' | 'expert_primary'
}

export interface AgentExecutionResult {
  taskId: string
  success: boolean
  results: Map<string, any> // Domain -> result
  synthesis: any
  executionTime: number
  agentCount: number
}

/**
 * Multi-Agent Coordinator
 */
export class MultiAgentCoordinator {
  /**
   * Analyze task and determine if multi-agent collaboration is needed
   */
  static analyzeCollaborationNeeded(content: string): {
    needsCollaboration: boolean
    primaryDomain: string
    supportingDomains: string[]
    reasoning: string
  } {
    const primaryDomain = ExpertiseProfileRegistry.detectDomain(content)
    const lowerContent = content.toLowerCase()

    // Check for multi-domain indicators
    const multiDomainIndicators = [
      { pattern: /build.*website.*with.*payment/i, domains: ['web', 'ecommerce', 'cybersecurity'] },
      { pattern: /marketing.*automation.*campaign/i, domains: ['marketing', 'automation', 'content'] },
      { pattern: /data.*analysis.*for.*business/i, domains: ['data', 'business', 'automation'] },
      { pattern: /cloud.*infrastructure.*for.*app/i, domains: ['cloud', 'software', 'cybersecurity'] },
      { pattern: /ai.*workflow.*with.*n8n/i, domains: ['ai', 'automation', 'software'] },
      { pattern: /course.*platform.*with.*payment/i, domains: ['education', 'ecommerce', 'web'] },
      { pattern: /secure.*api.*for.*app/i, domains: ['cybersecurity', 'software', 'cloud'] },
    ]

    let supportingDomains: string[] = []
    let reasoning = 'Single domain task'

    for (const indicator of multiDomainIndicators) {
      if (indicator.pattern.test(content)) {
        supportingDomains = indicator.domains.filter(d => d !== primaryDomain)
        reasoning = `Multi-domain task: ${indicator.domains.join(', ')}`
        break
      }
    }

    // Check for general complexity indicators
    if (supportingDomains.length === 0) {
      const complexityIndicators = [
        'integrate', 'connect', 'combine', 'merge', 'system', 'platform', 'infrastructure',
        'end-to-end', 'full stack', 'complete solution', 'comprehensive'
      ]

      const hasComplexity = complexityIndicators.some(indicator => lowerContent.includes(indicator))
      if (hasComplexity) {
        // Infer supporting domains based on primary domain
        supportingDomains = this.inferSupportingDomains(primaryDomain)
        reasoning = 'Complex task requiring multiple domain perspectives'
      }
    }

    return {
      needsCollaboration: supportingDomains.length > 0,
      primaryDomain,
      supportingDomains,
      reasoning
    }
  }

  /**
   * Infer supporting domains based on primary domain
   */
  private static inferSupportingDomains(primaryDomain: string): string[] {
    const domainMap: Record<string, string[]> = {
      web: ['uiux', 'software', 'cybersecurity'],
      ecommerce: ['web', 'automation', 'cybersecurity'],
      automation: ['software', 'cloud', 'business'],
      ai: ['software', 'data', 'automation'],
      cloud: ['cybersecurity', 'software', 'automation'],
      marketing: ['content', 'data', 'business'],
      business: ['data', 'marketing', 'automation'],
      education: ['web', 'content', 'automation'],
      software: ['web', 'cloud', 'cybersecurity'],
      cybersecurity: ['cloud', 'software', 'automation'],
      data: ['business', 'automation', 'ai'],
      content: ['marketing', 'uiux', 'web'],
      uiux: ['web', 'content', 'automation'],
    }

    return domainMap[primaryDomain] || []
  }

  /**
   * Create collaboration plan
   */
  static createCollaborationPlan(
    taskId: string,
    description: string,
    primaryDomain: string,
    supportingDomains: string[]
  ): AgentCollaborationPlan {
    const tasks: AgentTask[] = []

    // Create primary task
    tasks.push({
      id: `${taskId}_primary`,
      description: `Primary analysis from ${primaryDomain} perspective`,
      domain: primaryDomain,
      priority: 1,
      dependencies: [],
      status: 'pending'
    })

    // Create supporting tasks
    supportingDomains.forEach((domain, index) => {
      tasks.push({
        id: `${taskId}_support_${index}`,
        description: `Supporting analysis from ${domain} perspective`,
        domain,
        priority: 2,
        dependencies: [], // Can run in parallel with primary
        status: 'pending'
      })
    })

    // Determine coordination strategy
    const coordinationStrategy: 'sequential' | 'parallel' | 'hierarchical' =
      supportingDomains.length > 2 ? 'parallel' : 'sequential'

    // Determine synthesis strategy
    const synthesisStrategy: 'merge' | 'vote' | 'cascade' | 'expert_primary' =
      primaryDomain === 'ai' || primaryDomain === 'business' ? 'expert_primary' : 'merge'

    return {
      taskId,
      description,
      primaryDomain,
      supportingDomains,
      tasks,
      coordinationStrategy,
      synthesisStrategy
    }
  }

  /**
   * Execute collaboration plan
   */
  static async executeCollaboration(
    plan: AgentCollaborationPlan,
    executeAgent: (task: AgentTask) => Promise<any>
  ): Promise<AgentExecutionResult> {
    const startTime = Date.now()
    const results = new Map<string, any>()

    console.log('[Multi-Agent] Starting collaboration:', {
      taskId: plan.taskId,
      primaryDomain: plan.primaryDomain,
      supportingDomains: plan.supportingDomains,
      coordinationStrategy: plan.coordinationStrategy
    })

    try {
      if (plan.coordinationStrategy === 'parallel') {
        // Execute all tasks in parallel
        const taskPromises = plan.tasks.map(task => executeAgent(task))
        const taskResults = await Promise.all(taskPromises)

        plan.tasks.forEach((task, index) => {
          task.status = 'completed'
          task.result = taskResults[index]
          results.set(task.domain, taskResults[index])
        })
      } else if (plan.coordinationStrategy === 'sequential') {
        // Execute primary first, then supporting
        const primaryTask = plan.tasks.find(t => t.domain === plan.primaryDomain)
        if (primaryTask) {
          primaryTask.status = 'in_progress'
          const primaryResult = await executeAgent(primaryTask)
          primaryTask.status = 'completed'
          primaryTask.result = primaryResult
          results.set(primaryTask.domain, primaryResult)

          // Execute supporting tasks
          const supportingTasks = plan.tasks.filter(t => t.domain !== plan.primaryDomain)
          for (const task of supportingTasks) {
            task.status = 'in_progress'
            const result = await executeAgent(task)
            task.status = 'completed'
            task.result = result
            results.set(task.domain, result)
          }
        }
      } else {
        // Hierarchical - primary with dependencies
        const primaryTask = plan.tasks.find(t => t.domain === plan.primaryDomain)
        if (primaryTask) {
          primaryTask.status = 'in_progress'
          const primaryResult = await executeAgent(primaryTask)
          primaryTask.status = 'completed'
          primaryTask.result = primaryResult
          results.set(primaryTask.domain, primaryResult)

          // Supporting tasks depend on primary
          const supportingTasks = plan.tasks.filter(t => t.domain !== plan.primaryDomain)
          for (const task of supportingTasks) {
            task.status = 'in_progress'
            const result = await executeAgent(task)
            task.status = 'completed'
            task.result = result
            results.set(task.domain, result)
          }
        }
      }

      // Synthesize results
      const synthesis = this.synthesizeResults(plan, results)

      const executionTime = Date.now() - startTime

      console.log('[Multi-Agent] Collaboration completed:', {
        taskId: plan.taskId,
        executionTime,
        agentCount: plan.tasks.length,
        synthesisStrategy: plan.synthesisStrategy
      })

      return {
        taskId: plan.taskId,
        success: true,
        results,
        synthesis,
        executionTime,
        agentCount: plan.tasks.length
      }
    } catch (error) {
      console.error('[Multi-Agent] Collaboration failed:', error)

      return {
        taskId: plan.taskId,
        success: false,
        results,
        synthesis: null,
        executionTime: Date.now() - startTime,
        agentCount: plan.tasks.length
      }
    }
  }

  /**
   * Synthesize results from multiple agents
   */
  private static synthesizeResults(
    plan: AgentCollaborationPlan,
    results: Map<string, any>
  ): any {
    const primaryResult = results.get(plan.primaryDomain)

    switch (plan.synthesisStrategy) {
      case 'expert_primary':
        // Primary domain expert has final say
        return {
          primary: primaryResult,
          supporting: Object.fromEntries(
            Array.from(results.entries()).filter(([key]) => key !== plan.primaryDomain)
          ),
          synthesis: 'Primary expert perspective with supporting insights'
        }

      case 'merge':
        // Merge all results
        return {
          merged: Object.fromEntries(results),
          domains: Array.from(results.keys()),
          synthesis: 'Merged perspectives from all domains'
        }

      case 'cascade':
        // Start with primary, enhance with supporting
        const cascaded = { ...primaryResult }
        plan.supportingDomains.forEach(domain => {
          const supportingResult = results.get(domain)
          if (supportingResult) {
            cascaded[`${domain}_insights`] = supportingResult
          }
        })
        return {
          cascaded,
          synthesis: 'Primary perspective enhanced with supporting domain insights'
        }

      case 'vote':
        // For consensus-based decisions (simplified)
        return {
          consensus: primaryResult, // In practice, would implement voting logic
          alternatives: Object.fromEntries(
            Array.from(results.entries()).filter(([key]) => key !== plan.primaryDomain)
          ),
          synthesis: 'Consensus-based synthesis'
        }

      default:
        return {
          results: Object.fromEntries(results),
          synthesis: 'Default synthesis'
        }
    }
  }

  /**
   * Get agent-specific system prompt
   */
  static getAgentSystemPrompt(domain: string, context?: string): string {
    const profile = ExpertiseProfileRegistry.getProfileByDomain(domain)
    if (!profile) return ''

    let prompt = `You are a ${profile.name} working on a collaborative task.\n\n`
    prompt += `Your domain expertise:\n`
    prompt += profile.systemPromptAdditions.join('\n')
    prompt += `\n\nYour reasoning patterns:\n`
    prompt += profile.reasoningPatterns.join('\n')
    prompt += `\n\nValidation rules:\n`
    prompt += profile.validationRules.join('\n')

    if (context) {
      prompt += `\n\nTask context:\n${context}`
    }

    return prompt
  }
}
