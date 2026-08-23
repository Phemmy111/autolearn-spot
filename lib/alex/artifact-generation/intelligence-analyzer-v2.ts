/**
 * ALEX Intelligence Analyzer V2
 * 
 * Semantic conversation state management with structured specifications
 * Distinguishes known/inferred/blockers/recommendations
 * Maps answers to correct specification fields
 */

import { AutomationSpec, SpecState, createSpecState, updateSpec, mergeSpec } from './automation-spec'
import { selectPlatform } from './platform-capabilities'
import { AlexFile } from '../types'

export interface AnalysisResult {
  // Structured specification
  specState: SpecState
  
  // What's the current situation
  situation: 'new_request' | 'continuation' | 'ready_to_design' | 'ready_to_generate'
  
  // What should we do next
  nextAction: 'ask_question' | 'design_architecture' | 'generate_artifact' | 'clarify_ambiguity'
  
  // If asking, what's the question and what field are we resolving
  question?: {
    text: string
    field: string  // Which spec field this resolves
    context: string  // Why we're asking
    options?: string[]  // Optional choices to present
  }
  
  // If designing, what's the proposed architecture
  architectureProposal?: {
    description: string
    platform: string
    platformReasoning: string
    complexity: 'simple' | 'moderate' | 'complex'
    stages: string[]
    assumptions: string[]
    recommendations: string[]
  }
  
  // Explanation for the user
  explanation?: string
}

export class IntelligenceAnalyzerV2 {
  /**
   * Analyze the request with full semantic context
   */
  static async analyze(request: {
    content: string
    conversationHistory?: Array<{ role: string; content: string }>
    attachedFiles?: AlexFile[]
    existingSpecState?: SpecState
  }): Promise<AnalysisResult> {
    const { content, conversationHistory, attachedFiles, existingSpecState } = request
    
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] ===== ANALYZE START =====')
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Content:', content.substring(0, 100))
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Existing spec state:', existingSpecState ? 'present' : 'none')
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Has attached files:', !!attachedFiles, attachedFiles?.length || 0)
    
    // Start with existing state or create new
    const specState = existingSpecState || createSpecState()
    
    console.log('[Intelligence Analyzer V2] Current spec:', JSON.stringify(specState.spec, null, 2))
    
    // Determine if this is a continuation
    const isContinuation = this.detectContinuation(content, conversationHistory, specState)
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Is continuation:', isContinuation)
    
    if (isContinuation) {
      console.log('[DEBUG INTELLIGENCE ANALYZER V2] Routing to handleContinuation')
      return this.handleContinuation(content, specState)
    }
    
    // New request - analyze from scratch
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Routing to handleNewRequest')
    return this.handleNewRequest(content, attachedFiles, specState)
  }
  
  /**
   * Handle a new automation request
   */
  private static handleNewRequest(
    content: string,
    attachedFiles: AlexFile[] | undefined,
    specState: SpecState
  ): AnalysisResult {
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] ===== HANDLE NEW REQUEST =====')
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Content:', content.substring(0, 100))
    
    const lower = content.toLowerCase()
    
    // Detect automation type and domain
    const automationType = this.detectAutomationType(content)
    const domain = this.detectDomain(content)
    
    // Update spec
    specState.spec.automationType = automationType
    specState.spec.domain = domain
    specState.known.add('automationType')
    specState.known.add('domain')
    
    // Extract explicit specifications
    this.extractExplicitSpecs(content, specState)
    
    // Make intelligent inferences
    this.makeInferences(content, specState)
    
    // Select platform if not specified
    if (!specState.spec.platform) {
      console.log('[DEBUG INTELLIGENCE ANALYZER V2] Selecting platform')
      const platformSelection = selectPlatform({
        needsEmail: domain === 'email',
        needsAI: specState.spec.aiConfig?.enabled,
        needsDatabase: !!specState.spec.integrations?.databases?.length,
        needsComplexLogic: specState.spec.businessRules?.conditions ? specState.spec.businessRules.conditions.length > 3 : false,
        needsLoops: false,
        needsHumanApproval: specState.spec.humanApproval?.required,
        needsRAG: !!specState.spec.integrations?.knowledgeBase,
        complexity: specState.spec.architecture?.complexity,
        explicitPlatform: specState.spec.platform
      })
      
      console.log('[DEBUG INTELLIGENCE ANALYZER V2] Platform selection result:', {
        platform: platformSelection.platform,
        reasoning: platformSelection.reasoning
      })
      
      specState.spec.platform = platformSelection.platform
      specState.spec.platformReasoning = platformSelection.reasoning
      specState.recommended.add('platform')
      specState.spec.recommendations = specState.spec.recommendations || []
      specState.spec.recommendations.push(platformSelection.reasoning)
    }
    
    // Identify genuine blockers
    this.identifyBlockers(content, specState)
    
    // Make recommendations for missing but inferable info
    this.makeRecommendations(specState)
    
    // Determine next action
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Blockers check:', {
      blockerCount: specState.blockers.size,
      blockers: Array.from(specState.blockers)
    })
    
    if (specState.blockers.size > 0) {
      const blocker = Array.from(specState.blockers)[0]
      const question = this.formulateQuestion(blocker, specState)
      console.log('[DEBUG INTELLIGENCE ANALYZER V2] Formulated question:', {
        blocker,
        questionText: question.text,
        questionField: question.field,
        questionContext: question.context,
        hasOptions: !!question.options
      })
      return {
        specState,
        situation: 'new_request',
        nextAction: 'ask_question',
        question,
        explanation: this.buildExplanation(specState)
      }
    }
    
    // No blockers - ready to design architecture
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] No blockers, ready to design architecture')
    return {
      specState,
      situation: 'ready_to_design',
      nextAction: 'design_architecture',
      explanation: this.buildExplanation(specState)
    }
  }
  
  /**
   * Handle a continuation (user answering a question)
   */
  private static handleContinuation(content: string, specState: SpecState): AnalysisResult {
    console.log('[Intelligence Analyzer V2] Handling continuation')
    console.log('[Intelligence Analyzer V2] Question context:', specState.questionContext)
    
    const lower = content.toLowerCase()
    
    // Check if the answer includes field context (format: "field: value")
    const fieldMatch = content.match(/^([^:]+):\s*(.+)$/i)
    if (fieldMatch) {
      const field = fieldMatch[1].trim()
      const value = fieldMatch[2].trim()
      console.log('[Intelligence Analyzer V2] Parsed field:value format:', { field, value })
      this.mapAnswerToSpec(value, field, specState)
    } else if (specState.questionContext) {
      // Use database-restored question context
      this.mapAnswerToSpec(content, specState.questionContext, specState)
    } else {
      // No question context - try to infer what field this answers
      this.inferAnswerMapping(content, specState)
    }
    
    // Clear the question context
    specState.questionContext = undefined
    specState.currentQuestion = undefined
    
    // Re-evaluate blockers
    this.identifyBlockers(content, specState)
    
    // Make recommendations for any remaining gaps
    this.makeRecommendations(specState)
    
    // Determine next action
    if (specState.blockers.size > 0) {
      const blocker = Array.from(specState.blockers)[0]
      return {
        specState,
        situation: 'continuation',
        nextAction: 'ask_question',
        question: this.formulateQuestion(blocker, specState),
        explanation: this.buildExplanation(specState)
      }
    }
    
    // No blockers - ready to design architecture
    return {
      specState,
      situation: 'ready_to_design',
      nextAction: 'design_architecture',
      explanation: this.buildExplanation(specState)
    }
  }
  
  /**
   * Detect if this is a continuation
   */
  private static detectContinuation(
    content: string,
    history: Array<{ role: string; content: string }> | undefined,
    specState: SpecState
  ): boolean {
    // If we have an existing spec with a pending question, it's a continuation
    if (specState.questionContext) {
      return true
    }
    
    // Short, direct answers are likely continuations
    if (content.length < 100) {
      const lower = content.toLowerCase()
      if (lower.includes('yes') || lower.includes('no') || lower.includes('gmail') || 
          lower.includes('outlook') || lower.includes('gemini') || lower.includes('gpt') ||
          lower.includes('every') || lower.includes('all') || lower.includes('support')) {
        return true
      }
    }
    
    return false
  }
  
  /**
   * Detect automation type
   */
  private static detectAutomationType(content: string): AutomationSpec['automationType'] {
    const lower = content.toLowerCase()
    
    if (lower.includes('workflow') || lower.includes('automation')) return 'workflow'
    if (lower.includes('chatbot') || lower.includes('bot')) return 'chatbot'
    if (lower.includes('agent') || lower.includes('assistant')) return 'agent'
    if (lower.includes('pipeline')) return 'pipeline'
    if (lower.includes('integration')) return 'integration'
    
    return 'automation' // Default
  }
  
  /**
   * Detect automation domain
   */
  private static detectDomain(content: string): AutomationSpec['domain'] {
    const lower = content.toLowerCase()
    
    if (lower.includes('email') || lower.includes('gmail') || lower.includes('outlook')) return 'email'
    if (lower.includes('support') || lower.includes('customer')) return 'support'
    if (lower.includes('sales') || lower.includes('lead')) return 'sales'
    if (lower.includes('marketing')) return 'marketing'
    if (lower.includes('invoice') || lower.includes('finance')) return 'finance'
    if (lower.includes('ai') || lower.includes('artificial intelligence') || lower.includes('llm')) return 'ai'
    if (lower.includes('data') || lower.includes('etl')) return 'data'
    
    return 'custom' // Default
  }
  
  /**
   * Extract explicit specifications from content
   */
  private static extractExplicitSpecs(content: string, specState: SpecState): void {
    const lower = content.toLowerCase()
    
    // Platform
    if (lower.includes('n8n')) {
      specState.spec.platform = 'n8n'
      specState.known.add('platform')
    }
    if (lower.includes('zapier')) {
      specState.spec.platform = 'zapier'
      specState.known.add('platform')
    }
    if (lower.includes('make') || lower.includes('integromat')) {
      specState.spec.platform = 'make'
      specState.known.add('platform')
    }
    
    // Email provider
    if (lower.includes('gmail')) {
      specState.spec.integrations = specState.spec.integrations || {}
      specState.spec.integrations.emailProvider = 'gmail'
      specState.known.add('integrations.emailProvider')
    }
    if (lower.includes('outlook') || lower.includes('exchange')) {
      specState.spec.integrations = specState.spec.integrations || {}
      specState.spec.integrations.emailProvider = 'outlook'
      specState.known.add('integrations.emailProvider')
    }
    
    // AI provider/model
    if (lower.includes('gemini')) {
      specState.spec.integrations = specState.spec.integrations || {}
      specState.spec.integrations.aiProvider = 'google'
      specState.spec.integrations.aiModel = 'gemini'
      specState.known.add('integrations.aiProvider')
      specState.known.add('integrations.aiModel')
    }
    if (lower.includes('gpt') || lower.includes('openai')) {
      specState.spec.integrations = specState.spec.integrations || {}
      specState.spec.integrations.aiProvider = 'openai'
      specState.spec.integrations.aiModel = 'gpt-4'
      specState.known.add('integrations.aiProvider')
      specState.known.add('integrations.aiModel')
    }
    if (lower.includes('claude') || lower.includes('anthropic')) {
      specState.spec.integrations = specState.spec.integrations || {}
      specState.spec.integrations.aiProvider = 'anthropic'
      specState.spec.integrations.aiModel = 'claude-3'
      specState.known.add('integrations.aiProvider')
      specState.known.add('integrations.aiModel')
    }
    
    // Knowledge base
    if (lower.includes('pinecone')) {
      specState.spec.integrations = specState.spec.integrations || {}
      specState.spec.integrations.knowledgeBase = 'pinecone'
      specState.known.add('integrations.knowledgeBase')
    }
    if (lower.includes('notion')) {
      specState.spec.integrations = specState.spec.integrations || {}
      specState.spec.integrations.knowledgeBase = 'notion'
      specState.known.add('integrations.knowledgeBase')
    }
    if (lower.includes('confluence')) {
      specState.spec.integrations = specState.spec.integrations || {}
      specState.spec.integrations.knowledgeBase = 'confluence'
      specState.known.add('integrations.knowledgeBase')
    }
    
    // Trigger
    if (lower.includes('webhook')) {
      specState.spec.trigger = specState.spec.trigger || {}
      specState.spec.trigger.type = 'webhook'
      specState.known.add('trigger.type')
    }
    if (lower.includes('schedule') || lower.includes('daily') || lower.includes('cron')) {
      specState.spec.trigger = specState.spec.trigger || {}
      specState.spec.trigger.type = 'schedule'
      specState.known.add('trigger.type')
    }
    if (lower.includes('email') && !lower.includes('trigger')) {
      specState.spec.trigger = specState.spec.trigger || {}
      specState.spec.trigger.type = 'email'
      specState.known.add('trigger.type')
    }
    
    // Schedule details
    if (lower.includes('8 am') || lower.includes('8am') || lower.includes('8:00')) {
      specState.spec.schedule = specState.spec.schedule || {}
      specState.spec.schedule.enabled = true
      specState.spec.schedule.time = '08:00'
      specState.spec.schedule.frequency = 'daily'
      specState.known.add('schedule.time')
    }
    
    // AI enablement
    if (lower.includes('ai') || lower.includes('artificial intelligence') || lower.includes('understand') || 
        lower.includes('classify') || lower.includes('generate') || lower.includes('draft')) {
      specState.spec.aiConfig = specState.spec.aiConfig || { enabled: false }
      specState.spec.aiConfig.enabled = true
      specState.known.add('aiConfig.enabled')
    }
    
    // Human approval/escalation
    if (lower.includes('escalate') || lower.includes('human') || lower.includes('uncertain') || 
        lower.includes('confidence')) {
      specState.spec.humanApproval = specState.spec.humanApproval || { required: false }
      specState.spec.humanApproval.required = true
      specState.known.add('humanApproval.required')
    }
    
    // Reply scope for email responders
    if (lower.includes('every') || lower.includes('all')) {
      specState.spec.businessRules = specState.spec.businessRules || {}
      specState.spec.businessRules.routing = specState.spec.businessRules.routing || []
      specState.spec.businessRules.routing.push('reply to all emails')
      specState.known.add('businessRules.routing')
    }
    if (lower.includes('support') || lower.includes('customer')) {
      specState.spec.businessRules = specState.spec.businessRules || {}
      specState.spec.businessRules.routing = specState.spec.businessRules.routing || []
      specState.spec.businessRules.routing.push('reply to support inquiries only')
      specState.known.add('businessRules.routing')
    }
    
    // Filename
    const filenameMatch = content.match(/filename[:\s]+([^\s,\.]+)/i)
    if (filenameMatch) {
      specState.spec.filename = filenameMatch[1]
      specState.known.add('filename')
    }
  }
  
  /**
   * Make intelligent inferences
   */
  private static makeInferences(content: string, specState: SpecState): void {
    const lower = content.toLowerCase()
    
    // If email domain and no trigger specified, infer email trigger
    if (specState.spec.domain === 'email' && !specState.spec.trigger?.type) {
      specState.spec.trigger = specState.spec.trigger || {}
      specState.spec.trigger.type = 'email'
      specState.inferred.add('trigger.type')
      specState.spec.assumptions = specState.spec.assumptions || []
      specState.spec.assumptions.push('Using email trigger since this is an email automation')
    }
    
    // If AI enabled and no model specified, recommend a model
    if (specState.spec.aiConfig?.enabled && !specState.spec.integrations?.aiModel) {
      specState.spec.integrations = specState.spec.integrations || {}
      specState.spec.integrations.aiModel = 'gpt-4' // Default recommendation
      specState.recommended.add('integrations.aiModel')
      specState.spec.recommendations = specState.spec.recommendations || []
      specState.spec.recommendations.push('I recommend GPT-4 for AI processing, but this can be configured')
    }
    
    // If human approval mentioned, add confidence threshold
    if (specState.spec.humanApproval?.required && !specState.spec.aiConfig?.confidenceThreshold) {
      specState.spec.aiConfig = specState.spec.aiConfig || { enabled: false }
      specState.spec.aiConfig.confidenceThreshold = 0.7
      specState.recommended.add('aiConfig.confidenceThreshold')
      specState.spec.assumptions = specState.spec.assumptions || []
      specState.spec.assumptions.push('Using 70% confidence threshold for human escalation')
    }
    
    // If no logging specified, recommend it for production
    if (!specState.spec.persistence?.enabled) {
      specState.spec.persistence = specState.spec.persistence || { enabled: false }
      specState.spec.persistence.enabled = true
      specState.recommended.add('persistence.enabled')
      specState.spec.assumptions = specState.spec.assumptions || []
      specState.spec.assumptions.push('Enabling logging for audit and debugging')
    }
  }
  
  /**
   * Identify genuine blockers
   */
  private static identifyBlockers(content: string, specState: SpecState): void {
    specState.blockers.clear()
    
    const domain = specState.spec.domain
    const hasAI = specState.spec.aiConfig?.enabled
    
    // Email domain blockers
    if (domain === 'email') {
      // Email provider is a blocker
      if (!specState.spec.integrations?.emailProvider) {
        specState.blockers.add('integrations.emailProvider')
      }
      
      // For AI email, need delivery channel
      if (hasAI && !specState.spec.outputs?.destinations?.length) {
        specState.blockers.add('outputs.destinations')
      }
    }
    
    // AI customer support blockers
    if (domain === 'support' && hasAI) {
      // Knowledge base is a blocker if explicitly mentioned in request
      const lower = content.toLowerCase()
      if (lower.includes('knowledge base') && !specState.spec.integrations?.knowledgeBase) {
        specState.blockers.add('integrations.knowledgeBase')
      }
      
      // AI provider is a blocker
      if (!specState.spec.integrations?.aiProvider) {
        specState.blockers.add('integrations.aiProvider')
      }
    }
    
    // Scheduled automation blockers
    if (specState.spec.schedule?.enabled && !specState.spec.outputs?.destinations?.length) {
      specState.blockers.add('outputs.destinations')
    }
    
    // Chatbot blockers
    if (specState.spec.automationType === 'chatbot' && !specState.spec.outputs?.destinations?.length) {
      specState.blockers.add('outputs.destinations')
    }
  }
  
  /**
   * Make recommendations for missing but inferable info
   */
  private static makeRecommendations(specState: SpecState): void {
    // These are not blockers, but useful recommendations
    if (!specState.spec.persistence?.logLevel) {
      specState.spec.persistence = specState.spec.persistence || { enabled: false }
      specState.spec.persistence.logLevel = 'info'
      specState.recommended.add('persistence.logLevel')
    }
    
    if (!specState.spec.errorHandling?.retryStrategy) {
      specState.spec.errorHandling = specState.spec.errorHandling || {}
      specState.spec.errorHandling.retryStrategy = 'exponential-backoff'
      specState.spec.errorHandling.maxRetries = 3
      specState.recommended.add('errorHandling.retryStrategy')
    }
  }
  
  /**
   * Map user answer to specification field based on question context
   */
  private static mapAnswerToSpec(answer: string, context: string, specState: SpecState): void {
    const lower = answer.toLowerCase()
    
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Mapping answer to context:', { context, answer, lower })
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Known before mapping:', Array.from(specState.known))
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Blockers before mapping:', Array.from(specState.blockers))
    
    // Handle "Recommend for me" option
    if (lower.includes('recommend')) {
      console.log('[DEBUG INTELLIGENCE ANALYZER V2] Using recommendation for context:', context)
      this.handleRecommendation(context, specState)
      console.log('[DEBUG INTELLIGENCE ANALYZER V2] Known after recommendation:', Array.from(specState.known))
      console.log('[DEBUG INTELLIGENCE ANALYZER V2] Blockers after recommendation:', Array.from(specState.blockers))
      return
    }
    
    switch (context) {
      case 'integrations.emailProvider':
        if (lower.includes('gmail')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.emailProvider = 'gmail'
          specState.known.add('integrations.emailProvider')
          specState.blockers.delete('integrations.emailProvider')
          console.log('[DEBUG INTELLIGENCE ANALYZER V2] Mapped Gmail, known:', Array.from(specState.known))
        } else if (lower.includes('outlook') || lower.includes('exchange')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.emailProvider = 'outlook'
          specState.known.add('integrations.emailProvider')
          specState.blockers.delete('integrations.emailProvider')
          console.log('[DEBUG INTELLIGENCE ANALYZER V2] Mapped Outlook, known:', Array.from(specState.known))
        } else if (lower.includes('smtp') || lower.includes('imap')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.emailProvider = 'imap/smtp'
          specState.known.add('integrations.emailProvider')
          specState.blockers.delete('integrations.emailProvider')
          console.log('[DEBUG INTELLIGENCE ANALYZER V2] Mapped IMAP/SMTP, known:', Array.from(specState.known))
        }
        break
        
      case 'integrations.aiProvider':
      case 'integrations.aiModel':
        if (lower.includes('gemini')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.aiProvider = 'google'
          specState.spec.integrations.aiModel = 'gemini'
          specState.known.add('integrations.aiProvider')
          specState.known.add('integrations.aiModel')
        } else if (lower.includes('gpt') || lower.includes('openai')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.aiProvider = 'openai'
          specState.spec.integrations.aiModel = 'gpt-4'
          specState.known.add('integrations.aiProvider')
          specState.known.add('integrations.aiModel')
        } else if (lower.includes('claude') || lower.includes('anthropic')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.aiProvider = 'anthropic'
          specState.spec.integrations.aiModel = 'claude-3'
          specState.known.add('integrations.aiProvider')
          specState.known.add('integrations.aiModel')
        }
        break
        
      case 'integrations.knowledgeBase':
        if (lower.includes('none') || lower.includes('no')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.knowledgeBase = 'none'
          specState.known.add('integrations.knowledgeBase')
        } else if (lower.includes('pinecone') || lower.includes('vector')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.knowledgeBase = 'pinecone'
          specState.known.add('integrations.knowledgeBase')
        } else if (lower.includes('notion')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.knowledgeBase = 'notion'
          specState.known.add('integrations.knowledgeBase')
        } else if (lower.includes('confluence')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.knowledgeBase = 'confluence'
          specState.known.add('integrations.knowledgeBase')
        } else if (lower.includes('google drive') || lower.includes('drive')) {
          specState.spec.integrations = specState.spec.integrations || {}
          specState.spec.integrations.knowledgeBase = 'google-drive'
          specState.known.add('integrations.knowledgeBase')
        }
        break
        
      case 'businessRules.routing':
        if (lower.includes('every') || lower.includes('all')) {
          specState.spec.businessRules = specState.spec.businessRules || {}
          specState.spec.businessRules.routing = specState.spec.businessRules.routing || []
          specState.spec.businessRules.routing.push('reply to all emails')
          specState.known.add('businessRules.routing')
        } else if (lower.includes('support') || lower.includes('customer')) {
          specState.spec.businessRules = specState.spec.businessRules || {}
          specState.spec.businessRules.routing = specState.spec.businessRules.routing || []
          specState.spec.businessRules.routing.push('reply to support inquiries only')
          specState.known.add('businessRules.routing')
        }
        break
        
      case 'outputs.destinations':
        if (lower.includes('email') || lower.includes('gmail')) {
          specState.spec.outputs = specState.spec.outputs || {}
          specState.spec.outputs.destinations = ['email']
          specState.known.add('outputs.destinations')
          specState.blockers.delete('outputs.destinations')
        } else if (lower.includes('slack')) {
          specState.spec.outputs = specState.spec.outputs || {}
          specState.spec.outputs.destinations = ['slack']
          specState.known.add('outputs.destinations')
          specState.blockers.delete('outputs.destinations')
        } else if (lower.includes('telegram') || lower.includes('whatsapp')) {
          specState.spec.outputs = specState.spec.outputs || {}
          specState.spec.outputs.destinations = [lower.includes('telegram') ? 'telegram' : 'whatsapp']
          specState.known.add('outputs.destinations')
          specState.blockers.delete('outputs.destinations')
        }
        break
        
      default:
        console.log('[Intelligence Analyzer V2] Unknown question context:', context)
    }
  }
  
  /**
   * Handle "Recommend for me" option
   */
  private static handleRecommendation(context: string, specState: SpecState): void {
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Handling recommendation for context:', context)
    
    switch (context) {
      case 'integrations.emailProvider':
        specState.spec.integrations = specState.spec.integrations || {}
        specState.spec.integrations.emailProvider = 'gmail'
        specState.known.add('integrations.emailProvider')
        specState.blockers.delete('integrations.emailProvider')
        specState.recommended.add('integrations.emailProvider')
        specState.spec.assumptions = specState.spec.assumptions || []
        specState.spec.assumptions.push('I recommend Gmail as it has excellent IMAP support and is widely used')
        break
        
      case 'integrations.aiProvider':
      case 'integrations.aiModel':
        specState.spec.integrations = specState.spec.integrations || {}
        specState.spec.integrations.aiProvider = 'openai'
        specState.spec.integrations.aiModel = 'gpt-4'
        specState.known.add('integrations.aiModel')
        specState.blockers.delete('integrations.aiModel')
        specState.blockers.delete('integrations.aiProvider')
        specState.recommended.add('integrations.aiModel')
        specState.spec.assumptions = specState.spec.assumptions || []
        specState.spec.assumptions.push('I recommend GPT-4 for its strong reasoning and wide compatibility')
        break
        
      case 'integrations.knowledgeBase':
        specState.spec.integrations = specState.spec.integrations || {}
        specState.spec.integrations.knowledgeBase = 'notion'
        specState.known.add('integrations.knowledgeBase')
        specState.blockers.delete('integrations.knowledgeBase')
        specState.recommended.add('integrations.knowledgeBase')
        specState.spec.assumptions = specState.spec.assumptions || []
        specState.spec.assumptions.push('I recommend Notion as it\'s easy to set up and integrates well with many tools')
        break
        
      case 'businessRules.routing':
        specState.spec.businessRules = specState.spec.businessRules || {}
        specState.spec.businessRules.routing = specState.spec.businessRules.routing || []
        specState.spec.businessRules.routing.push('reply to all emails')
        specState.known.add('businessRules.routing')
        specState.blockers.delete('businessRules.routing')
        specState.recommended.add('businessRules.routing')
        specState.spec.assumptions = specState.spec.assumptions || []
        specState.spec.assumptions.push('I recommend replying to all emails for maximum automation')
        break
        
      case 'outputs.destinations':
        specState.spec.outputs = specState.spec.outputs || {}
        specState.spec.outputs.destinations = ['email']
        specState.known.add('outputs.destinations')
        specState.blockers.delete('outputs.destinations')
        specState.recommended.add('outputs.destinations')
        specState.spec.assumptions = specState.spec.assumptions || []
        specState.spec.assumptions.push('I recommend email as it\'s universal and reliable')
        console.log('[DEBUG INTELLIGENCE ANALYZER V2] Recommended email destinations, known:', Array.from(specState.known))
        break

      default:
        console.log('[DEBUG INTELLIGENCE ANALYZER V2] Unknown recommendation context:', context)
    }
    
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] After recommendation - known:', Array.from(specState.known), 'blockers:', Array.from(specState.blockers))
  }
        
      default:
        console.log('[DEBUG INTELLIGENCE ANALYZER V2] Unknown recommendation context:', context)
    }
    
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Final known after mapping:', Array.from(specState.known))
    console.log('[DEBUG INTELLIGENCE ANALYZER V2] Final blockers after mapping:', Array.from(specState.blockers))
  }
  
  /**
   * Infer which field an answer is for when there's no question context
   */
  private static inferAnswerMapping(answer: string, specState: SpecState): void {
    const lower = answer.toLowerCase()
    
    // Check if this answers an email provider question
    if (specState.blockers.has('integrations.emailProvider')) {
      if (lower.includes('gmail') || lower.includes('outlook') || lower.includes('exchange')) {
        this.mapAnswerToSpec(answer, 'integrations.emailProvider', specState)
        return
      }
    }
    
    // Check if this answers an AI provider question
    if (specState.blockers.has('integrations.aiProvider') || specState.blockers.has('integrations.aiModel')) {
      if (lower.includes('gemini') || lower.includes('gpt') || lower.includes('claude')) {
        this.mapAnswerToSpec(answer, 'integrations.aiProvider', specState)
        return
      }
    }
    
    // Check if this answers a knowledge base question
    if (specState.blockers.has('integrations.knowledgeBase')) {
      if (lower.includes('pinecone') || lower.includes('notion') || lower.includes('confluence')) {
        this.mapAnswerToSpec(answer, 'integrations.knowledgeBase', specState)
        return
      }
    }
    
    // Check if this answers a routing/reply scope question
    if (specState.blockers.has('businessRules.routing')) {
      if (lower.includes('every') || lower.includes('all') || lower.includes('support')) {
        this.mapAnswerToSpec(answer, 'businessRules.routing', specState)
        return
      }
    }
    
    // Check if this answers an output destination question
    if (specState.blockers.has('outputs.destinations')) {
      if (lower.includes('email') || lower.includes('slack') || lower.includes('telegram') || lower.includes('whatsapp')) {
        this.mapAnswerToSpec(answer, 'outputs.destinations', specState)
        return
      }
    }
    
    console.log('[Intelligence Analyzer V2] Could not infer answer mapping for:', answer)
  }
  
  /**
   * Formulate a question for a blocker
   */
  private static formulateQuestion(blocker: string, specState: SpecState): AnalysisResult['question'] {
    switch (blocker) {
      case 'integrations.emailProvider':
        return {
          text: 'Which email provider should receive the emails?',
          field: 'integrations.emailProvider',
          context: 'integrations.emailProvider',
          options: ['Gmail', 'Outlook', 'IMAP/SMTP', 'Recommend for me']
        }
        
      case 'integrations.aiProvider':
      case 'integrations.aiModel':
        return {
          text: 'Which AI provider/model should generate responses?',
          field: 'integrations.aiModel',
          context: 'integrations.aiProvider',
          options: ['Recommend for me', 'OpenAI GPT-4', 'Anthropic Claude-3', 'Google Gemini']
        }
        
      case 'integrations.knowledgeBase':
        return {
          text: 'Which knowledge base system should I query?',
          field: 'integrations.knowledgeBase',
          context: 'integrations.knowledgeBase',
          options: ['None', 'Notion', 'Confluence', 'Google Drive', 'Pinecone/Vector DB', 'Custom API']
        }
        
      case 'businessRules.routing':
        return {
          text: 'Should it reply to every incoming email, or only support/customer inquiries?',
          field: 'businessRules.routing',
          context: 'businessRules.routing',
          options: ['Every email', 'Support inquiries only', 'Custom rules']
        }
        
      case 'outputs.destinations':
        return {
          text: 'Where should the reminder/notification be sent?',
          field: 'outputs.destinations',
          context: 'outputs.destinations',
          options: ['Email', 'Slack', 'Telegram', 'WhatsApp', 'Recommend for me']
        }
        
      default:
        return {
          text: `I need to know: ${blocker}`,
          field: blocker,
          context: blocker
        }
    }
  }
  
  /**
   * Build an explanation for the user
   */
  private static buildExplanation(specState: SpecState): string {
    const parts: string[] = []
    
    // Only show platform explanation on first question, not on every continuation
    if (specState.known.size === 0 && specState.spec.platform && specState.spec.platformReasoning) {
      parts.push(`I recommend **${specState.spec.platform}** because ${specState.spec.platformReasoning.toLowerCase()}.`)
    }
    
    // Only show what we understand on first question
    if (specState.known.size === 0 && (specState.spec.description || specState.spec.automationType)) {
      parts.push(`I understand you want to build a **${specState.spec.description || specState.spec.automationType}**.`)
    }
    
    // For continuations, keep it minimal - just the question context
    if (specState.known.size > 0) {
      parts.push(`Thanks for the information.`)
    }
    
    return parts.join(' ')
  }
}
