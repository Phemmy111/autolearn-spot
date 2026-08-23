/**
 * ALEX Workflow Manager V2
 * 
 * Architecture-first, platform-aware workflow management
 * Uses semantic conversation state and platform-agnostic design
 */

import { ArtifactService } from './artifact-service'
import { IntelligenceAnalyzerV2, AnalysisResult as AnalysisResultV2 } from './intelligence-analyzer-v2'
import { ArchitectureDesigner, LogicalArchitecture } from './architecture-designer'
import { ArchitecturePlanner, WorkflowArchitecture } from './architecture-planner'
import { AutomationSpec, SpecState, createSpecState } from './automation-spec'
import { ArtifactBuild, BuildStatus, BuildType } from './types'

export interface WorkflowRequest {
  conversationId: string
  userId: string
  content: string
  attachedFiles?: any[]
  conversationHistory?: Array<{ role: string; content: string }>
}

export interface WorkflowResponse {
  status: BuildStatus
  message: string
  needsInput?: boolean
  question?: {
    text: string
    field: string
    context: string
    options?: string[]
  }
  architectureProposal?: {
    description: string
    platform: string
    platformReasoning: string
    complexity: 'simple' | 'moderate' | 'complex'
    stages: string[]
    assumptions: string[]
    recommendations: string[]
  }
  artifacts?: any[]
  specification?: Record<string, any>
}

export class WorkflowManagerV2 {
  /**
   * Process a workflow request with architecture-first approach
   */
  static async processRequest(request: WorkflowRequest): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Processing request:', request.content.substring(0, 100))
    
    // Check for existing active build
    const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)
    
    if (existingBuild) {
      return this.continueWorkflow(existingBuild, request)
    }
    
    // New request - use Intelligence Analyzer V2
    const analysis = await IntelligenceAnalyzerV2.analyze({
      content: request.content,
      conversationHistory: request.conversationHistory,
      attachedFiles: request.attachedFiles
    })
    
    console.log('[Workflow Manager V2] Analysis result:', {
      situation: analysis.situation,
      nextAction: analysis.nextAction,
      hasQuestion: !!analysis.question
    })
    
    // Create new build
    const buildType = this.detectBuildType(analysis.specState.spec)
    const build = await ArtifactService.createBuild(
      request.conversationId,
      request.userId,
      request.content,
      buildType
    )
    
    // Store the spec state in the build (we'll use final_specification for now)
    await ArtifactService.updateSpecification(build.id, analysis.specState.spec, [])
    
    // Handle the analysis result
    switch (analysis.nextAction) {
      case 'ask_question':
        return this.handleAskQuestion(build, analysis)
        
      case 'design_architecture':
        return this.handleDesignArchitecture(build, analysis)
        
      case 'generate_artifact':
        return this.handleGenerateArtifact(build, analysis)
        
      case 'clarify_ambiguity':
        return this.handleClarifyAmbiguity(build, analysis)
        
      default:
        throw new Error(`Unknown next action: ${analysis.nextAction}`)
    }
  }
  
  /**
   * Continue an existing workflow
   */
  private static async continueWorkflow(build: ArtifactBuild, request: WorkflowRequest): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Continuing workflow:', build.id, 'status:', build.status)
    
    // If user is confirming architecture, proceed to generation
    const lowerContent = request.content.toLowerCase()
    if (build.status === 'awaiting_architecture_verification' && 
        (lowerContent.includes('yes') || lowerContent.includes('go ahead') || lowerContent.includes('proceed'))) {
      console.log('[Workflow Manager V2] User approved architecture, proceeding to generation')
      
      // Load existing spec
      const existingSpec = build.final_specification || {}
      const specState = createSpecState(existingSpec)
      
      // Move to generation
      const analysis: AnalysisResultV2 = {
        specState,
        situation: 'ready_to_generate',
        nextAction: 'generate_artifact'
      }
      
      return this.handleGenerateArtifact(build, analysis)
    }
    
    // Load existing spec state
    const existingSpec = build.final_specification || {}
    const specState = createSpecState(existingSpec)
    
    // If we have a pending question context, restore it
    if (build.questions && build.questions.length > 0) {
      const lastQuestion = build.questions[build.questions.length - 1]
      specState.questionContext = lastQuestion.context || 'unknown'
      specState.currentQuestion = lastQuestion.question
    }
    
    // Analyze the continuation
    const analysis = await IntelligenceAnalyzerV2.analyze({
      content: request.content,
      conversationHistory: request.conversationHistory,
      existingSpecState: specState
    })
    
    console.log('[Workflow Manager V2] Continuation analysis:', {
      situation: analysis.situation,
      nextAction: analysis.nextAction
    })
    
    // Update the specification
    await ArtifactService.updateSpecification(build.id, analysis.specState.spec, [])
    
    // Handle the analysis result
    switch (analysis.nextAction) {
      case 'ask_question':
        return this.handleAskQuestion(build, analysis)
        
      case 'design_architecture':
        return this.handleDesignArchitecture(build, analysis)
        
      case 'generate_artifact':
        return this.handleGenerateArtifact(build, analysis)
        
      case 'clarify_ambiguity':
        return this.handleClarifyAmbiguity(build, analysis)
        
      default:
        throw new Error(`Unknown next action: ${analysis.nextAction}`)
    }
  }
  
  /**
   * Handle asking a question
   */
  private static async handleAskQuestion(build: ArtifactBuild, analysis: AnalysisResultV2): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Asking question:', analysis.question?.text)
    
    if (!analysis.question) {
      throw new Error('Question action specified but no question provided')
    }
    
    // Store the question context in the build
    await ArtifactService.addQuestion(build.id, analysis.question.text, analysis.question.context)
    await ArtifactService.updateBuildStatus(build.id, 'collecting_requirements')
    
    // Update spec state with question context
    const specState = analysis.specState
    specState.questionContext = analysis.question.context
    specState.currentQuestion = analysis.question.text
    await ArtifactService.updateSpecification(build.id, specState.spec, [])
    
    return {
      status: 'collecting_requirements',
      message: analysis.explanation || 'I need to clarify something before proceeding.',
      needsInput: true,
      question: analysis.question
    }
  }
  
  /**
   * Handle designing the architecture
   */
  private static async handleDesignArchitecture(build: ArtifactBuild, analysis: AnalysisResultV2): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Designing architecture')
    
    // Design the logical architecture
    const logicalArchitecture = ArchitectureDesigner.design(analysis.specState.spec)
    
    console.log('[Workflow Manager V2] Logical architecture designed:', {
      name: logicalArchitecture.name,
      complexity: logicalArchitecture.complexity,
      stageCount: logicalArchitecture.stages.length
    })
    
    // Generate human-readable description
    const architectureDescription = ArchitectureDesigner.describeArchitecture(logicalArchitecture)
    
    // Build the architecture proposal
    const proposal = {
      description: architectureDescription,
      platform: analysis.specState.spec.platform || 'n8n',
      platformReasoning: analysis.specState.spec.platformReasoning || 'Recommended based on requirements',
      complexity: logicalArchitecture.complexity,
      stages: logicalArchitecture.stages.map(s => s.name),
      assumptions: logicalArchitecture.assumptions,
      recommendations: logicalArchitecture.recommendations
    }
    
    // Store the architecture in the build for later use
    await ArtifactService.updateSpecification(build.id, analysis.specState.spec, [])
    await ArtifactService.updateBuildStatus(build.id, 'awaiting_architecture_verification')
    
    return {
      status: 'awaiting_architecture_verification',
      message: `I've designed the architecture for your automation.\n\n${architectureDescription}\n\nDoes this architecture match what you want? If yes, I'll generate the workflow and guide.`,
      needsInput: true,
      architectureProposal: proposal
    }
  }
  
  /**
   * Handle generating the artifact
   */
  private static async handleGenerateArtifact(build: ArtifactBuild, analysis: AnalysisResultV2): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Generating artifact')
    
    const spec = analysis.specState.spec
    const platform = spec.platform || 'n8n'
    
    // Design the logical architecture
    const logicalArchitecture = ArchitectureDesigner.design(spec)
    
    // Translate to platform-specific implementation
    let artifactContent: any
    let fileType: string
    let mimeType: string
    
    if (platform === 'n8n') {
      // Use existing ArchitecturePlanner for n8n translation
      const platformArchitecture = ArchitecturePlanner.design({
        originalRequest: build.original_request,
        platform: platform,
        trigger: spec.trigger?.type || 'manual',
        functionality: spec.description || 'automation',
        integrations: spec.integrations?.emailProvider || 'none',
        filename: spec.filename || 'workflow.json',
        replyScope: spec.businessRules?.routing?.join(', ')
      })
      
      artifactContent = {
        name: platformArchitecture.name,
        nodes: platformArchitecture.nodes,
        connections: this.buildConnectionsFromDesign(platformArchitecture.connections, platformArchitecture.nodes),
        active: true,
        settings: {
          executionOrder: 'v1',
          saveDataOnExecution: 'all',
          saveManualExecutions: true
        },
        id: this.generateUUID(),
        tags: []
      }
      
      fileType = 'json'
      mimeType = 'application/json'
      
      // Validate n8n schema
      const validation = this.validateN8nSchema(artifactContent)
      if (!validation.valid) {
        console.error('[Workflow Manager V2] n8n schema validation failed:', validation.errors)
        // Try to repair
        artifactContent = this.repairN8nWorkflow(artifactContent, validation.errors)
      }
    } else {
      // For other platforms, generate appropriate format
      artifactContent = this.generateGenericArtifact(spec, logicalArchitecture, platform)
      fileType = 'json'
      mimeType = 'application/json'
    }
    
    // Save the artifact
    const filename = spec.filename || `${spec.automationType}-${platform}.json`
    const artifact = await ArtifactService.saveArtifact(
      build.id,
      build.user_id,
      filename,
      fileType,
      mimeType,
      JSON.stringify(artifactContent, null, 2),
      true
    )
    
    // Generate guide from the actual artifact
    const guide = this.generateGuide(spec, logicalArchitecture, artifactContent, platform)
    
    // Save guide as secondary artifact
    const guideFilename = filename.replace('.json', '-guide.md')
    await ArtifactService.saveArtifact(
      build.id,
      build.user_id,
      guideFilename,
      'markdown',
      'text/markdown',
      guide,
      false
    )
    
    await ArtifactService.updateBuildStatus(build.id, 'completed')
    
    return {
      status: 'completed',
      message: `I've generated the ${platform} workflow and implementation guide.\n\n${guide.substring(0, 500)}...`,
      artifacts: [
        {
          filename: filename,
          fileType: fileType,
          mimeType: mimeType
        },
        {
          filename: guideFilename,
          fileType: 'markdown',
          mimeType: 'text/markdown'
        }
      ],
      specification: spec
    }
  }
  
  /**
   * Build connections from architecture design
   */
  private static buildConnectionsFromDesign(connections: any[], nodes: any[]): any {
    const connectionMap: any = {}
    
    // Create a node name to ID mapping
    const nodeNameToId = new Map()
    nodes.forEach(node => {
      nodeNameToId.set(node.name, node.id)
    })
    
    // Build connections using node IDs
    connections.forEach(conn => {
      const fromId = nodeNameToId.get(conn.from)
      const toId = nodeNameToId.get(conn.to)
      
      if (fromId && toId) {
        if (!connectionMap[fromId]) {
          connectionMap[fromId] = { main: [] }
        }
        connectionMap[fromId].main.push({
          node: toId,
          type: conn.type,
          index: conn.index
        })
      }
    })
    
    return connectionMap
  }
  
  /**
   * Validate n8n workflow schema
   */
  private static validateN8nSchema(workflow: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check required top-level fields
    if (!workflow.name || typeof workflow.name !== 'string') {
      errors.push('Missing or invalid workflow name')
    }
    
    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Missing or invalid nodes array')
    } else {
      const nodeIds = new Set<string>()
      const nodeNames = new Set<string>()
      
      for (const node of workflow.nodes) {
        if (!node.id || typeof node.id !== 'string') {
          errors.push(`Node missing ID: ${node.name || 'unnamed'}`)
        } else if (nodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: ${node.id}`)
        } else {
          nodeIds.add(node.id)
        }
        
        if (!node.name || typeof node.name !== 'string') {
          errors.push(`Node missing name: ${node.id}`)
        } else if (nodeNames.has(node.name)) {
          errors.push(`Duplicate node name: ${node.name}`)
        } else {
          nodeNames.add(node.name)
        }
        
        if (!node.type || typeof node.type !== 'string') {
          errors.push(`Node missing type: ${node.name}`)
        }
        
        if (!node.position || !Array.isArray(node.position) || node.position.length !== 2) {
          errors.push(`Node missing valid position: ${node.name}`)
        }
        
        if (!node.parameters || typeof node.parameters !== 'object') {
          errors.push(`Node missing parameters: ${node.name}`)
        }
      }
      
      if (workflow.nodes.length === 0) {
        errors.push('Workflow has no nodes')
      }
    }
    
    // Check connections
    if (!workflow.connections || typeof workflow.connections !== 'object') {
      errors.push('Missing or invalid connections object')
    } else {
      const connectionNodeIds = Object.keys(workflow.connections)
      
      for (const sourceId of connectionNodeIds) {
        if (!nodeIds.has(sourceId)) {
          errors.push(`Connection references non-existent source node: ${sourceId}`)
        }
        
        const sourceConnections = workflow.connections[sourceId]
        if (!sourceConnections.main || !Array.isArray(sourceConnections.main)) {
          errors.push(`Invalid connection structure for node: ${sourceId}`)
        } else {
          for (const conn of sourceConnections.main) {
            if (!conn.node || !nodeIds.has(conn.node)) {
              errors.push(`Connection references non-existent target node: ${conn.node}`)
            }
          }
        }
      }
    }
    
    // Check settings
    if (!workflow.settings || typeof workflow.settings !== 'object') {
      errors.push('Missing or invalid settings object')
    }
    
    return {
      valid: errors.length === 0,
      errors
    }
  }
  
  /**
   * Repair n8n workflow with common issues
   */
  private static repairN8nWorkflow(workflow: any, errors: string[]): any {
    console.log('[Workflow Manager V2] Attempting to repair workflow')
    
    // Add missing settings
    if (!workflow.settings) {
      workflow.settings = {
        executionOrder: 'v1',
        saveDataOnExecution: 'all',
        saveManualExecutions: true
      }
    }
    
    // Ensure all nodes have positions
    if (workflow.nodes) {
      workflow.nodes.forEach((node: any, index: number) => {
        if (!node.position) {
          node.position = [index * 200, 100]
        }
      })
    }
    
    return workflow
  }
  
  /**
   * Generate generic artifact for non-n8n platforms
   */
  private static generateGenericArtifact(spec: AutomationSpec, architecture: LogicalArchitecture, platform: string): any {
    return {
      platform: platform,
      name: architecture.name,
      description: architecture.description,
      stages: architecture.stages.map(stage => ({
        id: stage.id,
        name: stage.name,
        purpose: stage.purpose,
        inputs: stage.inputs,
        outputs: stage.outputs
      })),
      complexity: architecture.complexity,
      assumptions: architecture.assumptions,
      recommendations: architecture.recommendations,
      configuration: spec
    }
  }
  
  /**
   * Generate implementation guide from actual artifact
   */
  private static generateGuide(spec: AutomationSpec, architecture: LogicalArchitecture, artifact: any, platform: string): string {
    let guide = `# ${architecture.name} - Implementation Guide\n\n`
    guide += `## Overview\n\n`
    guide += `This automation implements: ${architecture.description}\n\n`
    guide += `**Platform:** ${platform}\n`
    guide += `**Complexity:** ${architecture.complexity}\n\n`
    
    guide += `## Architecture\n\n`
    architecture.stages.forEach((stage, index) => {
      guide += `${index + 1}. **${stage.name}**\n`
      guide += `   ${stage.purpose}\n`
      if (stage.inputs.length > 0) {
        guide += `   Inputs: ${stage.inputs.join(', ')}\n`
      }
      if (stage.outputs.length > 0) {
        guide += `   Outputs: ${stage.outputs.join(', ')}\n`
      }
      guide += `\n`
    })
    
    guide += `## Configuration Required\n\n`
    
    if (spec.integrations?.emailProvider) {
      guide += `- Email Provider: ${spec.integrations.emailProvider} (configure credentials)\n`
    }
    
    if (spec.integrations?.aiProvider) {
      guide += `- AI Provider: ${spec.integrations.aiProvider} (configure API key)\n`
      if (spec.integrations?.aiModel) {
        guide += `- AI Model: ${spec.integrations.aiModel}\n`
      }
    }
    
    if (spec.integrations?.knowledgeBase) {
      guide += `- Knowledge Base: ${spec.integrations.knowledgeBase} (configure connection)\n`
    }
    
    if (spec.aiConfig?.confidenceThreshold) {
      guide += `- Confidence Threshold: ${spec.aiConfig.confidenceThreshold}\n`
    }
    
    guide += `\n## Assumptions\n\n`
    architecture.assumptions.forEach(assumption => {
      guide += `- ${assumption}\n`
    })
    
    guide += `\n## Recommendations\n\n`
    architecture.recommendations.forEach(rec => {
      guide += `- ${rec}\n`
    })
    
    guide += `\n## Testing\n\n`
    guide += `1. Import the workflow into ${platform}\n`
    guide += `2. Configure required credentials\n`
    guide += `3. Test with sample data\n`
    guide += `4. Verify the output matches expectations\n`
    guide += `5. Monitor the first few executions\n`
    
    return guide
  }
  
  /**
   * Generate UUID
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }
  
  /**
   * Handle clarifying ambiguity
   */
  private static async handleClarifyAmbiguity(build: ArtifactBuild, analysis: AnalysisResultV2): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Clarifying ambiguity')
    
    return {
      status: 'collecting_requirements',
      message: analysis.explanation || 'I need to clarify something.',
      needsInput: true,
      question: analysis.question
    }
  }
  
  /**
   * Detect build type from spec
   */
  private static detectBuildType(spec: AutomationSpec): BuildType {
    switch (spec.automationType) {
      case 'chatbot':
        return 'chatbot'
      case 'workflow':
      case 'automation':
      case 'pipeline':
      case 'integration':
      default:
        return 'workflow'
    }
  }
}
