/**
 * Phase 2: Intelligent Task Classifier
 * 
 * Enhanced task classification layer for ALEX
 * Determines task type, complexity, required tools, and knowledge sources
 */

export type TaskType =
  | 'conversation'
  | 'factual_question'
  | 'research'
  | 'current_information_research'
  | 'writing'
  | 'coding'
  | 'debugging'
  | 'website_creation'
  | 'ui_design'
  | 'data_analysis'
  | 'document_creation'
  | 'image_related'
  | 'workflow_creation'
  | 'automation'
  | 'lead_generation'
  | 'marketing'
  | 'business_planning'
  | 'file_analysis'
  | 'multi_step_execution'
  | 'tool_execution'
  | 'learning_teaching'
  | 'mixed_task'

export type TaskComplexity = 'simple' | 'moderate' | 'complex' | 'multi_stage'

export type KnowledgeFreshness = 'static' | 'slow_changing' | 'current' | 'real_time'

export interface TaskClassification {
  primaryType: TaskType
  secondaryTypes: TaskType[]
  complexity: TaskComplexity
  requiredKnowledge: KnowledgeFreshness[]
  requiredTools: string[]
  estimatedSubtasks: number
  requiresPlanning: boolean
  requiresVerification: boolean
  confidence: number
  reasoning: string
}

export interface ClassificationResult {
  classification: TaskClassification
  suggestedMode: 'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder'
  shouldUseAgent: boolean
  shouldUseWebResearch: boolean
  shouldUseRetrieval: boolean
  shouldUseMemory: boolean
}

/**
 * Enhanced task classifier
 */
export class TaskClassifier {
  private static taskPatterns: Map<TaskType, RegExp[]> = new Map([
    ['conversation', [
      /^(hi|hello|hey|how are you|what's up|good morning|good evening)/i,
      /^(thanks|thank you|you're welcome|no problem)/i,
      /^(yes|no|maybe|sure|ok|okay)/i,
    ]],
    ['factual_question', [
      /^(what|who|where|when|why|how) (is|are|was|were|do|does|did|can|could|will|would|should|would)/i,
      /^(explain|describe|define|tell me about)/i,
    ]],
    ['current_information_research', [
      /\b(latest|current|recent|new|updated|version|price|now|today)\b/i,
      /\b(stock|crypto|weather|news|trending|popular)\b/i,
      /\b(is (down|up|available|working|offline))\b/i,
    ]],
    ['research', [
      /\b(research|investigate|look into|find information about|compare)\b/i,
      /\b(best|top|vs|versus|comparison|review)\b/i,
    ]],
    ['writing', [
      /\b(write|create|draft|compose|generate)\b/i,
      /\b(article|blog|post|email|letter|report|essay|story)\b/i,
    ]],
    ['coding', [
      /\b(code|program|develop|implement|create|build)\b/i,
      /\b(function|class|api|endpoint|backend|frontend|app|application)\b/i,
      /\b(javascript|typescript|react|next\.js|node\.js|python|java|rust|go)\b/i,
    ]],
    ['debugging', [
      /\b(debug|fix|error|issue|problem|bug|not working|broken)\b/i,
      /\b(failing|crashing|throwing|exception)\b/i,
    ]],
    ['website_creation', [
      /\b(website|web|landing page|portfolio|blog|ecommerce|store)\b/i,
      /\b(build|create|design|make) (a|an|the).*website/i,
      /\b(page|site|url|domain|hosting)\b/i,
    ]],
    ['ui_design', [
      /\b(design|ui|ux|interface|layout|component|style)\b/i,
      /\b(look|feel|appearance|visual|color|font|typography)\b/i,
      /\b(responsive|mobile|desktop)\b/i,
    ]],
    ['data_analysis', [
      /\b(analyze|data|csv|spreadsheet|excel|chart|graph|statistics)\b/i,
      /\b(report|insight|trend|pattern)\b/i,
    ]],
    ['document_creation', [
      /\b(document|pdf|docx|slide|presentation|proposal)\b/i,
      /\b(create|generate|make) (a|an).*document/i,
    ]],
    ['image_related', [
      /\b(image|picture|photo|screenshot|visual|diagram|chart)\b/i,
      /\b(analyze|look at|examine|describe).*image/i,
    ]],
    ['workflow_creation', [
      /\b(workflow|automation|process|pipeline|trigger|action)\b/i,
      /\b(n8n|zapier|make|integromat)\b/i,
      /\b(webhook|api integration|automation)\b/i,
    ]],
    ['automation', [
      /\b(automate|automation|automated|schedule|cron|job)\b/i,
      /\b(recurring|periodic|daily|weekly|monthly)\b/i,
    ]],
    ['lead_generation', [
      /\b(lead|prospect|customer|client|sales)\b/i,
      /\b(find|discover|research|identify).*leads/i,
      /\b(icp|ideal customer profile|target audience)\b/i,
    ]],
    ['marketing', [
      /\b(marketing|campaign|funnel|conversion|landing page|seo)\b/i,
      /\b(content|social media|email|ads|advertising)\b/i,
    ]],
    ['business_planning', [
      /\b(business|startup|company|strategy|plan|roadmap)\b/i,
      /\b(market|competitor|pricing|revenue|business model)\b/i,
    ]],
    ['file_analysis', [
      /\b(file|document|pdf|csv|data)\b/i,
      /\b(analyze|extract|read|parse|process).*file/i,
    ]],
    ['multi_step_execution', [
      /\b(step|phase|stage|then|after that|next|first|second|third)\b/i,
      /\b(build|create|make).*and then/i,
    ]],
    ['tool_execution', [
      /\b(calculate|compute|math|time|date|search)\b/i,
    ]],
    ['learning_teaching', [
      /\b(teach|learn|explain|tutorial|guide|how to)\b/i,
      /\b(understand|learn|study|practice)\b/i,
    ]],
  ])

  private static complexityIndicators: Map<string, TaskComplexity> = new Map([
    ['simple', 'simple'],
    ['quick', 'simple'],
    ['brief', 'simple'],
    ['detailed', 'moderate'],
    ['comprehensive', 'complex'],
    ['complex', 'complex'],
    ['multi-step', 'multi_stage'],
    ['multiple', 'moderate'],
    ['several', 'moderate'],
    ['extensive', 'complex'],
  ])

  private static knowledgeFreshnessIndicators: Map<string, KnowledgeFreshness> = new Map([
    ['latest', 'current'],
    ['current', 'current'],
    ['recent', 'current'],
    ['new', 'current'],
    ['updated', 'current'],
    ['version', 'current'],
    ['now', 'real_time'],
    ['today', 'current'],
    ['real-time', 'real_time'],
    ['realtime', 'real_time'],
    ['live', 'real_time'],
    ['historical', 'static'],
    ['fundamental', 'static'],
    ['basic', 'static'],
    ['standard', 'slow_changing'],
  ])

  /**
   * Classify a task based on user input
   */
  static classify(input: string): ClassificationResult {
    const lowerInput = input.toLowerCase()
    
    // Detect primary and secondary task types
    const detectedTypes = this.detectTaskTypes(lowerInput)
    const primaryType = detectedTypes[0] || 'conversation'
    const secondaryTypes = detectedTypes.slice(1)

    // Determine complexity
    const complexity = this.determineComplexity(lowerInput, detectedTypes)

    // Determine knowledge freshness requirements
    const requiredKnowledge = this.determineKnowledgeFreshness(lowerInput)

    // Determine required tools
    const requiredTools = this.determineRequiredTools(primaryType, secondaryTypes)

    // Estimate subtasks
    const estimatedSubtasks = this.estimateSubtasks(complexity, primaryType)

    // Determine if planning is needed
    const requiresPlanning = complexity === 'complex' || complexity === 'multi_stage'

    // Determine if verification is needed
    const requiresVerification = this.requiresVerification(primaryType)

    // Calculate confidence
    const confidence = this.calculateConfidence(detectedTypes, lowerInput)

    // Generate reasoning
    const reasoning = this.generateReasoning(primaryType, complexity, requiredKnowledge)

    const classification: TaskClassification = {
      primaryType,
      secondaryTypes,
      complexity,
      requiredKnowledge,
      requiredTools,
      estimatedSubtasks,
      requiresPlanning,
      requiresVerification,
      confidence,
      reasoning,
    }

    // Determine execution parameters
    const suggestedMode = this.suggestMode(classification)
    const shouldUseAgent = this.shouldUseAgent(classification)
    const shouldUseWebResearch = this.shouldUseWebResearch(classification)
    const shouldUseRetrieval = this.shouldUseRetrieval(classification)
    const shouldUseMemory = this.shouldUseMemory(classification)

    return {
      classification,
      suggestedMode,
      shouldUseAgent,
      shouldUseWebResearch,
      shouldUseRetrieval,
      shouldUseMemory,
    }
  }

  /**
   * Detect task types from input
   */
  private static detectTaskTypes(input: string): TaskType[] {
    const detectedTypes: TaskType[] = []

    for (const [taskType, patterns] of this.taskPatterns) {
      for (const pattern of patterns) {
        if (pattern.test(input)) {
          if (!detectedTypes.includes(taskType)) {
            detectedTypes.push(taskType)
          }
          break
        }
      }
    }

    // Check for mixed task patterns
    if (detectedTypes.length > 1) {
      if (!detectedTypes.includes('mixed_task')) {
        detectedTypes.push('mixed_task')
      }
    }

    return detectedTypes.length > 0 ? detectedTypes : ['conversation']
  }

  /**
   * Determine task complexity
   */
  private static determineComplexity(input: string, detectedTypes: TaskType[]): TaskComplexity {
    // Check for explicit complexity indicators
    for (const [indicator, complexity] of this.complexityIndicators) {
      if (input.includes(indicator)) {
        return complexity
      }
    }

    // Infer from task types
    if (detectedTypes.includes('multi_step_execution')) {
      return 'multi_stage'
    }
    if (detectedTypes.includes('website_creation') || detectedTypes.includes('workflow_creation')) {
      return 'complex'
    }
    if (detectedTypes.includes('coding') || detectedTypes.includes('data_analysis')) {
      return 'moderate'
    }

    // Default based on input length
    if (input.length > 200) {
      return 'moderate'
    }
    return 'simple'
  }

  /**
   * Determine knowledge freshness requirements
   */
  private static determineKnowledgeFreshness(input: string): KnowledgeFreshness[] {
    const freshness: KnowledgeFreshness[] = ['static'] // Default to static

    for (const [indicator, fresh] of this.knowledgeFreshnessIndicators) {
      if (input.includes(indicator)) {
        if (!freshness.includes(fresh)) {
          freshness.push(fresh)
        }
      }
    }

    return freshness
  }

  /**
   * Determine required tools
   */
  private static determineRequiredTools(primaryType: TaskType, secondaryTypes: TaskType[]): string[] {
    const tools: string[] = []

    const toolMapping: Record<TaskType, string[]> = {
      current_information_research: ['web_search'],
      research: ['web_search', 'retrieval'],
      data_analysis: ['file_reader', 'data_analyzer'],
      file_analysis: ['file_reader', 'retrieval'],
      coding: ['code_executor', 'file_writer'],
      debugging: ['code_executor', 'file_reader'],
      website_creation: ['code_generator', 'ui_generator', 'component_builder'],
      ui_design: ['ui_generator', 'component_builder'],
      workflow_creation: ['workflow_builder', 'n8n_generator'],
      automation: ['workflow_builder', 'scheduler'],
      tool_execution: ['calculator', 'current_time'],
      image_related: ['vision_analyzer'],
    }

    // Add tools for primary type
    if (toolMapping[primaryType]) {
      tools.push(...toolMapping[primaryType])
    }

    // Add tools for secondary types
    for (const type of secondaryTypes) {
      if (toolMapping[type]) {
        for (const tool of toolMapping[type]) {
          if (!tools.includes(tool)) {
            tools.push(tool)
          }
        }
      }
    }

    return tools
  }

  /**
   * Estimate number of subtasks
   */
  private static estimateSubtasks(complexity: TaskComplexity, primaryType: TaskType): number {
    const baseSubtasks: Record<TaskComplexity, number> = {
      simple: 1,
      moderate: 3,
      complex: 7,
      multi_stage: 12,
    }

    const multiplier: Record<TaskType, number> = {
      website_creation: 2,
      workflow_creation: 2,
      multi_step_execution: 1.5,
      research: 1.5,
      coding: 1.3,
    }

    const base = baseSubtasks[complexity] || 1
    const mult = multiplier[primaryType] || 1

    return Math.round(base * mult)
  }

  /**
   * Determine if verification is required
   */
  private static requiresVerification(taskType: TaskType): boolean {
    const verificationRequired: TaskType[] = [
      'coding',
      'debugging',
      'website_creation',
      'workflow_creation',
      'automation',
      'data_analysis',
    ]
    return verificationRequired.includes(taskType)
  }

  /**
   * Calculate confidence score
   */
  private static calculateConfidence(detectedTypes: TaskType[], input: string): number {
    if (detectedTypes.length === 0) {
      return 0.3
    }
    if (detectedTypes.length === 1) {
      return 0.7
    }
    if (detectedTypes.includes('mixed_task')) {
      return 0.8
    }
    return 0.6
  }

  /**
   * Generate reasoning for classification
   */
  private static generateReasoning(
    primaryType: TaskType,
    complexity: TaskComplexity,
    requiredKnowledge: KnowledgeFreshness[]
  ): string {
    const freshnessText = requiredKnowledge.join(', ')
    return `Classified as ${primaryType} with ${complexity} complexity. Requires ${freshnessText} information.`
  }

  /**
   * Suggest ALEX mode based on classification
   */
  private static suggestMode(classification: TaskClassification): 'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder' {
    const { primaryType, secondaryTypes } = classification

    const modeMapping: Record<TaskType, 'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder'> = {
      conversation: 'auto',
      factual_question: 'auto',
      research: 'research',
      current_information_research: 'research',
      writing: 'auto',
      coding: 'developer',
      debugging: 'developer',
      website_creation: 'developer',
      ui_design: 'developer',
      data_analysis: 'developer',
      document_creation: 'auto',
      image_related: 'auto',
      workflow_creation: 'automation',
      automation: 'automation',
      lead_generation: 'automation',
      marketing: 'automation',
      business_planning: 'auto',
      file_analysis: 'developer',
      multi_step_execution: 'agent_builder',
      tool_execution: 'auto',
      learning_teaching: 'tutor',
      mixed_task: 'agent_builder',
    }

    // Check secondary types for more specific mode
    for (const type of secondaryTypes) {
      if (modeMapping[type] && modeMapping[type] !== 'auto') {
        return modeMapping[type]
      }
    }

    return modeMapping[primaryType] || 'auto'
  }

  /**
   * Determine if agent mode should be used
   */
  private static shouldUseAgent(classification: TaskClassification): boolean {
    return (
      classification.complexity === 'complex' ||
      classification.complexity === 'multi_stage' ||
      classification.requiresPlanning ||
      classification.estimatedSubtasks > 5
    )
  }

  /**
   * Determine if web research should be used
   */
  private static shouldUseWebResearch(classification: TaskClassification): boolean {
    return (
      classification.requiredKnowledge.includes('current') ||
      classification.requiredKnowledge.includes('real_time') ||
      classification.primaryType === 'research' ||
      classification.primaryType === 'current_information_research'
    )
  }

  /**
   * Determine if retrieval should be used
   */
  private static shouldUseRetrieval(classification: TaskClassification): boolean {
    return (
      classification.primaryType === 'research' ||
      classification.primaryType === 'file_analysis' ||
      classification.primaryType === 'coding' ||
      classification.primaryType === 'learning_teaching'
    )
  }

  /**
   * Determine if memory should be used
   */
  private static shouldUseMemory(classification: TaskClassification): boolean {
    return (
      classification.primaryType === 'conversation' ||
      classification.primaryType === 'learning_teaching' ||
      classification.complexity === 'complex'
    )
  }
}
