/**
 * Phase 7: Workflow Analyze Tool
 * 
 * Tool for analyzing n8n workflow structure and purpose.
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'
import { WorkflowAnalyzer } from '../../workflows/workflow-analyzer'
import { WorkflowParser } from '../../workflows/workflow-parser'

export const workflowAnalyzeToolDefinition: ToolDefinition = {
  name: 'workflow_analyze',
  description: 'Analyze n8n workflow to identify triggers, actions, integrations, required credentials, and workflow purpose. Returns a structured analysis.',
  inputSchema: {
    type: 'object',
    required: ['workflowJson'],
    properties: {
      workflowJson: {
        type: 'string',
        description: 'The n8n workflow JSON as a string',
        minLength: 1
      }
    }
  },
  category: 'workflow',
  permissions: [],
  enabled: true,
  timeoutMs: 10000
}

export const workflowAnalyzeToolExecutor: ToolExecutor = {
  name: 'workflow_analyze',
  async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
    const { workflowJson } = args

    if (!workflowJson || typeof workflowJson !== 'string') {
      throw new Error('workflowJson is required and must be a string')
    }

    try {
      const parseResult = WorkflowParser.parseFromJson(workflowJson)

      if (!parseResult.success || !parseResult.workflow) {
        return {
          success: false,
          error: `Failed to parse workflow: ${parseResult.errors.map(e => e.message).join(', ')}`,
          data: {
            parseErrors: parseResult.errors
          }
        }
      }

      const analysis = WorkflowAnalyzer.analyze(parseResult.workflow)
      const summary = WorkflowAnalyzer.generateSummary(analysis)

      return {
        success: true,
        data: {
          analysis,
          summary
        }
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error analyzing workflow')
    }
  }
}
