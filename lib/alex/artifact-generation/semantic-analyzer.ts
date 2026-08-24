/**
 * AI-based Semantic Specification Extraction
 * 
 * Replaces keyword-based detection with AI understanding
 * Extracts complete automation specification from user requests
 */

import { AutomationSpec } from './automation-spec'
import { AlexFile } from '../types'

export class SemanticAnalyzer {
  /**
   * Extract complete specification from user request using AI
   */
  static async extractSpecification(request: {
    content: string
    conversationHistory?: Array<{ role: string; content: string }>
    attachedFiles?: AlexFile[]
  }): Promise<Partial<AutomationSpec>> {
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()
    
    // Build context from attachments
    const attachmentContext = this.buildAttachmentContext(request.attachedFiles)
    
    // Build context from conversation history
    const historyContext = this.buildHistoryContext(request.conversationHistory)
    
    const prompt = `You are an expert automation architect. Extract a complete automation specification from the user's request.

User request: ${request.content}
${historyContext}
${attachmentContext}

Extract the following fields if mentioned or inferable from context:
- automationType (workflow, chatbot, agent, pipeline, integration, automation)
- domain (email, support, sales, marketing, finance, ai, data, custom)
- description (concise description of what the automation does)
- platform (n8n, zapier, make, power-automate, pipedream, custom)
- trigger.type (email, webhook, schedule, manual, event)
- trigger.source (gmail, outlook, slack, etc.)
- trigger.config (trigger-specific configuration)
- inputs.sources (email, webhook, database, api, form, file, etc.)
- inputs.format (json, xml, csv, etc.)
- inputs.validation (required validations)
- outputs.destinations (email, slack, telegram, whatsapp, database, api, etc.)
- outputs.format (json, xml, csv, etc.)
- outputs.notification (true/false)
- integrations.emailProvider (gmail, outlook, smtp, imap, sendgrid, mailgun)
- integrations.aiProvider (openai, anthropic, google, local)
- integrations.aiModel (gpt-4, claude-3, gemini, llama)
- integrations.knowledgeBase (notion, confluence, pinecone, google-drive, none)
- integrations.databases (array of database names)
- integrations.apis (array of API names)
- integrations.webhooks (array of webhook URLs)
- integrations.crm (salesforce, hubspot, etc.)
- businessRules.conditions (branching logic conditions)
- businessRules.routing (routing rules)
- businessRules.filters (inclusion/exclusion filters)
- businessRules.transformations (data transformations)
- aiConfig.enabled (true/false)
- aiConfig.task (classification, generation, extraction, summarization)
- aiConfig.confidenceThreshold (0.0-1.0)
- aiConfig.humanEscalation (true/false)
- aiConfig.fallbackBehavior (what to do on failure)
- aiConfig.promptTemplate (custom prompt template)
- aiConfig.systemPrompt (custom system prompt)
- humanApproval.required (true/false)
- humanApproval.stages (where approval is needed)
- humanApproval.escalationPath (where to escalate)
- errorHandling.retryStrategy (exponential-backoff, fixed, none)
- errorHandling.maxRetries (number)
- errorHandling.fallbackPath (fallback behavior)
- errorHandling.errorNotification (how to notify on error)
- persistence.enabled (true/false)
- persistence.storage (database, file, memory)
- persistence.logLevel (error, warn, info, debug)
- persistence.auditTrail (true/false)
- schedule.enabled (true/false)
- schedule.frequency (daily, hourly, weekly, cron)
- schedule.timezone (timezone string)
- schedule.time (HH:MM format)
- security.credentials (list of credentials needed)
- security.encryption (true/false)
- security.accessControl (list of access controls)
- security.dataRetention (retention policy)
- observability.monitoring (true/false)
- observability.metrics (list of metrics to track)
- observability.alerts (list of alerts to configure)
- filename (suggested filename for the artifact)
- architecture.complexity (simple, moderate, complex)
- architecture.assumptions (list of architectural assumptions)
- recommendations (list of recommendations)

Return ONLY valid JSON in this exact format:
{
  "automationType": "workflow",
  "domain": "email",
  "description": "...",
  "platform": "n8n",
  "trigger": { "type": "email", "source": "gmail" },
  "inputs": { "sources": ["email"], "format": "text" },
  "outputs": { "destinations": ["email"], "notification": true },
  "integrations": { "emailProvider": "gmail", "aiProvider": "openai", "aiModel": "gpt-4" },
  "businessRules": { "routing": ["reply to all emails"], "conditions": ["customer"] },
  "aiConfig": { "enabled": true, "task": "generation" },
  "humanApproval": { "required": true },
  "schedule": { "enabled": false },
  "persistence": { "enabled": true },
  "errorHandling": { "retryStrategy": "exponential-backoff", "maxRetries": 3 },
  "architecture": { "complexity": "moderate" },
  "assumptions": ["assumption 1"],
  "recommendations": ["recommendation 1"]
}

IMPORTANT:
- If a field is not mentioned or inferable from context, OMIT it from the JSON
- Do not include null or undefined values
- Do not include empty strings or empty arrays
- Do not include any text before or after the JSON
- Return a compact JSON object with only the fields you can confidently extract
- Be specific and precise - if uncertain, omit the field rather than guess

Return ONLY the JSON object, nothing else.`

    console.log('[Semantic Analyzer] Calling AI for specification extraction with prompt length:', prompt.length)

    const response = await aiService.generateResponse(prompt)
    console.log('[Semantic Analyzer] AI response received:', response.substring(0, 500))

    // Try to extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const spec = JSON.parse(jsonMatch[0])
        console.log('[Semantic Analyzer] Successfully parsed AI specification:', {
          fieldCount: Object.keys(spec).length,
          hasAutomationType: !!spec.automationType,
          hasDomain: !!spec.domain,
          hasPlatform: !!spec.platform,
          hasTrigger: !!spec.trigger,
          hasIntegrations: !!spec.integrations
        })
        return spec
      } catch (error) {
        console.error('[Semantic Analyzer] Failed to parse AI specification JSON:', error)
      }
    }

    // If JSON parsing fails, return empty spec (will trigger keyword fallback)
    console.log('[Semantic Analyzer] JSON extraction failed, returning empty spec for keyword fallback')
    return {}
  }
  
  /**
   * Build context from attached files
   */
  private static buildAttachmentContext(attachedFiles?: AlexFile[]): string {
    if (!attachedFiles || attachedFiles.length === 0) {
      return ''
    }
    
    let context = '\n\nAttached files:\n'
    attachedFiles.forEach(file => {
      context += `- ${file.original_filename} (${file.mime_type})\n`
      if (file.extracted_text && file.extracted_text.length > 0) {
        const preview = file.extracted_text.substring(0, 1000)
        context += `  Content preview: ${preview}${file.extracted_text.length > 1000 ? '...' : ''}\n`
      }
      if (file.imageDataUrl) {
        context += `  [Image file included]\n`
      }
    })
    
    return context
  }
  
  /**
   * Build context from conversation history
   */
  private static buildHistoryContext(history?: Array<{ role: string; content: string }>): string {
    if (!history || history.length === 0) {
      return ''
    }
    
    let context = '\n\nConversation history (last 3 messages):\n'
    const recentHistory = history.slice(-3)
    recentHistory.forEach(msg => {
      context += `- ${msg.role}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`
    })
    
    return context
  }
  
  /**
   * Map user answer to specification field using AI semantic understanding
   */
  static async mapAnswer(answer: string, context: string, currentSpec: AutomationSpec): Promise<{ field: string | null; value: any }> {
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()
    
    const prompt = `You are an expert automation consultant. Map the user's answer to the correct specification field using semantic understanding.

Question context: ${context}
User's answer: ${answer}

Current specification state:
${JSON.stringify(currentSpec, null, 2)}

Determine which field this answer maps to and extract the value using semantic understanding, not just keyword matching.

For AI providers (context: integrations.aiModel or integrations.aiProvider):
- "Google's Gemini", "Google's AI", "Use Google" → field: "integrations.aiModel", value: "gemini" 
- "Anthropic's Claude", "I'd prefer Anthropic", "Use Claude" → field: "integrations.aiModel", value: "claude-3"
- "OpenAI's latest model", "Use OpenAI", "GPT" → field: "integrations.aiModel", value: "gpt-4"
- "Pick the best option", "Whatever you recommend" → field: "recommendation", value: "gpt-4"

For email providers (context: integrations.emailProvider):
- "Microsoft 365", "Outlook", "Exchange" → field: "integrations.emailProvider", value: "outlook"
- "Google Workspace", "Gmail", "Google" → field: "integrations.emailProvider", value: "gmail"
- "SMTP", "IMAP" → field: "integrations.emailProvider", value: "imap/smtp"
- "Whatever you recommend" → field: "recommendation", value: "gmail"

For schedules (context: schedule.frequency or schedule.time):
- "Every weekday morning", "Weekdays only" → field: "schedule.frequency", value: "weekdays"
- "At 8am every day", "Daily" → field: "schedule.frequency", value: "daily"
- "Every Monday and Friday", "Weekly" → field: "schedule.frequency", value: "weekly"
- "8am" → field: "schedule.time", value: "08:00"

For business rules (context: businessRules.routing):
- "All incoming emails", "Every message", "All" → field: "businessRules.routing", value: ["reply to all emails"]
- "Support only", "Customer inquiries", "Support inquiries" → field: "businessRules.routing", value: ["reply to support inquiries only"]
- "Sales only" → field: "businessRules.routing", value: ["reply to sales inquiries only"]

For knowledge bases (context: integrations.knowledgeBase):
- "Notion" → field: "integrations.knowledgeBase", value: "notion"
- "Confluence" → field: "integrations.knowledgeBase", value: "confluence"
- "Pinecone", "Vector database" → field: "integrations.knowledgeBase", value: "pinecone"
- "None", "No knowledge base" → field: "integrations.knowledgeBase", value: "none"

For outputs (context: outputs.destinations):
- "Email", "Gmail", "Outlook" → field: "outputs.destinations", value: ["email"]
- "Slack" → field: "outputs.destinations", value: ["slack"]
- "Telegram" → field: "outputs.destinations", value: ["telegram"]
- "WhatsApp" → field: "outputs.destinations", value: ["whatsapp"]

Return ONLY valid JSON in this exact format:
{
  "field": "spec.field.path",
  "value": "extracted value"
}

If the answer is a request for recommendation ("pick the best", "whatever you recommend", "you choose"), return:
{
  "field": "recommendation",
  "value": "sensible default value for this context"
}

If the answer is "Skip", "None", "Don't know", or unclear, return:
{
  "field": null,
  "value": null
}

IMPORTANT: Use semantic understanding. The user might say "Google's AI" instead of "Gemini", or "Microsoft 365" instead of "Outlook". Infer the intended meaning.

Do not include any text before or after the JSON.`

    console.log('[Semantic Analyzer] Calling AI for answer mapping:', { context, answer: answer.substring(0, 50) })

    const response = await aiService.generateResponse(prompt)
    console.log('[Semantic Analyzer] AI mapping response:', response.substring(0, 200))

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0])
        console.log('[Semantic Analyzer] Successfully parsed AI mapping:', result)
        return result
      } catch (error) {
        console.error('[Semantic Analyzer] Failed to parse AI mapping JSON:', error)
      }
    }

    // If AI mapping fails, return null (will trigger keyword fallback)
    console.log('[Semantic Analyzer] AI mapping failed, returning null for keyword fallback')
    return { field: null, value: null }
  }
  
  /**
   * Generate question options dynamically using AI
   */
  static async generateOptions(field: string, currentSpec: AutomationSpec): Promise<string[] | null> {
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()
    
    const prompt = `You are an expert automation consultant. Generate relevant options for a question about a specification field.

Field: ${field}
Current specification state:
${JSON.stringify(currentSpec, null, 2)}

Generate 3-5 relevant options for this field, or null if this is an open-ended question.

Examples:
- For email provider: ["Gmail", "Outlook", "IMAP/SMTP", "SendGrid", "Recommend for me"]
- For AI model: ["Recommend for me", "OpenAI GPT-4", "Anthropic Claude-3", "Google Gemini", "Local LLM"]
- For destinations: ["Email", "Slack", "Telegram", "WhatsApp", "Discord", "Recommend for me"]
- For custom description (like routing rules): null
- For filename: null

Return ONLY valid JSON in this exact format:
{
  "options": ["option1", "option2", "option3"] or null
}

Do not include any text before or after the JSON.`

    console.log('[Semantic Analyzer] Calling AI for option generation:', field)

    const response = await aiService.generateResponse(prompt)
    console.log('[Semantic Analyzer] AI options response:', response.substring(0, 200))

    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        const result = JSON.parse(jsonMatch[0])
        console.log('[Semantic Analyzer] Successfully parsed AI options:', result)
        return result.options
      } catch (error) {
        console.error('[Semantic Analyzer] Failed to parse AI options JSON:', error)
      }
    }

    // If AI option generation fails, return null (will trigger fallback)
    console.log('[Semantic Analyzer] AI option generation failed, returning null for fallback')
    return null
  }
}
