/**
 * ALEX Architecture Designer
 * 
 * Platform-agnostic automation architecture design
 * Designs logical flow first, then translates to platform-specific implementation
 */

import { AutomationSpec } from './automation-spec'

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
   * Design logical architecture based on automation specification
   * Phase 3A: Now uses AI-based dynamic generation instead of hardcoded templates
   */
  static async design(spec: AutomationSpec): Promise<LogicalArchitecture> {
    console.log('[Architecture Designer] Designing logical architecture using AI for:', spec.automationType)
    
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()

    const prompt = `You are an expert automation architect. Design a rich, platform-independent logical architecture for the following automation request.

Request: ${spec.description || spec.automationType || 'General automation'}
Automation Type: ${spec.automationType || 'automation'}
Domain: ${spec.domain || 'custom'}

Key Requirements:
${spec.aiConfig?.enabled ? '- AI processing is enabled' : '- No AI processing'}
${spec.integrations?.emailProvider ? `- Email provider: ${spec.integrations.emailProvider}` : ''}
${spec.integrations?.aiProvider ? `- AI provider: ${spec.integrations.aiProvider}` : ''}
${spec.integrations?.aiModel ? `- AI model: ${spec.integrations.aiModel}` : ''}
${spec.integrations?.knowledgeBase ? `- Knowledge base: ${spec.integrations.knowledgeBase}` : ''}
${spec.humanApproval?.required ? '- Human approval/escalation is required' : ''}
${spec.schedule?.enabled ? '- Scheduled/triggered automation' : ''}
${spec.persistence?.enabled ? '- Logging and persistence is enabled' : ''}
${spec.security?.credentials && spec.security.credentials.length > 0 ? `- Credentials needed: ${spec.security.credentials.join(', ')}` : ''}

Design the architecture by reasoning through:
1. Business objective and goal
2. Inputs and data sources
3. Outputs and destinations
4. Trigger mechanism
5. Core processing stages (be specific to the use case)
6. Data flow between stages (what data moves where)
7. Dependencies between stages
8. Branching logic (if decisions need to be made)
9. State requirements (if duplicate detection, conversation history, etc. is needed)
10. Failure handling and retry behavior (where it materially matters)
11. Human-in-the-loop requirements (when human judgment is needed)
12. Security considerations (credentials, PII, encryption if relevant)
13. Observability (logging, metrics, alerts if meaningful)

IMPORTANT ARCHITECTURE RULES:
- Design stages specifically for THIS use case, not generic templates
- Simple requests should have simple architectures (don't over-engineer)
- Complex requests should have appropriately rich architectures
- Only include failure handling where it materially matters
- Only include state when actually needed
- Only include human interaction when genuinely required
- Only include security considerations when relevant

Stage categories to use:
- trigger: Initiates the automation
- input: Receives external data
- processing: Transforms or analyzes data
- decision: Makes branching decisions
- output: Sends results or notifications
- error_handling: Handles failures and retries
- state_management: Maintains state across executions
- human_interaction: Requires human input
- observability: Logs, metrics, monitoring

Return ONLY JSON in this exact format:
{
  "id": "unique-architecture-id",
  "name": "descriptive architecture name",
  "description": "what this automation accomplishes",
  "goal": "business objective",
  "domain": "domain",
  "complexity": "simple|moderate|complex",
  "reasoning": "why this architecture was designed this way",
  "stages": [
    {
      "id": "unique-stage-id",
      "name": "descriptive stage name",
      "purpose": "what this stage does",
      "category": "trigger|input|processing|decision|output|error_handling|state_management|human_interaction|observability",
      "inputs": ["data inputs"],
      "outputs": ["data outputs"],
      "dataFlow": {
        "from": ["source stage ids"],
        "to": ["destination stage ids"]
      },
      "optional": false,
      "dependencies": ["stage ids this depends on"],
      "conditions": {
        "expression": "semantic condition if this is a decision stage",
        "truePath": ["stage ids if condition is true"],
        "falsePath": ["stage ids if condition is false"]
      },
      "failureBehavior": {
        "retryPolicy": "none|fixed|exponential-backoff",
        "maxRetries": 3,
        "fallbackPath": ["stage ids on failure"]
      },
      "stateRequirements": {
        "required": true,
        "purpose": "why state is needed",
        "data": ["what state to maintain"]
      },
      "security": {
        "credentials": ["what credentials are needed"],
        "pii": true,
        "encryption": true
      },
      "observability": {
        "logging": true,
        "metrics": ["what metrics to track"],
        "alerts": ["what conditions trigger alerts"]
      },
      "humanInteraction": {
        "required": true,
        "purpose": "why human interaction is needed",
        "escalationPath": "where to escalate"
      }
    }
  ],
  "dataFlow": {
    "connections": [
      {
        "from": "stage id",
        "to": "stage id",
        "data": ["what data flows"]
      }
    ]
  },
  "assumptions": ["assumption 1", "assumption 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "unresolvedDecisions": ["decisions that need user input"],
  "platformAgnostic": true
}

IMPORTANT:
- Only include fields that are actually needed for this specific automation
- Don't include failureBehavior if failure handling isn't needed
- Don't include stateRequirements if state isn't needed
- Don't include security if there are no security considerations
- Don't include humanInteraction if no human interaction is required
- dataFlow should explicitly represent connections between stages
- Keep simple workflows genuinely simple`

Return ONLY the JSON object, nothing else.`

    console.log('[Architecture Designer] Calling AI for architecture generation with prompt length:', prompt.length)

    const response = await aiService.generateResponse(prompt)
    console.log('[Architecture Designer] AI architecture response received:', response.substring(0, 500))

    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
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
      }
    }

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
    if (architecture.stages) {
      const stageIds = new Set<string>()
      
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
