/**
 * ALEX AI Orchestrator
 * 
 * The new "brain" of ALEX - AI-driven decision-making for next actions
 * Replaces template-driven blocker/question system
 */

import { WorkflowAIService } from '../artifact-generation/workflow-ai-service'
import { 
  AlexNextAction, 
  AutomationPlan, 
  ConversationContext, 
  UserIntent,
  OrchestrationResult,
  RequirementUpdate
} from './types'
import { OrchestrationQuestionService } from './orchestration-question-service'
import { estimateTokens } from '../token-estimation'

export class AIOrchestrator {
  private static instance: AIOrchestrator
  
  private constructor() {
    // No in-memory question tracker - using persistent service
  }

  /**
   * Token estimation helper for conversational path budgeting
   */
  private estimateTokens(text: string): number {
    if (!text) return 0
    const normalizedText = text.replace(/\s+/g, ' ').trim()
    return Math.ceil(normalizedText.length / 4) // Conservative: ~4 chars per token
  }
  
  static getInstance(): AIOrchestrator {
    if (!AIOrchestrator.instance) {
      AIOrchestrator.instance = new AIOrchestrator()
    }
    return AIOrchestrator.instance
  }
  
  /**
   * Get question tracker (for backward compatibility)
   * Returns the persistent question service
   */
  static getQuestionTracker() {
    return OrchestrationQuestionService
  }
  
  /**
   * Main orchestration entry point
   * AI decides what to do next based on conversation context and automation plan
   * Phase B: Support conversational mode via ALEX_CONVERSATIONAL_MODE feature flag
   */
  async orchestrate(
    userMessage: string,
    context: ConversationContext,
    currentPlan: AutomationPlan | null
  ): Promise<OrchestrationResult> {
    console.log('[AI Orchestrator] ===== ORCHESTRATION START =====')
    console.log('[AI Orchestrator] User message:', userMessage.substring(0, 100))
    console.log('[AI Orchestrator] Current plan:', currentPlan ? 'present' : 'none')
    console.log('[AI Orchestrator] Conversation mode:', context.mode)

    // Phase B: Check conversational mode feature flag
    const enableConversationalMode = process.env.ALEX_CONVERSATIONAL_MODE === 'true'
    console.log('[Phase B] Conversational mode:', enableConversationalMode)
    
    // P1: Log AI decision for confirmation handling
    console.log('[P1 ORCHESTRATION] Orchestration starting', {
      userMessage: userMessage.substring(0, 50),
      hasCurrentPlan: !!currentPlan
    })
    
    // Clear old questions periodically
    if (context.userId && context.conversationId) {
      await OrchestrationQuestionService.clearOldQuestions({
        conversationId: context.conversationId,
        userId: context.userId
      })
    }
    
    // Phase B: Branch based on conversational mode
    let aiDecision: OrchestrationResult
    if (enableConversationalMode) {
      // New path: Natural language conversation
      aiDecision = await this.askAIDecisionConversational(userMessage, context, currentPlan)
    } else {
      // Legacy path: JSON-forced orchestration
      aiDecision = await this.askAIDecision(userMessage, context, currentPlan)
    }
    
    console.log('[AI Orchestrator] AI decision:', {
      intent: aiDecision.intent,
      actionType: aiDecision.action.type,
      confidence: aiDecision.confidence
    })
    console.log('[FORENSIC] AI decision for user message:', userMessage)
    console.log('[FORENSIC] AI action type:', aiDecision.action.type)
    console.log('[FORENSIC] AI action has plan:', !!aiDecision.action.plan)
    console.log('[FORENSIC] AI has updatedPlan:', !!aiDecision.updatedPlan)
    if (aiDecision.action.plan) {
      console.log('[FORENSIC] AI action.plan platform:', aiDecision.action.plan.platform?.name)
    }
    if (aiDecision.updatedPlan) {
      console.log('[FORENSIC] AI updatedPlan platform:', aiDecision.updatedPlan.platform?.name)
    }
    
    // P1: Log confirmation-related actions
    if (aiDecision.action.type === 'execute' || aiDecision.action.type === 'generate') {
      console.log('[P1 CONFIRMATION] AI selected generation/execute action', {
        actionType: aiDecision.action.type,
        confirmationRequired: aiDecision.action.confirmationRequired
      })
    }
    
    if (aiDecision.intent === 'answer_question') {
      console.log('[P1 CONFIRMATION] AI detected answer_question intent', {
        userMessage: userMessage.substring(0, 50)
      })
    }
    
    // P1: Log revision detection
    if (aiDecision.intent === 'revise_automation') {
      console.log('[P1 REVISION] AI detected revision intent', {
        userMessage: userMessage.substring(0, 50)
      })
    }
    
    // Update plan if provided
    let updatedPlan = currentPlan
    if (aiDecision.updatedPlan) {
      updatedPlan = aiDecision.updatedPlan
      updatedPlan.lastUpdated = new Date().toISOString()
      console.log('[AI Orchestrator] Plan updated by AI, platform:', updatedPlan.platform?.name || 'no platform')
    }
    
    // Track questions if clarification action
    if (aiDecision.action.type === 'clarify' && context.userId && context.conversationId) {
      const question = aiDecision.action.question
      const contextStr = aiDecision.action.reason || 'general'
      
      const shouldAsk = await OrchestrationQuestionService.shouldAsk({
        conversationId: context.conversationId,
        userId: context.userId,
        question,
        questionContext: contextStr
      })
      
      if (shouldAsk) {
        await OrchestrationQuestionService.recordQuestion({
          conversationId: context.conversationId,
          userId: context.userId,
          question,
          questionContext: contextStr,
          questionType: 'clarify',
          orchestrationAction: aiDecision.action.type
        })
        console.log('[P1] QuestionTracker: Question allowed to proceed (not duplicate)')
      } else {
        console.log('[P1] QuestionTracker: Question appears duplicate, but AI decision preserved')
        console.log('[P1] QuestionTracker: AI may choose to reformulate or proceed regardless')
        // P1: Do NOT override AI decision
        // Let the AI decide whether to reformulate or proceed
        // The tracker is advisory, not authoritative
      }
    }
    
    // Track answers if this looks like an answer to a previous question
    if (aiDecision.intent === 'answer_question' && context.userId && context.conversationId) {
      const unanswered = await OrchestrationQuestionService.getUnansweredQuestions({
        conversationId: context.conversationId,
        userId: context.userId
      })
      
      if (unanswered.length > 0) {
        // Try to match this answer to a recent question
        const mostRecent = unanswered[0]
        await OrchestrationQuestionService.recordAnswer({
          conversationId: context.conversationId,
          userId: context.userId,
          question: mostRecent.question,
          answer: userMessage
        })
      }
    }
    
    return {
      action: aiDecision.action,
      intent: aiDecision.intent,
      updatedPlan,
      confidence: aiDecision.confidence,
      reasoning: aiDecision.reasoning
    }
  }
  
  /**
   * Ask AI to decide what to do next
   * This is the core AI decision-making logic
   */
  private async askAIDecision(
    userMessage: string,
    context: ConversationContext,
    currentPlan: AutomationPlan | null
  ): Promise<OrchestrationResult> {
    const aiService = WorkflowAIService.getInstance()
    
    // Build comprehensive conversation context for AI
    const recentMessages = context.messages.slice(-20).map(m => 
      `${m.role}: ${m.content.substring(0, 500)}`
    ).join('\n')
    
    const planContext = currentPlan 
      ? `\nCurrent automation plan:\n${JSON.stringify(currentPlan, null, 2)}`
      : '\nNo current automation plan - this is a new request'
    
    console.log('[FORENSIC] AI Orchestrator conversation context diagnostics:')
    console.log('[FORENSIC] Total messages in context:', context.messages.length)
    console.log('[FORENSIC] Recent messages count:', Math.min(20, context.messages.length))
    console.log('[FORENSIC] Recent messages preview:', recentMessages.substring(0, 300))
    console.log('[FORENSIC] Plan context length:', planContext.length)
    console.log('[FORENSIC] currentPlan exists:', !!currentPlan)
    if (currentPlan) {
      console.log('[FORENSIC] currentPlan objective:', currentPlan.objective)
    }
    
    const prompt = `You are ALEX, an intelligent automation expert. Your job is to decide what to do next based on the user's message and conversation context.

User's message: ${userMessage}

Conversation context:
Mode: ${context.mode}
Recent messages (last 20):
${recentMessages}
${planContext}

Determine:
1. What is the user's intent? (new_automation, revise_automation, answer_question, clarification, brainstorm_request, recommendation_request, unrelated_conversation, confirmation, cancellation)
2. What should ALEX do next? (respond, clarify, recommend, brainstorm, plan, generate, execute, revise)
3. What is your confidence in this decision? (0-1)
4. What is your reasoning?

Intent Detection Guidelines:
- new_automation: User wants to create a completely new automation (e.g., "Create a bot", "Build a workflow", "Make an automation")
- revise_automation: User wants to change an existing plan (e.g., "Actually use Slack instead", "Change the trigger", "Modify the platform")
- answer_question: User is providing information in response to a previous question
- clarification: User is asking for clarification about something
- brainstorm_request: User explicitly wants to brainstorm or explore options
- recommendation_request: User is asking for recommendations or suggestions
- unrelated_conversation: User is chatting about something unrelated to automation
- confirmation: User is confirming or approving something
- cancellation: User wants to cancel or abandon the current task

For each action type:
- respond: Provide a conversational response acknowledging the user
- clarify: Ask a specific question to gather necessary information. Include reason for asking and optional answer choices.
- recommend: Suggest a platform, approach, or solution with reasoning
- brainstorm: Generate creative ideas or alternatives
- plan: Create or update an automation plan with structured information
- generate: The automation is sufficiently specified - proceed to generate the artifact
- execute: Execute the plan (generate artifact) - optionally require confirmation
- revise: Revise the existing plan based on user feedback

IMPORTANT GUIDELINES:
- DO NOT mechanically enumerate fields like "trigger?", "platform?", "inputs?"
- DO ask meaningful questions only when necessary for the automation
- DO infer reasonable defaults when possible
- DO recommend platforms with reasoning, don't just ask "which platform?"
- DO detect if this is a new automation request vs a revision
- DO detect if the user wants to abandon the current task and start fresh
- DO prevent asking the same question twice
- DO accept natural language answers, don't require field:value format
- DO handle requirement changes gracefully (e.g., "actually use Slack instead")
- DO detect when enough information is available to proceed
- DO use the full conversation context to understand user intent
- DO maintain plan evolution across conversation turns
- DO use the current plan to detect revisions vs new requests
- P2-A: EXPLICITLY DISTINGUISH between:
  * requirements (confirmed user requests - preserve verbatim where appropriate)
  * recommendations (AI suggestions with reasoning - not treated as requirements)
  * assumptions (information assumed because missing - explicit metadata required)
  * unresolved (information needed before proceeding - consider clarification if critical)
- P2-A: DO NOT silently convert assumptions into confirmed requirements
- P2-A: DO NOT claim that an assumed platform/integration/account exists unless confirmed
- P2-A: SURFACE important assumptions when they materially affect execution
- P2-A: ASK for clarification when an assumption would create significant execution risk
- P2-A: Use enhanced assumption structure: { statement, basis, confidence, category }
- P2-A: Use enhanced recommendation structure: { statement, reasoning, priority }
- If the user says "forget that", "start over", "never mind", or similar, treat as new request
- If the user says "actually", "change", "modify", "instead", or similar, treat as revision
- If the user provides direct information without a question mark, treat as answer
- If the user asks "what would you recommend", treat as recommendation request
- If the user asks "brainstorm", "ideas", "options", treat as brainstorm request

Return ONLY valid JSON in this exact format:
{
  "intent": "intent_type",
  "action": {
    "type": "action_type",
    "message": "response message if applicable",
    "question": "question text if clarify",
    "reason": "why asking if clarify",
    "options": ["option1", "option2"] if clarify,
    "recommendations": ["rec1", "rec2"] if recommend,
    "ideas": ["idea1", "idea2"] if brainstorm,
    "plan": { automation plan object } if plan/generate/execute/revise,
    "confirmationRequired": true/false if execute
  },
  "updatedPlan": { updated automation plan object if applicable } or null,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of your decision"
}

If no plan update is needed, set "updatedPlan" to null.
If this is unrelated conversation, return action type "respond" with a helpful message.`

    console.log('[AI Orchestrator] Calling AI for decision with prompt length:', prompt.length)
    
    try {
      const response = await aiService.generateResponse(prompt)
      console.log('[AI Orchestrator] AI response received:', response.substring(0, 500))
      
      // Parse JSON response
      const jsonMatch = response.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const result = JSON.parse(jsonMatch[0])
        
        // Phase 2: Extract requirement updates from updatedPlan
        const requirementUpdate = this.extractRequirementUpdate(result.updatedPlan, currentPlan)
        
        // Validate and convert to typed result
        return {
          action: this.validateAction(result.action),
          intent: result.intent as UserIntent,
          updatedPlan: result.updatedPlan || undefined,
          confidence: result.confidence || 0.5,
          reasoning: result.reasoning,
          requirementUpdate // Phase 2: Include requirement update
        }
      }
      
      // Fallback if JSON parsing fails
      console.error('[AI Orchestrator] Failed to parse AI decision, using fallback')
      return this.getFallbackDecision(userMessage, currentPlan, context)
    } catch (error) {
      console.error('[AI Orchestrator] AI decision failed, using fallback:', error)
      return this.getFallbackDecision(userMessage, currentPlan, context)
    }
  }

  /**
   * Phase B: Conversational AI decision path
   * Returns natural language response without requiring JSON
   * Requirements are extracted separately via deterministic patterns
   */
  private async askAIDecisionConversational(
    userMessage: string,
    context: ConversationContext,
    currentPlan: AutomationPlan | null
  ): Promise<OrchestrationResult> {
    const aiService = WorkflowAIService.getInstance()
    
    // Phase 3C.1: Token budgeting for conversational path
    // Get provider-safe input budget
    const providerInputBudget = 6400 // 80% of 8000 TPM limit
    
    console.log('[Phase B Token Budget] Provider input budget:', providerInputBudget)
    
    // Build prompt components with token estimation
    const systemPrompt = `You are ALEX (AutoLearn Intelligence & Execution Agent), an automation expert and conversational AI assistant.

Your role:
- Help users understand automation concepts
- Assist with designing workflows and integrations
- Answer questions about n8n, automation platforms, APIs, webhooks, and related technologies
- Guide users through planning automations when they're ready
- Respond naturally and conversationally`
    
    const systemPromptTokens = this.estimateTokens(systemPrompt)
    console.log('[Phase B Token Budget] System prompt tokens:', systemPromptTokens)
    
    // Build conversation context with token-aware selection
    // Priority: most recent messages first, drop oldest if budget exceeded
    let conversationContext = ''
    let conversationTokens = 0
    const maxConversationTokens = providerInputBudget - systemPromptTokens - 500 // Reserve 500 for plan + user message
    
    // Build messages from newest to oldest to prioritize recent context
    const recentMessagesReversed = [...context.messages].reverse()
    for (const message of recentMessagesReversed) {
      const messageText = `${message.role}: ${message.content.substring(0, 200)}` // Shorter limit for budgeting
      const messageTokens = this.estimateTokens(messageText)
      
      if (conversationTokens + messageTokens <= maxConversationTokens) {
        conversationContext = messageText + '\n' + conversationContext
        conversationTokens += messageTokens
      } else {
        console.log('[Phase B Token Budget] Skipping message to stay within budget')
        break
      }
    }
    
    console.log('[Phase B Token Budget] Conversation context tokens:', conversationTokens)
    console.log('[Phase B Token Budget] Messages included:', recentMessagesReversed.length)
    
    // Build plan context with token awareness
    let planContext = ''
    let planTokens = 0
    const maxPlanTokens = providerInputBudget - systemPromptTokens - conversationTokens - 200 // Reserve 200 for user message
    
    if (currentPlan) {
      // Compact plan representation for token efficiency
      const compactPlan = {
        objective: currentPlan.objective,
        platform: currentPlan.platform?.name,
        status: currentPlan.status,
        stageCount: currentPlan.architecture?.stages?.length || 0
      }
      const planText = `\nCurrent automation plan:\n${JSON.stringify(compactPlan, null, 2)}`
      const estimatedPlanTokens = this.estimateTokens(planText)
      
      if (estimatedPlanTokens <= maxPlanTokens) {
        planContext = planText
        planTokens = estimatedPlanTokens
      } else {
        console.log('[Phase B Token Budget] Plan too large, using minimal representation')
        planContext = `\nCurrent automation plan: ${currentPlan.objective}`
        planTokens = this.estimateTokens(planContext)
      }
    } else {
      planContext = '\nNo current automation plan - this is a new request'
      planTokens = this.estimateTokens(planContext)
    }
    
    console.log('[Phase B Token Budget] Plan context tokens:', planTokens)
    
    // User message (never removed)
    const userMessageText = `User's message: ${userMessage}`
    const userMessageTokens = this.estimateTokens(userMessageText)
    console.log('[Phase B Token Budget] User message tokens:', userMessageTokens)
    
    // Calculate total estimated tokens
    const totalEstimatedTokens = systemPromptTokens + conversationTokens + planTokens + userMessageTokens
    console.log('[Phase B Token Budget] Total estimated tokens:', totalEstimatedTokens)
    console.log('[Phase B Token Budget] Provider input budget:', providerInputBudget)
    console.log('[Phase B Token Budget] Within budget:', totalEstimatedTokens <= providerInputBudget)
    
    // Phase B: Natural language prompt - NO JSON requirement
    const prompt = `${systemPrompt}

Conversation context:
Mode: ${context.mode}
Recent messages:
${conversationContext}
${planContext}
${userMessageText}

Respond naturally to the user's message. Be helpful, clear, and conversational.
If the user is discussing automation, use your expertise to provide useful guidance.
If appropriate, ask follow-up questions to better understand their needs.
Do not output JSON. Do not use structured formats. Just respond naturally.`

    console.log('[Phase B] Calling AI for conversational response')
    
    try {
      const response = await aiService.generateResponse(prompt)
      console.log('[Phase B] AI response received:', response.substring(0, 500))
      
      // Phase B: Accept natural language response as valid
      // No JSON parsing required
      
      // Phase B: Extract requirements via deterministic patterns (Phase 3)
      const requirementUpdate = this.extractRequirementsFromMessage(userMessage)
      
      // Phase B: Load existing requirements for merge
      let buildId: string | null = null
      let existingRequirements: Record<string, any> = {}
      
      if (context?.userId && context?.conversationId) {
        try {
          const { ArtifactService } = await import('../artifact-generation/artifact-service')
          const build = await ArtifactService.getActiveBuild(context.conversationId, context.userId)
          if (build?.requirements_collected) {
            buildId = build.id
            existingRequirements = build.requirements_collected
            console.log('[Phase B] Found existing requirements:', Object.keys(build.requirements_collected))
          }
        } catch (error) {
          console.error('[Phase B] Failed to load requirements:', error)
        }
      }
      
      // Phase B: Persist requirements if extracted
      if (requirementUpdate && Object.keys(requirementUpdate).length > 0) {
        console.log('[Phase B] Extracted requirements from message:', Object.keys(requirementUpdate))
        
        try {
          const { ArtifactService } = await import('../artifact-generation/artifact-service')
          
          if (buildId) {
            // Update existing build
            await ArtifactService.updateRequirements(buildId, requirementUpdate)
            console.log('[Phase B] Updated requirements in build:', buildId)
          } else if (context?.userId && context?.conversationId) {
            // Create new build
            const newBuild = await ArtifactService.createBuild(
              context.conversationId,
              context.userId,
              userMessage,
              'workflow'
            )
            await ArtifactService.updateRequirements(newBuild.id, requirementUpdate)
            console.log('[Phase B] Created build and persisted requirements:', newBuild.id)
          }
        } catch (error) {
          console.error('[Phase B] Failed to persist requirements:', error)
          // Continue - requirement persistence failure should not prevent conversational response
        }
      }
      
      // Phase B: Return natural language response
      return {
        action: {
          type: 'respond',
          message: response
        },
        intent: 'unrelated_conversation', // Default to conversation for natural responses
        confidence: 0.8,
        reasoning: 'Conversational response via natural language path',
        requirementUpdate
      }
      
    } catch (error) {
      console.error('[Phase B] Conversational AI response failed:', error)
      
      // Phase B: On genuine provider failure, return error message
      // Do not use canned fallback that hides the failure
      return {
        action: {
          type: 'respond',
          message: 'I apologize, but I encountered an error processing your request. Please try again.'
        },
        intent: 'unrelated_conversation',
        confidence: 0.0,
        reasoning: 'Provider error in conversational path'
      }
    }
  }

  /**
   * Phase 2: Extract requirement updates from AI plan
   * Returns only the new/changed fields between currentPlan and updatedPlan
   */
  private extractRequirementUpdate(
    updatedPlan: AutomationPlan | null | undefined,
    currentPlan: AutomationPlan | null
  ): RequirementUpdate | undefined {
    if (!updatedPlan) {
      return undefined
    }

    const update: RequirementUpdate = {}

    // Extract key fields that represent requirements
    if (updatedPlan.platform && (!currentPlan?.platform || currentPlan.platform.name !== updatedPlan.platform.name)) {
      update.platform = updatedPlan.platform
    }

    if (updatedPlan.trigger && (!currentPlan?.trigger || currentPlan.trigger.type !== updatedPlan.trigger.type)) {
      update.trigger = updatedPlan.trigger
    }

    if (updatedPlan.inputs && (!currentPlan?.inputs || currentPlan.inputs.sources !== updatedPlan.inputs.sources)) {
      update.inputs = updatedPlan.inputs
    }

    if (updatedPlan.outputs && (!currentPlan?.outputs || currentPlan.outputs.destinations !== updatedPlan.outputs.destinations)) {
      update.outputs = updatedPlan.outputs
    }

    if (updatedPlan.integrations && (!currentPlan?.integrations || currentPlan.integrations.platform !== updatedPlan.integrations.platform)) {
      update.integrations = updatedPlan.integrations
    }

    // Return undefined if no changes detected
    return Object.keys(update).length > 0 ? update : undefined
  }
  
  /**
   * Validate and convert action to typed AlexNextAction
   */
  private validateAction(action: any): AlexNextAction {
    const type = action.type
    
    switch (type) {
      case 'respond':
        return { type: 'respond', message: action.message || '' }
      
      case 'clarify':
        return {
          type: 'clarify',
          question: action.question || '',
          reason: action.reason,
          options: action.options
        }
      
      case 'recommend':
        return {
          type: 'recommend',
          message: action.message || '',
          recommendations: action.recommendations
        }
      
      case 'brainstorm':
        return {
          type: 'brainstorm',
          message: action.message || '',
          ideas: action.ideas
        }
      
      case 'plan':
      case 'generate':
      case 'execute':
        return {
          type,
          plan: action.plan || {}
        }
      
      case 'revise':
        return {
          type: 'revise',
          message: action.message || '',
          plan: action.plan || {}
        }
      
      default:
        console.warn('[AI Orchestrator] Unknown action type:', type, 'defaulting to respond')
        return { type: 'respond', message: action.message || '' }
    }
  }
  
  /**
   * Phase 3: Extract requirements from user message using deterministic pattern matching
   * Safety net for when AI structured output fails
   * Conservative: only extracts strong, unambiguous signals
   */
  private extractRequirementsFromMessage(userMessage: string): RequirementUpdate {
    const lower = userMessage.toLowerCase()
    const update: RequirementUpdate = {}

    // Platform detection (automation platforms)
    const platformPatterns = [
      { pattern: /\b(n8n|zapier|make|integromat)\b/i, field: 'platform', map: (m: string) => ({ name: m.toLowerCase() }) },
      { pattern: /\b(workflow automation|automation platform)\b/i, field: 'platform', map: () => ({ name: 'n8n' }) }
    ]

    for (const { pattern, field, map } of platformPatterns) {
      const match = lower.match(pattern)
      if (match) {
        update[field] = map(match[1])
        console.log('[Phase 3 Fallback] Extracted platform:', update[field])
        break
      }
    }

    // Form source detection
    const formPatterns = [
      { pattern: /\bgoogle form(s)?\b/i, field: 'trigger', map: () => ({ source: 'google-form', description: 'Google Forms' }) },
      { pattern: /\btypeform\b/i, field: 'trigger', map: () => ({ source: 'typeform', description: 'Typeform' }) },
      { pattern: /\bairtable form\b/i, field: 'trigger', map: () => ({ source: 'airtable', description: 'Airtable Form' }) }
    ]

    for (const { pattern, field, map } of formPatterns) {
      const match = lower.match(pattern)
      if (match) {
        update[field] = map()
        console.log('[Phase 3 Fallback] Extracted form source:', update[field])
        break
      }
    }

    // Email provider detection
    const emailPatterns = [
      { pattern: /\bgmail\b/i, field: 'integrations', map: () => ({ emailProvider: 'gmail' }) },
      { pattern: /\b(outlook|exchange|microsoft 365)\b/i, field: 'integrations', map: () => ({ emailProvider: 'outlook' }) },
      { pattern: /\b(simple mail transfer protocol|smtp)\b/i, field: 'integrations', map: () => ({ emailProvider: 'imap/smtp' }) }
    ]

    for (const { pattern, field, map } of emailPatterns) {
      const match = lower.match(pattern)
      if (match) {
        update[field] = map()
        console.log('[Phase 3 Fallback] Extracted email provider:', update[field])
        break
      }
    }

    // Qualification/scoring method detection
    const scoringPatterns = [
      { pattern: /\bautomatic scoring\b/i, field: 'qualificationMethod', map: () => 'automatic scoring' },
      { pattern: /\bscore (them )?automatically\b/i, field: 'qualificationMethod', map: () => 'automatic scoring' },
      { pattern: /\blead scoring\b/i, field: 'qualificationMethod', map: () => 'lead scoring' }
    ]

    for (const { pattern, field, map } of scoringPatterns) {
      const match = lower.match(pattern)
      if (match) {
        update[field] = map()
        console.log('[Phase 3 Fallback] Extracted qualification method:', update[field])
        break
      }
    }

    // Phase 2: AI lead scoring detection
    // Initialize lead scoring config if any pattern matches
    let leadScoringConfig: any = {}
    
    // Check for AI scoring request
    if (/\bai (?:to )?score/i.test(lower)) {
      leadScoringConfig.enabled = true
      leadScoringConfig.scoringMethod = 'ai'
      leadScoringConfig.explainReasoning = true
    }
    
    // Check for score range patterns
    if (/\bscore (?:from )?0 to 100\b/i.test(lower) || /\bscore 0-100\b/i.test(lower)) {
      leadScoringConfig.scoreRange = { min: 0, max: 100 }
    }
    
    // Check for explanation request
    if (/\bexplain (?:the )?(?:score|reasoning)\b/i.test(lower) || /\bexplain why\b/i.test(lower)) {
      leadScoringConfig.explainReasoning = true
    }
    
    // Check for qualification threshold
    const thresholdMatch = lower.match(/\b(?:only send|only route|only notify|score|scoring|leads) (\d+)\+?\b/i)
    if (thresholdMatch) {
      leadScoringConfig.qualificationThreshold = parseInt(thresholdMatch[1])
    }
    
    // Apply lead scoring config if any patterns matched
    if (Object.keys(leadScoringConfig).length > 0) {
      if (!update.aiConfig) {
        update.aiConfig = {}
      }
      if (!update.aiConfig.leadScoring) {
        update.aiConfig.leadScoring = {}
      }
      // Merge the new config with existing
      update.aiConfig.leadScoring = { ...update.aiConfig.leadScoring, ...leadScoringConfig }
      console.log('[Phase 2 Fallback] Extracted lead scoring config:', update.aiConfig.leadScoring)
    }

    // Notification destination detection
    const notificationPatterns = [
      { pattern: /\b(slack|teams|discord)\b/i, field: 'outputs', map: (m: string) => ({ destinations: [m.toLowerCase()] }) },
      { pattern: /\bemail notification(s)?\b/i, field: 'outputs', map: () => ({ destinations: ['email'] }) }
    ]

    for (const { pattern, field, map } of notificationPatterns) {
      const match = lower.match(pattern)
      if (match) {
        update[field] = map(match[1])
        console.log('[Phase 3 Fallback] Extracted notification destination:', update[field])
        break
      }
    }

    return Object.keys(update).length > 0 ? update : undefined
  }

  /**
   * Fallback decision when AI fails
   * Phase 2: Preserve workflow state by loading requirements from database
   * Phase 3: Attempt to extract obvious requirements from current user message
   */
  private async getFallbackDecision(
    userMessage: string,
    currentPlan: AutomationPlan | null,
    context?: ConversationContext
  ): Promise<OrchestrationResult> {
    console.log('[AI Orchestrator] Using fallback decision logic')
    
    const lower = userMessage.toLowerCase()
    
    // Phase 2: Try to load existing requirements from database
    let hasExistingRequirements = false
    let buildId: string | undefined
    let existingRequirements: Record<string, any> = {}

    if (context?.userId && context?.conversationId) {
      try {
        const { ArtifactService } = await import('../artifact-generation/artifact-service')
        const build = await ArtifactService.getActiveBuild(context.conversationId, context.userId)
        if (build?.requirements_collected && Object.keys(build.requirements_collected).length > 0) {
          hasExistingRequirements = true
          buildId = build.id
          existingRequirements = build.requirements_collected
          console.log('[AI Orchestrator] Fallback: Found existing requirements in database:', Object.keys(build.requirements_collected))
        }
      } catch (error) {
        console.error('[AI Orchestrator] Failed to load requirements in fallback:', error)
      }
    }

    // Phase 3: Attempt to extract obvious requirements from current user message
    const newRequirements = this.extractRequirementsFromMessage(userMessage)
    
    if (newRequirements && buildId) {
      console.log('[Phase 3 Fallback] Extracted requirements from message:', Object.keys(newRequirements))
      
      try {
        const { ArtifactService } = await import('../artifact-generation/artifact-service')
        const mergedRequirements = { ...existingRequirements, ...newRequirements }
        await ArtifactService.updateRequirements(buildId, newRequirements)
        console.log('[Phase 3 Fallback] Persisted extracted requirements to build:', buildId)
      } catch (error) {
        console.error('[Phase 3 Fallback] Failed to persist extracted requirements:', error)
        // Continue with existing state if persistence fails
      }
    } else if (newRequirements && !buildId) {
      console.log('[Phase 3 Fallback] Extracted requirements but no build exists, creating build')
      
      try {
        const { ArtifactService } = await import('../artifact-generation/artifact-service')
        if (context?.userId && context?.conversationId) {
          const newBuild = await ArtifactService.createBuild(
            context.conversationId,
            context.userId,
            userMessage,
            'workflow'
          )
          await ArtifactService.updateRequirements(newBuild.id, newRequirements)
          console.log('[Phase 3 Fallback] Created build and persisted requirements:', newBuild.id)
        }
      } catch (error) {
        console.error('[Phase 3 Fallback] Failed to create build and persist requirements:', error)
      }
    }
    
    // If no current plan and no existing requirements, assume new request
    if (!currentPlan && !hasExistingRequirements && !newRequirements) {
      return {
        action: {
          type: 'clarify',
          question: 'What automation would you like me to help you create?',
          reason: 'I need to understand your automation goal',
          options: ['A workflow to automate a task', 'A chatbot for customer support', 'An integration between systems', 'Something else']
        },
        intent: 'new_automation',
        confidence: 0.3,
        reasoning: 'AI decision failed, using fallback for new request'
      }
    }
    
    // If current plan exists or requirements exist, preserve state
    const message = (hasExistingRequirements || newRequirements)
      ? 'I understand. Let me continue with your automation based on what we\'ve discussed so far.'
      : 'I understand. Let me continue with your automation.'
    
    return {
      action: {
        type: 'respond',
        message
      },
      intent: 'answer_question',
      confidence: 0.3,
      reasoning: 'AI decision failed, using fallback for continuation with preserved state'
    }
  }
  
  /**
   * Get question tracker instance
   */
  getQuestionTracker(): QuestionTracker {
    return this.questionTracker
  }
}