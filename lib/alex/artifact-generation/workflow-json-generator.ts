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
  static async generateN8NWorkflowWithAI(plan: AutomationPlan): Promise<string> {
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()

    const planSummary = this.buildPlanSummary(plan)

    const prompt = `You are an elite n8n workflow architect. Generate a COMPLETE, VALID, IMPORTABLE n8n workflow JSON based on the following automation plan.

AUTOMATION PLAN:
${planSummary}

CRITICAL RULES:
1. Output ONLY the raw JSON object. No markdown, no code fences, no explanation text.
2. NEVER use n8n-nodes-base.code as a substitute for a real integration node. Use the ACTUAL n8n node type for each service.
3. Every node MUST have: "parameters" (object), "id" (unique uuid string), "name" (string), "type" (exact n8n node type string), "typeVersion" (number, default 1), "position" ([x, y] array).

NODE TYPE REFERENCE (use these EXACT type strings):
- Gmail trigger: "n8n-nodes-base.gmailTrigger", typeVersion: 1
- Gmail send/reply: "n8n-nodes-base.gmail", typeVersion: 2, parameters.operation: "reply" or "send"
- Google Sheets append: "n8n-nodes-base.googleSheets", typeVersion: 2, parameters.operation: "appendOrUpdate"
- Slack send message: "n8n-nodes-base.slack", typeVersion: 2, parameters.resource: "message", parameters.operation: "post"
- Twilio send SMS: "n8n-nodes-base.twilio", typeVersion: 1
- Webhook: "n8n-nodes-base.webhook", typeVersion: 1
- IF conditional: "n8n-nodes-base.if", typeVersion: 1
- Switch: "n8n-nodes-base.switch", typeVersion: 1
- HTTP Request: "n8n-nodes-base.httpRequest", typeVersion: 1
- Code (JS): "n8n-nodes-base.code", typeVersion: 1 (ONLY for custom JavaScript logic, NOT as substitute for real nodes)
- Set data: "n8n-nodes-base.set", typeVersion: 1
- Schedule trigger: "n8n-nodes-base.scheduleTrigger", typeVersion: 1
- Manual trigger: "n8n-nodes-base.manualTrigger", typeVersion: 1
- Google Gemini AI: "@n8n/n8n-nodes-langchain.lmChatGoogleGemini", typeVersion: 1
- LLM Chain: "@n8n/n8n-nodes-langchain.chainLlm", typeVersion: 1
- Merge: "n8n-nodes-base.merge", typeVersion: 1

CONNECTIONS FORMAT:
- Standard: { "NodeA": { "main": [ [ { "node": "NodeB", "type": "main", "index": 0 } ] ] } }
- IF node (2 branches): { "IF": { "main": [ [ { "node": "TrueNode", "type": "main", "index": 0 } ], [ { "node": "FalseNode", "type": "main", "index": 0 } ] ] } }
- Switch node (3 branches): { "Switch": { "main": [ [ { "node": "Branch0Node", "type": "main", "index": 0 } ], [ { "node": "Branch1Node", "type": "main", "index": 0 } ], [ { "node": "Branch2Node", "type": "main", "index": 0 } ] ] } }
- AI model to chain: { "Gemini": { "ai_languageModel": [ [ { "node": "LLMChain", "type": "ai_languageModel", "index": 0 } ] ] } }
- One output to multiple nodes: { "NodeA": { "main": [ [ { "node": "NodeB", "type": "main", "index": 0 }, { "node": "NodeC", "type": "main", "index": 0 } ] ] } }

CONCRETE EXAMPLE (Shopify webhook with IF routing):
{
  "name": "Shopify Order Router",
  "nodes": [
    { "parameters": { "httpMethod": "POST", "path": "shopify-order", "responseMode": "onReceived" }, "id": "a1b2c3d4-0001-4000-8000-000000000001", "name": "Webhook", "type": "n8n-nodes-base.webhook", "typeVersion": 1, "position": [250, 300] },
    { "parameters": { "conditions": { "number": [{ "value1": "={{ $json.total_price }}", "operation": "larger", "value2": 500 }] } }, "id": "a1b2c3d4-0002-4000-8000-000000000002", "name": "IF Total > 500", "type": "n8n-nodes-base.if", "typeVersion": 1, "position": [500, 300] },
    { "parameters": { "from": "+15551234567", "to": "+15559876543", "message": "High-value order: ={{ $json.total_price }}" }, "id": "a1b2c3d4-0003-4000-8000-000000000003", "name": "Twilio SMS", "type": "n8n-nodes-base.twilio", "typeVersion": 1, "position": [750, 200], "credentials": { "twilioApi": { "id": "1", "name": "Twilio account" } } },
    { "parameters": { "operation": "appendOrUpdate", "sheetName": "Orders", "columns": "order_id,total,customer,date", "options": {} }, "id": "a1b2c3d4-0004-4000-8000-000000000004", "name": "Log to Sheets", "type": "n8n-nodes-base.googleSheets", "typeVersion": 2, "position": [750, 400], "credentials": { "googleSheetsOAuth2Api": { "id": "1", "name": "Google Sheets account" } } }
  ],
  "connections": {
    "Webhook": { "main": [[ { "node": "IF Total > 500", "type": "main", "index": 0 } ]] },
    "IF Total > 500": { "main": [[ { "node": "Twilio SMS", "type": "main", "index": 0 } ], [ { "node": "Log to Sheets", "type": "main", "index": 0 } ]] }
  },
  "active": false, "settings": { "executionOrder": "v1" }, "versionId": "a1b2c3d4-0000-4000-8000-000000000000"
}

TOP-LEVEL JSON MUST HAVE: "name", "nodes", "connections", "active" (false), "settings" ({"executionOrder": "v1"}), "versionId" (uuid).
Credentials: Add placeholder credentials objects on nodes that need auth.
Expressions: Use "={{ $json.property }}" syntax.
Positions: Spread nodes across the canvas. Use branching Y positions for parallel paths (e.g. true branch at y=200, false branch at y=400).

OUTPUT: Return ONLY the JSON object, nothing else.`


    console.log('[WorkflowJSONGenerator] Generating n8n workflow via AI for plan:', plan.objective)

    const response = await aiService.generateResponse(prompt)

    // Robust JSON extraction (handles markdown and extra text)
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

    let workflow;
    try {
      workflow = JSON.parse(jsonStr)
    } catch (parseError) {
      console.error('[WorkflowJSONGenerator] JSON parse failed on:', jsonStr.substring(0, 200) + '...')
      throw new Error('AI did not return valid JSON for workflow: ' + parseError)
    }

    // Ensure required top-level keys exist
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      throw new Error('AI workflow missing "nodes" array')
    }
    if (!workflow.connections || typeof workflow.connections !== 'object') {
      throw new Error('AI workflow missing "connections" object')
    }

    // Ensure required fields
    workflow.name = workflow.name || plan.objective || 'Generated Workflow'
    workflow.settings = workflow.settings || { executionOrder: 'v1' }
    workflow.pinData = workflow.pinData || {}
    workflow.meta = workflow.meta || { instanceId: 'generated-by-alex' }

    // Enforce IDs for all nodes, otherwise n8n shows ? icons
    workflow.nodes.forEach((node: any, index: number) => {
      if (!node.id) {
        const fallbackId = 'node-' + Date.now() + '-' + index
        node.id = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : fallbackId
      }
    })

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

    // 1. Trigger node
    const triggerType = (plan.trigger?.type || '').toLowerCase()
    if (triggerType === 'webhook' || triggerType.includes('webhook')) {
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
    } else if (triggerType === 'schedule' || triggerType.includes('cron')) {
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
    } else if (triggerType.includes('email') || triggerType.includes('gmail')) {
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

    // 2. Workflow step nodes (generic Code nodes as fallback)
    if (plan.workflow && Array.isArray(plan.workflow)) {
      plan.workflow.forEach((step: any, index: number) => {
        nodes.push({
          parameters: {
            jsCode: `// ${step.step || 'Step ' + (index + 1)}\n// ${step.description || 'Add your logic here'}\nreturn $input.all();`
          },
          id: crypto.randomUUID ? crypto.randomUUID() : `step-${index}-${Date.now()}`,
          name: step.step || `Step ${index + 1}`,
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
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

    const workflow = {
      name: plan.objective || 'Generated Workflow',
      nodes,
      connections,
      settings: { executionOrder: 'v1' },
      pinData: {},
      meta: { instanceId: 'generated-by-alex' }
    }

    return JSON.stringify(workflow, null, 2)
  }

  /**
   * Main generator - routes to appropriate platform.
   * Now uses AI for n8n, with fallback to templates.
   */
  static async generateWorkflowAsync(plan: AutomationPlan, platform: string): Promise<{ content: string; filename: string; fileType: string }> {
    const filename = `${this.sanitizeFilename(plan.objective || 'workflow')}.json`

    switch (platform.toLowerCase()) {
      case 'n8n':
      default: {
        try {
          const content = await this.generateN8NWorkflowWithAI(plan)
          console.log('[WorkflowJSONGenerator] ✅ AI generation succeeded!')
          return { content, filename, fileType: 'application/json' }
        } catch (error) {
          console.error('[WorkflowJSONGenerator] ❌ AI generation FAILED, falling back to template generator.')
          console.error('[WorkflowJSONGenerator] Error details:', error instanceof Error ? error.message : String(error))
          console.error('[WorkflowJSONGenerator] Stack:', error instanceof Error ? error.stack : 'N/A')
          const content = this.generateN8NWorkflowFallback(plan)
          return { content, filename, fileType: 'application/json' }
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