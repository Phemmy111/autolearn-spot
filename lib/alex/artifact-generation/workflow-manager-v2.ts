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
    console.log('[DEBUG WORKFLOW MANAGER V2] ===== PROCESS REQUEST START =====')
    console.log('[DEBUG WORKFLOW MANAGER V2] Request details:', {
      conversationId: request.conversationId,
      userId: request.userId,
      content: request.content.substring(0, 100),
      hasAttachedFiles: !!request.attachedFiles,
      attachedFilesCount: request.attachedFiles?.length || 0
    })
    
    // Check for existing active build
    const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)
    console.log('[DEBUG WORKFLOW MANAGER V2] Existing build check:', {
      found: !!existingBuild,
      buildId: existingBuild?.id,
      status: existingBuild?.status
    })
    
    if (existingBuild) {
      return this.continueWorkflow(existingBuild, request)
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
    console.log('[Workflow Manager V2] Designing architecture with AI-based reasoning')

    const spec = analysis.specState.spec

    // Use AI to dynamically reason about the architecture
    const architectureProposal = await this.generateArchitectureWithAI(spec)

    console.log('[Workflow Manager V2] Architecture design result:', {
      platform: architectureProposal.platform,
      complexity: architectureProposal.complexity,
      stageCount: architectureProposal.stages.length
    })

    // Store the architecture in the build for later use with state preservation
    const specWithState = {
      ...spec,
      _knownFields: Array.from(analysis.specState.known),
      _blockerFields: Array.from(analysis.specState.blockers)
    }
    await ArtifactService.updateSpecification(build.id, specWithState, [])
    await ArtifactService.updateBuildStatus(build.id, 'awaiting_architecture_verification')

    return {
      status: 'awaiting_architecture_verification',
      message: `I recommend the following architecture:\n\n${architectureProposal.description}\n\nDoes this architecture match what you want? If yes, I'll generate the workflow JSON file for you to import into n8n.`,
      needsInput: true,
      architectureProposal
    }
  }

  /**
   * Generate architecture using AI-based dynamic reasoning
   */
  private static async generateArchitectureWithAI(spec: any): Promise<any> {
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()

    const prompt = `You are an expert automation architect. Design a logical architecture for the following automation request.

Request: ${spec.description || spec.automationType || 'General automation'}
Automation Type: ${spec.automationType || 'automation'}
Domain: ${spec.domain || 'custom'}
Platform: ${spec.platform || 'n8n'}

Key Requirements:
${spec.aiConfig?.enabled ? '- AI processing is enabled' : '- No AI processing'}
${spec.integrations?.emailProvider ? `- Email provider: ${spec.integrations.emailProvider}` : ''}
${spec.integrations?.aiProvider ? `- AI provider: ${spec.integrations.aiProvider}` : ''}
${spec.humanApproval?.required ? '- Human approval/escalation is required' : ''}
${spec.schedule?.enabled ? '- Scheduled/triggered automation' : ''}
${spec.persistence?.enabled ? '- Logging and persistence is enabled' : ''}

Design the architecture by:
1. Identify the core stages needed for this automation
2. Ensure stages are contextually relevant to the specific use case
3. Name stages descriptively (e.g., "Email Trigger" not just "Trigger")
4. Define the purpose of each stage
5. Determine complexity based on stage count and dependencies
6. List assumptions about the environment
7. Provide implementation recommendations

Return ONLY JSON in this exact format:
{
  "platform": "n8n",
  "platformReasoning": "brief explanation of platform choice",
  "complexity": "simple|moderate|complex",
  "stages": [
    {
      "name": "descriptive stage name",
      "purpose": "what this stage does"
    }
  ],
  "assumptions": ["assumption 1", "assumption 2"],
  "recommendations": ["recommendation 1", "recommendation 2"],
  "description": "numbered list of stages with descriptions"
}

Be specific and context-aware. Do not use generic templates.`

    console.log('[Workflow Manager V2] Calling WorkflowAIService for architecture generation with prompt length:', prompt.length)

    const fullResponse = await aiService.generateResponse(prompt)
    console.log('[Workflow Manager V2] AI architecture response received:', fullResponse.substring(0, 200))

    // Parse the AI response to extract JSON
    const jsonMatch = fullResponse.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      const architecture = JSON.parse(jsonMatch[0])
      console.log('[Workflow Manager V2] Successfully parsed AI architecture:', {
        stageCount: architecture.stages?.length,
        complexity: architecture.complexity
      })
      return architecture
    }

    // If JSON parsing fails, try to extract stages from text
    console.log('[Workflow Manager V2] JSON parsing failed, attempting text extraction')
    const lines = fullResponse.split('\n').filter(line => line.trim())
    const stages = lines
      .filter(line => line.match(/^\d+\./) || line.match(/^- /))
      .map(line => {
        const name = line.replace(/^\d+\.\s*/, '').replace(/^- /, '').split(':')[0].trim()
        const purpose = line.includes(':') ? line.split(':')[1].trim() : 'Process data'
        return { name, purpose }
      })
      .filter(s => s.name.length > 0)

    if (stages.length > 0) {
      console.log('[Workflow Manager V2] Extracted stages from text:', stages.length)
      return {
        platform: spec.platform || 'n8n',
        platformReasoning: 'Selected based on requirements',
        complexity: stages.length > 5 ? 'complex' : stages.length > 3 ? 'moderate' : 'simple',
        stages,
        assumptions: ['AI-generated architecture from text'],
        recommendations: ['Test thoroughly before deployment'],
        description: stages.map((s, i) => `${i + 1}. ${s.name}\n   ${s.purpose}`).join('\n')
      }
    }

    throw new Error('Failed to extract architecture from AI response')
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
   */
  private static async handleGenerateArtifact(build: ArtifactBuild, analysis: AnalysisResultV2): Promise<WorkflowResponse> {
    console.log('[Workflow Manager V2] Generating artifact with AI')

    const spec = analysis.specState.spec
    const platform = spec.platform || 'n8n'

    // Use AI to generate the n8n workflow JSON directly
    const { WorkflowAIService } = await import('./workflow-ai-service')
    const aiService = WorkflowAIService.getInstance()

    const prompt = 'You are an expert n8n workflow architect. Generate a complete n8n workflow JSON for the following automation. Request: ' + (spec.description || spec.automationType || 'General automation') + '. Automation Type: ' + (spec.automationType || 'automation') + '. Domain: ' + (spec.domain || 'custom') + '. Platform: n8n. Key Requirements: ' + (spec.aiConfig?.enabled ? '- AI processing is enabled (use OpenAI node)' : '- No AI processing') + ' ' + (spec.integrations?.emailProvider ? '- Email provider: ' + spec.integrations.emailProvider + ' (use Email node)' : '') + ' ' + (spec.integrations?.aiProvider ? '- AI provider: ' + spec.integrations.aiProvider + ' (use OpenAI node)' : '') + ' ' + (spec.trigger?.type ? '- Trigger type: ' + spec.trigger.type : '- Default to Webhook trigger') + '. Generate a complete n8n workflow JSON with: 1. Nodes array with properly configured nodes 2. Connections object defining node connections 3. name field for the workflow 4. settings object with proper n8n settings 5. active: true 6. Valid node types (n8n-nodes-base.*). Return ONLY valid JSON. Do not include any text before or after the JSON.'

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

    // Save the artifact
    const artifact = await ArtifactService.saveArtifact(
      build.id,
      build.user_id,
      filename,
      fileType,
      mimeType,
      serializedContent,
      true
    )

    // Generate guide using AI
    const guidePrompt = 'Generate a brief implementation guide for this n8n workflow.\n\nWorkflow: ' + (spec.description || spec.automationType) + '\nPlatform: n8n\n\nProvide a simple guide with:\n1. How to import the JSON into n8n\n2. What credentials are needed\n3. How to test the workflow\n4. Any important configuration notes\n\nKeep it under 300 words.'

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
