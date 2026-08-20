/**
 * Phase 7: Workflow Repair
 * 
 * Repairs n8n workflows by fixing structural issues and validation errors.
 */

import { Workflow, WorkflowRepairResult, WorkflowNode, WorkflowConnection } from './workflow-types'
import { WorkflowValidator } from './workflow-validator'
import { WorkflowParser } from './workflow-parser'

export class WorkflowRepair {
  /**
   * Repair a workflow
   */
  static repair(workflow: Workflow): WorkflowRepairResult {
    const originalWorkflow = JSON.parse(JSON.stringify(workflow))
    const repairsPerformed: string[] = []
    const uncertainRepairs: string[] = []

    // Clone workflow for repair
    const repairedWorkflow = JSON.parse(JSON.stringify(workflow))

    // Fix duplicate node IDs
    const idRepair = this.fixDuplicateNodeIds(repairedWorkflow)
    if (idRepair.repaired) {
      repairsPerformed.push(...idRepair.repairs)
      uncertainRepairs.push(...idRepair.uncertain)
    }

    // Fix duplicate node names
    const nameRepair = this.fixDuplicateNodeNames(repairedWorkflow)
    if (nameRepair.repaired) {
      repairsPerformed.push(...nameRepair.repairs)
      uncertainRepairs.push(...nameRepair.uncertain)
    }

    // Fix broken connections
    const connectionRepair = this.fixBrokenConnections(repairedWorkflow)
    if (connectionRepair.repaired) {
      repairsPerformed.push(...connectionRepair.repairs)
      uncertainRepairs.push(...connectionRepair.uncertain)
    }

    // Fix invalid node types
    const typeRepair = this.fixInvalidNodeTypes(repairedWorkflow)
    if (typeRepair.repaired) {
      repairsPerformed.push(...typeRepair.repairs)
      uncertainRepairs.push(...typeRepair.uncertain)
    }

    // Fix missing required fields
    const fieldRepair = this.fixMissingFields(repairedWorkflow)
    if (fieldRepair.repaired) {
      repairsPerformed.push(...fieldRepair.repairs)
      uncertainRepairs.push(...fieldRepair.uncertain)
    }

    // Validate the repaired workflow
    const validationAfterRepair = WorkflowValidator.validate(repairedWorkflow)

    // Determine success
    const success = validationAfterRepair.isValid || validationAfterRepair.errors.length === 0

    return {
      success,
      originalWorkflow,
      repairedWorkflow: success ? repairedWorkflow : undefined,
      repairsPerformed,
      uncertainRepairs,
      validationAfterRepair
    }
  }

  /**
   * Fix duplicate node IDs
   */
  private static fixDuplicateNodeIds(workflow: Workflow): {
    repaired: boolean
    repairs: string[]
    uncertain: string[]
  } {
    const repairs: string[] = []
    const uncertain: string[] = []
    const idMap = new Map<string, string>()
    const seenIds = new Set<string>()

    workflow.nodes.forEach(node => {
      if (seenIds.has(node.id)) {
        // Generate new unique ID
        const newId = `${node.id}_${Math.random().toString(36).substr(2, 9)}`
        idMap.set(node.id, newId)
        node.id = newId
        repairs.push(`Changed duplicate node ID from ${idMap.get(node.id)} to ${newId}`)
      }
      seenIds.add(node.id)
    })

    // Update connections
    workflow.connections.forEach(conn => {
      if (idMap.has(conn.source)) {
        conn.source = idMap.get(conn.source)!
      }
      if (idMap.has(conn.target)) {
        conn.target = idMap.get(conn.target)!
      }
    })

    return { repaired: repairs.length > 0, repairs, uncertain }
  }

  /**
   * Fix duplicate node names
   */
  private static fixDuplicateNodeNames(workflow: Workflow): {
    repaired: boolean
    repairs: string[]
    uncertain: string[]
  } {
    const repairs: string[] = []
    const uncertain: string[] = []
    const nameMap = new Map<string, string>()
    const seenNames = new Set<string>()

    workflow.nodes.forEach(node => {
      if (seenNames.has(node.name)) {
        // Generate new unique name
        const newName = `${node.name}_${Math.random().toString(36).substr(2, 9)}`
        nameMap.set(node.name, newName)
        node.name = newName
        repairs.push(`Changed duplicate node name from ${nameMap.get(node.name)} to ${newName}`)
      }
      seenNames.add(node.name)
    })

    return { repaired: repairs.length > 0, repairs, uncertain }
  }

  /**
   * Fix broken connections
   */
  private static fixBrokenConnections(workflow: Workflow): {
    repaired: boolean
    repairs: string[]
    uncertain: string[]
  } {
    const repairs: string[] = []
    const uncertain: string[] = []
    const nodeIds = new Set(workflow.nodes.map(n => n.id))

    // Remove connections to non-existent nodes
    const validConnections = workflow.connections.filter(conn => {
      const sourceExists = nodeIds.has(conn.source)
      const targetExists = nodeIds.has(conn.target)

      if (!sourceExists) {
        repairs.push(`Removed connection from non-existent source node '${conn.source}'`)
      }
      if (!targetExists) {
        repairs.push(`Removed connection to non-existent target node '${conn.target}'`)
      }

      return sourceExists && targetExists
    })

    workflow.connections = validConnections

    return { repaired: repairs.length > 0, repairs, uncertain }
  }

  /**
   * Fix invalid node types
   */
  private static fixInvalidNodeTypes(workflow: Workflow): {
    repaired: boolean
    repairs: string[]
    uncertain: string[]
  } {
    const repairs: string[] = []
    const uncertain: string[] = []

    workflow.nodes.forEach(node => {
      if (!node.type || typeof node.type !== 'string') {
        // Cannot fix unknown node type - this is uncertain
        uncertain.push(`Node '${node.name}' has invalid type and could not be auto-repaired`)
      }
    })

    return { repaired: repairs.length > 0, repairs, uncertain }
  }

  /**
   * Fix missing required fields
   */
  private static fixMissingFields(workflow: Workflow): {
    repaired: boolean
    repairs: string[]
    uncertain: string[]
  } {
    const repairs: string[] = []
    const uncertain: string[] = []

    workflow.nodes.forEach(node => {
      // Ensure parameters object exists
      if (!node.parameters) {
        node.parameters = {}
        repairs.push(`Added empty parameters object to node '${node.name}'`)
      }

      // Ensure position exists
      if (!node.position) {
        node.position = [250, 300]
        repairs.push(`Added default position to node '${node.name}'`)
      }

      // Ensure typeVersion exists
      if (!node.typeVersion) {
        node.typeVersion = 1
        repairs.push(`Added default typeVersion to node '${node.name}'`)
      }
    })

    return { repaired: repairs.length > 0, repairs, uncertain }
  }

  /**
   * Attempt to repair from JSON string
   */
  static repairFromJson(jsonString: string): WorkflowRepairResult {
    const parseResult = WorkflowParser.parseFromJson(jsonString)

    if (!parseResult.success || !parseResult.workflow) {
      return {
        success: false,
        originalWorkflow: {} as Workflow,
        repairsPerformed: [],
        uncertainRepairs: parseResult.errors.map(e => e.message),
        validationAfterRepair: {
          isValid: false,
          errors: parseResult.errors,
          warnings: parseResult.warnings,
          info: [],
          nodeCount: 0,
          connectionCount: 0,
          nodeTypes: [],
          integrations: [],
          requiredCredentials: []
        }
      }
    }

    return this.repair(parseResult.workflow)
  }
}
