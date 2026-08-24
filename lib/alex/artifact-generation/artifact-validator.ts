/**
 * ALEX Artifact Validator
 * 
 * Phase 3A Runtime Stabilization: Multi-level artifact validation
 * Validates JSON structure, platform structure, architecture coverage, and requirement coverage
 */

import { ValidationResult } from './types'
import { LogicalArchitecture } from './architecture-designer'

export class ArtifactValidator {
  /**
   * Level 1: JSON validity
   */
  static validateJSON(content: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      JSON.parse(content)
    } catch (error) {
      errors.push(`Invalid JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Level 2: Platform structure validation (n8n)
   */
  static validateN8nStructure(content: string): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const workflow = JSON.parse(content)

      // Required fields
      if (!workflow.name) {
        errors.push('Missing required field: name')
      }
      if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
        errors.push('Missing required field: nodes (must be array)')
      }
      if (!workflow.connections) {
        errors.push('Missing required field: connections')
      }
      if (!workflow.settings) {
        warnings.push('Missing field: settings (using defaults)')
      }

      // Validate nodes
      if (workflow.nodes && Array.isArray(workflow.nodes)) {
        if (workflow.nodes.length === 0) {
          errors.push('Workflow must have at least one node')
        }

        for (let i = 0; i < workflow.nodes.length; i++) {
          const node = workflow.nodes[i]
          if (!node.name) {
            errors.push(`Node ${i}: Missing name`)
          }
          if (!node.type) {
            errors.push(`Node ${i}: Missing type`)
          }
          if (!node.position) {
            warnings.push(`Node ${i}: Missing position`)
          }
          if (!node.parameters) {
            warnings.push(`Node ${i}: Missing parameters`)
          }
        }
      }

      // Validate connections
      if (workflow.connections) {
        const connectionErrors = this.validateConnections(workflow.connections, workflow.nodes)
        errors.push(...connectionErrors)
      }

    } catch (error) {
      errors.push(`Failed to parse workflow JSON: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Validate connections structure
   */
  private static validateConnections(connections: any, nodes: any[]): string[] {
    const errors: string[] = []
    const nodeNames = new Set(nodes?.map((n: any) => n.name) || [])

    for (const [sourceNode, connectionData] of Object.entries(connections)) {
      if (!nodeNames.has(sourceNode)) {
        errors.push(`Connection source node not found: ${sourceNode}`)
      }

      if (connectionData && typeof connectionData === 'object') {
        for (const [targetNode, nodeConnections] of Object.entries(connectionData)) {
          if (!nodeNames.has(targetNode)) {
            errors.push(`Connection target node not found: ${targetNode}`)
          }

          if (nodeConnections && Array.isArray(nodeConnections)) {
            for (const conn of nodeConnections) {
              if (!conn.index && conn.index !== 0) {
                errors.push(`Connection missing index from ${sourceNode} to ${targetNode}`)
              }
              if (!conn.type) {
                errors.push(`Connection missing type from ${sourceNode} to ${targetNode}`)
              }
            }
          }
        }
      }
    }

    return errors
  }

  /**
   * Level 3: Architecture coverage validation
   */
  static validateArchitectureCoverage(
    content: string,
    architecture: LogicalArchitecture
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const workflow = JSON.parse(content)
      const nodeCategories = new Map<string, string>()

      // Map nodes to categories based on type
      if (workflow.nodes && Array.isArray(workflow.nodes)) {
        for (const node of workflow.nodes) {
          const category = this.inferNodeCategory(node.type)
          nodeCategories.set(node.name, category)
        }
      }

      // Check if all architecture stages have corresponding implementations
      for (const stage of architecture.stages) {
        if (stage.optional) continue

        const hasImplementation = this.hasStageImplementation(stage, nodeCategories, workflow)
        if (!hasImplementation) {
          errors.push(`Architecture stage "${stage.name}" (${stage.category}) has no corresponding implementation`)
        }
      }

      // Check if data flow is represented
      if (architecture.dataFlow && architecture.dataFlow.connections.length > 0) {
        const hasConnections = workflow.connections && Object.keys(workflow.connections).length > 0
        if (!hasConnections) {
          errors.push('Architecture defines data flow but workflow has no connections')
        }
      }

    } catch (error) {
      errors.push(`Failed to validate architecture coverage: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Infer node category from n8n node type
   */
  private static inferNodeCategory(nodeType: string): string {
    const type = nodeType.toLowerCase()
    
    if (type.includes('trigger') || type.includes('webhook') || type.includes('cron') || type.includes('schedule')) {
      return 'trigger'
    }
    if (type.includes('email') && type.includes('send')) {
      return 'output'
    }
    if (type.includes('if') || type.includes('switch') || type.includes('merge')) {
      return 'decision'
    }
    if (type.includes('ai') || type.includes('openai') || type.includes('anthropic')) {
      return 'processing'
    }
    if (type.includes('http') || type.includes('api')) {
      return 'input'
    }
    
    return 'processing' // Default
  }

  /**
   * Check if stage has implementation
   */
  private static hasStageImplementation(
    stage: any,
    nodeCategories: Map<string, string>,
    workflow: any
  ): boolean {
    // Simple check: does any node match the stage category?
    for (const [, category] of nodeCategories) {
      if (category === stage.category) {
        return true
      }
    }

    // More sophisticated check could look for specific node types
    return false
  }

  /**
   * Level 4: Requirement coverage validation
   */
  static validateRequirementCoverage(
    content: string,
    requirements: string[]
  ): ValidationResult {
    const errors: string[] = []
    const warnings: string[] = []

    try {
      const workflow = JSON.parse(content)
      const workflowText = JSON.stringify(workflow).toLowerCase()

      for (const requirement of requirements) {
        const requirementLower = requirement.toLowerCase()
        
        // Check if requirement is mentioned in the workflow
        if (!workflowText.includes(requirementLower)) {
          warnings.push(`Requirement may not be addressed: "${requirement}"`)
        }
      }

    } catch (error) {
      errors.push(`Failed to validate requirement coverage: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Run all validation levels
   */
  static validateAll(
    content: string,
    architecture?: LogicalArchitecture,
    requirements?: string[]
  ): {
    json: ValidationResult
    structure: ValidationResult
    architecture: ValidationResult
    requirements: ValidationResult
    overall: ValidationResult
  } {
    const json = this.validateJSON(content)
    const structure = json.valid ? this.validateN8nStructure(content) : { valid: false, errors: ['JSON invalid, skipping structure validation'], warnings: [] }
    const architecture = structure.valid && architecture ? this.validateArchitectureCoverage(content, architecture) : { valid: true, errors: [], warnings: ['Architecture validation skipped'] }
    const requirements = structure.valid && requirements ? this.validateRequirementCoverage(content, requirements) : { valid: true, errors: [], warnings: ['Requirement validation skipped'] }

    const allErrors = [...json.errors, ...structure.errors, ...architecture.errors, ...requirements.errors]
    const allWarnings = [...json.warnings, ...structure.warnings, ...architecture.warnings, ...requirements.warnings]

    return {
      json,
      structure,
      architecture,
      requirements,
      overall: {
        valid: allErrors.length === 0,
        errors: allErrors,
        warnings: allWarnings
      }
    }
  }
}
