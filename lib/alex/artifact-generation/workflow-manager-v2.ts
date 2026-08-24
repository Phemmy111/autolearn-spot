/**
 * ALEX Workflow Manager V2
 * 
 * Architecture-first, platform-aware workflow management
 * Uses semantic conversation state and platform-agnostic design
 */

import { ArtifactService } from './artifact-service'
import { IntelligenceAnalyzerV2, AnalysisResult as AnalysisResultV2 } from './intelligence-analyzer-v2'
import { ArchitectureDesigner, LogicalArchitecture, LogicalStage } from './architecture-designer'
import { ArchitecturePlanner, WorkflowArchitecture } from './architecture-planner'
import { AutomationSpec, SpecState, createSpecState } from './automation-spec'
import { ArtifactBuild, BuildStatus, BuildType } from './types'
import { ArtifactValidator } from './artifact-validator'
import { WorkflowLogger } from './workflow-logger'

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
    const workflowRequestId = `wf-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    console.log('[DEBUG WORKFLOW MANAGER V2] ===== PROCESS REQUEST START =====')
    console.log('[DEBUG WORKFLOW MANAGER V2] Request details:', {
      conversationId: request.conversationId,
      userId: request.userId,
      content: request.content.substring(0, 100),
      hasAttachedFiles: !!request.attachedFiles,
      attachedFilesCount: request.attachedFiles?.length || 0
    })

    WorkflowLogger.log({
      workflow_request_id: workflowRequestId,
      conversation_id: request.conversationId,
      user_id: request.userId,
      stage: 'request_received',
      operation: 'process_request',
      duration_ms: 0,
      success: true
    })
    
    // Check for existing active build
    const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)
    console.log('[DEBUG WORKFLOW MANAGER V2] Existing build check:', {
      found: !!existingBuild,
      buildId: existingBuild?.id,
      status: existingBuild?.status
    })
    
    if (existingBuild) {
      // Before continuing, check if this is actually a continuation or a new request
      const isContinuation = this.detectWorkflowContinuation(request.content, existingBuild)
      console.log('[Workflow Manager V2] Incoming request classified as:', isContinuation ? 'continuation' : 'NEW workflow')
      
      if (isContinuation) {
        return this.continueWorkflow(existingBuild, request)
      } else {
        console.log('[Workflow Manager V2] New automation request detected, creating new build instead of continuing old build')
        // Fall through to create new build below
      }
    }
    
    // New request - use Intelligence Analyzer V2
    // Limit conversation history to prevent token limit issues
    const limitedHistory = request.conversationHistory?.slice(-3) || []
    console.log('[DEBUG WORKFLOW MANAGER V2] Calling IntelligenceAnalyzerV2.analyze with limited history:', {
      originalHistoryLength: request.conversationHistory?.length || 0,
      limitedHistoryLength: limitedHistory.length
    })
    const analysis = await IntelligenceAnalyzerV2.analyze({
      content: request.content,
      conversationHistory: limitedHistory,
      attachedFiles: request.attachedFiles
    })
    
    console.log('[DEBUG WORKFLOW MANAGER V2] IntelligenceAnalyzerV2 result:', {
      situation: analysis.situation,
      nextAction: analysis.nextAction,
      hasQuestion: !!analysis.question,
      questionField: analysis.question?.field,
      questionContext: analysis.question?.context,
      hasArchitecture: !!analysis.architectureProposal,
      explanationPreview: analysis.explanation?.substring(0, 100)
    })
    
    // Create new build
    const buildType = this.detectBuildType(analysis.specState.spec)
    const build = await ArtifactService.createBuild(
      request.conversationId,
      request.userId,
      request.content,
      buildType
    )
    
    // Store the spec state in the build with known/blockers tracking
    const specWithState = {
      ...analysis.specState.spec,
      _knownFields: Array.from(analysis.specState.known),
      _blockerFields: Array.from(analysis.specState.blockers)
    }
    await ArtifactService.updateSpecification(build.id, specWithState, [])
    
    // Handle the analysis result
    console.log('[DEBUG WORKFLOW MANAGER V2] Switching on nextAction (new request):', analysis.nextAction)
    switch (analysis.nextAction) {
      case 'ask_question':
        console.log('[DEBUG WORKFLOW MANAGER V2] Routing to handleAskQuestion')
        return this.handleAskQuestion(build, analysis)
        
      case 'design_architecture':
        console.log('[DEBUG WORKFLOW MANAGER V2] Routing to handleDesignArchitecture')
        return this.handleDesignArchitecture(build, analysis)
        
      case 'generate_artifact':
        console.log('[DEBUG WORKFLOW MANAGER V2] Routing to handleGenerateArtifact')
        return this.handleGenerateArtifact(build, analysis)
        
      case 'clarify_ambiguity':
        console.log('[DEBUG WORKFLOW MANAGER V2] Routing to handleClarifyAmbiguity')
        return this.handleClarifyAmbiguity(build, analysis)
        
      default:
        console.error('[DEBUG WORKFLOW MANAGER V2] Unknown next action:', analysis.nextAction)
        throw new Error(`Unknown next action: ${analysis.nextAction}`)
    }
  }
  
  /**
   * Detect if incoming message is a continuation of existing workflow or a new request
   */
  private static detectWorkflowContinuation(content: string, existingBuild: ArtifactBuild): boolean {
    const lower = content.toLowerCase()
    
    // Check if this is a new automation request (contains create/build/generate keywords)
    const automationKeywords = ['create', 'build', 'generate', 'make', 'design', 'setup']
    const hasAutomationKeyword = automationKeywords.some(keyword => lower.includes(keyword))
    
    if (hasAutomationKeyword && content.length > 10) {
      console.log('[Workflow Manager V2] New automation request detected:', content.substring(0, 50))
      return false
    }
    
    // Check if it answers the current question context
    const existingSpec = existingBuild.final_specification || {}
    const questionContext = (existingSpec as any)._blockerFields?.[0]
    
    if (questionContext) {
      // Field:value format is a continuation
      const fieldMatch = content.match(/^([^:]+):\s*(.+)$/i)
      if (fieldMatch) {
        console.log('[Workflow Manager V2] Field:value format detected, treating as continuation')
        return true
      }
      
      // Simple platform/service names are continuations
      const platformNames = ['gmail', 'outlook', 'slack', 'telegram', 'whatsapp', 'email']
      if (content.length < 20 && platformNames.some(name => lower === name || lower === name + ' ')) {
        console.log('[Workflow Manager V2] Simple platform answer detected, treating as continuation')
        return true
      }
    }
    
    // Approval/rejection keywords are continuations (if build is awaiting verification)
    if (existingBuild.status === 'awaiting_architecture_verification') {
      const approvalKeywords = ['yes', 'no', 'approve', 'reject', 'modify', 'improve', 'change']
      if (content.length < 20 && approvalKeywords.some(keyword => lower.includes(keyword))) {
        console.log('[Workflow Manager V2] Approval keyword detected, treating as continuation')
        return true
      }
    }
    
    // Default: treat as continuation if existing build exists and we can't clearly classify as new request
    console.log('[Workflow Manager V2] Unable to classify as new request, treating as continuation')
    return true
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
      
      // Load existing spec with known/blockers restoration
      const existingSpec = build.final_specification || {}
      console.log('[DEBUG WORKFLOW MANAGER V2] Existing spec for generation:', JSON.stringify(existingSpec, null, 2))
      const specState = createSpecState(
        existingSpec,
        (existingSpec as any)._knownFields,
        (existingSpec as any)._blockerFields
      )
      console.log('[DEBUG WORKFLOW MANAGER V2] Spec state after restoration:', {
        known: Array.from(specState.known),
        blockers: Array.from(specState.blockers)
      })
      
      // Move to generation
      const analysis: AnalysisResultV2 = {
        specState,
        situation: 'ready_to_generate',
        nextAction: 'generate_artifact'
      }
      
      return this.handleGenerateArtifact(build, analysis)
    }
    
    // Load existing spec state with known/blockers restoration
    const existingSpec = build.final_specification || {}
    console.log('[DEBUG WORKFLOW MANAGER V2] Existing spec from database:', JSON.stringify(existingSpec, null, 2))
    const specState = createSpecState(
      existingSpec,
      (existingSpec as any)._knownFields,
      (existingSpec as any)._blockerFields
    )
    
    console.log('[DEBUG WORKFLOW MANAGER V2] Current spec state before analysis:', {
      known: Array.from(specState.known),
      blockers: Array.from(specState.blockers),
      questionContext: specState.questionContext
    })
    
    // If we have a pending question context, restore it
    if (build.questions && build.questions.length > 0) {
      const lastQuestion = build.questions[build.questions.length - 1]
      specState.questionContext = lastQuestion.context || undefined
      specState.currentQuestion = lastQuestion.question
      console.log('[DEBUG WORKFLOW MANAGER V2] Restored question context:', {
        context: specState.questionContext,
        question: specState.currentQuestion
      })
    } else {
      console.log('[DEBUG WORKFLOW MANAGER V2] No questions in build to restore context from')
    }
    
    // Analyze the continuation
    // Limit conversation history to prevent token limit issues
    const limitedHistory = request.conversationHistory?.slice(-3) || []
    console.log('[DEBUG WORKFLOW MANAGER V2] Calling IntelligenceAnalyzerV2.analyze for continuation with limited history:', {
      originalHistoryLength: request.conversationHistory?.length || 0,
      limitedHistoryLength: limitedHistory.length
    })
    const analysis = await IntelligenceAnalyzerV2.analyze({
      content: request.content,
      conversationHistory: limitedHistory,
      existingSpecState: specState
    })
    
    console.log('[DEBUG WORKFLOW MANAGER V2] Continuation analysis:', {
      situation: analysis.situation,
      nextAction: analysis.nextAction,
      knownAfter: Array.from(analysis.specState.known),
      blockersAfter: Array.from(analysis.specState.blockers)
    })
    
    // Update the specification with current known/blockers state
    const specWithState = {
      ...analysis.specState.spec,
      _knownFields: Array.from(analysis.specState.known),
      _blockerFields: Array.from(analysis.specState.blockers)
    }
    await ArtifactService.updateSpecification(build.id, specWithState, [])
    
    // Check if all blockers are resolved and transition to architecture generation
    console.log('[Workflow Manager V2] Checking for completion:', {
      blockersCount: analysis.specState.blockers.size,
      buildStatus: build.status,
      nextAction: analysis.nextAction
    })
    
    if (analysis.specState.blockers.size === 0 && build.status === 'collecting_requirements') {
      console.log('[Workflow Manager V2] Requirements complete, transitioning collecting_requirements → architecture_generation')
      await ArtifactService.updateBuildStatus(build.id, 'designing_architecture')
      
      // Force design_architecture action if blockers are clear
      if (analysis.nextAction === 'ask_question') {
        console.log('[Workflow Manager V2] Overriding nextAction from ask_question to design_architecture (no blockers remain)')
        const overriddenAnalysis = { ...analysis, nextAction: 'design_architecture' as const }
        return this.handleDesignArchitecture(build, overriddenAnalysis)
      }
    } else if (analysis.specState.blockers.size === 0 && analysis.nextAction === 'ask_question') {
      console.log('[Workflow Manager V2] Blockers clear but still asking question - forcing architecture design')
      const overriddenAnalysis = { ...analysis, nextAction: 'design_architecture' as const }
      return this.handleDesignArchitecture(build, overriddenAnalysis)
    }
    
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
    console.log('[DEBUG WORKFLOW MANAGER V2] Asking question:', analysis.question?.text)
    
    if (!analysis.question) {
      throw new Error('Question action specified but no question provided')
    }
    
    // Store the question context in the build
    await ArtifactService.addQuestion(build.id, analysis.question.text, 'missing_requirement', analysis.question.context)
    await ArtifactService.updateBuildStatus(build.id, 'collecting_requirements')
    
    // Update spec state with question context
    const specState = analysis.specState
    specState.questionContext = analysis.question.context
    specState.currentQuestion = analysis.question.text
    const specWithState = {
      ...specState.spec,
      _knownFields: Array.from(specState.known),
      _blockerFields: Array.from(specState.blockers)
    }
    await ArtifactService.updateSpecification(build.id, specWithState, [])
    
    // Message is just the explanation - the question will be rendered by the component
    const message = analysis.explanation || 'I need to gather some information to design your automation.'

    console.log('[DEBUG WORKFLOW MANAGER V2] Returning question response with message:', message)

    return {
      status: 'collecting_requirements',
      message,
      needsInput: true,
      question: analysis.question
    }
  }
  
  /**
   * Handle designing the architecture using AI-based dynamic reasoning
   */
  private static async handleDesignArchitecture(build: ArtifactBuild, analysis: AnalysisResultV2): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Designing architecture with AI-based dynamic reasoning')

    const spec = analysis.specState.spec

    // Use AI to dynamically reason about the architecture
    const logicalArchitecture = await ArchitectureDesigner.design(spec)

    console.log('[Workflow Manager V2] Architecture design result:', {
      architectureId: logicalArchitecture.id,
      complexity: logicalArchitecture.complexity,
      stageCount: logicalArchitecture.stages.length,
      hasDataFlow: !!logicalArchitecture.dataFlow
    })

    // Convert to proposal format for user
    const architectureProposal = {
      id: logicalArchitecture.id,
      description: logicalArchitecture.description,
      platform: spec.platform || 'n8n',
      platformReasoning: spec.platformReasoning || 'Selected based on requirements',
      complexity: logicalArchitecture.complexity,
      stages: logicalArchitecture.stages.map(s => ({
        id: s.id,
        name: s.name,
        purpose: s.purpose,
        category: s.category
      })),
      reasoning: logicalArchitecture.reasoning,
      assumptions: logicalArchitecture.assumptions,
      recommendations: logicalArchitecture.recommendations,
      unresolvedDecisions: logicalArchitecture.unresolvedDecisions,
      logicalArchitecture: logicalArchitecture  // Store full architecture for later use
    }

    // Store the architecture in the build for later use with state preservation
    const specWithState = {
      ...spec,
      _knownFields: Array.from(analysis.specState.known),
      _blockerFields: Array.from(analysis.specState.blockers),
      logicalArchitecture: logicalArchitecture  // Store full architecture
    }
    await ArtifactService.updateSpecification(build.id, specWithState, [])
    await ArtifactService.updateBuildStatus(build.id, 'awaiting_architecture_verification')

    // Generate human-readable description
    const description = this.generateArchitectureDescription(logicalArchitecture)

    return {
      status: 'awaiting_architecture_verification',
      message: `${description}\n\nDoes this architecture look right? If yes, I'll generate the workflow JSON file for you to import into n8n.`,
      needsInput: true,
      architectureProposal
    }
  }

  /**
   * Generate human-readable architecture description from rich logical architecture
   */
  private static generateArchitectureDescription(architecture: LogicalArchitecture): string {
    let description = `I recommend the following architecture:\n\n`
    
    description += `**Goal:** ${architecture.goal}\n\n`
    
    description += `**Stages:**\n`
    architecture.stages.forEach((stage, index) => {
      description += `${index + 1}. **${stage.name}** (${stage.category})\n`
      description += `   ${stage.purpose}\n`
      
      if (stage.inputs && stage.inputs.length > 0) {
        description += `   *Inputs: ${stage.inputs.join(', ')}\n`
      }
      if (stage.outputs && stage.outputs.length > 0) {
        description += `   *Outputs: ${stage.outputs.join(', ')}\n`
      }
      if (stage.dependencies && stage.dependencies.length > 0) {
        description += `   *Depends on: ${stage.dependencies.join(', ')}\n`
      }
      description += `\n`
    })
    
    if (architecture.dataFlow && architecture.dataFlow.connections.length > 0) {
      description += `**Data Flow:**\n`
      architecture.dataFlow.connections.forEach(conn => {
        description += `* ${conn.from} → ${conn.to}: ${conn.data.join(', ')}\n`
      })
      description += `\n`
    }
    
    description += `**Complexity:** ${architecture.complexity}\n\n`
    description += `**Reasoning:** ${architecture.reasoning}\n\n`
    
    if (architecture.assumptions.length > 0) {
      description += `**Assumptions:**\n`
      architecture.assumptions.forEach(assumption => {
        description += `- ${assumption}\n`
      })
      description += `\n`
    }
    
    if (architecture.recommendations.length > 0) {
      description += `**Recommendations:**\n`
      architecture.recommendations.forEach(rec => {
        description += `- ${rec}\n`
      })
      description += `\n`
    }
    
    if (architecture.unresolvedDecisions && architecture.unresolvedDecisions.length > 0) {
      description += `**Decisions needed:**\n`
      architecture.unresolvedDecisions.forEach(decision => {
        description += `- ${decision}\n`
      })
      description += `\n`
    }
    
    return description
  }

  /**
   * Generate build summary before generation
   */
  private static generateBuildSummary(spec: AutomationSpec, architecture: LogicalArchitecture, proposal: any): string {
    let summary = '**Build Plan**\n\n'
    
    summary += `**Platform:** ${proposal.platform}\n`
    if (proposal.platformReasoning) {
      summary += `Reason: ${proposal.platformReasoning}\n`
    }
    
    if (spec.trigger?.type) {
      summary += `**Trigger:** ${spec.trigger.type}\n`
    }
    
    if (spec.integrations?.emailProvider) {
      summary += `**Email Provider:** ${spec.integrations.emailProvider}\n`
    }
    
    if (spec.integrations?.aiProvider) {
      summary += `**AI Provider:** ${spec.integrations.aiProvider}\n`
      if (spec.integrations?.aiModel) {
        summary += `**AI Model:** ${spec.integrations.aiModel}\n`
      }
    }
    
    if (spec.integrations?.knowledgeBase) {
      summary += `**Knowledge Base:** ${spec.integrations.knowledgeBase}\n`
    }
    
    if (spec.businessRules?.routing?.length > 0) {
      summary += `**Reply Scope:** ${spec.businessRules.routing.join(', ')}\n`
    }
    
    if (spec.humanApproval?.required) {
      summary += `**Human Escalation:** Enabled\n`
    }
    
    if (spec.persistence?.enabled) {
      summary += `**Logging:** Enabled\n`
    }
    
    summary += `\n**Workflow Stages:**\n`
    architecture.stages.forEach((stage, index) => {
      summary += `${index + 1}. ${stage.name}\n`
    })
    
    // Check for potential issues
    const issues: string[] = []
    if (spec.integrations?.emailProvider) {
      issues.push(`${spec.integrations.emailProvider} credentials must be configured after import`)
    }
    if (spec.integrations?.aiProvider) {
      issues.push(`AI API credentials must be configured after import`)
    }
    if (spec.integrations?.knowledgeBase) {
      issues.push(`Knowledge base connection must be configured after import`)
    }
    
    if (issues.length > 0) {
      summary += `\n**Configuration Required:**\n`
      issues.forEach(issue => {
        summary += `- ${issue}\n`
      })
    }
    
    return summary
  }
  
  /**
   * Handle generating the artifact
   * Phase 3A: Uses approved architecture as source of truth
   */
  private static async handleGenerateArtifact(build: ArtifactBuild, analysis: AnalysisResultV2): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Generating artifact from approved architecture')

    const spec = analysis.specState.spec
    const platform = spec.platform || 'n8n'

    // Retrieve the approved architecture from the build specification
    const approvedArchitecture = (spec as any).logicalArchitecture as LogicalArchitecture
    if (!approvedArchitecture) {
      throw new Error('No approved architecture found in specification. Cannot generate artifact.')
    }

    console.log('[Workflow Manager V2] Using approved architecture:', {
      architectureId: approvedArchitecture.id,
      stageCount: approvedArchitecture.stages.length,
      complexity: approvedArchitecture.complexity
    })

    // Use AI to generate the n8n workflow JSON from the approved architecture
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()

    const architectureSummary = this.summarizeArchitectureForCompiler(approvedArchitecture)

    const prompt = 'You are an expert n8n workflow compiler. Translate the following logical architecture into n8n workflow JSON.\n\nAPPROVED ARCHITECTURE:\n' + architectureSummary + '\n\nPlatform: n8n\n\nYour task is to implement this exact architecture in n8n. Each logical stage should become an n8n node or node group. Data flow connections should become n8n node connections. Branching conditions should become n8n IF nodes. IMPORTANT SECURITY CONSTRAINTS: NEVER invent email addresses, API keys, credentials, or user-specific configuration. If a value is required but unavailable, represent it as a configurable credential or placeholder (e.g., "user@example.com" or placeholder: true). Generate a complete n8n workflow JSON with: 1. Nodes array with properly configured nodes 2. Connections object defining node connections 3. name field for the workflow 4. settings object with proper n8n settings 5. active: true 6. Valid node types (n8n-nodes-base.*). Return ONLY valid JSON. Do not include any text before or after the JSON.'

    const workflowJSON = await aiService.generateJSON(prompt)
    console.log('[Workflow Manager V2] AI-generated workflow JSON')

    const artifactContent = workflowJSON
    const fileType = 'json'
    const mimeType = 'application/json'
    const filename = this.ensureExtension(spec.filename || `${spec.automationType}-${platform}.json`, 'json')

    // Serialize content
    const serializedContent = JSON.stringify(artifactContent, null, 2)

    // Parse it back to verify it's valid
    try {
      JSON.parse(serializedContent)
    } catch (e) {
      console.error('[Workflow Manager V2] Generated content is not valid JSON:', e)
      throw new Error('Generated artifact is not valid JSON')
    }

    // Calculate specification hash for traceability
    const specHash = this.calculateSpecificationHash(spec)

    // Save the artifact with traceability metadata
    const artifact = await ArtifactService.saveArtifact(
      build.id,
      build.user_id,
      filename,
      fileType,
      mimeType,
      serializedContent,
      true,
      {
        architecture_id: approvedArchitecture.id,
        architecture_name: approvedArchitecture.name,
        specification_hash: specHash,
        platform: platform,
        generation_stage: 'compiling',
        architecture_approved: true,
        validation_passed: false, // Will be updated after validation
        repair_attempts: 0
      }
    )

    // Validate the artifact
    console.log('[Workflow Manager V2] Validating generated artifact')
    const validationResults = ArtifactValidator.validateAll(
      serializedContent,
      approvedArchitecture,
      [spec.description || spec.automationType || 'General automation']
    )

    console.log('[Workflow Manager V2] Validation results:', {
      jsonValid: validationResults.json.valid,
      structureValid: validationResults.structure.valid,
      architectureValid: validationResults.architecture.valid,
      overallValid: validationResults.overall.valid,
      errors: validationResults.overall.errors,
      warnings: validationResults.overall.warnings
    })

    // Controlled repair loop
    const MAX_REPAIR_ATTEMPTS = 3
    let repairAttempts = 0
    let repairedContent = serializedContent

    while (!validationResults.overall.valid && repairAttempts < MAX_REPAIR_ATTEMPTS) {
      repairAttempts++
      console.log(`[Workflow Manager V2] Attempting repair ${repairAttempts}/${MAX_REPAIR_ATTEMPTS}`)

      try {
        repairedContent = await this.attemptRepair(
          repairedContent,
          validationResults.overall.errors,
          approvedArchitecture,
          spec
        )

        // Re-validate
        const revalidationResults = ArtifactValidator.validateAll(
          repairedContent,
          approvedArchitecture,
          [spec.description || spec.automationType || 'General automation']
        )

        if (revalidationResults.overall.valid) {
          console.log('[Workflow Manager V2] Repair successful')
          validationResults.json = revalidationResults.json
          validationResults.structure = revalidationResults.structure
          validationResults.architecture = revalidationResults.architecture
          validationResults.overall = revalidationResults.overall
          break
        } else {
          console.log(`[Workflow Manager V2] Repair attempt ${repairAttempts} failed, retrying...`)
        }
      } catch (error) {
        console.error(`[Workflow Manager V2] Repair attempt ${repairAttempts} threw error:`, error)
      }
    }

    // Update artifact with validation results
    if (!validationResults.overall.valid) {
      console.error('[Workflow Manager V2] Artifact validation failed after repair attempts:', validationResults.overall.errors)
      throw new Error(`Artifact validation failed after ${repairAttempts} repair attempts: ${validationResults.overall.errors.join(', ')}`)
    } else {
      console.log('[Workflow Manager V2] Artifact validation passed with warnings:', validationResults.overall.warnings)
    }

    // Generate guide using AI
    const guidePrompt = 'Generate a brief implementation guide for this n8n workflow.\n\nWorkflow: ' + (spec.description || spec.automationType) + '\nPlatform: n8n\n\nProvide a simple guide with:\n1. How to import the JSON into n8n\n2. What credentials are needed (use placeholder names, not real values)\n3. How to test the workflow\n4. Any important configuration notes\n\nIMPORTANT: Do not include real email addresses, API keys, or credentials. Use placeholder names only.\n\nKeep it under 300 words.'

    const guide = await aiService.generateResponse(guidePrompt)

    // Save guide as secondary artifact
    const guideFilename = filename.replace(/\.(json|yaml|py|js)$/i, '-guide.md')
    const guideArtifact = await ArtifactService.saveArtifact(
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
      message: `I've generated the n8n workflow JSON file for you to import.\n\n${guide.substring(0, 500)}...`,
      artifacts: [
        {
          id: artifact.id,
          filename: filename,
          fileType: fileType,
          mimeType: mimeType,
          download_url: `/api/alex/artifacts/${artifact.id}/download`
        },
        {
          id: guideArtifact.id,
          filename: guideFilename,
          fileType: 'markdown',
          mimeType: 'text/markdown',
          download_url: `/api/alex/artifacts/${guideArtifact.id}/download`
        }
      ],
      specification: spec
    }
  }
  
  /**
   * Detect requested file format from user request
   */
  private static detectRequestedFormat(request: string): string {
    const lower = request.toLowerCase()
    if (lower.includes('json')) return 'json'
    if (lower.includes('yaml') || lower.includes('yml')) return 'yaml'
    if (lower.includes('python') || lower.includes('.py')) return 'python'
    if (lower.includes('javascript') || lower.includes('.js')) return 'javascript'
    return 'json' // default
  }

  /**
   * Ensure file has correct extension
   */
  private static ensureExtension(filename: string, extension: string): string {
    if (!filename.endsWith('.' + extension)) {
      return filename + '.' + extension
    }
    return filename
  }

  /**
   * Summarize approved architecture for platform compiler
   * Phase 3A: Ensures architecture is source of truth for compilation
   */
  private static summarizeArchitectureForCompiler(architecture: LogicalArchitecture): string {
    let summary = `Architecture: ${architecture.name}\n`
    summary += `Goal: ${architecture.goal}\n`
    summary += `Complexity: ${architecture.complexity}\n\n`
    
    summary += `Stages:\n`
    architecture.stages.forEach((stage, index) => {
      summary += `${index + 1}. ${stage.name} (${stage.category})\n`
      summary += `   Purpose: ${stage.purpose}\n`
      if (stage.inputs?.length > 0) summary += `   Inputs: ${stage.inputs.join(', ')}\n`
      if (stage.outputs?.length > 0) summary += `   Outputs: ${stage.outputs.join(', ')}\n`
      if (stage.dependencies?.length > 0) summary += `   Dependencies: ${stage.dependencies.join(', ')}\n`
      if (stage.conditions?.expression) summary += `   Condition: ${stage.conditions.expression}\n`
      if (stage.failureBehavior?.retryPolicy) summary += `   Retry: ${stage.failureBehavior.retryPolicy}\n`
      summary += `\n`
    })
    
    if (architecture.dataFlow?.connections?.length > 0) {
      summary += `Data Flow:\n`
      architecture.dataFlow.connections.forEach(conn => {
        summary += `  ${conn.from} → ${conn.to}: ${conn.data.join(', ')}\n`
      })
    }
    
    return summary
  }

  /**
   * Calculate specification hash for traceability
   * Phase 3A: Enables artifact-to-specification traceability
   */
  private static calculateSpecificationHash(spec: AutomationSpec): string {
    const specString = JSON.stringify(spec, Object.keys(spec).sort())
    // Simple hash function for traceability (not cryptographic)
    let hash = 0
    for (let i = 0; i < specString.length; i++) {
      const char = specString.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(16)
  }

  /**
   * Attempt to repair invalid artifact
   * Phase 3A: Controlled repair loop with AI assistance
   */
  private static async attemptRepair(
    content: string,
    errors: string[],
    architecture: LogicalArchitecture,
    spec: AutomationSpec
  ): Promise<string> {
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()

    const repairPrompt = `You are an expert n8n workflow repair specialist. Fix the following validation errors in an n8n workflow JSON.

VALIDATION ERRORS:
${errors.join('\n')}

ARCHITECTURE CONTEXT:
${this.summarizeArchitectureForCompiler(architecture)}

ORIGINAL WORKFLOW JSON:
${content}

TASK: Repair the workflow JSON to fix the validation errors while preserving the architecture and functionality. Focus on structural issues, missing required fields, and connection problems. Do not change the overall logic or purpose of the workflow.

Return ONLY the repaired JSON. Do not include any text before or after the JSON.`

    const repairedJSON = await aiService.generateResponse(repairPrompt)
    
    // Extract JSON from response
    const jsonMatch = repairedJSON.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      return jsonMatch[0]
    }

    throw new Error('Failed to extract valid JSON from repair response')
  }

  /**
   * Generate UUID for workflow
   */
  private static generateUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0
      const v = c === 'x' ? r : (r & 0x3 | 0x8)
      return v.toString(16)
    })
  }

  /**
   * Validate artifact format
   */
  private static validateArtifactFormat(content: any, filename: string, fileType: string, mimeType: string, requestedFormat: string): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!content) {
      errors.push('Artifact content is empty')
    }

    if (!filename) {
      errors.push('Filename is missing')
    }

    if (!fileType) {
      errors.push('File type is missing')
    }

    if (!mimeType) {
      errors.push('MIME type is missing')
    }

    if (requestedFormat !== fileType) {
      console.log(`[Workflow Manager V2] Format mismatch: requested ${requestedFormat}, got ${fileType}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Detect build type from spec
   */
  private static detectBuildType(spec: any): BuildType {
    return 'automation'
  }

  /**
   * Handle clarifying ambiguity
   */
  private static async handleClarifyAmbiguity(build: ArtifactBuild, analysis: AnalysisResultV2): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Clarifying ambiguity')

    return {
      status: 'collecting_requirements',
      message: analysis.explanation || 'I need to clarify something about your request.',
      needsInput: true,
      question: analysis.question
    }
  }

  /**
   * Translate logical architecture to n8n implementation
   */
  private static translateLogicalToN8n(logicalArchitecture: LogicalArchitecture, spec: any, originalRequest: string): any {
    // This is now handled by AI - kept for compatibility
    return {
      name: spec.automationType || 'n8n Workflow',
      nodes: [],
      connections: {}
    }
  }

  /**
   * Generate generic artifact for non-n8n platforms
   */
  private static generateGenericArtifact(spec: any, logicalArchitecture: LogicalArchitecture, platform: string): any {
    return {
      platform,
      automationType: spec.automationType,
      stages: logicalArchitecture.stages
    }
  }

  /**
   * Validate n8n schema
   */
  private static validateN8nSchema(workflow: any): { valid: boolean; errors: string[] } {
    const errors: string[] = []

    if (!workflow.name) {
      errors.push('Workflow name is missing')
    }

    if (!workflow.nodes || !Array.isArray(workflow.nodes)) {
      errors.push('Workflow nodes are missing or invalid')
    }

    if (!workflow.connections) {
      errors.push('Workflow connections are missing')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Repair n8n workflow
   */
  private static repairN8nWorkflow(workflow: any, errors: string[]): any {
    // Basic repair logic
    if (!workflow.name) {
      workflow.name = 'Repaired Workflow'
    }

    if (!workflow.nodes) {
      workflow.nodes = []
    }

    if (!workflow.connections) {
      workflow.connections = {}
    }

    return workflow
  }

  /**
   * Generate guide from artifact
   */
  private static generateGuide(spec: AutomationSpec, architecture: LogicalArchitecture, artifactContent: any, platform: string): string {
    let guide = '# Implementation Guide\n\n'
    guide += `## ${spec.automationType || 'Automation'}\n\n`
    guide += `Platform: ${platform}\n\n`
    guide += '### Architecture\n\n'
    architecture.stages.forEach((stage, index) => {
      guide += `${index + 1}. ${stage.name}: ${stage.purpose}\n`
    })
    guide += '\n### Configuration\n\n'
    guide += '- Import the workflow file into ' + platform + '\n'
    guide += '- Configure required credentials\n'
    guide += '- Test the workflow\n'
    return guide
  }
}
