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
1. **Objective** — What does the user want? (usually clear from the initial message)
2. **Platform** — Which automation platform? (n8n, Make, Zapier) — NEVER assume, always ask
3. **Data/Content Source** — Where does the input data come from? (e.g., URL, RSS feed, API, file upload, email, webhook payload, database)
4. **Trigger** — What starts the workflow? (schedule/cron, webhook, manual trigger, email received, new file, etc.)
5. **Output/Delivery** — Where should results go? (email, Slack, Google Sheets, webhook, dashboard, file, etc.)

If ANY of these 5 items is unknown or not yet answered by the user, you MUST use "clarify" to ask about it. Do NOT fill in defaults and skip ahead.
Exception: If the user explicitly says "just generate it" or "use defaults", you may proceed with intelligent defaults.

For AI/LLM-powered workflows (e.g., summarizers, chatbots, classifiers), also ask about:
6. **AI Model** — Which AI model? (Google Gemini, OpenAI GPT, Anthropic Claude, etc.)
7. **Output Format** — How should results be formatted? (bullet points, paragraph, structured JSON, table, etc.)

Workflow Design & Intelligence Guidelines:
- ALWAYS think about edge cases, error handling, data validation, and scale.
- Proactively suggest best practices for the chosen platform.
- When you are ready to propose the architecture (action: plan or generate), ensure the plan is extremely detailed with specific workflow steps that map to REAL integration nodes (HTTP Request, Gmail, Slack, Google Sheets, OpenAI/Gemini, IF conditions, etc.) — NOT generic "processing" steps.
- Break down complex automations into manageable logical steps.
- Each workflow step MUST specify what n8n node type it maps to (e.g., "Fetch content via HTTP Request node", "Summarize with LLM Chain + Gemini node", "Send results via Gmail node").

Interactive Flow Guidelines:
- Sequence: Gather missing information ONE step at a time in this order: Goal -> Platform -> Data Source -> Trigger -> Output/Delivery -> AI Model (if applicable) -> Edge Cases.
- Use "clarify" to ask ONE specific question at a time. Include a reason, field, and helpful options. Set "inputType": "multi-select" if the user should be allowed to pick multiple options (e.g. data sources).
- Use "recommend" to suggest platforms or architectural improvements with strong reasoning.
- Use "plan" to propose the final automation architecture ONLY when all 5 minimum requirements are gathered.
- Use the "field" property in "clarify" to indicate what aspect is being asked (e.g., "platform", "trigger", "data_source", "delivery", "ai_model", "output_format").
- DO NOT repeat questions that have already been answered (check the current plan or conversation history).
- DO accept natural language answers and adapt gracefully.
- CRITICAL: Never default to a platform without asking, unless the user previously specified one.
- CRITICAL: NEVER output workflow JSON, architecture diagrams, or step-by-step setup in a 'respond' message. If the user provides a complete automation description (e.g., trigger, actions, conditions), you MUST use the 'clarify' action to ask "Would you like me to generate a ready-made JSON file for this workflow?" and include options like ["Yes, generate it", "No, I need to make changes"]. Ensure you include the proposed plan in the 'updatedPlan' field.
- If the user confirms they want to generate the JSON file (e.g., they reply "yes" to the previous question), you MUST use the 'plan' action and provide the full plan. The system will automatically generate the importable JSON file based on the plan.

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
    
    try {
      const response = await aiService.generateResponse(prompt, options)
      console.log('[AI Orchestrator] AI response received:', response.substring(0, 500))
      
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
          const result = JSON.parse(jsonMatch[0])
          
          // Validate and convert to typed result
          return {
            action: this.validateAction(result.action),
            intent: result.intent as UserIntent,
            updatedPlan: result.updatedPlan || undefined,
            confidence: result.confidence || 0.5,
            reasoning: result.reasoning
          }
        } catch (parseError) {
          console.error('[AI Orchestrator] JSON parse error:', parseError, '\nRaw extracted:', jsonMatch[0])
          return this.getFallbackDecision(userMessage, currentPlan)
        }
      }
      
      // Fallback if no JSON found
      console.error('[AI Orchestrator] Failed to find JSON in AI decision, using fallback')
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
        // Trust the AI's options first; only fall back to generator when AI provides nothing
        let aiEnrichedOptions = action.enrichedOptions
        if (!aiEnrichedOptions || aiEnrichedOptions.length === 0) {
          // Convert AI's plain options array to enrichedOptions if present
          if (action.options && action.options.length > 0) {
            aiEnrichedOptions = action.options.map((opt: string) => ({
              label: opt,
              value: opt
            }))
          } else {
            // Last resort: use the static generator as a fallback
            const contextForOptions = action.reason || action.field || ''
            const generatedOptions = contextForOptions ? QuestionOptionsGenerator.getOptionsForContext(contextForOptions) : null
            aiEnrichedOptions = generatedOptions || undefined
          }
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
   * Fallback decision when AI fails
   */
  private getFallbackDecision(
    userMessage: string,
    currentPlan: AutomationPlan | null
  ): OrchestrationResult {
    console.log('[AI Orchestrator] Using fallback decision logic')
    
    const lower = userMessage.toLowerCase()
    
    // If no current plan, try to extract intent from the user's message
    // instead of asking the generic "what do you want?" question
    if (!currentPlan) {
      // Check if the user's message already describes what they want
      const hasObjective = lower.length > 10 && (
        lower.includes('create') || lower.includes('build') || lower.includes('make') ||
        lower.includes('automate') || lower.includes('bot') || lower.includes('workflow') ||
        lower.includes('summarize') || lower.includes('scrape') || lower.includes('sync') ||
        lower.includes('notify') || lower.includes('send') || lower.includes('monitor') ||
        lower.includes('track') || lower.includes('generate') || lower.includes('schedule') ||
        lower.includes('connect') || lower.includes('integrate')
      )
      
      if (hasObjective) {
        // User already told us what they want — ask for platform next
        return {
          action: {
            type: 'clarify',
            question: 'Which automation platform would you like to use?',
            reason: `Great! I'll help you with that. First, let me know which platform you'd like to build on.`,
            field: 'platform',
            enrichedOptions: [
              { label: 'n8n', value: 'n8n', description: 'Self-hosted or cloud, great for AI/LLM integrations', recommended: true },
              { label: 'Make (Integromat)', value: 'Make', description: 'Visual builder with good AI support' },
              { label: 'Zapier', value: 'Zapier', description: 'Cloud-only, extensive integrations, easy to use' }
            ]
          },
          updatedPlan: {
            objective: userMessage,
            status: 'draft'
          },
          intent: 'new_automation',
          confidence: 0.5,
          reasoning: 'AI decision failed but user message contains a clear objective — asking for platform'
        }
      }
      
      // User message is too vague — ask what they want
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
    
    // If current plan exists, check what's missing and ask for it
    // instead of a generic "should I proceed?" message
    if (!currentPlan.platform?.name) {
      return {
        action: {
          type: 'clarify',
          question: 'Which automation platform would you like to use?',
          reason: 'I need to know which platform to build on.',
          field: 'platform',
          enrichedOptions: [
            { label: 'n8n', value: 'n8n', description: 'Self-hosted or cloud, great for AI/LLM integrations', recommended: true },
            { label: 'Make (Integromat)', value: 'Make', description: 'Visual builder with good AI support' },
            { label: 'Zapier', value: 'Zapier', description: 'Cloud-only, extensive integrations, easy to use' }
          ]
        },
        intent: 'answer_question',
        confidence: 0.4,
        reasoning: 'AI decision failed, plan exists but platform is missing'
      }
    }

    if (!currentPlan.inputs?.sources || currentPlan.inputs.sources.length === 0) {
      return {
        action: {
          type: 'clarify',
          question: 'Where will the data or content come from?',
          reason: 'I need to know the data source to set up the input nodes.',
          field: 'data_source',
          inputType: 'multi-select',
          enrichedOptions: [
            { label: 'URLs / Webpages', value: 'URLs/webpages', description: 'Fetch and process web content' },
            { label: 'RSS feeds', value: 'RSS feeds', description: 'Subscribe to news/blog feeds' },
            { label: 'APIs', value: 'APIs', description: 'Pull data from external APIs' },
            { label: 'Emails', value: 'Emails', description: 'Process incoming emails' },
            { label: 'Documents (PDF, text)', value: 'Documents', description: 'Parse uploaded files' },
            { label: 'Social media', value: 'Social media', description: 'Twitter/X, LinkedIn, Facebook, etc.' }
          ]
        },
        intent: 'answer_question',
        confidence: 0.4,
        reasoning: 'AI decision failed, plan exists but data source is missing'
      }
    }

    if (!currentPlan.trigger?.type && !currentPlan.trigger?.description) {
      return {
        action: {
          type: 'clarify',
          question: 'What should trigger this workflow?',
          reason: 'Every automation needs a trigger to start.',
          field: 'trigger',
          enrichedOptions: [
            { label: 'Schedule (daily, hourly, etc.)', value: 'schedule', description: 'Run on a recurring schedule' },
            { label: 'Webhook', value: 'webhook', description: 'Triggered by another app or service' },
            { label: 'Manual', value: 'manual', description: 'Click a button to run' },
            { label: 'On new email', value: 'email', description: 'When an email arrives' },
            { label: 'On new data/file', value: 'new_data', description: 'When new data or files are added' }
          ]
        },
        intent: 'answer_question',
        confidence: 0.4,
        reasoning: 'AI decision failed, plan exists but trigger is missing'
      }
    }

    if (!currentPlan.outputs?.destinations || currentPlan.outputs.destinations.length === 0) {
      return {
        action: {
          type: 'clarify',
          question: 'Where should the results be sent or saved?',
          reason: 'I need to know the output destination to complete the workflow.',
          field: 'delivery',
          inputType: 'multi-select',
          enrichedOptions: [
            { label: 'Email (Gmail/Outlook)', value: 'Email', description: 'Send results via email' },
            { label: 'Slack', value: 'Slack', description: 'Post to a Slack channel' },
            { label: 'Google Sheets', value: 'Google Sheets', description: 'Append rows to a spreadsheet' },
            { label: 'Notion', value: 'Notion', description: 'Create pages in a Notion database' },
            { label: 'Webhook', value: 'Webhook', description: 'Send to another app via webhook' },
            { label: 'Dashboard/UI', value: 'Dashboard', description: 'Display in a web dashboard' }
          ]
        },
        intent: 'answer_question',
        confidence: 0.4,
        reasoning: 'AI decision failed, plan exists but output is missing'
      }
    }

    // Plan has all key fields — ask to proceed
    return {
      action: {
        type: 'clarify',
        question: 'Should I still proceed with generating the workflow?',
        reason: 'I had a little trouble processing that response.',
        field: 'proceed_confirmation',
        options: ['Yes', 'No'],
        enrichedOptions: [
          { label: 'Yes, proceed', value: 'yes' },
          { label: 'No, let me rephrase', value: 'no' }
        ]
      },
      intent: 'answer_question',
      confidence: 0.1,
      reasoning: 'AI decision failed, using conversational fallback'
    }
  }
  
  /**
   * Get question tracker instance
   */
  getQuestionTracker(): QuestionTracker {
    return this.questionTracker
  }
}