/**
 * Phase 7: n8n Workflow Parser
 * 
 * Parses and normalizes n8n workflow JSON with safety and error handling.
 */

import { Workflow, WorkflowNode, WorkflowConnection, WorkflowMetadata, WorkflowValidationError } from './workflow-types'

export interface ParseResult {
  success: boolean
  workflow?: Workflow
  errors: WorkflowValidationError[]
  warnings: WorkflowValidationError[]
}

export class WorkflowParser {
  /**
   * Parse workflow from JSON string
   */
  static parseFromJson(jsonString: string): ParseResult {
    const errors: WorkflowValidationError[] = []
    const warnings: WorkflowValidationError[] = []

    try {
      const parsed = JSON.parse(jsonString)

      if (typeof parsed !== 'object' || parsed === null) {
        errors.push({
          severity: 'error',
          code: 'INVALID_TYPE',
          message: 'Workflow must be a JSON object',
          suggestion: 'Ensure the workflow is a valid JSON object with nodes and connections.'
        })
        return { success: false, errors, warnings }
      }

      return this.parseFromObject(parsed)
    } catch (error) {
      errors.push({
        severity: 'error',
        code: 'JSON_PARSE_ERROR',
        message: `Failed to parse JSON: ${error instanceof Error ? error.message : 'Unknown error'}`,
        suggestion: 'Ensure the workflow JSON is valid JSON format.'
      })
      return { success: false, errors, warnings }
    }
  }

  /**
   * Parse workflow from object
   */
  static parseFromObject(obj: any): ParseResult {
    const errors: WorkflowValidationError[] = []
    const warnings: WorkflowValidationError[] = []

    // Check if it resembles an n8n workflow
    if (!this.resemblesN8nWorkflow(obj)) {
      warnings.push({
        severity: 'warning',
        code: 'UNRECOGNIZED_FORMAT',
        message: 'Input may not be an n8n workflow',
        suggestion: 'Ensure the workflow follows n8n JSON format with nodes and connections.'
      })
    }

    // Extract metadata
    const metadata: WorkflowMetadata = {
      id: obj.id,
      name: obj.name,
      version: obj.version,
      createdAt: obj.createdAt,
      updatedAt: obj.updatedAt,
      tags: obj.tags,
      settings: obj.settings
    }

    // Extract nodes
    const nodes: WorkflowNode[] = []
    if (Array.isArray(obj.nodes)) {
      for (let i = 0; i < obj.nodes.length; i++) {
        const node = obj.nodes[i]
        try {
          const parsedNode = this.parseNode(node, i)
          nodes.push(parsedNode)
        } catch (error) {
          errors.push({
            severity: 'error',
            code: 'NODE_PARSE_ERROR',
            message: `Failed to parse node at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            suggestion: 'Check that the node has a valid structure with id, name, and type.'
          })
        }
      }
    } else {
      errors.push({
        severity: 'error',
        code: 'MISSING_NODES',
        message: 'Workflow must have a nodes array',
        suggestion: 'Add a nodes array to the workflow object.'
      })
    }

    // Extract connections
    const connections: WorkflowConnection[] = []
    if (Array.isArray(obj.connections)) {
      for (let i = 0; i < obj.connections.length; i++) {
        const conn = obj.connections[i]
        try {
          const parsedConn = this.parseConnection(conn, i)
          connections.push(parsedConn)
        } catch (error) {
          errors.push({
            severity: 'error',
            code: 'CONNECTION_PARSE_ERROR',
            message: `Failed to parse connection at index ${i}: ${error instanceof Error ? error.message : 'Unknown error'}`,
            suggestion: 'Check that the connection has valid source and target references.'
          })
        }
      }
    } else {
      warnings.push({
        severity: 'info',
        code: 'NO_CONNECTIONS',
        message: 'Workflow has no connections',
        suggestion: 'Add connections between nodes to create a functional workflow.'
      })
    }

    // Preserve unknown fields
    const workflow: Workflow = {
      nodes,
      connections,
      metadata,
      ...obj
    }

    // Remove fields we've already extracted to avoid duplication
    delete workflow.nodes
    delete workflow.connections
    delete workflow.id
    delete workflow.name
    delete workflow.version
    delete workflow.createdAt
    delete workflow.updatedAt
    delete workflow.tags
    delete workflow.settings

    return {
      success: errors.length === 0,
      workflow: errors.length === 0 ? workflow : undefined,
      errors,
      warnings
    }
  }

  /**
   * Check if object resembles an n8n workflow
   */
  private static resemblesN8nWorkflow(obj: any): boolean {
    return (
      typeof obj === 'object' &&
      obj !== null &&
      (Array.isArray(obj.nodes) || obj.connections !== undefined)
    )
  }

  /**
   * Parse a single node
   */
  private static parseNode(node: any, index: number): WorkflowNode {
    if (typeof node !== 'object' || node === null) {
      throw new Error(`Node at index ${index} is not an object`)
    }

    if (!node.id || typeof node.id !== 'string') {
      throw new Error(`Node at index ${index} missing or invalid id`)
    }

    if (!node.name || typeof node.name !== 'string') {
      throw new Error(`Node ${node.id} missing or invalid name`)
    }

    if (!node.type || typeof node.type !== 'string') {
      throw new Error(`Node ${node.id} missing or invalid type`)
    }

    return {
      id: node.id,
      name: node.name,
      type: node.type,
      typeVersion: node.typeVersion,
      position: node.position,
      parameters: node.parameters || {},
      credentials: node.credentials || {},
      notes: node.notes,
      disabled: node.disabled || false
    }
  }

  /**
   * Parse a single connection
   */
  private static parseConnection(conn: any, index: number): WorkflowConnection {
    if (typeof conn !== 'object' || conn === null) {
      throw new Error(`Connection at index ${index} is not an object`)
    }

    if (!conn.source || typeof conn.source !== 'string') {
      throw new Error(`Connection at index ${index} missing or invalid source`)
    }

    if (!conn.target || typeof conn.target !== 'string') {
      throw new Error(`Connection at index ${index} missing or invalid target`)
    }

    return {
      source: conn.source,
      target: conn.target,
      index: conn.index,
      type: conn.type
    }
  }

  /**
   * Serialize workflow to JSON string
   */
  static serializeToJson(workflow: Workflow): string {
    const obj = {
      ...workflow,
      nodes: workflow.nodes,
      connections: workflow.connections
    }

    // Add metadata back
    if (workflow.metadata) {
      Object.assign(obj, workflow.metadata)
    }

    return JSON.stringify(obj, null, 2)
  }
}
