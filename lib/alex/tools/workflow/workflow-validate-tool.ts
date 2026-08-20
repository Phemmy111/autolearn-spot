/**
 * Phase 7: Workflow Validate Tool
 * 
 * Tool for validating n8n workflow structure and configuration.
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'
import { WorkflowValidator } from '../../workflows/workflow-validator'
import { WorkflowParser } from '../../workflows/workflow-parser'

export const workflowValidateToolDefinition: ToolDefinition = {
  name: 'workflow_validate',
  description: 'Validate n8n workflow structure, connections, and node configuration. Returns errors, warnings, and validation summary.',
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

export const workflowValidateToolExecutor: ToolExecutor = {
  name: 'workflow_validate',
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

      const validation = WorkflowValidator.validate(parseResult.workflow)

      return {
        success: true,
        data: {
          isValid: validation.isValid,
          errors: validation.errors,
          warnings: validation.warnings,
          info: validation.info,
          nodeCount: validation.nodeCount,
          connectionCount: validation.connectionCount,
          nodeTypes: validation.nodeTypes,
          integrations: validation.integrations,
          requiredCredentials: validation.requiredCredentials
        }
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error validating workflow')
    }
  }
}
