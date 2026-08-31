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
    currentPlan: AutomationPlan | null,
    options?: { personalProvider?: string; personalApiKey?: string; personalModel?: string }
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
    
    // First ask AI to decide what to do
    const aiDecision = await this.askAIDecision(userMessage, context, currentPlan, options)
    
    console.log('[AI Orchestrator] AI decision:', {
      intent: aiDecision.intent,
      actionType: aiDecision.action.type,
      confidence: aiDecision.confidence
    })
    
    // Update plan if provided
    let updatedPlan = aiDecision.updatedPlan || currentPlan
    
    // If AI provided a plan in the action but not in updatedPlan, use it
    if (!aiDecision.updatedPlan && aiDecision.action.plan && Object.keys(aiDecision.action.plan).length > 0) {
      aiDecision.updatedPlan = aiDecision.action.plan as AutomationPlan;
    }

    if (aiDecision.updatedPlan) {
      updatedPlan = aiDecision.updatedPlan
      updatedPlan.lastUpdated = new Date().toISOString()
      
      // Reverse fallback: If AI provided updatedPlan but missed action.plan, copy it over
      // so that UI rendering (like status: 'planning') doesn't show an empty object.
      if (!aiDecision.action.plan || Object.keys(aiDecision.action.plan).length === 0) {
        aiDecision.action.plan = updatedPlan;
      }
    }
    
    // UNIVERSAL FIX: Auto-fix platform as string → object in ALL cases (not just generate/execute)
    // The AI frequently returns platform: "n8n" instead of platform: { name: "n8n" }
    if (updatedPlan && typeof updatedPlan.platform === 'string') {
      updatedPlan.platform = { name: updatedPlan.platform }
    }
    if (currentPlan && typeof currentPlan.platform === 'string') {
      (currentPlan as any).platform = { name: currentPlan.platform }
    }
    
    // UNIVERSAL ANSWER MERGER: When the user answers a question for a known field,
    // ensure the answer is patched into the plan even if the AI forgot to set it.
    // This prevents the infinite loop where the AI keeps re-asking the same question.
    if (updatedPlan && context.messages.length > 0) {
      const lastAssistantMsg = [...context.messages].reverse().find(m => m.role === 'assistant')
      const userAnswer = userMessage.trim()
      
      if (lastAssistantMsg) {
        const assistantContent = lastAssistantMsg.content.toLowerCase()
        
        // Detect which field was being asked based on the assistant's last message
        const isPlatformQuestion = assistantContent.includes('which automation platform') || 
                                   assistantContent.includes('which platform') ||
                                   assistantContent.includes('platform selection')
        const isDataSourceQuestion = assistantContent.includes('where will the data') || 
                                      assistantContent.includes('data source') ||
                                      assistantContent.includes('content come from') ||
                                      assistantContent.includes('where does the input')
        const isTriggerQuestion = assistantContent.includes('what should trigger') || 
                                   assistantContent.includes('what triggers') ||
                                   assistantContent.includes('what starts the workflow')
        const isDeliveryQuestion = assistantContent.includes('where should the results') || 
                                    assistantContent.includes('output destination') ||
                                    assistantContent.includes('results be sent')
        
        if (isPlatformQuestion && userAnswer && !updatedPlan.platform?.name) {
          const platformMap: Record<string, string> = { 'n8n': 'n8n', 'make': 'Make', 'zapier': 'Zapier', 'make (integromat)': 'Make' }
          const resolved = platformMap[userAnswer.toLowerCase()] || userAnswer
          updatedPlan.platform = { name: resolved }
          console.log('[AI Orchestrator] Answer merger: Set platform to', resolved)
        }
        
        if (isDataSourceQuestion && userAnswer && (!updatedPlan.inputs?.sources || updatedPlan.inputs.sources.length === 0)) {
          const sources = userAnswer.split(',').map((s: string) => s.trim()).filter(Boolean)
          updatedPlan.inputs = { ...(updatedPlan.inputs || {}), sources }
          console.log('[AI Orchestrator] Answer merger: Set data sources to', sources)
        }
        
        if (isTriggerQuestion && userAnswer && !updatedPlan.trigger?.type) {
          updatedPlan.trigger = { type: userAnswer, description: userAnswer }
          console.log('[AI Orchestrator] Answer merger: Set trigger to', userAnswer)
        }
        
        if (isDeliveryQuestion && userAnswer && (!updatedPlan.outputs?.destinations || updatedPlan.outputs.destinations.length === 0)) {
          const destinations = userAnswer.split(',').map((s: string) => s.trim()).filter(Boolean)
          updatedPlan.outputs = { ...(updatedPlan.outputs || {}), destinations }
          console.log('[AI Orchestrator] Answer merger: Set delivery to', destinations)
        }
      }
    }
    
    // If AI wants to generate but no platform is set, switch to clarify
    if (aiDecision.action.type === 'generate' || aiDecision.action.type === 'execute') {
      const planToCheck = updatedPlan || currentPlan
      
      if (!planToCheck?.platform?.name) {
        console.log('[AI Orchestrator] Platform not specified, switching to clarify action')
        aiDecision.action = {
          type: 'clarify',
          question: 'Which automation platform would you like to use for this workflow?',
          reason: 'Platform selection is required before generating the workflow',
          field: 'platform'
        }
      }
    }
    
    // INTERCEPT: If AI still dumped JSON or a step-by-step guide in ANY action, convert it to a clarify action
    const fullMsg = JSON.stringify(aiDecision)
    const msgLower = fullMsg.toLowerCase()
    
    // Check if there's a long setup guide anywhere in the response
    if (fullMsg) {
      const isJsonDump = (msgLower.includes('```json') && msgLower.includes('"nodes"')) ||
                         (msgLower.includes('"connections"') && msgLower.includes('n8n-nodes-base'))
                         
      const isSetupGuide = fullMsg.length > 400 && 
                           (msgLower.includes('node') || msgLower.includes('webhook')) &&
                           (msgLower.includes('step') || msgLower.includes('overview') || msgLower.includes('┌──'))

      if (isJsonDump || isSetupGuide) {
        console.log('[AI Orchestrator] Intercepted setup guide / JSON dump. Converting to clarify action.')
        
        // Build a rich plan from whatever context we have
        // Extract useful workflow step info from the AI's message before we discard it
        const extractedSteps: Array<{step: string, description: string}> = []
        const stepMatches = fullMsg.match(/(?:step|node)\s*\d+[a-z]?\s*[:\-–—]\s*([^\n]+)/gi)
        if (stepMatches) {
          stepMatches.forEach((m: string, i: number) => {
            extractedSteps.push({ step: `Step ${i + 1}`, description: m.trim() })
          })
        }
        
        if (!aiDecision.updatedPlan) {
          aiDecision.updatedPlan = currentPlan || {
            objective: (userMessage || '').substring(0, 500),
            platform: { name: "n8n" },
            status: "draft"
          }
        }
        
        // Enrich the plan with extracted steps if it doesn't already have workflow steps
        if (extractedSteps.length > 0 && (!aiDecision.updatedPlan.workflow || aiDecision.updatedPlan.workflow.length === 0)) {
          aiDecision.updatedPlan.workflow = extractedSteps
        }
        
        // Always store the user's original message as the objective if not already set
        if (!aiDecision.updatedPlan.objective || aiDecision.updatedPlan.objective === 'Extracted workflow from request') {
          aiDecision.updatedPlan.objective = (userMessage || '').substring(0, 500)
        }
        
        // SMART EXTRACTION: Pre-fill trigger, inputs, and outputs from the user's message
        // so the bot doesn't need to ask obvious questions
        const msgLowerUser = (userMessage || '').toLowerCase()
        const combinedLower = msgLowerUser + ' ' + msgLower
        
        // Extract trigger
        if (!aiDecision.updatedPlan.trigger?.type) {
          if (combinedLower.includes('webhook')) {
            aiDecision.updatedPlan.trigger = { type: 'webhook', description: 'Webhook trigger' }
          } else if (combinedLower.includes('schedule') || combinedLower.includes('cron') || combinedLower.includes('every day') || combinedLower.includes('every hour') || combinedLower.includes('every morning')) {
            aiDecision.updatedPlan.trigger = { type: 'schedule', description: 'Scheduled trigger' }
          } else if (combinedLower.includes('new email') || combinedLower.includes('email arrives') || combinedLower.includes('incoming email')) {
            aiDecision.updatedPlan.trigger = { type: 'email', description: 'Email trigger' }
          } else if (combinedLower.includes('rss')) {
            aiDecision.updatedPlan.trigger = { type: 'rss', description: 'RSS feed trigger' }
          } else if (combinedLower.includes('manual')) {
            aiDecision.updatedPlan.trigger = { type: 'manual', description: 'Manual trigger' }
          }
        }
        
        // Extract inputs/sources
        if (!aiDecision.updatedPlan.inputs?.sources || aiDecision.updatedPlan.inputs.sources.length === 0) {
          const inputSources: string[] = []
          if (combinedLower.includes('form submission') || combinedLower.includes('form data')) inputSources.push('Form submissions')
          if (combinedLower.includes('webhook')) inputSources.push('Webhook payload')
          if (combinedLower.includes('rss')) inputSources.push('RSS feed')
          if (combinedLower.includes('email')) inputSources.push('Email')
          if (combinedLower.includes('api') || combinedLower.includes('http request')) inputSources.push('API/HTTP Request')
          if (combinedLower.includes('url') || combinedLower.includes('webpage') || combinedLower.includes('article')) inputSources.push('Web URLs')
          if (inputSources.length > 0) {
            aiDecision.updatedPlan.inputs = { ...(aiDecision.updatedPlan.inputs || {}), sources: inputSources }
          }
        }
        
        // Extract outputs/destinations
        if (!aiDecision.updatedPlan.outputs?.destinations || aiDecision.updatedPlan.outputs.destinations.length === 0) {
          const outputDests: string[] = []
          if (combinedLower.includes('google sheet') || combinedLower.includes('spreadsheet')) outputDests.push('Google Sheets')
          if (combinedLower.includes('slack')) outputDests.push('Slack')
          if (combinedLower.includes('email') || combinedLower.includes('gmail')) outputDests.push('Email')
          if (combinedLower.includes('notion')) outputDests.push('Notion')
          if (combinedLower.includes('telegram')) outputDests.push('Telegram')
          if (combinedLower.includes('discord')) outputDests.push('Discord')
          if (combinedLower.includes('airtable')) outputDests.push('Airtable')
          if (outputDests.length > 0) {
            aiDecision.updatedPlan.outputs = { ...(aiDecision.updatedPlan.outputs || {}), destinations: outputDests }
          }
        }
        
        console.log('[AI Orchestrator] Smart extraction result:', {
          trigger: aiDecision.updatedPlan.trigger,
          inputs: aiDecision.updatedPlan.inputs,
          outputs: aiDecision.updatedPlan.outputs
        })
        
        aiDecision.action = {
          type: 'clarify',
          question: 'I have the workflow logic ready. Would you like me to generate a ready-made n8n JSON file for this?',
          reason: 'Workflow JSON intercepted, transitioning to generator',
          field: 'generate_artifact',
          options: ['Yes, generate the JSON', 'No, I need to make changes'],
          plan: aiDecision.updatedPlan
        }
      }
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
      
      // We no longer block the AI from asking questions based on fuzzy matching.
      // The AI is now instructed to avoid repetition via prompt, and fuzzy matching 
      // falsely triggers when the AI needs to re-ask a question due to an invalid user answer.
      await OrchestrationQuestionService.recordQuestion({
        conversationId: context.conversationId,
        userId: context.userId,
        question,
        questionContext: contextStr,
        questionType: 'clarify',
        orchestrationAction: aiDecision.action.type
      }).catch(err => console.error('[AI Orchestrator] Failed to record question:', err))
    }
    
    // The AI decision accurately determines if the user is answering a question 
    // and asks the next question or proceeds to generation. We shouldn't override it.
    
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
    currentPlan: AutomationPlan | null,
    options?: { personalProvider?: string; personalApiKey?: string; personalModel?: string }
  ): Promise<OrchestrationResult> {
    const aiService = WorkflowAIService.getInstance()
    
    // Build comprehensive conversation context for AI
    const recentMessages = context.messages.slice(-20).map(m => 
      `${m.role}: ${m.content.substring(0, 500)}`
    ).join('\n')
    
    const planContext = currentPlan 
      ? `\nCurrent automation plan:\n${JSON.stringify(currentPlan, null, 2)}`
      : '\nNo current automation plan - this is a new request'
    
    const prompt = `You are ALEX, an elite, highly intelligent automation architect. Your mission is to deeply understand the user's request, design robust, enterprise-grade workflows, and guide the user on how to set them up effectively.

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
- new_automation: User wants to create a completely new automation
- revise_automation: User wants to change an existing plan (e.g., "Add error handling", "Change the trigger")
- answer_question: User is providing information in response to a previous question
- clarification: User is asking for clarification about something
- brainstorm_request: User explicitly wants to brainstorm or explore options
- recommendation_request: User is asking for recommendations or suggestions
- confirmation: User is confirming or approving something
- cancellation: User wants to cancel or abandon the current task

MINIMUM REQUIREMENTS BEFORE GENERATING (CRITICAL — DO NOT SKIP):
You MUST gather ALL of the following before using "plan" or "generate" action:
1. **Objective** — What does the user want? (Ask deep questions to truly understand their intention)
2. **Platform** — Which automation platform? (n8n, Make, Zapier) — NEVER assume, always ask
3. **Trigger** — What exactly starts the workflow? (e.g. Schedule/Cron, Webhook, Form submission, Chat message, Telegram/Slack/Notion event) — NEVER assume. If not provided, ask.
4. **Data/Content Source** — Where does the input data come from? (e.g. URL, RSS feed, API, Email, Webhook payload, Database)
5. **Output/Delivery** — Where should results go? (Email, Slack, Google Sheets, Webhook, Discord, etc.)
6. **AI Model (if applicable)** — If the workflow uses AI, WHICH model exactly? (Google Gemini 1.5 Flash/Pro, OpenAI GPT-4o, Anthropic Claude 3.5, etc.)

If ANY of these items is unknown or vague, you MUST use "clarify" to ask about it. DO NOT skip ahead.

Workflow Design & Intelligence Guidelines (BE 100% SMART & PROFESSIONAL):
- ALWAYS ask deep questions to truly understand the user's business goal. Don't just accept basic requests; dig into the nuances (e.g., "How do you define a 'hot' lead?", "What specific fields do you want extracted?").
- **Proactive Recommendations**: You MUST give additional recommendations to spice the workflow up! Suggest adding extra nodes (like error handling, data enrichment, filtering), suggest alternative/better triggers, and explain how they make the workflow more professional.
- Break down complex automations into manageable logical steps.
- Each workflow step MUST specify what n8n node type it maps to. Use exact types (e.g., "n8n-nodes-base.httpRequest", "n8n-nodes-base.rssFeedRead", "n8n-nodes-base.itemLists", "n8n-nodes-base.openAi").

Interactive Flow Guidelines:
- Sequence: Gather missing information ONE step at a time, but do it intelligently. You can combine a clarification with a recommendation (e.g., "What trigger should we use? I recommend a Webhook for real-time, or a Schedule for batching.").
- Use "recommend" to suggest architectural improvements with strong reasoning (e.g., "To make this professional, I recommend adding a Switch node to route cold vs hot leads to different emails.").
- Use "clarify" to ask ONE specific question at a time. Include a reason, field, and helpful options.
- DO NOT repeat questions that have already been answered.
- CRITICAL: Never default to a platform, trigger, or AI model without asking.
- CRITICAL: NEVER output workflow JSON, architecture diagrams, or step-by-step setup in a 'respond' message. If the user provides a complete automation description, you MUST use the 'clarify' action to ask "I have the workflow logic ready. Would you like me to generate a ready-made n8n JSON file for this?" with options ["Yes, generate the JSON", "No, I need to make changes"]. Ensure you include the proposed plan in the 'updatedPlan' field.
- If the user confirms they want to generate the JSON file, you MUST use the 'plan' action and provide the full detailed plan.

Return ONLY valid JSON in this exact format:
{
  "intent": "intent_type",
  "action": {
    "type": "action_type",
    "message": "response message or setup guide if applicable",
    "question": "question text if clarify",
    "reason": "why asking if clarify",
    "field": "what aspect this covers",
    "inputType": "select or multi-select (use multi-select if the user can choose multiple options)",
    "options": ["option1", "option2"] if clarify,
    "recommendations": ["rec1", "rec2"] if recommend,
    "ideas": ["idea1", "idea2"] if brainstorm,
    "plan": { "objective": "...", "platform": { "name": "n8n" }, "trigger": { "type": "...", "description": "..." }, "workflow": [{"step": "...", "description": "...", "nodeType": "n8n-nodes-base.httpRequest"}], "inputs": { "sources": ["..."] }, "outputs": { "destinations": ["..."] }, "status": "draft" } if plan/generate/execute/revise
  },
  "updatedPlan": { "objective": "...", "platform": { "name": "n8n" }, "trigger": { "type": "...", "description": "..." }, "workflow": [{"step": "...", "description": "...", "nodeType": "n8n-nodes-base.httpRequest"}], "inputs": { "sources": ["..."] }, "outputs": { "destinations": ["..."] }, "status": "draft" } or null,
  "confidence": 0.0-1.0,
  "reasoning": "brief explanation of your decision"
}

If no plan update is needed, set "updatedPlan" to null.
IMPORTANT: When providing the plan, the platform MUST be an object like {"platform": {"name": "n8n"}}, NOT a string.
IMPORTANT: Each workflow step in the plan MUST include a "nodeType" field with the exact n8n node type string (e.g., "n8n-nodes-base.httpRequest", "@n8n/n8n-nodes-langchain.chainLlm"). NEVER use "n8n-nodes-base.code" unless the step genuinely requires custom JavaScript.
Make sure your proposed workflow steps in the plan are comprehensive and handle edge cases.`

    console.log('[AI Orchestrator] Calling AI for decision with prompt length:', prompt.length)
    
    let attempt = 0;
    let currentPrompt = prompt;
    
    while (attempt < 2) {
      attempt++;
      try {
        const response = await aiService.generateResponse(currentPrompt, options)
        console.log(`[AI Orchestrator] AI response received (Attempt ${attempt}):`, response.substring(0, 500))
        
        // Clean up response (remove markdown code blocks if present)
        let cleanResponse = response.trim()
        if (cleanResponse.startsWith('```json')) {
          cleanResponse = cleanResponse.replace(/^```json\n?/, '').replace(/\n?```$/, '')
        } else if (cleanResponse.startsWith('```')) {
          cleanResponse = cleanResponse.replace(/^```\n?/, '').replace(/\n?```$/, '')
        }
        
        // Parse JSON response
        const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/)
        if (jsonMatch) {
          try {
            // First try basic JSON parse
            let jsonString = jsonMatch[0]
            
            // Fix trailing commas (common LLM hallucination)
            jsonString = jsonString.replace(/,\s*([}\]])/g, '$1')
            
            const result = JSON.parse(jsonString)
            
            // Validate and convert to typed result
            return {
              action: this.validateAction(result.action),
              intent: result.intent as UserIntent,
              updatedPlan: result.updatedPlan || undefined,
              confidence: result.confidence || 0.5,
              reasoning: result.reasoning
            }
          } catch (parseError) {
            console.error(`[AI Orchestrator] JSON parse error on attempt ${attempt}:`, parseError)
            
            if (attempt === 1) {
              console.log('[AI Orchestrator] Retrying with JSON fix prompt...')
              // Append a stern warning to the prompt for the second attempt
              currentPrompt = prompt + `\n\nCRITICAL ERROR: Your previous response was NOT valid JSON. It failed to parse with error: ${(parseError as Error).message}. You MUST return ONLY valid, parseable JSON without trailing commas or unescaped quotes.`
              continue;
            }
            
            return this.getFallbackDecision(userMessage, currentPlan)
          }
        }
        
        // No JSON found
        if (attempt === 1) {
           console.log('[AI Orchestrator] No JSON found in response, retrying...')
           currentPrompt = prompt + `\n\nCRITICAL ERROR: You did not return a JSON object. You MUST start your response with { and end with }. Do not include introductory text.`
           continue;
        }
        
        console.error('[AI Orchestrator] Failed to find JSON in AI decision after retries, using fallback')
        return this.getFallbackDecision(userMessage, currentPlan)
      } catch (error) {
        console.error(`[AI Orchestrator] AI decision network/API error on attempt ${attempt}:`, error)
        if (attempt === 1) {
          console.log('[AI Orchestrator] Network error, retrying in 2 seconds...')
          await new Promise(resolve => setTimeout(resolve, 2000))
          continue;
        }
        return this.getFallbackDecision(userMessage, currentPlan)
      }
    }
    
    return this.getFallbackDecision(userMessage, currentPlan)
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
        // Convert AI's plain options array to enrichedOptions if present
        let aiEnrichedOptions = action.enrichedOptions
        if (!aiEnrichedOptions || aiEnrichedOptions.length === 0) {
          if (action.options && action.options.length > 0) {
            aiEnrichedOptions = action.options.map((opt: string) => ({
              label: opt,
              value: opt
            }))
          }
          // No template fallback — if AI didn't provide options, show question without options
        }
        return {
          type: 'clarify',
          question: action.question || '',
          reason: action.reason,
          options: action.options,
          enrichedOptions: aiEnrichedOptions,
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
      
      case 'generate_artifact':
        return {
          type: 'generate_artifact',
          plan: action.plan || {}
        }
      
      case 'approve':
        return {
          type: 'approve',
          plan: action.plan || {}
        }
      
      default:
        console.warn('[AI Orchestrator] Unknown action type:', type, 'defaulting to respond')
        return { type: 'respond', message: action.message || '' }
    }
  }
  
  /**
   * Fallback decision when AI fails (e.g. timeout or unparseable JSON).
   */
  private getFallbackDecision(
    userMessage: string,
    currentPlan: AutomationPlan | null
  ): OrchestrationResult {
    console.log('[AI Orchestrator] AI failed — using fallback error response')
    
    return {
      action: {
        type: 'respond',
        message: 'I apologize, but I encountered an error processing that request (my AI engine either timed out or failed to parse the context). Could you please try rephrasing or clicking one of the options again?'
      },
      updatedPlan: currentPlan || undefined,
      intent: 'clarification',
      confidence: 0.1
    }
  }
  
  /**
   * Get question tracker instance
   */
  getQuestionTracker(): QuestionTracker {
    return this.questionTracker
  }
}