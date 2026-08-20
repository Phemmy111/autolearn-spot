/**
 * Phase 7: Workflow Validator
 * 
 * Validates n8n workflow structure, connections, and node configuration.
 */

import { Workflow, WorkflowValidationResult, WorkflowValidationError, WorkflowNode } from './workflow-types'

export class WorkflowValidator {
  /**
   * Validate a workflow
   */
  static validate(workflow: Workflow): WorkflowValidationResult {
    const errors: WorkflowValidationError[] = []
    const warnings: WorkflowValidationError[] = []
    const info: WorkflowValidationError[] = []

    // Validate structure
    this.validateStructure(workflow, errors, warnings, info)

    // Validate connections
    this.validateConnections(workflow, errors, warnings, info)

    // Validate nodes
    this.validateNodes(workflow, errors, warnings, info)

    // Extract metadata
    const nodeTypes = [...new Set(workflow.nodes.map(n => n.type))]
    const integrations = this.extractIntegrations(workflow)
    const requiredCredentials = this.extractRequiredCredentials(workflow)

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      info,
      nodeCount: workflow.nodes.length,
      connectionCount: workflow.connections.length,
      nodeTypes,
      integrations,
      requiredCredentials
    }
  }

  /**
   * Validate overall workflow structure
   */
  private static validateStructure(
    workflow: Workflow,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationError[],
    info: WorkflowValidationError[]
  ): void {
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push({
        severity: 'error',
        code: 'MISSING_NODES',
        message: 'Workflow must have a nodes array',
        suggestion: 'Add a nodes array to the workflow object.'
      })
      return
    }

    if (workflow.nodes.length === 0) {
      errors.push({
        severity: 'error',
        code: 'EMPTY_NODES',
        message: 'Workflow has no nodes',
        suggestion: 'Add at least one node to the workflow.'
      })
    }

    if (!workflow.connections || !Array.isArray(workflow.connections)) {
      warnings.push({
        severity: 'warning',
        code: 'MISSING_CONNECTIONS',
        message: 'Workflow has no connections array',
        suggestion: 'Add connections between nodes to create a functional workflow.'
      })
    }
  }

  /**
   * Validate connections
   */
  private static validateConnections(
    workflow: Workflow,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationError[],
    info: WorkflowValidationError[]
  ): void {
    if (!workflow.connections || !Array.isArray(workflow.connections)) {
      return
    }

    const nodeIds = new Set(workflow.nodes.map(n => n.id))

    for (let i = 0; i < workflow.connections.length; i++) {
      const conn = workflow.connections[i]

      // Check source exists
      if (!nodeIds.has(conn.source)) {
        errors.push({
          severity: 'error',
          code: 'INVALID_SOURCE',
          message: `Connection ${i}: source node '${conn.source}' does not exist`,
          suggestion: 'Ensure the source node ID exists in the nodes array.'
        })
      }

      // Check target exists
      if (!nodeIds.has(conn.target)) {
        errors.push({
          severity: 'error',
          code: 'INVALID_TARGET',
          message: `Connection ${i}: target node '${conn.target}' does not exist`,
          suggestion: 'Ensure the target node ID exists in the nodes array.'
        })
      }

      // Check for self-connection
      if (conn.source === conn.target) {
        warnings.push({
          severity: 'warning',
          code: 'SELF_CONNECTION',
          message: `Connection ${i}: node '${conn.source}' connects to itself`,
          suggestion: 'Review if this self-connection is intentional.'
        })
      }
    }

    // Check for disconnected nodes
    const connectedNodeIds = new Set<string>()
    workflow.connections.forEach(conn => {
      connectedNodeIds.add(conn.source)
      connectedNodeIds.add(conn.target)
    })

    workflow.nodes.forEach(node => {
      if (!connectedNodeIds.has(node.id)) {
        info.push({
          severity: 'info',
          code: 'DISCONNECTED_NODE',
          message: `Node '${node.name}' (${node.id}) is not connected to any other node`,
          suggestion: 'Connect this node to the workflow or remove it if not needed.'
        })
      }
    })
  }

  /**
   * Validate nodes
   */
  private static validateNodes(
    workflow: Workflow,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationError[],
    info: WorkflowValidationError[]
  ): void {
    const nodeIds = new Set<string>()
    const nodeNames = new Set<string>()

    for (let i = 0; i < workflow.nodes.length; i++) {
      const node = workflow.nodes[i]

      // Check for duplicate IDs
      if (nodeIds.has(node.id)) {
        errors.push({
          severity: 'error',
          code: 'DUPLICATE_NODE_ID',
          message: `Duplicate node ID: '${node.id}'`,
          nodeId: node.id,
          suggestion: 'Ensure each node has a unique ID.'
        })
      }
      nodeIds.add(node.id)

      // Check for duplicate names
      if (nodeNames.has(node.name)) {
        warnings.push({
          severity: 'warning',
          code: 'DUPLICATE_NODE_NAME',
          message: `Duplicate node name: '${node.name}'`,
          nodeId: node.id,
          suggestion: 'Consider using unique names for clarity.'
        })
      }
      nodeNames.add(node.name)

      // Validate node type
      if (!node.type || typeof node.type !== 'string') {
        errors.push({
          severity: 'error',
          code: 'MISSING_NODE_TYPE',
          message: `Node '${node.name}' missing or invalid type`,
          nodeId: node.id,
          suggestion: 'Add a valid node type to the node.'
        })
      }

      // Validate position
      if (node.position && (!Array.isArray(node.position) || node.position.length !== 2)) {
        warnings.push({
          severity: 'warning',
          code: 'INVALID_POSITION',
          message: `Node '${node.name}' has invalid position format`,
          nodeId: node.id,
          suggestion: 'Position should be an array of two numbers [x, y].'
        })
      }

      // Validate credentials structure
      if (node.credentials) {
        for (const [credName, credValue] of Object.entries(node.credentials)) {
          if (typeof credValue !== 'string' && typeof credValue !== 'object') {
            warnings.push({
              severity: 'warning',
              code: 'INVALID_CREDENTIAL_STRUCTURE',
              message: `Node '${node.name}' has invalid credential structure for '${credName}'`,
              nodeId: node.id,
              field: `credentials.${credName}`,
              suggestion: 'Credentials should reference a credential name or ID.'
            })
          }
        }
      }

      // Validate parameters structure
      if (node.parameters && typeof node.parameters !== 'object') {
        errors.push({
          severity: 'error',
          code: 'INVALID_PARAMETERS',
          message: `Node '${node.name}' has invalid parameters structure`,
          nodeId: node.id,
          suggestion: 'Parameters should be an object.'
        })
      }

      // Check for obvious expression errors
      this.validateExpressions(node, errors, warnings)
    }
  }

  /**
   * Validate expressions in node parameters
   */
  private static validateExpressions(
    node: WorkflowNode,
    errors: WorkflowValidationError[],
    warnings: WorkflowValidationError[]
  ): void {
    if (!node.parameters) return

    const checkExpression = (value: any, path: string): void => {
      if (typeof value === 'string') {
        // Check for malformed expressions
        if (value.includes('={{') && !value.includes('}}')) {
          warnings.push({
            severity: 'warning',
            code: 'MALFORMED_EXPRESSION',
            message: `Possible malformed expression in ${path}`,
            nodeId: node.id,
            field: path,
            value,
            suggestion: 'Ensure expressions are properly closed with }}'
          })
        }
      } else if (typeof value === 'object' && value !== null) {
        Object.entries(value).forEach(([key, val]) => {
          checkExpression(val, `${path}.${key}`)
        })
      } else if (Array.isArray(value)) {
        value.forEach((item, index) => {
          checkExpression(item, `${path}[${index}]`)
        })
      }
    }

    checkExpression(node.parameters, 'parameters')
  }

  /**
   * Extract integrations from workflow
   */
  private static extractIntegrations(workflow: Workflow): string[] {
    const integrations = new Set<string>()

    workflow.nodes.forEach(node => {
      // Extract from node type (e.g., 'n8n-nodes-base.googleSheets' -> 'googleSheets')
      const match = node.type.match(/n8n-nodes-base\.(\w+)/i)
      if (match) {
        integrations.add(match[1])
      }

      // Extract from node type (e.g., '@n8n/n8n-nodes-langchain.openai' -> 'openai')
      const match2 = node.type.match(/@n8n\/n8n-nodes-[\w-]+\.(\w+)/i)
      if (match2) {
        integrations.add(match2[1])
      }

      // Extract from credentials
      if (node.credentials) {
        Object.keys(node.credentials).forEach(cred => {
          integrations.add(cred)
        })
      }
    })

    return Array.from(integrations)
  }

  /**
   * Extract required credentials from workflow
   */
  private static extractRequiredCredentials(workflow: Workflow): string[] {
    const credentials = new Set<string>()

    workflow.nodes.forEach(node => {
      if (node.credentials) {
        Object.keys(node.credentials).forEach(cred => {
          credentials.add(cred)
        })
      }
    })

    return Array.from(credentials)
  }
}
