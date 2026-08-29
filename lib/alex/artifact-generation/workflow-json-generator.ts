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

CRITICAL n8n SCHEMA RULES:
1. Output ONLY the raw JSON object. No markdown, no code fences, no explanation.
2. Every node MUST have: "parameters" (object), "id" (uuid-like string), "name", "type" (exact n8n node type), "typeVersion" (number), "position" (array [x, y]).
3. Use REAL n8n node types. CRITICAL: Default to "typeVersion": 1 for maximum backward compatibility with older n8n instances.
   - Triggers: n8n-nodes-base.webhook (v1), n8n-nodes-base.scheduleTrigger (v1), n8n-nodes-base.manualTrigger (v1)
   - Logic: n8n-nodes-base.if (v1), n8n-nodes-base.switch (v1), n8n-nodes-base.merge (v1)
   - Data & Transform: n8n-nodes-base.code (v1 or v2) (use parameters.jsCode), n8n-nodes-base.set (v1), n8n-nodes-base.httpRequest (v1)
   - Apps: n8n-nodes-base.googleSheets (v1 or v2), n8n-nodes-base.twilio (v1), n8n-nodes-base.slack (v1)
   - AI/LangChain: @n8n/n8n-nodes-langchain.lmChatGoogleGemini (v1), @n8n/n8n-nodes-langchain.chainLlm (v1), @n8n/n8n-nodes-langchain.lmChatGroq (v1)
4. Connections MUST use node names as keys. Format for main output:
   { "NodeName": { "main": [ [ { "node": "NextNode", "type": "main", "index": 0 } ] ] } }
   For AI models feeding into a chain, use the "ai_languageModel" type:
   { "ModelNodeName": { "ai_languageModel": [ [ { "node": "ChainNodeName", "type": "ai_languageModel", "index": 0 } ] ] } }
   For IF nodes, main has TWO arrays (0 = true branch, 1 = false branch):
   { "IfNode": { "main": [ [ { "node": "TrueNode", "type": "main", "index": 0 } ], [ { "node": "FalseNode", "type": "main", "index": 0 } ] ] } }
5. Credentials: When needed, add a "credentials" object to the node, e.g. { "googleSheetsOAuth2Api": { "id": "placeholder_id", "name": "Google Sheets account" } }. Do not invent real keys.
6. Position nodes intelligently on an [x, y] grid (e.g. Trigger at [0, 0], next at [250, 0], AI models at [250, 200]).
7. Expressions: Use "={{ $json.property }}" syntax.
8. The top-level JSON must have: "name" (string), "nodes" (array), "connections" (object), "active" (boolean), "settings" (object, e.g. {"executionOrder": "v1"}), "versionId" (uuid).
9. Make parameters as complete and realistic as possible based on the plan. Include proper JS code in Code nodes, proper headers in HTTP requests, etc.

OUTPUT: Return ONLY the JSON object.`


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
          return { content, filename, fileType: 'application/json' }
        } catch (error) {
          console.error('[WorkflowJSONGenerator] AI generation failed, using fallback:', error)
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