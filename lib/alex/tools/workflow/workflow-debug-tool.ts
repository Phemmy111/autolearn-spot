/**
 * Phase 7: Workflow Debug Tool
 * 
 * Tool for debugging n8n workflow errors.
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'
import { WorkflowDebugger } from '../../workflows/workflow-debugger'
import { WorkflowParser } from '../../workflows/workflow-parser'

export const workflowDebugToolDefinition: ToolDefinition = {
  name: 'workflow_debug',
  description: 'Debug n8n workflow errors. Analyzes workflow structure, error messages, and node configuration to identify problems and recommend fixes.',
  inputSchema: {
    type: 'object',
    required: ['workflowJson'],
    properties: {
      workflowJson: {
        type: 'string',
        description: 'The n8n workflow JSON as a string',
        minLength: 1
      },
      errorMessage: {
        type: 'string',
        description: 'The error message from n8n (optional)'
      },
      nodeName: {
        type: 'string',
        description: 'The name of the failing node (optional)'
      },
      userDescription: {
        type: 'string',
        description: 'User description of the problem (optional)'
      }
    }
  },
  category: 'workflow',
  permissions: [],
  enabled: true,
  timeoutMs: 15000
}

export const workflowDebugToolExecutor: ToolExecutor = {
  name: 'workflow_debug',
  async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
    const { workflowJson, errorMessage, nodeName, userDescription } = args

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

      const debugResult = WorkflowDebugger.debug({
        workflow: parseResult.workflow,
        errorMessage,
        nodeName,
        userDescription
      })

      return {
        success: true,
        data: debugResult
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error debugging workflow')
    }
  }
}
