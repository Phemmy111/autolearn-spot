/**
 * Phase 7: Workflow Debugger
 * 
 * Debugs n8n workflows by analyzing errors, nodes, and configuration.
 */

import { Workflow, WorkflowDebugRequest, WorkflowDebugResult, WorkflowNode } from './workflow-types'
import { WorkflowValidator } from './workflow-validator'
import { WorkflowAnalyzer } from './workflow-analyzer'

export class WorkflowDebugger {
  /**
   * Debug a workflow
   */
  static debug(request: WorkflowDebugRequest): WorkflowDebugResult {
    const { workflow, errorMessage, executionError, nodeName, userDescription } = request

    // First validate the workflow
    const validation = WorkflowValidator.validate(workflow)

    // Analyze the workflow
    const analysis = WorkflowAnalyzer.analyze(workflow)

    // Build evidence
    const evidence: string[] = []

    // Check validation errors
    if (!validation.isValid) {
      evidence.push(`Workflow has ${validation.errors.length} validation errors`)
      validation.errors.forEach(err => {
        evidence.push(`- ${err.message}`)
      })
    }

    // Check validation warnings
    if (validation.warnings.length > 0) {
      evidence.push(`Workflow has ${validation.warnings.length} warnings`)
    }

    // Analyze error message
    let likelyProblem = 'Unable to determine specific problem'
    let affectedNode: string | undefined
    let confidence: 'high' | 'medium' | 'low' = 'low'
    let recommendedFix = 'Review the workflow configuration and error details'

    if (errorMessage || executionError) {
      const errorAnalysis = this.analyzeError(errorMessage || executionError || '', workflow, nodeName)
      likelyProblem = errorAnalysis.problem
      affectedNode = errorAnalysis.affectedNode
      confidence = errorAnalysis.confidence
      recommendedFix = errorAnalysis.fix
      evidence.push(...errorAnalysis.evidence)
    }

    // Check for specific node issues
    if (nodeName) {
      const node = workflow.nodes.find(n => n.name === nodeName || n.id === nodeName)
      if (node) {
        const nodeAnalysis = this.analyzeNode(node, workflow)
        evidence.push(...nodeAnalysis.evidence)
        if (nodeAnalysis.issue && confidence === 'low') {
          likelyProblem = nodeAnalysis.issue
          confidence = 'medium'
        }
      }
    }

    // Check for disconnected nodes
    if (analysis.disconnectedNodes.length > 0) {
      evidence.push(`Disconnected nodes: ${analysis.disconnectedNodes.join(', ')}`)
    }

    // Check for suspicious nodes
    if (analysis.suspiciousNodes.length > 0) {
      evidence.push(`Suspicious nodes: ${analysis.suspiciousNodes.join(', ')}`)
    }

    // Check required credentials
    if (analysis.requiredCredentials.length > 0) {
      evidence.push(`Required credentials: ${analysis.requiredCredentials.join(', ')}`)
    }

    // Determine if auto-repair is possible
    const canAutoRepair = this.canAutoRepair(likelyProblem, validation)

    // Determine required configuration
    const requiredConfiguration = this.extractRequiredConfiguration(workflow, analysis)

    return {
      likelyProblem,
      affectedNode,
      evidence,
      confidence,
      recommendedFix,
      requiredConfiguration,
      canAutoRepair
    }
  }

  /**
   * Analyze error message
   */
  private static analyzeError(
    error: string,
    workflow: Workflow,
    nodeName?: string
  ): {
    problem: string
    affectedNode?: string
    confidence: 'high' | 'medium' | 'low'
    fix: string
    evidence: string[]
  } {
    const evidence: string[] = [`Error message: ${error}`]
    const errorLower = error.toLowerCase()

    // Credential errors
    if (errorLower.includes('credential') || errorLower.includes('authentication') || errorLower.includes('unauthorized')) {
      const node = this.findNodeWithCredentials(workflow, nodeName)
      evidence.push('Error appears to be credential-related')
      return {
        problem: `The workflow structure appears valid, but ${node ? `the '${node.name}' node` : 'a node'} is failing because its credential configuration is invalid or missing.`,
        affectedNode: node?.name,
        confidence: 'high',
        fix: 'Configure the required credential in n8n. The workflow does not contain your credential secret.',
        evidence
      }
    }

    // Connection errors
    if (errorLower.includes('connection') || errorLower.includes('reference') || errorLower.includes('not found')) {
      evidence.push('Error appears to be connection-related')
      return {
        problem: 'A node in the workflow references another node that does not exist or is not properly connected.',
        confidence: 'medium',
        fix: 'Check the workflow connections and ensure all referenced nodes exist.',
        evidence
      }
    }

    // Parameter errors
    if (errorLower.includes('parameter') || errorLower.includes('required') || errorLower.includes('missing')) {
      const node = this.findNodeWithIssue(workflow, nodeName)
      evidence.push('Error appears to be parameter-related')
      return {
        problem: `A node is missing required parameters or has invalid parameter values.`,
        affectedNode: node?.name,
        confidence: 'medium',
        fix: 'Review the node configuration and ensure all required parameters are provided.',
        evidence
      }
    }

    // API errors
    if (errorLower.includes('api') || errorLower.includes('request') || errorLower.includes('http')) {
      evidence.push('Error appears to be API-related')
      return {
        problem: 'An API request failed, possibly due to invalid endpoint, rate limiting, or service unavailability.',
        confidence: 'medium',
        fix: 'Check the API endpoint configuration, rate limits, and service status.',
        evidence
      }
    }

    // Data errors
    if (errorLower.includes('data') || errorLower.includes('format') || errorLower.includes('parse')) {
      evidence.push('Error appears to be data-related')
      return {
        problem: 'Data passed between nodes is in an unexpected format or missing required fields.',
        confidence: 'medium',
        fix: 'Check the data structure being passed and add data transformation nodes if needed.',
        evidence
      }
    }

    // Generic error
    return {
      problem: 'The workflow encountered an error that requires manual investigation.',
      confidence: 'low',
      fix: 'Review the error message and workflow configuration in n8n to identify the specific issue.',
      evidence
    }
  }

  /**
   * Analyze a specific node
   */
  private static analyzeNode(node: WorkflowNode, workflow: Workflow): {
    issue?: string
    evidence: string[]
  } {
    const evidence: string[] = []
    const issues: string[] = []

    // Check if node is disabled
    if (node.disabled) {
      issues.push(`Node '${node.name}' is disabled`)
      evidence.push('Disabled nodes will not execute')
    }

    // Check if node has no parameters
    if (!node.parameters || Object.keys(node.parameters).length === 0) {
      issues.push(`Node '${node.name}' has no parameters configured`)
      evidence.push('Node may require parameters to function correctly')
    }

    // Check if node has credentials but they might be missing
    if (node.credentials && Object.keys(node.credentials).length > 0) {
      evidence.push(`Node '${node.name}' requires credentials: ${Object.keys(node.credentials).join(', ')}`)
    }

    // Check if node type is unknown
    if (!node.type) {
      issues.push(`Node '${node.name}' has no type defined`)
    }

    return {
      issue: issues.length > 0 ? issues.join('; ') : undefined,
      evidence
    }
  }

  /**
   * Find node with credentials
   */
  private static findNodeWithCredentials(workflow: Workflow, nodeName?: string): WorkflowNode | undefined {
    if (nodeName) {
      return workflow.nodes.find(n => n.name === nodeName || n.id === nodeName)
    }

    // Find first node with credentials
    return workflow.nodes.find(n => n.credentials && Object.keys(n.credentials).length > 0)
  }

  /**
   * Find node with issue
   */
  private static findNodeWithIssue(workflow: Workflow, nodeName?: string): WorkflowNode | undefined {
    if (nodeName) {
      return workflow.nodes.find(n => n.name === nodeName || n.id === nodeName)
    }

    // Find first node with no parameters
    return workflow.nodes.find(n => !n.parameters || Object.keys(n.parameters).length === 0)
  }

  /**
   * Determine if auto-repair is possible
   */
  private static canAutoRepair(problem: string, validation: any): boolean {
    // Only auto-repair structural issues, not credential or configuration issues
    const structuralKeywords = ['duplicate', 'missing node', 'invalid type', 'connection']
    return structuralKeywords.some(keyword => problem.toLowerCase().includes(keyword)) && validation.errors.length > 0
  }

  /**
   * Extract required configuration
   */
  private static extractRequiredConfiguration(workflow: Workflow, analysis: any): Record<string, string> {
    const config: Record<string, string> = {}

    // Add credential requirements
    analysis.requiredCredentials.forEach((cred: string) => {
      config[cred] = 'credential'
    })

    // Check for common configuration values
    workflow.nodes.forEach(node => {
      if (node.parameters) {
        // Webhook URLs
        if (node.type.includes('webhook') && node.parameters.path) {
          config['webhook_path'] = node.parameters.path
        }

        // Spreadsheet IDs
        if (node.type.includes('sheets') && node.parameters.operation === 'append') {
          config['spreadsheet_id'] = 'required'
        }

        // Email addresses
        if (node.type.includes('email') && node.parameters.email) {
          config['email_address'] = node.parameters.email
        }
      }
    })

    return config
  }
}
