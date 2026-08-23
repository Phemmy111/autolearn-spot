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
    
    // This will be implemented in the next step
    // For now, return a placeholder
    return {
      status: 'generating',
      message: 'Generating the artifact based on the approved architecture...'
    }
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
