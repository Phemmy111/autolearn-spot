/**
 * Phase 7: Workflow Generator
 * 
 * Generates n8n workflows from natural language requirements using AI.
 */

import { Workflow, WorkflowGenerationRequest, WorkflowGenerationResult, WorkflowNode } from './workflow-types'
import { WorkflowValidator } from './workflow-validator'
import { WorkflowAnalyzer } from './workflow-analyzer'
import { AIEngine } from '../ai-engine'

export class WorkflowGenerator {
  /**
   * Generate a workflow from a natural language request
   */
  static async generate(
    request: WorkflowGenerationRequest,
    aiEngine: AIEngine,
    webResearchService?: any
  ): Promise<WorkflowGenerationResult> {
    const { requirement, additionalContext, existingWorkflow, constraints } = request

    // Build the prompt for the AI
    const prompt = this.buildGenerationPrompt(requirement, additionalContext, existingWorkflow, constraints)

    // Use AI to generate workflow JSON
    const aiResponse = await aiEngine.chat({
      messages: [
        {
          role: 'system',
          content: `You are an expert n8n workflow engineer. Generate valid n8n workflow JSON based on user requirements.

CRITICAL RULES:
1. ALWAYS return valid JSON only - no markdown, no code blocks, no explanations outside the JSON
2. The workflow must be a valid n8n workflow object with "nodes" array and "connections" array
3. Each node must have: id, name, type, typeVersion, position, parameters
4. Use standard n8n node types (e.g., "n8n-nodes-base.webhook", "n8n-nodes-base.googleSheets")
5. NEVER include actual credentials or API keys - use credential references only
6. NEVER include environment variables or secrets in the workflow
7. Generate realistic but placeholder configuration values
8. Ensure connections reference valid node IDs
9. Position nodes logically in the workflow editor

WORKFLOW JSON STRUCTURE:
{
  "nodes": [
    {
      "id": "unique-id",
      "name": "Node Name",
      "type": "n8n-nodes-base.nodeType",
      "typeVersion": 1,
      "position": [x, y],
      "parameters": { ... }
    }
  ],
  "connections": [
    {
      "source": "source-node-id",
      "target": "target-node-id"
    }
  ]
}`
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      enableTools: false,
      disableTools: true
    })

    // Extract JSON from AI response
    const workflowJson = this.extractJsonFromResponse(aiResponse.content)

    if (!workflowJson) {
      throw new Error('Failed to generate valid workflow JSON from AI response')
    }

    // Parse the workflow
    const workflow = JSON.parse(workflowJson)

    // Validate the generated workflow
    const validation = WorkflowValidator.validate(workflow)

    // If validation fails, attempt repair
    if (!validation.isValid) {
      console.warn('[WorkflowGenerator] Generated workflow failed validation, attempting repair')
      // Could add auto-repair here
    }

    // Analyze the workflow
    const analysis = WorkflowAnalyzer.analyze(workflow)

    // Generate explanation
    const explanation = this.generateExplanation(requirement, analysis, validation)

    // Extract required credentials
    const requiredCredentials = this.extractRequiredCredentials(analysis)

    // Extract required configuration
    const requiredConfiguration = this.extractRequiredConfiguration(workflow, analysis)

    // Generate testing instructions
    const testingInstructions = this.generateTestingInstructions(workflow, analysis)

    return {
      workflow,
      validation,
      explanation,
      requiredCredentials,
      requiredConfiguration,
      testingInstructions
    }
  }

  /**
   * Build the generation prompt
   */
  private static buildGenerationPrompt(
    requirement: string,
    additionalContext?: string,
    existingWorkflow?: Workflow,
    constraints?: any
  ): string {
    let prompt = `Generate an n8n workflow for the following requirement:\n\n${requirement}\n\n`

    if (additionalContext) {
      prompt += `Additional context:\n${additionalContext}\n\n`
    }

    if (existingWorkflow) {
      prompt += `Base this workflow on the existing workflow structure provided.\n\n`
    }

    if (constraints) {
      if (constraints.maxNodes) {
        prompt += `Maximum nodes: ${constraints.maxNodes}\n`
      }
      if (constraints.requiredIntegrations) {
        prompt += `Required integrations: ${constraints.requiredIntegrations.join(', ')}\n`
      }
      if (constraints.excludedIntegrations) {
        prompt += `Excluded integrations: ${constraints.excludedIntegrations.join(', ')}\n`
      }
    }

    prompt += `\nReturn ONLY the valid n8n workflow JSON object. No markdown, no code blocks, no explanations.`

    return prompt
  }

  /**
   * Extract JSON from AI response
   */
  private static extractJsonFromResponse(response: string): string | null {
    // Try to find JSON in the response
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return jsonMatch[0]
    }

    // Try to find JSON in code blocks
    const codeBlockMatch = response.match(/```(?:json)?\s*([\s\S]*?)\s*```/)
    if (codeBlockMatch) {
      return codeBlockMatch[1]
    }

    // If the entire response is JSON
    try {
      JSON.parse(response)
      return response
    } catch {
      return null
    }
  }

  /**
   * Generate explanation for the workflow
   */
  private static generateExplanation(
    requirement: string,
    analysis: any,
    validation: any
  ): string {
    let explanation = `I've generated an n8n workflow to: ${requirement}\n\n`

    explanation += `**Workflow Structure:**\n`
    explanation += `- Nodes: ${analysis.nodeSequence.length}\n`
    explanation += `- Sequence: ${analysis.nodeSequence.join(' → ')}\n\n`

    if (analysis.triggers.length > 0) {
      explanation += `**Triggers:**\n`
      analysis.triggers.forEach((t: WorkflowNode) => {
        explanation += `- ${t.name} (${t.type})\n`
      })
      explanation += '\n'
    }

    if (analysis.integrations.length > 0) {
      explanation += `**Integrations:**\n`
      analysis.integrations.forEach((int: string) => {
        explanation += `- ${int}\n`
      })
      explanation += '\n'
    }

    if (!validation.isValid) {
      explanation += `**Validation Notes:**\n`
      validation.warnings.forEach((w: any) => {
        explanation += `- ${w.message}\n`
      })
      explanation += '\n'
    }

    return explanation
  }

  /**
   * Extract required credentials
   */
  private static extractRequiredCredentials(analysis: any): Record<string, string> {
    const credentials: Record<string, string> = {}

    analysis.requiredCredentials.forEach((cred: string) => {
      credentials[cred] = `You need to configure a ${cred} credential in n8n. The workflow references this credential but does not contain the actual secret.`
    })

    return credentials
  }

  /**
   * Extract required configuration
   */
  private static extractRequiredConfiguration(workflow: Workflow, analysis: any): Record<string, string> {
    const config: Record<string, string> = {}

    workflow.nodes.forEach(node => {
      if (node.parameters) {
        // Check for common configurable values
        if (node.type.includes('webhook') && node.parameters.path) {
          config['webhook_path'] = `The webhook path is set to "${node.parameters.path}". You may need to update this based on your requirements.`
        }

        if (node.type.includes('sheets') && node.parameters.sheetId) {
          config['spreadsheet_id'] = `The workflow references a spreadsheet ID. Replace this with your actual Google Sheets ID.`
        }

        if (node.type.includes('email') && node.parameters.email) {
          config['email_address'] = `The workflow sends to "${node.parameters.email}". Update this with the actual recipient.`
        }

        if (node.type.includes('http') && node.parameters.url) {
          config['api_url'] = `The workflow calls "${node.parameters.url}". Update this with your actual API endpoint.`
        }
      }
    })

    return config
  }

  /**
   * Generate testing instructions
   */
  private static generateTestingInstructions(workflow: Workflow, analysis: any): string {
    let instructions = `**Testing Instructions:**\n\n`

    // Find trigger nodes
    const triggers = analysis.triggers
    if (triggers.length > 0) {
      instructions += `1. Activate the workflow in n8n\n`
      if (triggers[0].type.includes('webhook')) {
        instructions += `2. Send a test request to the webhook URL\n`
        instructions += `3. Verify the data flows through the workflow\n`
      } else if (triggers[0].type.includes('manual')) {
        instructions += `2. Click "Execute Workflow" in n8n\n`
        instructions += `3. Check the execution logs\n`
      } else {
        instructions += `2. Wait for the trigger to activate\n`
        instructions += `3. Monitor the execution logs\n`
      }
    } else {
      instructions += `1. Manually execute the workflow in n8n\n`
      instructions += `2. Check each node's output\n`
    }

    instructions += `\n**Expected Results:**\n`
    instructions += `- The workflow should complete without errors\n`
    instructions += `- Data should be transformed and passed correctly\n`
    instructions += `- External services should be called with the correct parameters\n`

    instructions += `\n**If it fails:**\n`
    instructions += `- Check the execution logs in n8n\n`
    instructions += `- Verify all credentials are configured\n`
    instructions += `- Ensure required configuration values are set\n`

    return instructions
  }
}
