/**
 * ALEX Architecture Designer
 * 
 * Platform-agnostic automation architecture design
 * Designs logical flow first, then translates to platform-specific implementation
 * Phase 3A Runtime Stabilization: Token-efficient context building
 */

import { AutomationSpec } from './automation-spec'
import { ContextBudgeter, ContextSection } from './context-budget'

export interface LogicalStage {
  // Core identification
  id: string
  name: string
  purpose: string
  
  // Stage categorization
  category: 'trigger' | 'input' | 'processing' | 'decision' | 'output' | 'error_handling' | 'state_management' | 'human_interaction' | 'observability'
  
  // Data flow
  inputs: string[]  // Data inputs this stage consumes
  outputs: string[]  // Data outputs this stage produces
  dataFlow?: {
    from?: string[]  // Stage IDs this stage consumes from
    to?: string[]  // Stage IDs this stage produces for
  }
  
  // Execution control
  optional: boolean
  dependencies: string[]  // IDs of stages this depends on
  
  // Configuration
  configuration?: Record<string, any>  // Stage-specific configuration
  
  // Branching and conditions
  conditions?: {
    expression?: string  // Semantic condition expression
    truePath?: string[]  // Stage IDs to execute if condition is true
    falsePath?: string[]  // Stage IDs to execute if condition is false
  }
  
  // Failure behavior
  failureBehavior?: {
    retryPolicy?: 'none' | 'fixed' | 'exponential-backoff'
    maxRetries?: number
    fallbackPath?: string[]  // Stage IDs to execute on failure
    escalationPath?: string[]  // Stage IDs to escalate to on repeated failure
  }
  
  // State requirements
  stateRequirements?: {
    required: boolean
    purpose?: string  // Why state is needed
    data?: string[]  // What state data to maintain
  }
  
  // Security considerations
  security?: {
    credentials?: string[]  // What credentials are needed
    pii?: boolean  // Whether this stage handles PII
    encryption?: boolean  // Whether encryption is required
    accessControl?: string[]  // Required access permissions
  }
  
  // Observability
  observability?: {
    logging?: boolean
    metrics?: string[]  // What metrics to collect
    alerts?: string[]  // What conditions trigger alerts
  }
  
  // Human interaction
  humanInteraction?: {
    required: boolean
    purpose?: string  // Why human interaction is needed
    escalationPath?: string  // Where to escalate
  }
}

export interface LogicalArchitecture {
  // Core identification
  id: string
  name: string
  description: string
  goal: string  // Business objective
  
  // Metadata
  domain: string
  complexity: 'simple' | 'moderate' | 'complex'
  reasoning: string  // Why this architecture was designed
  
  // Execution stages
  stages: LogicalStage[]
  
  // Data flow representation
  dataFlow?: {
    connections: Array<{
      from: string  // Stage ID
      to: string  // Stage ID
      data: string[]  // What data flows between them
    }>
  }
  
  // Architecture-level considerations
  assumptions: string[]
  recommendations: string[]
  unresolvedDecisions?: string[]  // Decisions that require user input
  
  // Platform independence
  platformAgnostic: boolean  // Should always be true for logical architecture
}

export class ArchitectureDesigner {
  /**
   * Build compact structured context for architecture generation
   * Phase 3A Runtime Stabilization: Uses context budgeting to prevent token limit errors
   */
  private static buildCompactContext(spec: AutomationSpec): string {
    const sections: ContextSection[] = []

    // Requirements (critical)
    const requirements: string[] = []
    if (spec.description) requirements.push(`Goal: ${spec.description}`)
    if (spec.automationType) requirements.push(`Type: ${spec.automationType}`)
    if (spec.domain) requirements.push(`Domain: ${spec.domain}`)
    if (requirements.length > 0) {
      sections.push({
        name: 'requirements',
        content: requirements.join('\n'),
        priority: 'critical',
        estimatedTokens: ContextBudgeter.estimateTokens(requirements.join('\n'))
      })
    }

    // Known values (high priority)
    const known: string[] = []
    if (spec.trigger?.type) known.push(`Trigger: ${spec.trigger.type}`)
    if (spec.trigger?.source) known.push(`Source: ${spec.trigger.source}`)
    if (spec.aiConfig?.enabled) known.push(`AI: enabled`)
    if (spec.integrations?.emailProvider) known.push(`Email: ${spec.integrations.emailProvider}`)
    if (spec.integrations?.aiProvider) known.push(`AI Provider: ${spec.integrations.aiProvider}`)
    if (spec.integrations?.knowledgeBase) known.push(`Knowledge Base: ${spec.integrations.knowledgeBase}`)
    if (spec.schedule?.enabled) known.push(`Schedule: ${spec.schedule.frequency}`)
    if (spec.humanApproval?.required) known.push(`Human Escalation: required`)
    if (known.length > 0) {
      sections.push({
        name: 'known',
        content: known.join('\n'),
        priority: 'high',
        estimatedTokens: ContextBudgeter.estimateTokens(known.join('\n'))
      })
    }

    // Inferred values (medium priority)
    const inferred: string[] = []
    if (spec.businessRules?.conditions?.length > 0) inferred.push(`Branching: ${spec.businessRules.conditions.length} conditions`)
    if (spec.persistence?.enabled) inferred.push(`Logging: enabled`)
    if (spec.security?.credentials?.length > 0) inferred.push(`Credentials: ${spec.security.credentials.length} needed`)
    if (inferred.length > 0) {
      sections.push({
        name: 'inferred',
        content: inferred.join('\n'),
        priority: 'medium',
        estimatedTokens: ContextBudgeter.estimateTokens(inferred.join('\n'))
      })
    }

    // Unresolved decisions (high priority if present)
    if (spec.unresolvedBlockers?.length > 0) {
      const decisions = `Blockers: ${spec.unresolvedBlockers.join(', ')}`
      sections.push({
        name: 'decisions',
        content: decisions,
        priority: 'high',
        estimatedTokens: ContextBudgeter.estimateTokens(decisions)
      })
    }

    // Build context with budgeting
    const { context } = ContextBudgeter.buildContext(sections)
    return context
  }

  /**
   * Design logical architecture based on automation specification
   * Phase 3A: Token-efficient AI-based dynamic generation
   */
  static async design(spec: AutomationSpec): Promise<LogicalArchitecture> {
    console.log('[Architecture Designer] Designing logical architecture using AI for:', spec.automationType)
    
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()

    // Build compact structured context with budgeting
    const context = this.buildCompactContext(spec)

    const prompt = `You are ALEX's automation architecture designer.

TASK: Design a platform-independent logical automation architecture.

${context}

CONSTRAINTS:
- Platform-agnostic design (describe WHAT, not HOW)
- Simple requests → simple architectures
- Complex requests → rich architectures
- Only include branching if decisions are needed
- Only include failure handling where it materially matters
- Only include state when actually needed
- Only include human interaction when genuinely required
- Only include security if relevant
- NEVER invent credentials, email addresses, API keys, or user-specific configuration
- If a value is required but unavailable, represent it as a configurable credential or placeholder

STAGE CATEGORIES:
- trigger: Initiates automation
- input: Receives external data
- processing: Transforms or analyzes data
- decision: Makes branching decisions
- output: Sends results or notifications
- error_handling: Handles failures and retries
- state_management: Maintains state across executions
- human_interaction: Requires human input
- observability: Logs, metrics, monitoring

OUTPUT:
Return ONLY JSON:
{
  "id": "unique-id",
  "name": "architecture-name",
  "description": "what it does",
  "goal": "business objective",
  "domain": "domain",
  "complexity": "simple|moderate|complex",
  "reasoning": "why designed this way",
  "stages": [
    {
      "id": "stage-id",
      "name": "stage-name",
      "purpose": "what it does",
      "category": "category",
      "inputs": ["inputs"],
      "outputs": ["outputs"],
      "optional": false,
      "dependencies": ["dep-ids"],
      "conditions": {"expression": "condition", "truePath": ["paths"], "falsePath": ["paths"]},
      "failureBehavior": {"retryPolicy": "policy", "maxRetries": 3, "fallbackPath": ["paths"]},
      "stateRequirements": {"required": true, "purpose": "why", "data": ["fields"]},
      "security": {"credentials": ["needed"], "pii": false, "encryption": false},
      "observability": {"logging": true, "metrics": ["metrics"], "alerts": ["alerts"]},
      "humanInteraction": {"required": false, "purpose": "why", "escalationPath": "where"}
    }
  ],
  "dataFlow": {"connections": [{"from": "id", "to": "id", "data": ["data"]}]},
  "assumptions": ["assumptions"],
  "recommendations": ["recommendations"],
  "unresolvedDecisions": ["decisions"],
  "platformAgnostic": true
}

RULES:
- Only include fields that are actually needed
- dataFlow must represent explicit connections
- Keep simple workflows genuinely simple

Return ONLY JSON.`

    console.log('[Architecture Designer] Calling AI for architecture generation with prompt length:', prompt.length)

    const response = await aiService.generateResponse(prompt)
    console.log('[Architecture Designer] AI architecture response received, length:', response.length)
    console.log('[Architecture Designer] Full AI response:', response)

    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    console.log('[Architecture Designer] JSON match result:', jsonMatch ? 'found' : 'not found')
    if (jsonMatch) {
      console.log('[Architecture Designer] Extracted JSON length:', jsonMatch[0].length)
      try {
        const architecture = JSON.parse(jsonMatch[0])
        console.log('[Architecture Designer] Successfully parsed AI architecture:', {
          stageCount: architecture.stages?.length,
          complexity: architecture.complexity,
          hasDataFlow: !!architecture.dataFlow
        })

        // Validate the architecture
        const validation = this.validateArchitecture(architecture)
        if (!validation.valid) {
          console.error('[Architecture Designer] Architecture validation failed:', validation.errors)
          throw new Error(`Invalid architecture: ${validation.errors.join(', ')}`)
        }

        return architecture
      } catch (error) {
        console.error('[Architecture Designer] Failed to parse AI architecture JSON:', error)
        console.error('[Architecture Designer] JSON parse error details:', error instanceof Error ? error.message : 'Unknown error')
      }
    }

    console.error('[Architecture Designer] No valid JSON found in AI response')
    throw new Error('Failed to extract valid architecture from AI response')
  }

  /**
   * Validate architecture structure and semantics
   */
  private static validateArchitecture(architecture: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    // Basic structure validation
    if (!architecture.id) {
      errors.push('Architecture is missing id')
    }
    if (!architecture.name) {
      errors.push('Architecture is missing name')
    }
    if (!architecture.description) {
      errors.push('Architecture is missing description')
    }
    if (!architecture.goal) {
      errors.push('Architecture is missing goal')
    }
    if (!architecture.complexity) {
      errors.push('Architecture is missing complexity')
    }
    if (!architecture.reasoning) {
      errors.push('Architecture is missing reasoning')
    }
    if (!architecture.stages || !Array.isArray(architecture.stages)) {
      errors.push('Architecture is missing stages array')
    }
    if (!architecture.platformAgnostic) {
      errors.push('Architecture must be platform-agnostic')
    }

    // Stage validation
    const stageIds = new Set<string>()
    if (architecture.stages) {
      for (const stage of architecture.stages) {
        if (!stage.id) {
          errors.push(`Stage is missing id`)
        } else if (stageIds.has(stage.id)) {
          errors.push(`Duplicate stage id: ${stage.id}`)
        } else {
          stageIds.add(stage.id)
        }
        
        if (!stage.name) {
          errors.push(`Stage ${stage.id || 'unknown'} is missing name`)
        }
        if (!stage.purpose) {
          errors.push(`Stage ${stage.id || 'unknown'} is missing purpose`)
        }
        if (!stage.category) {
          errors.push(`Stage ${stage.id || 'unknown'} is missing category`)
        }
        
        // Validate dependencies reference existing stages
        if (stage.dependencies && Array.isArray(stage.dependencies)) {
          for (const dep of stage.dependencies) {
            if (!stageIds.has(dep)) {
              errors.push(`Stage ${stage.id} has invalid dependency: ${dep}`)
            }
          }
        }
        
        // Validate data flow references
        if (stage.dataFlow) {
          if (stage.dataFlow.from) {
            for (const from of stage.dataFlow.from) {
              if (!stageIds.has(from)) {
                errors.push(`Stage ${stage.id} has invalid dataFlow.from: ${from}`)
              }
            }
          }
          if (stage.dataFlow.to) {
            for (const to of stage.dataFlow.to) {
              if (!stageIds.has(to)) {
                errors.push(`Stage ${stage.id} has invalid dataFlow.to: ${to}`)
              }
            }
          }
        }
        
        // Validate conditions paths
        if (stage.conditions) {
          if (stage.conditions.truePath) {
            for (const path of stage.conditions.truePath) {
              if (!stageIds.has(path)) {
                errors.push(`Stage ${stage.id} has invalid conditions.truePath: ${path}`)
              }
            }
          }
          if (stage.conditions.falsePath) {
            for (const path of stage.conditions.falsePath) {
              if (!stageIds.has(path)) {
                errors.push(`Stage ${stage.id} has invalid conditions.falsePath: ${path}`)
              }
            }
          }
        }
        
        // Validate failure paths
        if (stage.failureBehavior) {
          if (stage.failureBehavior.fallbackPath) {
            for (const path of stage.failureBehavior.fallbackPath) {
              if (!stageIds.has(path)) {
                errors.push(`Stage ${stage.id} has invalid failureBehavior.fallbackPath: ${path}`)
              }
            }
          }
          if (stage.failureBehavior.escalationPath) {
            for (const path of stage.failureBehavior.escalationPath) {
              if (!stageIds.has(path)) {
                errors.push(`Stage ${stage.id} has invalid failureBehavior.escalationPath: ${path}`)
              }
            }
          }
        }
      }
    }

    // Validate data flow connections
    if (architecture.dataFlow && architecture.dataFlow.connections) {
      for (const connection of architecture.dataFlow.connections) {
        if (!stageIds.has(connection.from)) {
          errors.push(`Data flow has invalid from: ${connection.from}`)
        }
        if (!stageIds.has(connection.to)) {
          errors.push(`Data flow has invalid to: ${connection.to}`)
        }
      }
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Generate human-readable architecture description
   */
  static describeArchitecture(architecture: LogicalArchitecture): string {
    let description = `I recommend the following architecture:\n\n`
    
    description += `**Goal:** ${architecture.goal}\n\n`
    
    description += `**Stages:**\n`
    architecture.stages.forEach((stage, index) => {
      description += `${index + 1}. **${stage.name}** (${stage.category})\n`
      description += `   ${stage.purpose}\n`
      
      if (stage.inputs && stage.inputs.length > 0) {
        description += `   *Inputs: ${stage.inputs.join(', ')}\n`
      }
      if (stage.outputs && stage.outputs.length > 0) {
        description += `   *Outputs: ${stage.outputs.join(', ')}\n`
      }
      if (stage.dependencies && stage.dependencies.length > 0) {
        description += `   *Depends on: ${stage.dependencies.join(', ')}\n`
      }
      description += `\n`
    })
    
    if (architecture.dataFlow && architecture.dataFlow.connections.length > 0) {
      description += `**Data Flow:**\n`
      architecture.dataFlow.connections.forEach(conn => {
        description += `* ${conn.from} → ${conn.to}: ${conn.data.join(', ')}\n`
      })
      description += `\n`
    }
    
    description += `**Complexity:** ${architecture.complexity}\n\n`
    description += `**Reasoning:** ${architecture.reasoning}\n\n`
    
    if (architecture.assumptions.length > 0) {
      description += `**Assumptions:**\n`
      architecture.assumptions.forEach(assumption => {
        description += `- ${assumption}\n`
      })
      description += `\n`
    }
    
    if (architecture.recommendations.length > 0) {
      description += `**Recommendations:**\n`
      architecture.recommendations.forEach(rec => {
        description += `- ${rec}\n`
      })
      description += `\n`
    }
    
    if (architecture.unresolvedDecisions && architecture.unresolvedDecisions.length > 0) {
      description += `**Decisions needed:**\n`
      architecture.unresolvedDecisions.forEach(decision => {
        description += `- ${decision}\n`
      })
      description += `\n`
    }
    
    return description
  }
}
