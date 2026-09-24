/**
 * Phase 3: Task Planner
 * 
 * Creates structured execution plans for complex tasks
 * Breaks down user requests into executable steps
 */

export interface TaskStep {
  id: string
  description: string
  type: 'research' | 'analysis' | 'creation' | 'verification' | 'communication'
  requiredTools: string[]
  dependencies: string[] // IDs of steps this depends on
  estimatedDuration: number // in seconds
  status: 'pending' | 'in_progress' | 'completed' | 'failed'
  result?: any
  error?: string
}

export interface TaskPlan {
  id: string
  objective: string
  constraints: string[]
  requiredKnowledge: string[]
  toolsRequired: string[]
  subtasks: TaskStep[]
  dependencies: Record<string, string[]>
  expectedOutputs: string[]
  verificationCriteria: string[]
  estimatedTotalDuration: number
  createdAt: string
  status: 'planning' | 'ready' | 'executing' | 'completed' | 'failed'
}

export interface PlanningRequest {
  objective: string
  taskType: string
  complexity: string
  availableTools: string[]
  userId?: string
  conversationId?: string
}

export interface PlanningResult {
  plan: TaskPlan
  confidence: number
  reasoning: string
}

/**
 * Task Planner - Creates structured execution plans
 */
export class TaskPlanner {
  /**
   * Create a task plan from a user request
   */
  static async createPlan(request: PlanningRequest): Promise<PlanningResult> {
    const { objective, taskType, complexity, availableTools } = request

    // Generate plan ID
    const planId = this.generatePlanId()

    // Determine plan structure based on task type
    const subtasks = this.generateSubtasks(taskType, objective, availableTools)

    // Calculate dependencies
    const dependencies = this.calculateDependencies(subtasks)

    // Define verification criteria
    const verificationCriteria = this.generateVerificationCriteria(taskType)

    // Estimate total duration
    const estimatedTotalDuration = subtasks.reduce((sum, step) => sum + step.estimatedDuration, 0)

    const plan: TaskPlan = {
      id: planId,
      objective,
      constraints: this.generateConstraints(taskType),
      requiredKnowledge: this.determineRequiredKnowledge(taskType),
      toolsRequired: this.determineRequiredTools(taskType, availableTools),
      subtasks,
      dependencies,
      expectedOutputs: this.generateExpectedOutputs(taskType),
      verificationCriteria,
      estimatedTotalDuration,
      createdAt: new Date().toISOString(),
      status: 'ready',
    }

    const confidence = this.calculateConfidence(taskType, complexity, availableTools)
    const reasoning = this.generateReasoning(taskType, complexity, subtasks.length)

    return {
      plan,
      confidence,
      reasoning,
    }
  }

  /**
   * Generate subtasks based on task type
   */
  private static generateSubtasks(
    taskType: string,
    objective: string,
    availableTools: string[]
  ): TaskStep[] {
    const stepId = () => this.generateStepId()

    const taskTemplates: Record<string, TaskStep[]> = {
      research: [
        {
          id: stepId(),
          description: 'Analyze research request and identify key questions',
          type: 'analysis',
          requiredTools: [],
          dependencies: [],
          estimatedDuration: 30,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Search for current information',
          type: 'research',
          requiredTools: ['web_search'],
          dependencies: [],
          estimatedDuration: 60,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Synthesize findings',
          type: 'analysis',
          requiredTools: [],
          dependencies: [],
          estimatedDuration: 45,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Verify source quality',
          type: 'verification',
          requiredTools: [],
          dependencies: [],
          estimatedDuration: 30,
          status: 'pending',
        },
      ],
      coding: [
        {
          id: stepId(),
          description: 'Analyze coding requirements',
          type: 'analysis',
          requiredTools: [],
          dependencies: [],
          estimatedDuration: 30,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Review existing code if applicable',
          type: 'analysis',
          requiredTools: ['file_reader'],
          dependencies: [],
          estimatedDuration: 60,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Generate code implementation',
          type: 'creation',
          requiredTools: ['code_executor'],
          dependencies: [],
          estimatedDuration: 120,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Test and verify implementation',
          type: 'verification',
          requiredTools: ['code_executor'],
          dependencies: [],
          estimatedDuration: 60,
          status: 'pending',
        },
      ],
      writing: [
        {
          id: stepId(),
          description: 'Analyze writing requirements',
          type: 'analysis',
          requiredTools: [],
          dependencies: [],
          estimatedDuration: 30,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Research topic if needed',
          type: 'research',
          requiredTools: ['web_search'],
          dependencies: [],
          estimatedDuration: 45,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Draft content',
          type: 'creation',
          requiredTools: [],
          dependencies: [],
          estimatedDuration: 90,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Review and refine',
          type: 'verification',
          requiredTools: [],
          dependencies: [],
          estimatedDuration: 30,
          status: 'pending',
        },
      ],
      data_analysis: [
        {
          id: stepId(),
          description: 'Load and inspect data',
          type: 'analysis',
          requiredTools: ['file_reader'],
          dependencies: [],
          estimatedDuration: 30,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Clean and process data',
          type: 'analysis',
          requiredTools: ['data_analyzer'],
          dependencies: [],
          estimatedDuration: 60,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Perform analysis',
          type: 'analysis',
          requiredTools: ['data_analyzer'],
          dependencies: [],
          estimatedDuration: 90,
          status: 'pending',
        },
        {
          id: stepId(),
          description: 'Generate report',
          type: 'creation',
          requiredTools: [],
          dependencies: [],
          estimatedDuration: 45,
          status: 'pending',
        },
      ],
    }

    return taskTemplates[taskType] || [
      {
        id: stepId(),
        description: `Execute ${taskType} task`,
        type: 'creation',
        requiredTools: availableTools.slice(0, 2),
        dependencies: [],
        estimatedDuration: 60,
        status: 'pending',
      },
    ]
  }

  /**
   * Calculate dependencies between steps
   */
  private static calculateDependencies(subtasks: TaskStep[]): Record<string, string[]> {
    const dependencies: Record<string, string[]> = {}

    for (let i = 1; i < subtasks.length; i++) {
      dependencies[subtasks[i].id] = [subtasks[i - 1].id]
    }

    return dependencies
  }

  /**
   * Generate verification criteria
   */
  private static generateVerificationCriteria(taskType: string): string[] {
    const criteria: Record<string, string[]> = {
      research: [
        'Sources are authoritative and current',
        'Information is consistent across multiple sources',
        'Claims are supported by evidence',
      ],
      coding: [
        'Code compiles without errors',
        'Code follows best practices',
        'Implementation meets requirements',
      ],
      writing: [
        'Content is clear and well-structured',
        'Grammar and spelling are correct',
        'Content meets the stated objective',
      ],
      data_analysis: [
        'Data processing is accurate',
        'Analysis is logically sound',
        'Conclusions are supported by data',
      ],
    }

    return criteria[taskType] || ['Task completed successfully']
  }

  /**
   * Generate constraints
   */
  private static generateConstraints(taskType: string): string[] {
    const constraints: Record<string, string[]> = {
      research: [
        'Use only authoritative sources',
        'Prioritize recent information',
        'Cite sources when appropriate',
      ],
      coding: [
        'Follow existing code style',
        'Maintain backward compatibility',
        'Include error handling',
      ],
      writing: [
        'Maintain professional tone',
        'Avoid plagiarism',
        'Use clear language',
      ],
      data_analysis: [
        'Preserve data integrity',
        'Handle missing values appropriately',
        'Document methodology',
      ],
    }

    return constraints[taskType] || ['Follow best practices']
  }

  /**
   * Determine required knowledge
   */
  private static determineRequiredKnowledge(taskType: string): string[] {
    const knowledge: Record<string, string[]> = {
      research: ['Current information', 'Domain knowledge', 'Source evaluation'],
      coding: ['Programming languages', 'Frameworks', 'Best practices'],
      writing: ['Subject matter', 'Writing conventions', 'Audience analysis'],
      data_analysis: ['Statistical methods', 'Data processing', 'Domain knowledge'],
    }

    return knowledge[taskType] || ['General knowledge']
  }

  /**
   * Determine required tools
   */
  private static determineRequiredTools(taskType: string, availableTools: string[]): string[] {
    const toolRequirements: Record<string, string[]> = {
      research: ['web_search'],
      coding: ['code_executor', 'file_reader'],
      writing: ['web_search'],
      data_analysis: ['file_reader', 'data_analyzer'],
    }

    const required = toolRequirements[taskType] || []
    return required.filter(tool => availableTools.includes(tool))
  }

  /**
   * Generate expected outputs
   */
  private static generateExpectedOutputs(taskType: string): string[] {
    const outputs: Record<string, string[]> = {
      research: ['Research findings', 'Source citations', 'Recommendations'],
      coding: ['Working code', 'Documentation', 'Test results'],
      writing: ['Written content', 'Draft revisions', 'Final version'],
      data_analysis: ['Analysis report', 'Visualizations', 'Insights'],
    }

    return outputs[taskType] || ['Task completion']
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(taskType: string, complexity: string, availableTools: string[]): number {
    let confidence = 0.7 // Base confidence

    // Adjust based on task type support
    const supportedTypes = ['research', 'coding', 'writing', 'data_analysis']
    if (supportedTypes.includes(taskType)) {
      confidence += 0.1
    }

    // Adjust based on complexity
    if (complexity === 'simple') {
      confidence += 0.1
    } else if (complexity === 'complex' || complexity === 'multi_stage') {
      confidence -= 0.1
    }

    // Adjust based on available tools
    if (availableTools.length > 0) {
      confidence += 0.05
    }

    return Math.min(Math.max(confidence, 0.3), 0.95)
  }

  /**
   * Generate reasoning
   */
  private static generateReasoning(taskType: string, complexity: string, stepCount: number): string {
    return `Created ${stepCount}-step plan for ${taskType} task with ${complexity} complexity. Plan includes research, execution, and verification phases.`
  }

  /**
   * Generate plan ID
   */
  private static generatePlanId(): string {
    return `plan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate step ID
   */
  private static generateStepId(): string {
    return `step_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}
