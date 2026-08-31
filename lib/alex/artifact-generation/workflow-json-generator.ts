/**
 * Workflow JSON Generator
 * 
 * Uses AI to generate proper, standard n8n workflow JSON files.
 * Falls back to basic template generation if AI fails.
 */

import { AutomationPlan } from '../orchestration/types'

export class WorkflowJSONGenerator {

  /**
   * AI-powered n8n workflow generation.
   * Sends the plan to the AI with strict n8n schema instructions,
   * producing valid, importable workflow JSON.
   */
  static async generateN8NWorkflowWithAI(
    plan: AutomationPlan,
    options?: { personalProvider?: string; personalApiKey?: string; personalModel?: string }
  ): Promise<string> {
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()

    const planSummary = this.buildPlanSummary(plan)

    let attempt = 0
    const maxAttempts = 2
    let workflow;

    while (attempt < maxAttempts) {
      attempt++
      const retryPrompt = attempt > 1 ? `\nCRITICAL FIX REQUIRED: Your previous response used too many "n8n-nodes-base.code" nodes. You MUST use proper n8n integration nodes (e.g. n8n-nodes-base.httpRequest, @n8n/n8n-nodes-langchain.chainLlm, n8n-nodes-base.gmail) instead of generic Code nodes for integrations and AI logic.\n` : ''
      
      const prompt = `You are an elite n8n workflow architect. Generate a COMPLETE, VALID, IMPORTABLE n8n workflow JSON based on the following automation plan.
${retryPrompt}
AUTOMATION PLAN:
${planSummary}

CRITICAL RULES:
1. Output ONLY the raw JSON object. No markdown, no code fences, no explanation text.
2. ABSOLUTELY NEVER use "n8n-nodes-base.code" as a placeholder or substitute for a real integration node. Use the ACTUAL n8n node type for each service (e.g., httpRequest for APIs, chainLlm for AI, gmail for emails).
3. Every node MUST have: "parameters" (object), "id" (unique uuid string), "name" (string), "type" (exact n8n node type string), "typeVersion" (number, default 1), "position" ([x, y] array).
4. PRE-CONFIGURE ALL NODES COMPLETELY. Fill in the "parameters" object with intelligent, ready-to-use configurations. For AI nodes (chainLlm, agent), write an appropriate and highly detailed "prompt" or "systemMessage" based on the user's objective. For HTTP nodes, provide a realistic dummy URL if a real one isn't given (e.g. "https://api.example.com/rss"). For integrations that require credentials, configure the node's parameters as if they were connected (e.g., set the operation type, resource type) so it is a ready-made workflow.

TRIGGER NODE TYPE REFERENCE (every workflow starts with ONE trigger — use these EXACT type strings):
- Manual trigger (user clicks button): "n8n-nodes-base.manualTrigger", typeVersion: 1
- Schedule / Cron (run on a schedule — daily, hourly, custom interval): "n8n-nodes-base.scheduleTrigger", typeVersion: 1.2
- Webhook (run on receiving an HTTP request): "n8n-nodes-base.webhook", typeVersion: 1.1
- Form submission (generate webforms in n8n): "n8n-nodes-base.formTrigger", typeVersion: 2.2
- Chat message (run when a user sends a chat message — for AI chatbots): "@n8n/n8n-nodes-langchain.chatTrigger", typeVersion: 1.1
- Execute workflow trigger (called by another workflow): "n8n-nodes-base.executeWorkflowTrigger", typeVersion: 1
- Gmail trigger (on new email): "n8n-nodes-base.gmailTrigger", typeVersion: 1
- Telegram trigger (on new Telegram message): "n8n-nodes-base.telegramTrigger", typeVersion: 1.1
- Slack trigger (on new Slack event): "n8n-nodes-base.slackTrigger", typeVersion: 1
- Airtable trigger (on new/updated Airtable record): "n8n-nodes-base.airtableTrigger", typeVersion: 1
- Notion trigger (on Notion database change): "n8n-nodes-base.notionTrigger", typeVersion: 1
- Google Sheets trigger (on row added/updated): "n8n-nodes-base.googleSheetsTrigger", typeVersion: 1
- Error trigger (workflow errors): "n8n-nodes-base.errorTrigger", typeVersion: 1
- File trigger / Local file changes: "n8n-nodes-base.localFileTrigger", typeVersion: 1

ACTION NODE TYPE REFERENCE (use these EXACT type strings for workflow steps):
- HTTP Request (for APIs, scraping, fetching): "n8n-nodes-base.httpRequest", typeVersion: 4.1
- RSS Feed Read (to read RSS/Atom feeds): "n8n-nodes-base.rssFeedRead", typeVersion: 1
- OpenAI (direct chat/completion): "n8n-nodes-base.openAi", typeVersion: 1, parameters.model: "gpt-4o-mini"
- Gmail send/reply: "n8n-nodes-base.gmail", typeVersion: 2, parameters.operation: "reply" or "send"
- Google Sheets append: "n8n-nodes-base.googleSheets", typeVersion: 4.3, parameters.operation: "appendOrUpdate"
- Slack send message: "n8n-nodes-base.slack", typeVersion: 2.2, parameters.resource: "message", parameters.operation: "post"
- Twilio send SMS: "n8n-nodes-base.twilio", typeVersion: 1
- IF conditional: "n8n-nodes-base.if", typeVersion: 1
- Switch: "n8n-nodes-base.switch", typeVersion: 1
- Set data / Format: "n8n-nodes-base.set", typeVersion: 3.2
- Item Lists (limit, sort, filter items): "n8n-nodes-base.itemLists", typeVersion: 3, parameters.operation: "limit" (set maxItems)
- Basic LLM Chain (for summarization/generation): "@n8n/n8n-nodes-langchain.chainLlm", typeVersion: 1.4
- Google Gemini AI Model: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini", typeVersion: 1
- OpenAI Chat Model: "@n8n/n8n-nodes-langchain.lmChatOpenAi", typeVersion: 1
- Output Parser (Auto-fixing JSON): "@n8n/n8n-nodes-langchain.outputParserAutofixing", typeVersion: 1
- Split In Batches / Chunking: "n8n-nodes-base.splitInBatches", typeVersion: 1
- Wait / Rate Limit: "n8n-nodes-base.wait", typeVersion: 1
- Merge / Combine: "n8n-nodes-base.merge", typeVersion: 1
- Notion: "n8n-nodes-base.notion", typeVersion: 2
- Telegram send: "n8n-nodes-base.telegram", typeVersion: 1
- Discord: "n8n-nodes-base.discord", typeVersion: 1
- Airtable: "n8n-nodes-base.airtable", typeVersion: 2
- Execute Workflow (call another workflow): "n8n-nodes-base.executeWorkflow", typeVersion: 1
- Respond to Webhook (send response back): "n8n-nodes-base.respondToWebhook", typeVersion: 1
- Code (JS): "n8n-nodes-base.code", typeVersion: 1 (ONLY use this if custom data transformation via JavaScript is explicitly needed. Do NOT use it for APIs, Emails, AI, or Webhooks)

CONNECTIONS FORMAT:
- Standard: { "NodeA": { "main": [ [ { "node": "NodeB", "type": "main", "index": 0 } ] ] } }
- IF node (2 branches): { "IF": { "main": [ [ { "node": "TrueNode", "type": "main", "index": 0 } ], [ { "node": "FalseNode", "type": "main", "index": 0 } ] ] } }
- Switch node (3 branches): { "Switch": { "main": [ [ { "node": "Branch0Node", "type": "main", "index": 0 } ], [ { "node": "Branch1Node", "type": "main", "index": 0 } ], [ { "node": "Branch2Node", "type": "main", "index": 0 } ] ] } }
- AI model to chain: { "Gemini": { "ai_languageModel": [ [ { "node": "LLMChain", "type": "ai_languageModel", "index": 0 } ] ] } }
- One output to multiple nodes: { "NodeA": { "main": [ [ { "node": "NodeB", "type": "main", "index": 0 }, { "node": "NodeC", "type": "main", "index": 0 } ] ] } }

CONCRETE EXAMPLE (LLM Summarization with API Fetch):
{
  "name": "Content Summarizer",
  "nodes": [
    { "parameters": {}, "id": "uuid-1", "name": "Manual Trigger", "type": "n8n-nodes-base.manualTrigger", "typeVersion": 1, "position": [100, 300] },
    { "parameters": { "url": "https://example.com/api/content", "method": "GET" }, "id": "uuid-2", "name": "Fetch Content", "type": "n8n-nodes-base.httpRequest", "typeVersion": 1, "position": [300, 300] },
    { "parameters": { "prompt": "Summarize this: ={{ $json.content }}" }, "id": "uuid-3", "name": "Summarize", "type": "@n8n/n8n-nodes-langchain.chainLlm", "typeVersion": 1, "position": [500, 300] },
    { "parameters": { "model": "gemini-1.5-flash" }, "id": "uuid-4", "name": "Gemini Model", "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini", "typeVersion": 1, "position": [500, 500] },
    { "parameters": { "resource": "message", "operation": "post", "text": "Summary: ={{ $json.text }}" }, "id": "uuid-5", "name": "Send to Slack", "type": "n8n-nodes-base.slack", "typeVersion": 2, "position": [700, 300] }
  ],
  "connections": {
    "Manual Trigger": { "main": [[ { "node": "Fetch Content", "type": "main", "index": 0 } ]] },
    "Fetch Content": { "main": [[ { "node": "Summarize", "type": "main", "index": 0 } ]] },
    "Gemini Model": { "ai_languageModel": [[ { "node": "Summarize", "type": "ai_languageModel", "index": 0 } ]] },
    "Summarize": { "main": [[ { "node": "Send to Slack", "type": "main", "index": 0 } ]] }
  },
  "active": false, "settings": { "executionOrder": "v1" }, "versionId": "uuid-6"
}

TOP-LEVEL JSON MUST HAVE: "name", "nodes", "connections", "active" (false), "settings" ({"executionOrder": "v1"}), "versionId" (uuid).
Credentials: Add placeholder credentials objects on nodes that need auth.
Expressions: Use "={{ $json.property }}" syntax.
Positions: Spread nodes across the canvas. Use branching Y positions for parallel paths (e.g. true branch at y=200, false branch at y=400).

OUTPUT: Return ONLY the JSON object, nothing else.`

      console.log(`[WorkflowJSONGenerator] Requesting JSON generation from AI (Attempt ${attempt})...`)
      const response = await aiService.generateResponse(prompt, options)
      let jsonStr = response.trim()
      
      // If it has markdown code blocks, extract just the content inside them
      const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
      if (codeBlockMatch && codeBlockMatch[1]) {
        jsonStr = codeBlockMatch[1].trim()
      } else {
        // Find the first { and last }
        const firstBrace = jsonStr.indexOf('{')
        const lastBrace = jsonStr.lastIndexOf('}')
        if (firstBrace !== -1 && lastBrace !== -1 && lastBrace > firstBrace) {
          jsonStr = jsonStr.substring(firstBrace, lastBrace + 1)
        }
      }

      try {
        workflow = JSON.parse(jsonStr)
      } catch (parseError) {
        console.error('[WorkflowJSONGenerator] JSON parse failed on:', jsonStr.substring(0, 200) + '...')
        if (attempt >= maxAttempts) {
          throw new Error('AI did not return valid JSON for workflow: ' + parseError)
        }
        continue;
      }

      // Ensure required top-level keys exist
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        if (attempt >= maxAttempts) throw new Error('AI workflow missing "nodes" array')
        continue;
      }
      if (!workflow.connections || typeof workflow.connections !== 'object') {
        if (attempt >= maxAttempts) throw new Error('AI workflow missing "connections" object')
        continue;
      }

      // Validation: Check if AI used too many Code nodes
      const nonTriggerNodes = workflow.nodes.filter((n: any) => !n.type?.includes('Trigger'))
      const codeNodes = nonTriggerNodes.filter((n: any) => n.type === 'n8n-nodes-base.code')
      
      if (nonTriggerNodes.length > 0 && codeNodes.length / nonTriggerNodes.length > 0.5 && attempt < maxAttempts) {
        console.warn(`[WorkflowJSONGenerator] AI returned too many Code nodes (${codeNodes.length}/${nonTriggerNodes.length}). Retrying...`)
        continue;
      }
      
      break; // Success!
    }

    // Ensure required fields (after successful parse)
    const rawName = workflow.name || plan.objective || 'Generated Workflow'
    workflow.name = rawName.length > 60 ? rawName.substring(0, 57) + '...' : rawName
    workflow.settings = workflow.settings || { executionOrder: 'v1' }
    workflow.pinData = workflow.pinData || {}
    workflow.meta = workflow.meta || { instanceId: 'generated-by-alex' }

    // Enforce IDs for all nodes, otherwise n8n shows ? icons
    // Also strictly enforce that node.name is a string (n8n will crash with t.toLowerCase is not a function if it's a number)
    workflow.nodes.forEach((node: any, index: number) => {
      if (!node.id) {
        const fallbackId = 'node-' + Date.now() + '-' + index
        node.id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : fallbackId
      }
      if (node.name !== undefined && node.name !== null) {
        node.name = String(node.name)
      } else {
        node.name = `Node ${index + 1}`
      }
    })

    // Also enforce connection keys and node references are strings
    if (workflow.connections) {
      const newConnections: any = {}
      for (const sourceNode in workflow.connections) {
        const sourceString = String(sourceNode)
        newConnections[sourceString] = workflow.connections[sourceNode]
        
        // Fix target nodes
        for (const outputType in newConnections[sourceString]) {
          const branches = newConnections[sourceString][outputType]
          if (Array.isArray(branches)) {
            branches.forEach((branch: any) => {
              if (Array.isArray(branch)) {
                branch.forEach((target: any) => {
                  if (target.node !== undefined && target.node !== null) {
                    target.node = String(target.node)
                  }
                })
              }
            })
          }
        }
      }
      workflow.connections = newConnections
    }

    console.log('[WorkflowJSONGenerator] AI generated workflow with', workflow.nodes.length, 'nodes')
    return JSON.stringify(workflow, null, 2)
  }

  /**
   * Build a compact text summary of the plan for the AI prompt
   */
  private static buildPlanSummary(plan: AutomationPlan): string {
    const parts: string[] = []

    parts.push(`Objective: ${plan.objective || 'Unknown'}`)

    if (plan.platform) {
      parts.push(`Platform: ${plan.platform.name || 'n8n'}`)
    }

    if (plan.trigger) {
      parts.push(`Trigger: ${plan.trigger.type || 'manual'} - ${plan.trigger.description || plan.trigger.source || 'No description'}`)
    }

    if (plan.workflow && Array.isArray(plan.workflow)) {
      parts.push('Workflow Steps:')
      plan.workflow.forEach((step: any, i: number) => {
        parts.push(`  ${i + 1}. ${step.step || step.name || 'Step'}: ${step.description || 'No description'}`)
      })
    }

    if (plan.inputs) {
      parts.push(`Inputs: ${JSON.stringify(plan.inputs)}`)
    }

    if (plan.outputs) {
      parts.push(`Outputs: ${JSON.stringify(plan.outputs)}`)
    }

    if (plan.assumptions && plan.assumptions.length > 0) {
      parts.push(`Assumptions: ${plan.assumptions.join(', ')}`)
    }

    if (plan.recommendations && plan.recommendations.length > 0) {
      parts.push(`Recommendations: ${plan.recommendations.join(', ')}`)
    }

    // Include architecture stages if present
    if (plan.architecture && (plan.architecture as any).stages) {
      parts.push('Architecture Stages:')
      ;(plan.architecture as any).stages.forEach((stage: any) => {
        parts.push(`  - ${stage.name} (${stage.category}): ${stage.purpose || ''}`)
      })
    }

    return parts.join('\n')
  }

  /**
   * Fallback: Generate a basic n8n workflow from plan (no AI).
   * Used only when AI generation fails.
   */
  static generateN8NWorkflowFallback(plan: AutomationPlan): string {
    const nodes: any[] = []
    let xPos = 250
    const yBase = 300

    // Auto-generate workflow steps from plan context if plan.workflow is empty
    if (!plan.workflow || !Array.isArray(plan.workflow) || plan.workflow.length === 0) {
      plan.workflow = this.inferWorkflowSteps(plan)
    }

    // 1. Trigger node
    const triggerType = (plan.trigger?.type || '').toLowerCase()
    const triggerDesc = (plan.trigger?.description || plan.trigger?.source || '').toLowerCase()
    const triggerContext = triggerType + ' ' + triggerDesc

    if (triggerContext.includes('webhook')) {
      nodes.push({
        parameters: {
          httpMethod: 'POST',
          path: plan.objective ? plan.objective.toLowerCase().replace(/[^a-z0-9]/g, '-').substring(0, 30) : 'webhook',
          responseMode: 'onReceived',
          options: {}
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [xPos, yBase],
        webhookId: 'auto-' + Date.now()
      })
    } else if (triggerContext.includes('schedule') || triggerContext.includes('cron') || triggerContext.includes('daily') || triggerContext.includes('hourly') || triggerContext.includes('every') || triggerContext.includes('interval') || triggerContext.includes('morning') || triggerContext.includes('night')) {
      nodes.push({
        parameters: {
          rule: {
            interval: [{ field: 'cronExpression', expression: '0 9 * * *' }]
          }
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [xPos, yBase]
      })
    } else if (triggerContext.includes('form') || triggerContext.includes('submission') || triggerContext.includes('webform')) {
      nodes.push({
        parameters: {
          formTitle: plan.objective || 'Form',
          formFields: { values: [{ fieldLabel: 'Input', fieldType: 'text', requiredField: true }] },
          options: {}
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Form Trigger',
        type: 'n8n-nodes-base.formTrigger',
        typeVersion: 2.2,
        position: [xPos, yBase],
        webhookId: 'form-' + Date.now()
      })
    } else if (triggerContext.includes('chat') || triggerContext.includes('chatbot') || triggerContext.includes('conversation')) {
      nodes.push({
        parameters: {
          options: {}
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Chat Trigger',
        type: '@n8n/n8n-nodes-langchain.chatTrigger',
        typeVersion: 1.1,
        position: [xPos, yBase]
      })
    } else if (triggerContext.includes('email') || triggerContext.includes('gmail') || triggerContext.includes('mail')) {
      nodes.push({
        parameters: {
          pollTimes: { item: [{ mode: 'everyMinute' }] },
          simple: true
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Gmail Trigger',
        type: 'n8n-nodes-base.gmailTrigger',
        typeVersion: 1,
        position: [xPos, yBase],
        credentials: {
          gmailOAuth2: { id: 'GMAIL_CREDENTIAL_ID', name: 'Your Gmail account' }
        }
      })
    } else if (triggerContext.includes('telegram')) {
      nodes.push({
        parameters: {
          updates: ['message']
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Telegram Trigger',
        type: 'n8n-nodes-base.telegramTrigger',
        typeVersion: 1.1,
        position: [xPos, yBase],
        credentials: {
          telegramApi: { id: 'TELEGRAM_CREDENTIAL_ID', name: 'Your Telegram Bot' }
        }
      })
    } else if (triggerContext.includes('slack')) {
      nodes.push({
        parameters: {},
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Slack Trigger',
        type: 'n8n-nodes-base.slackTrigger',
        typeVersion: 1,
        position: [xPos, yBase],
        credentials: {
          slackOAuth2Api: { id: 'SLACK_CREDENTIAL_ID', name: 'Your Slack account' }
        }
      })
    } else if (triggerContext.includes('notion')) {
      nodes.push({
        parameters: {
          pollTimes: { item: [{ mode: 'everyMinute' }] },
          event: 'pageAddedToDatabase',
          simple: true
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Notion Trigger',
        type: 'n8n-nodes-base.notionTrigger',
        typeVersion: 1,
        position: [xPos, yBase],
        credentials: {
          notionApi: { id: 'NOTION_CREDENTIAL_ID', name: 'Your Notion account' }
        }
      })
    } else if (triggerContext.includes('airtable')) {
      nodes.push({
        parameters: {
          pollTimes: { item: [{ mode: 'everyMinute' }] },
          simple: true
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Airtable Trigger',
        type: 'n8n-nodes-base.airtableTrigger',
        typeVersion: 1,
        position: [xPos, yBase],
        credentials: {
          airtableTokenApi: { id: 'AIRTABLE_CREDENTIAL_ID', name: 'Your Airtable account' }
        }
      })
    } else if (triggerContext.includes('sheet') || triggerContext.includes('spreadsheet') || triggerContext.includes('google sheet')) {
      nodes.push({
        parameters: {
          pollTimes: { item: [{ mode: 'everyMinute' }] },
          event: 'rowAdded'
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Google Sheets Trigger',
        type: 'n8n-nodes-base.googleSheetsTrigger',
        typeVersion: 1,
        position: [xPos, yBase],
        credentials: {
          googleSheetsOAuth2Api: { id: 'GSHEETS_CREDENTIAL_ID', name: 'Your Google account' }
        }
      })
    } else if (triggerContext.includes('execute') || triggerContext.includes('sub-workflow') || triggerContext.includes('called by')) {
      nodes.push({
        parameters: {},
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Execute Workflow Trigger',
        type: 'n8n-nodes-base.executeWorkflowTrigger',
        typeVersion: 1,
        position: [xPos, yBase]
      })
    } else if (triggerContext.includes('error') || triggerContext.includes('failure')) {
      nodes.push({
        parameters: {},
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Error Trigger',
        type: 'n8n-nodes-base.errorTrigger',
        typeVersion: 1,
        position: [xPos, yBase]
      })
    } else {
      nodes.push({
        parameters: {},
        id: crypto.randomUUID ? crypto.randomUUID() : 'trigger-' + Date.now(),
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [xPos, yBase]
      })
    }
    xPos += 250

    // 2. Workflow step nodes (using semantic mapping instead of generic Code nodes)
    if (plan.workflow && Array.isArray(plan.workflow)) {
      plan.workflow.forEach((step: any, index: number) => {
        const desc = (step.description || step.step || '').toLowerCase()
        let nodeType = 'n8n-nodes-base.set'
        let typeVersion = 1
        let parameters: any = { keepOnlySet: false, values: { string: [{ name: 'placeholder', value: 'placeholder' }] } }

        // Infer node type from description
        if (desc.includes('rss') || desc.includes('feed')) {
          nodeType = 'n8n-nodes-base.rssFeedRead'
          typeVersion = 1
          parameters = { url: 'https://example.com/feed/' }
        } else if (desc.includes('limit') || desc.includes('top ')) {
          nodeType = 'n8n-nodes-base.itemLists'
          typeVersion = 3
          parameters = { operation: 'limit', maxItems: 5 }
        } else if (desc.includes('http') || desc.includes('fetch') || desc.includes('api') || desc.includes('scrape') || desc.includes('get ') || desc.includes('url') || desc.includes('request') || desc.includes('download') || desc.includes('content')) {
          nodeType = 'n8n-nodes-base.httpRequest'
          parameters = { method: 'GET', url: 'https://example.com' }
        } else if (desc.includes('summarize') || desc.includes('ai') || desc.includes('llm') || desc.includes('generate') || desc.includes('analyze') || desc.includes('classify') || desc.includes('extract')) {
          nodeType = '@n8n/n8n-nodes-langchain.chainLlm'
          parameters = { prompt: '={{ $json.content }}' }
        } else if (desc.includes('email') || desc.includes('gmail') || desc.includes('mail') || desc.includes('digest')) {
          nodeType = 'n8n-nodes-base.gmail'
          typeVersion = 2
          parameters = { operation: 'send', message: 'Hello' }
        } else if (desc.includes('slack')) {
          nodeType = 'n8n-nodes-base.slack'
          typeVersion = 2
          parameters = { resource: 'message', operation: 'post', text: 'Hello' }
        } else if (desc.includes('sheet') || desc.includes('spreadsheet')) {
          nodeType = 'n8n-nodes-base.googleSheets'
          typeVersion = 4.3
          parameters = { operation: 'appendOrUpdate' }
        } else if (desc.includes('if') || desc.includes('condition') || desc.includes('filter')) {
          nodeType = 'n8n-nodes-base.if'
          parameters = { conditions: { string: [] } }
        } else if (desc.includes('chunk') || desc.includes('batch') || desc.includes('split')) {
          nodeType = 'n8n-nodes-base.splitInBatches'
          typeVersion = 3
          parameters = { batchSize: 10 }
        } else if (desc.includes('format') || desc.includes('transform') || desc.includes('combine') || desc.includes('merge')) {
          nodeType = 'n8n-nodes-base.set'
          typeVersion = 3.2
          parameters = { keepOnlySet: false, values: {} }
        } else if (desc.includes('notion')) {
          nodeType = 'n8n-nodes-base.notion'
          typeVersion = 2
          parameters = { operation: 'create', resource: 'page' }
        } else if (desc.includes('telegram')) {
          nodeType = 'n8n-nodes-base.telegram'
          parameters = { operation: 'sendMessage' }
        } else if (desc.includes('discord')) {
          nodeType = 'n8n-nodes-base.discord'
          parameters = { operation: 'sendMessage' }
        }

        // Check if the AI provided a nodeType explicitly in the plan
        if (step.nodeType) {
          nodeType = step.nodeType
          if (nodeType !== 'n8n-nodes-base.set') parameters = {} 
        }

        nodes.push({
          parameters,
          id: crypto.randomUUID ? crypto.randomUUID() : `step-${index}-${Date.now()}`,
          name: String(step.step || `Step ${index + 1}`),
          type: nodeType,
          typeVersion,
          position: [xPos, yBase]
        })
        xPos += 250
      })
    }

    // Ensure at least one processing node
    if (nodes.length === 1) {
      nodes.push({
        parameters: {
          jsCode: `// ${plan.objective || 'Processing'}\n// Add your logic here\nreturn $input.all();`
        },
        id: crypto.randomUUID ? crypto.randomUUID() : 'process-' + Date.now(),
        name: 'Process',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [xPos, yBase]
      })
    }

    // Build connections
    const connections: any = {}
    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i]
      const next = nodes[i + 1]

      if (current.type === 'n8n-nodes-base.if' && i + 2 < nodes.length) {
        connections[current.name] = {
          main: [
            [{ node: next.name, type: 'main', index: 0 }],
            [{ node: nodes[i + 2].name, type: 'main', index: 0 }]
          ]
        }
        i++
      } else {
        connections[current.name] = {
          main: [[{ node: next.name, type: 'main', index: 0 }]]
        }
      }
    }

    const rawName = plan.objective || 'Generated Workflow'
    const workflow = {
      name: rawName.length > 60 ? rawName.substring(0, 57) + '...' : rawName,
      nodes,
      connections,
      settings: { executionOrder: 'v1' },
      pinData: {},
      meta: { instanceId: 'generated-by-alex' }
    }

    return JSON.stringify(workflow, null, 2)
  }

  /**
   * Infer workflow steps from plan inputs/outputs/objective when
   * the plan has no explicit workflow array.
   */
  private static inferWorkflowSteps(plan: AutomationPlan): Array<{step: string, description: string}> {
    const steps: Array<{step: string, description: string}> = []
    const objective = (plan.objective || '').toLowerCase()

    // Step 1: Fetch / Ingest data from each source
    const sources = plan.inputs?.sources || []
    if (sources.length > 0) {
      sources.forEach((src: string) => {
        const srcLower = (src || '').toLowerCase()
        if (srcLower.includes('rss')) {
          steps.push({ step: 'Fetch RSS Feeds', description: 'Fetch content from RSS feed sources via HTTP Request' })
        } else if (srcLower.includes('url') || srcLower.includes('web') || srcLower.includes('page')) {
          steps.push({ step: 'Fetch Web Content', description: 'Fetch content from URLs/webpages via HTTP Request' })
        } else if (srcLower.includes('api')) {
          steps.push({ step: 'Fetch API Data', description: 'Fetch data from external API via HTTP Request' })
        } else if (srcLower.includes('email') || srcLower.includes('mail')) {
          steps.push({ step: 'Read Emails', description: 'Read incoming emails via Gmail/email node' })
        } else if (srcLower.includes('social') || srcLower.includes('twitter') || srcLower.includes('linkedin') || srcLower.includes('facebook')) {
          steps.push({ step: 'Fetch Social Media', description: 'Fetch social media content via HTTP Request API' })
        } else if (srcLower.includes('document') || srcLower.includes('pdf') || srcLower.includes('file') || srcLower.includes('text')) {
          steps.push({ step: 'Read Documents', description: 'Read and extract content from documents via HTTP Request' })
        } else {
          steps.push({ step: `Fetch ${src}`, description: `Fetch data from ${src} via HTTP Request` })
        }
      })
    } else if (objective.includes('summar') || objective.includes('content')) {
      steps.push({ step: 'Fetch Content', description: 'Fetch content from source via HTTP Request' })
    }

    // Step 2: If multiple sources, combine them
    if (steps.length > 1) {
      steps.push({ step: 'Combine Data', description: 'Format and combine data from multiple sources' })
    }

    // Step 3: AI processing if the objective implies it
    if (objective.includes('summar') || objective.includes('generat') || objective.includes('analyz') ||
        objective.includes('classif') || objective.includes('extract') || objective.includes('ai') ||
        objective.includes('bot') || objective.includes('chat')) {
      steps.push({ step: 'AI Summarize', description: 'Summarize and analyze content using AI/LLM' })
    }

    // Step 4: Format output
    steps.push({ step: 'Format Output', description: 'Format and transform the results for delivery' })

    // Step 5: Deliver to each destination
    const destinations = plan.outputs?.destinations || []
    if (destinations.length > 0) {
      destinations.forEach((dest: string) => {
        const destLower = (dest || '').toLowerCase()
        if (destLower.includes('email') || destLower.includes('gmail') || destLower.includes('mail')) {
          steps.push({ step: 'Send Email Digest', description: 'Send results as email digest via Gmail' })
        } else if (destLower.includes('slack')) {
          steps.push({ step: 'Post to Slack', description: 'Post results to Slack channel' })
        } else if (destLower.includes('sheet') || destLower.includes('spreadsheet')) {
          steps.push({ step: 'Save to Google Sheets', description: 'Append results to Google Sheets spreadsheet' })
        } else if (destLower.includes('notion')) {
          steps.push({ step: 'Save to Notion', description: 'Create page in Notion database' })
        } else if (destLower.includes('webhook')) {
          steps.push({ step: 'Send via Webhook', description: 'Send results via webhook/HTTP request to external app' })
        } else if (destLower.includes('telegram')) {
          steps.push({ step: 'Send to Telegram', description: 'Send message via Telegram bot' })
        } else if (destLower.includes('discord')) {
          steps.push({ step: 'Send to Discord', description: 'Send message to Discord channel' })
        } else {
          steps.push({ step: `Send to ${dest}`, description: `Deliver results to ${dest}` })
        }
      })
    }

    // If nothing was inferred, add a generic processing step
    if (steps.length === 0) {
      steps.push({ step: 'Fetch Data', description: 'Fetch input data via HTTP Request' })
      steps.push({ step: 'Process', description: 'Process and transform data' })
      steps.push({ step: 'Output', description: 'Send results to output destination' })
    }

    console.log(`[WorkflowJSONGenerator] Inferred ${steps.length} workflow steps from plan context`)
    return steps
  }

  /**
   * Main generator - routes to appropriate platform.
   * Now uses AI for n8n, with fallback to templates.
   */
  static async generateWorkflowAsync(
    plan: AutomationPlan, 
    platform: string,
    options?: { personalProvider?: string; personalApiKey?: string; personalModel?: string }
  ): Promise<{ content: string; filename: string; fileType: string }> {
    const filename = `${this.sanitizeFilename(plan.objective || 'workflow')}.json`

    switch (platform.toLowerCase()) {
      case 'n8n':
      default: {
        try {
          const content = await this.generateN8NWorkflowWithAI(plan, options)
          console.log('[WorkflowJSONGenerator] ✅ AI generation succeeded!')
          return { content, filename, fileType: 'application/json' }
        } catch (error) {
          console.error('[WorkflowJSONGenerator] ❌ AI generation FAILED. Fallback template is disabled by user request.')
          console.error('[WorkflowJSONGenerator] Error details:', error instanceof Error ? error.message : String(error))
          console.error('[WorkflowJSONGenerator] Stack:', error instanceof Error ? error.stack : 'N/A')
          
          throw new Error('AI workflow generation failed. Please click "Modify" and try again to ensure a high-quality, AI-powered workflow is generated.')
        }
      }

      case 'zapier': {
        const zap = {
          title: plan.objective || 'Generated Zap',
          description: plan.objective,
          steps: [
            { type: 'trigger', description: plan.trigger?.description || 'Trigger step' },
            ...(plan.workflow?.map((step: any) => ({
              type: 'action',
              description: step.description || step.step
            })) || [])
          ]
        }
        return { content: JSON.stringify(zap, null, 2), filename, fileType: 'application/json' }
      }

      case 'make':
      case 'integromat': {
        const scenario = {
          name: plan.objective || 'Generated Scenario',
          flow: [{
            modules: [
              { parameters: {}, ...plan.trigger },
              ...(plan.workflow?.map((step: any) => ({ parameters: {}, ...step })) || [])
            ]
          }]
        }
        return { content: JSON.stringify(scenario, null, 2), filename, fileType: 'application/json' }
      }
    }
  }

  /**
   * Synchronous wrapper (for backward compatibility).
   * Falls back to template-based generation only.
   */
  static generateWorkflow(plan: AutomationPlan, platform: string): { content: string; filename: string; fileType: string } {
    const filename = `${this.sanitizeFilename(plan.objective || 'workflow')}.json`

    switch (platform.toLowerCase()) {
      case 'n8n':
      default: {
        const content = this.generateN8NWorkflowFallback(plan)
        return { content, filename, fileType: 'application/json' }
      }

      case 'zapier': {
        const zap = {
          title: plan.objective || 'Generated Zap',
          description: plan.objective,
          steps: [
            { type: 'trigger', description: plan.trigger?.description || 'Trigger step' },
            ...(plan.workflow?.map((step: any) => ({
              type: 'action',
              description: step.description || step.step
            })) || [])
          ]
        }
        return { content: JSON.stringify(zap, null, 2), filename, fileType: 'application/json' }
      }

      case 'make':
      case 'integromat': {
        const scenario = {
          name: plan.objective || 'Generated Scenario',
          flow: [{
            modules: [
              { parameters: {}, ...plan.trigger },
              ...(plan.workflow?.map((step: any) => ({ parameters: {}, ...step })) || [])
            ]
          }]
        }
        return { content: JSON.stringify(scenario, null, 2), filename, fileType: 'application/json' }
      }
    }
  }

  /**
   * Sanitize filename
   */
  private static sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)
  }
}