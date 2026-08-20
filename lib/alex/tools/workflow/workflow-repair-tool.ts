/**
 * Phase 7: Workflow Repair Tool
 * 
 * Tool for repairing n8n workflow structural issues.
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'
import { WorkflowRepair } from '../../workflows/workflow-repair'
import { WorkflowParser } from '../../workflows/workflow-parser'

export const workflowRepairToolDefinition: ToolDefinition = {
  name: 'workflow_repair',
  description: 'Repair n8n workflow structural issues such as duplicate node IDs, broken connections, and missing required fields. Returns repaired workflow JSON and repair details.',
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
  timeoutMs: 15000
}

export const workflowRepairToolExecutor: ToolExecutor = {
  name: 'workflow_repair',
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

      const repairResult = WorkflowRepair.repair(parseResult.workflow)

      return {
        success: true,
        data: {
          success: repairResult.success,
          repairsPerformed: repairResult.repairsPerformed,
          uncertainRepairs: repairResult.uncertainRepairs,
          validationAfterRepair: repairResult.validationAfterRepair,
          repairedWorkflowJson: repairResult.repairedWorkflow
            ? WorkflowParser.serializeToJson(repairResult.repairedWorkflow)
            : null
        }
      }
    } catch (error) {
      throw new Error(error instanceof Error ? error.message : 'Unknown error repairing workflow')
    }
  }
}
