/**
 * Phase 7: Workflow Agent Integration
 * 
 * Integrates workflow capabilities with the Phase 6 AgentService.
 */

import { Workflow, WorkflowGenerationRequest, WorkflowDebugRequest } from './workflow-types'
import { WorkflowParser } from './workflow-parser'
import { WorkflowValidator } from './workflow-validator'
import { WorkflowAnalyzer } from './workflow-analyzer'
import { WorkflowDebugger } from './workflow-debugger'
import { WorkflowRepair } from './workflow-repair'
import { WorkflowGenerator } from './workflow-generator'
import { WorkflowArtifactService } from './workflow-artifact'
import { WorkflowGuidance } from './workflow-guidance'
import { WorkflowSecurity } from './workflow-security'
import { AIEngine } from '../ai-engine'

export class WorkflowAgent {
  /**
   * Process a workflow-related request
   */
  static async processRequest(
    content: string,
    attachedFiles: any[],
    workflowJson?: string,
    workflowErrors?: string[],
    aiEngine?: AIEngine,
    webResearchService?: any
  ): Promise<{
    response: string
    artifact?: any
    metadata?: any
  }> {
    // Detect request type
    const requestType = this.detectRequestType(content, workflowJson, attachedFiles)

    switch (requestType) {
      case 'generate':
        return this.handleGeneration(content, aiEngine, webResearchService)

      case 'debug':
        return this.handleDebug(content, workflowJson, workflowErrors, attachedFiles)

      case 'validate':
        return this.handleValidation(workflowJson)

      case 'analyze':
        return this.handleAnalysis(workflowJson)

      case 'repair':
        return this.handleRepair(workflowJson)

      default:
        return {
          response: 'I can help you with n8n workflows. You can ask me to generate, debug, validate, analyze, or repair workflows. Please provide the workflow JSON or describe what you need.'
        }
    }
  }

  /**
   * Detect the type of workflow request
   */
  private static detectRequestType(
    content: string,
    workflowJson?: string,
    attachedFiles?: any[]
  ): 'generate' | 'debug' | 'validate' | 'analyze' | 'repair' | 'unknown' {
    const contentLower = content.toLowerCase()

    // Generation requests
    if (contentLower.includes('create') || contentLower.includes('generate') || contentLower.includes('build')) {
      if (contentLower.includes('workflow') || contentLower.includes('n8n')) {
        return 'generate'
      }
    }

    // Debug requests
    if (contentLower.includes('debug') || contentLower.includes('error') || contentLower.includes('failing') || contentLower.includes('not working')) {
      if (workflowJson || attachedFiles?.length > 0) {
        return 'debug'
      }
    }

    // Validation requests
    if (contentLower.includes('validate') || contentLower.includes('check')) {
      if (workflowJson) {
        return 'validate'
      }
    }

    // Analysis requests
    if (contentLower.includes('analyze') || contentLower.includes('explain') || contentLower.includes('what does')) {
      if (workflowJson) {
        return 'analyze'
      }
    }

    // Repair requests
    if (contentLower.includes('repair') || contentLower.includes('fix')) {
      if (workflowJson) {
        return 'repair'
      }
    }

    // If workflow JSON is provided without specific instruction, default to analyze
    if (workflowJson) {
      return 'analyze'
    }

    return 'unknown'
  }

  /**
   * Handle workflow generation
   */
  private static async handleGeneration(
    content: string,
    aiEngine?: AIEngine,
    webResearchService?: any
  ): Promise<{ response: string; artifact?: any; metadata?: any }> {
    // Security check
    const securityCheck = WorkflowSecurity.validateGenerationInput(content)
    if (!securityCheck.safe) {
      return {
        response: `Security check failed: ${securityCheck.error}`
      }
    }

    if (!aiEngine) {
      return {
        response: 'Workflow generation requires AI engine capabilities. Please ensure AI engine is available.'
      }
    }

    try {
      const request: WorkflowGenerationRequest = {
        requirement: content
      }

      const result = await WorkflowGenerator.generate(request, aiEngine, webResearchService)

      // Security validation
      const securityValidation = WorkflowSecurity.validateWorkflowSecurity(result.workflow)
      if (!securityValidation.safe) {
        return {
          response: `Generated workflow failed security validation:\n${securityValidation.errors.map(e => e.message).join('\n')}`
        }
      }

      // Sanitize workflow
      const sanitizedWorkflow = WorkflowSecurity.sanitizeWorkflow(result.workflow)

      // Generate artifact
      const artifact = WorkflowArtifactService.generateArtifact(sanitizedWorkflow)

      // Generate guidance
      const analysis = WorkflowAnalyzer.analyze(sanitizedWorkflow)
      const guidance = WorkflowGuidance.generateCompleteGuidance(sanitizedWorkflow, analysis, artifact.filename)

      // Build response
      let response = result.explanation + '\n\n'
      response += WorkflowSecurity.getSecurityDisclaimer() + '\n\n'
      response += guidance.importInstructions
      response += guidance.credentialInstructions
      response += guidance.configurationInstructions
      response += guidance.testingInstructions

      return {
        response,
        artifact,
        metadata: {
          validation: result.validation,
          requiredCredentials: result.requiredCredentials,
          requiredConfiguration: result.requiredConfiguration
        }
      }
    } catch (error) {
      return {
        response: `Failed to generate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Handle workflow debugging
   */
  private static async handleDebug(
    content: string,
    workflowJson?: string,
    workflowErrors?: string[],
    attachedFiles?: any[]
  ): Promise<{ response: string; artifact?: any; metadata?: any }> {
    if (!workflowJson && attachedFiles?.length === 0) {
      return {
        response: 'Please provide the workflow JSON to debug. You can paste it directly or upload a JSON file.'
      }
    }

    try {
      // Get workflow JSON from file or direct input
      const json = workflowJson || (attachedFiles?.[0]?.content)
      if (!json) {
        return {
          response: 'Could not extract workflow JSON from the provided input.'
        }
      }

      const parseResult = WorkflowParser.parseFromJson(json)
      if (!parseResult.success || !parseResult.workflow) {
        return {
          response: `Failed to parse workflow: ${parseResult.errors.map(e => e.message).join(', ')}`
        }
      }

      const debugRequest: WorkflowDebugRequest = {
        workflow: parseResult.workflow,
        errorMessage: workflowErrors?.join('\n'),
        userDescription: content
      }

      const debugResult = WorkflowDebugger.debug(debugRequest)

      // Build response
      let response = `## Debugging Results\n\n`
      response += `**Likely Problem:** ${debugResult.likelyProblem}\n\n`
      response += `**Confidence:** ${debugResult.confidence}\n\n`

      if (debugResult.affectedNode) {
        response += `**Affected Node:** ${debugResult.affectedNode}\n\n`
      }

      response += `**Recommended Fix:** ${debugResult.recommendedFix}\n\n`

      if (debugResult.evidence.length > 0) {
        response += `**Evidence:**\n`
        debugResult.evidence.forEach(e => {
          response += `- ${e}\n`
        })
        response += '\n'
      }

      if (debugResult.requiredConfiguration && Object.keys(debugResult.requiredConfiguration).length > 0) {
        response += `**Required Configuration:**\n`
        Object.entries(debugResult.requiredConfiguration).forEach(([key, value]) => {
          response += `- ${key}: ${value}\n`
        })
        response += '\n'
      }

      // Attempt repair if possible
      if (debugResult.canAutoRepair) {
        const repairResult = WorkflowRepair.repair(parseResult.workflow)
        if (repairResult.success && repairResult.repairedWorkflow) {
          const artifact = WorkflowArtifactService.generateArtifact(repairResult.repairedWorkflow)
          response += `**Auto-Repair Performed:**\n`
          response += repairResult.repairsPerformed.map(r => `- ${r}`).join('\n')
          response += '\n\n'
          response += `A corrected workflow artifact has been generated.\n`

          return {
            response,
            artifact,
            metadata: {
              repairResult,
              debugResult
            }
          }
        }
      }

      return { response, metadata: { debugResult } }
    } catch (error) {
      return {
        response: `Failed to debug workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      }
    }
  }

  /**
   * Handle workflow validation
   */
  private static handleValidation(workflowJson?: string): Promise<{ response: string }> {
    if (!workflowJson) {
      return Promise.resolve({
        response: 'Please provide the workflow JSON to validate.'
      })
    }

    try {
      const parseResult = WorkflowParser.parseFromJson(workflowJson)
      if (!parseResult.success || !parseResult.workflow) {
        return Promise.resolve({
          response: `Failed to parse workflow: ${parseResult.errors.map(e => e.message).join(', ')}`
        })
      }

      const validation = WorkflowValidator.validate(parseResult.workflow)

      let response = `## Validation Results\n\n`
      response += `**Valid:** ${validation.isValid ? 'Yes' : 'No'}\n\n`
      response += `**Nodes:** ${validation.nodeCount}\n`
      response += `**Connections:** ${validation.connectionCount}\n\n`

      if (validation.errors.length > 0) {
        response += `### Errors\n`
        validation.errors.forEach(e => {
          response += `- **${e.code}:** ${e.message}\n`
        })
        response += '\n'
      }

      if (validation.warnings.length > 0) {
        response += `### Warnings\n`
        validation.warnings.forEach(w => {
          response += `- **${w.code}:** ${w.message}\n`
        })
        response += '\n'
      }

      if (validation.info.length > 0) {
        response += `### Information\n`
        validation.info.forEach(i => {
          response += `- ${i.message}\n`
        })
        response += '\n'
      }

      return Promise.resolve({ response })
    } catch (error) {
      return Promise.resolve({
        response: `Failed to validate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  /**
   * Handle workflow analysis
   */
  private static handleAnalysis(workflowJson?: string): Promise<{ response: string }> {
    if (!workflowJson) {
      return Promise.resolve({
        response: 'Please provide the workflow JSON to analyze.'
      })
    }

    try {
      const parseResult = WorkflowParser.parseFromJson(workflowJson)
      if (!parseResult.success || !parseResult.workflow) {
        return Promise.resolve({
          response: `Failed to parse workflow: ${parseResult.errors.map(e => e.message).join(', ')}`
        })
      }

      const analysis = WorkflowAnalyzer.analyze(parseResult.workflow)
      const summary = WorkflowAnalyzer.generateSummary(analysis)

      let response = `## Workflow Analysis\n\n`
      response += summary + '\n\n'

      if (analysis.purpose) {
        response += `**Purpose:** ${analysis.purpose}\n\n`
      }

      return Promise.resolve({ response })
    } catch (error) {
      return Promise.resolve({
        response: `Failed to analyze workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }

  /**
   * Handle workflow repair
   */
  private static handleRepair(workflowJson?: string): Promise<{ response: string; artifact?: any }> {
    if (!workflowJson) {
      return Promise.resolve({
        response: 'Please provide the workflow JSON to repair.'
      })
    }

    try {
      const parseResult = WorkflowParser.parseFromJson(workflowJson)
      if (!parseResult.success || !parseResult.workflow) {
        return Promise.resolve({
          response: `Failed to parse workflow: ${parseResult.errors.map(e => e.message).join(', ')}`
        })
      }

      const repairResult = WorkflowRepair.repair(parseResult.workflow)

      let response = `## Repair Results\n\n`
      response += `**Success:** ${repairResult.success ? 'Yes' : 'No'}\n\n`

      if (repairResult.repairsPerformed.length > 0) {
        response += `### Repairs Performed\n`
        repairResult.repairsPerformed.forEach(r => {
          response += `- ${r}\n`
        })
        response += '\n'
      }

      if (repairResult.uncertainRepairs.length > 0) {
        response += `### Uncertain Repairs\n`
        response += `The following items could not be automatically repaired:\n`
        repairResult.uncertainRepairs.forEach(r => {
          response += `- ${r}\n`
        })
        response += '\n'
      }

      response += `### Validation After Repair\n`
      response += `**Valid:** ${repairResult.validationAfterRepair.isValid ? 'Yes' : 'No'}\n`
      response += `**Errors:** ${repairResult.validationAfterRepair.errors.length}\n`
      response += `**Warnings:** ${repairResult.validationAfterRepair.warnings.length}\n\n`

      if (repairResult.success && repairResult.repairedWorkflow) {
        const artifact = WorkflowArtifactService.generateArtifact(repairResult.repairedWorkflow)
        response += `A repaired workflow artifact has been generated.\n`

        return Promise.resolve({ response, artifact })
      }

      return Promise.resolve({ response })
    } catch (error) {
      return Promise.resolve({
        response: `Failed to repair workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
      })
    }
  }
}
