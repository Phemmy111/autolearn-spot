/**
 * Phase 7: Workflow Parse Tool
 * 
 * Tool for parsing n8n workflow JSON.
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'
import { WorkflowParser } from '../../workflows/workflow-parser'

export const workflowParseToolDefinition: ToolDefinition = {
  name: 'workflow_parse',
  description: 'Parse and validate n8n workflow JSON. Accepts a JSON string and returns structured workflow information including nodes, connections, and metadata.',
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

export const workflowParseToolExecutor: ToolExecutor = {
  name: 'workflow_parse',
  async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
    const { workflowJson } = args

    if (!workflowJson || typeof workflowJson !== 'string') {
      throw new Error('workflowJson is required and must be a string')
    }

    try {
      const result = WorkflowParser.parseFromJson(workflowJson)

      if (!result.success) {
        return {
          success: false,
          error: `Failed to parse workflow: ${result.errors.map(e => e.message).join(', ')}`,
          data: {
            errors: result.errors,
            warnings: result.warnings
          }
        }
      }

      return {
        success: true,
        data: {
          workflow: result.workflow,
          nodeCount: result.workflow?.nodes.length || 0,
          connectionCount: result.workflow?.connections.length || 0,
          warnings: result.warnings
        }
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error parsing workflow')
    }
  }
}
