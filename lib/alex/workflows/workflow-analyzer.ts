/**
 * Phase 7: Workflow Analyzer
 * 
 * Analyzes n8n workflows to identify triggers, actions, integrations, and purpose.
 */

import { Workflow, WorkflowAnalysis, WorkflowNode } from './workflow-types'

export class WorkflowAnalyzer {
  /**
   * Analyze a workflow
   */
  static analyze(workflow: Workflow): WorkflowAnalysis {
    const triggers = this.identifyTriggers(workflow)
    const actions = this.identifyActions(workflow)
    const transformations = this.identifyTransformations(workflow)
    const branches = this.identifyBranches(workflow)
    const integrations = this.extractIntegrations(workflow)
    const requiredCredentials = this.extractRequiredCredentials(workflow)
    const purpose = this.inferPurpose(workflow, triggers, actions)
    const nodeSequence = this.inferNodeSequence(workflow)
    const disconnectedNodes = this.findDisconnectedNodes(workflow)
    const suspiciousNodes = this.findSuspiciousNodes(workflow)
    const bottlenecks = this.findBottlenecks(workflow)

    return {
      triggers,
      actions,
      transformations,
      branches,
      integrations,
      requiredCredentials,
      purpose,
      nodeSequence,
      disconnectedNodes,
      suspiciousNodes,
      bottlenecks
    }
  }

  /**
   * Identify trigger nodes
   */
  private static identifyTriggers(workflow: Workflow): WorkflowNode[] {
    return workflow.nodes.filter(node => {
      const type = node.type.toLowerCase()
      return (
        type.includes('trigger') ||
        type.includes('webhook') ||
        type.includes('cron') ||
        type.includes('schedule') ||
        type.includes('manual') ||
        type.includes('start')
      )
    })
  }

  /**
   * Identify action nodes
   */
  private static identifyActions(workflow: Workflow): WorkflowNode[] {
    return workflow.nodes.filter(node => {
      const type = node.type.toLowerCase()
      const isTrigger = type.includes('trigger') || type.includes('webhook') || type.includes('cron')
      const isTransform = type.includes('set') || type.includes('function') || type.includes('code')
      const isBranch = type.includes('if') || type.includes('switch') || type.includes('merge')
      return !isTrigger && !isTransform && !isBranch
    })
  }

  /**
   * Identify transformation nodes
   */
  private static identifyTransformations(workflow: Workflow): WorkflowNode[] {
    return workflow.nodes.filter(node => {
      const type = node.type.toLowerCase()
      return (
        type.includes('set') ||
        type.includes('function') ||
        type.includes('code') ||
        type.includes('transform') ||
        type.includes('javascript') ||
        type.includes('python')
      )
    })
  }

  /**
   * Identify branching nodes
   */
  private static identifyBranches(workflow: Workflow): WorkflowNode[] {
    return workflow.nodes.filter(node => {
      const type = node.type.toLowerCase()
      return (
        type.includes('if') ||
        type.includes('switch') ||
        type.includes('merge') ||
        type.includes('branch')
      )
    })
  }

  /**
   * Extract integrations
   */
  private static extractIntegrations(workflow: Workflow): string[] {
    const integrations = new Set<string>()

    workflow.nodes.forEach(node => {
      // Extract from node type
      const match = node.type.match(/n8n-nodes-base\.(\w+)/i)
      if (match) {
        integrations.add(match[1])
      }

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
   * Extract required credentials
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

  /**
   * Infer workflow purpose
   */
  private static inferPurpose(
    workflow: Workflow,
    triggers: WorkflowNode[],
    actions: WorkflowNode[]
  ): string {
    const parts: string[] = []

    if (triggers.length > 0) {
      const triggerTypes = triggers.map(t => this.getNodeTypeName(t)).join(', ')
      parts.push(`starts with ${triggerTypes}`)
    }

    if (actions.length > 0) {
      const actionTypes = actions.map(a => this.getNodeTypeName(a)).join(', ')
      parts.push(`uses ${actionTypes}`)
    }

    if (parts.length === 0) {
      return 'Workflow structure is unclear'
    }

    return `Your workflow ${parts.join(', ')}.`
  }

  /**
   * Get human-readable node type name
   */
  private static getNodeTypeName(node: WorkflowNode): string {
    const type = node.type
      .replace('n8n-nodes-base.', '')
      .replace('@n8n/n8n-nodes-langchain.', '')
      .replace('@n8n/n8n-nodes-starter.', '')
      .replace(/([A-Z])/g, ' $1')
      .toLowerCase()
      .trim()

    return type || node.type
  }

  /**
   * Infer node sequence
   */
  private static inferNodeSequence(workflow: Workflow): string[] {
    const sequence: string[] = []
    const visited = new Set<string>()
    const connectionMap = new Map<string, string[]>()

    // Build connection map
    workflow.connections.forEach(conn => {
      if (!connectionMap.has(conn.source)) {
        connectionMap.set(conn.source, [])
      }
      connectionMap.get(conn.source)!.push(conn.target)
    })

    // Find trigger nodes (nodes with no incoming connections)
    const allTargets = new Set(workflow.connections.map(c => c.target))
    const startNodes = workflow.nodes.filter(n => !allTargets.has(n.id))

    // Traverse from start nodes
    const traverse = (nodeId: string): void => {
      if (visited.has(nodeId)) return

      const node = workflow.nodes.find(n => n.id === nodeId)
      if (node) {
        sequence.push(node.name)
        visited.add(nodeId)

        const nextNodes = connectionMap.get(nodeId) || []
        nextNodes.forEach(nextId => traverse(nextId))
      }
    }

    startNodes.forEach(node => traverse(node.id))

    // Add any remaining nodes
    workflow.nodes.forEach(node => {
      if (!visited.has(node.id)) {
        sequence.push(node.name)
      }
    })

    return sequence
  }

  /**
   * Find disconnected nodes
   */
  private static findDisconnectedNodes(workflow: Workflow): string[] {
    const connectedNodeIds = new Set<string>()
    workflow.connections.forEach(conn => {
      connectedNodeIds.add(conn.source)
      connectedNodeIds.add(conn.target)
    })

    return workflow.nodes
      .filter(node => !connectedNodeIds.has(node.id))
      .map(node => node.name)
  }

  /**
   * Find suspicious nodes
   */
  private static findSuspiciousNodes(workflow: Workflow): string[] {
    const suspicious: string[] = []

    workflow.nodes.forEach(node => {
      // Disabled nodes
      if (node.disabled) {
        suspicious.push(node.name)
      }

      // Nodes with no parameters
      if (!node.parameters || Object.keys(node.parameters).length === 0) {
        suspicious.push(node.name)
      }

      // Nodes with empty credentials reference
      if (node.credentials && Object.keys(node.credentials).length === 0) {
        suspicious.push(node.name)
      }
    })

    return [...new Set(suspicious)]
  }

  /**
   * Find potential bottlenecks
   */
  private static findBottlenecks(workflow: Workflow): string[] {
    const bottlenecks: string[] = []
    const connectionCount = new Map<string, number>()

    // Count incoming connections per node
    workflow.connections.forEach(conn => {
      const count = connectionCount.get(conn.target) || 0
      connectionCount.set(conn.target, count + 1)
    })

    // Nodes with many incoming connections might be bottlenecks
    connectionCount.forEach((count, nodeId) => {
      if (count > 3) {
        const node = workflow.nodes.find(n => n.id === nodeId)
        if (node) {
          bottlenecks.push(node.name)
        }
      }
    })

    return bottlenecks
  }

  /**
   * Generate human-readable summary
   */
  static generateSummary(analysis: WorkflowAnalysis): string {
    const parts: string[] = []

    if (analysis.triggers.length > 0) {
      const triggerNames = analysis.triggers.map(t => t.name).join(', ')
      parts.push(`Trigger(s): ${triggerNames}`)
    }

    if (analysis.actions.length > 0) {
      const actionNames = analysis.actions.slice(0, 5).map(a => a.name).join(', ')
      const more = analysis.actions.length > 5 ? ` and ${analysis.actions.length - 5} more` : ''
      parts.push(`Actions: ${actionNames}${more}`)
    }

    if (analysis.integrations.length > 0) {
      parts.push(`Integrations: ${analysis.integrations.join(', ')}`)
    }

    if (analysis.requiredCredentials.length > 0) {
      parts.push(`Required credentials: ${analysis.requiredCredentials.join(', ')}`)
    }

    if (analysis.disconnectedNodes.length > 0) {
      parts.push(`Disconnected nodes: ${analysis.disconnectedNodes.join(', ')}`)
    }

    if (analysis.purpose) {
      parts.push(`Purpose: ${analysis.purpose}`)
    }

    return parts.join('\n')
  }
}
