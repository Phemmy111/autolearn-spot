/**
 * ALEX AI Orchestrator
 * 
 * The new "brain" of ALEX - AI-driven decision-making for next actions
 * Replaces template-driven blocker/question system
 */

import { WorkflowAIService } from '../artifact-generation/workflow-ai-service'
import { QuestionOptionsGenerator } from '../artifact-generation/question-options-generator'
import { 
  AlexNextAction, 
  AutomationPlan, 
  ConversationContext, 
  UserIntent,
  OrchestrationResult 
} from './types'
import { OrchestrationQuestionService } from './orchestration-question-service'

export class AIOrchestrator {
  private static instance: AIOrchestrator
  
  private constructor() {
    // No in-memory question tracker - using persistent service
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
    
    // Clear old questions periodically
    if (context.userId && context.conversationId) {
      await OrchestrationQuestionService.clearOldQuestions({
        conversationId: context.conversationId,
        userId: context.userId
      })
    }
    
    // Use AI to determine intent and next action
    const aiDecision = await this.askAIDecision(userMessage, context, currentPlan)
    
    console.log('[AI Orchestrator] AI decision:', {
      intent: aiDecision.intent,
      actionType: aiDecision.action.type,
      confidence: aiDecision.confidence
    })
    
    // Update plan if provided
    let updatedPlan = currentPlan
    if (aiDecision.updatedPlan) {
      updatedPlan = aiDecision.updatedPlan
      updatedPlan.lastUpdated = new Date().toISOString()
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
      } else {
        console.log('[AI Orchestrator] Question prevented by persistent tracker:', question.substring(0, 50))
        // Fallback to respond instead
        aiDecision.action = {
          type: 'respond',
          message: "I think we've already discussed that. Let me proceed with what we have."
        }
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
- new_automation: User wants to create a completely new automation (e.g., "Create a bot", "Build a workflow", "Make an automation", "Automate a task", "Generate JSON", "Create workflow")
- revise_automation: User wants to change an existing plan (e.g., "Actually use Slack instead", "Change the trigger", "Modify the platform")
- answer_question: User is providing information in response to a previous question
- clarification: User is asking for clarification about something
- brainstorm_request: User explicitly wants to brainstorm or explore options
- recommendation_request: User is asking for recommendations or suggestions
- unrelated_conversation: User is chatting about something unrelated to automation
- confirmation: User is confirming or approving something
- cancellation: User wants to cancel or abandon the current task

IMPORTANT: If user mentions specific automation (WhatsApp, email, etc.) and wants to "generate the json" or similar, treat as new_automation and use interactive questions

For each action type:
- respond: Provide a conversational response acknowledging the user
- clarify: Ask a specific question to gather necessary information. Include reason for asking and optional answer choices.
- recommend: Suggest a platform, approach, or solution with reasoning
- brainstorm: Generate creative ideas or alternatives
- plan: Create or update an automation plan with structured information
- generate: The automation is sufficiently specified - proceed to generate the artifact
- execute: Execute the plan (generate artifact) - optionally require confirmation
- revise: Revise the existing plan based on user feedback

CRITICAL INTERACTIVE QUESTION GUIDELINES:
- When you use "clarify" action, you MUST provide a structured question with options
- NEVER provide comprehensive guides or tutorials in a single response
- ALWAYS break down complex automations into step-by-step interactive questions
- Use the "reason" field to provide context for why you're asking
- Use the "options" field to provide clear choices when applicable
- Use the "field" field to indicate what aspect of the automation you're asking about
- Example: If asking about platform, set field="platform" and provide platform options
- Example: If asking about trigger, set field="trigger" and provide trigger type options
- Keep responses concise and focused on gathering ONE piece of information at a time
- DO NOT dump entire workflow specifications - guide the user interactively
- If the user mentions a specific use case (like WhatsApp chatbot), ask ONE clarifying question about it first
- NEVER provide full implementation guides - ask questions instead
- NEVER provide code examples or JSON before understanding requirements
- ALWAYS start with understanding the goal, then platform, then trigger, then specifics

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
    "field": "what aspect this question covers (e.g., platform, trigger, inputs)",
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
        
        // Validate and convert to typed result
        return {
          action: this.validateAction(result.action),
          intent: result.intent as UserIntent,
          updatedPlan: result.updatedPlan || undefined,
          confidence: result.confidence || 0.5,
          reasoning: result.reasoning
        }
      }
      
      // Fallback if JSON parsing fails
      console.error('[AI Orchestrator] Failed to parse AI decision, using fallback')
      return this.getFallbackDecision(userMessage, currentPlan)
    } catch (error) {
      console.error('[AI Orchestrator] AI decision failed, using fallback:', error)
      return this.getFallbackDecision(userMessage, currentPlan)
    }
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
        // Generate enriched options if available for the context
        const contextForOptions = action.reason || action.field || ''
        const enrichedOptions = contextForOptions ? QuestionOptionsGenerator.getOptionsForContext(contextForOptions) : null
        return {
          type: 'clarify',
          question: action.question || '',
          reason: action.reason,
          options: action.options,
          enrichedOptions: enrichedOptions || undefined,
          inputType: action.inputType || 'select',
          header: action.header || action.field,
          field: action.field
        }
      
      case 'recommend':
        // Convert recommendations to enriched options if they're simple strings
        const enrichedRecs = action.recommendations?.map((rec: string) => ({
          label: rec,
          value: rec
        }))
        return {
          type: 'recommend',
          message: action.message || '',
          recommendations: action.recommendations,
          enrichedOptions: enrichedRecs
        }
      
      case 'brainstorm':
        // Convert ideas to enriched options if they're simple strings
        const enrichedIdeas = action.ideas?.map((idea: string) => ({
          label: idea,
          value: idea
        }))
        return {
          type: 'brainstorm',
          message: action.message || '',
          ideas: action.ideas,
          enrichedOptions: enrichedIdeas
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
   * Fallback decision when AI fails
   */
  private getFallbackDecision(
    userMessage: string,
    currentPlan: AutomationPlan | null
  ): OrchestrationResult {
    console.log('[AI Orchestrator] Using fallback decision logic')
    
    const lower = userMessage.toLowerCase()
    
    // If no current plan, assume new request
    if (!currentPlan) {
      return {
        action: {
          type: 'clarify',
          question: 'What automation would you like me to help you create?',
          reason: 'I need to understand your automation goal',
          field: 'objective',
          enrichedOptions: [
            { label: 'Email automation', value: 'email automation', description: 'Automate email processing or notifications' },
            { label: 'Data synchronization', value: 'data sync', description: 'Sync data between apps or databases' },
            { label: 'Web scraping', value: 'web scraping', description: 'Extract data from websites' },
            { label: 'API integration', value: 'api integration', description: 'Connect and automate API workflows' },
            { label: 'Scheduling', value: 'scheduling', description: 'Automate scheduled tasks or reminders' },
            { label: 'Custom workflow', value: 'custom', description: 'Describe your specific automation need' }
          ]
        },
        intent: 'new_automation',
        confidence: 0.3,
        reasoning: 'AI decision failed, using fallback for new request'
      }
    }
    
    // If current plan exists, treat as answer
    return {
      action: {
        type: 'respond',
        message: 'I understand. Let me continue with your automation.'
      },
      intent: 'answer_question',
      confidence: 0.3,
      reasoning: 'AI decision failed, using fallback for continuation'
    }
  }
  
  /**
   * Get question tracker instance
   */
  getQuestionTracker(): QuestionTracker {
    return this.questionTracker
  }
}