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

    const prompt = `You are an expert n8n workflow architect. Generate a complete n8n workflow JSON for the following automation.

Request: ${spec.description || spec.automationType || 'General automation'}
Automation Type: ${spec.automationType || 'automation'}
Domain: ${spec.domain || 'custom'}
Platform: n8n

Key Requirements:
${spec.aiConfig?.enabled ? '- AI processing is enabled (use OpenAI node)' : '- No AI processing'}
${spec.integrations?.emailProvider ? `- Email provider: ${spec.integrations.emailProvider} (use Email node)' : ''}
${spec.integrations?.aiProvider ? `- AI provider: ${spec.integrations.aiProvider} (use OpenAI node)' : ''}
${spec.trigger?.type ? `- Trigger type: ${spec.trigger.type}` : '- Default to Webhook trigger'}

Generate a complete n8n workflow JSON with:
1. Nodes array with properly configured nodes
2. Connections object defining node connections
3. name field for the workflow
4. settings object with proper n8n settings
5. active: true
6. Valid node types (n8n-nodes-base.*)

Return ONLY valid JSON. Do not include any text before or after the JSON.`

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
    const guidePrompt = `Generate a brief implementation guide for this n8n workflow.

Workflow: ${spec.description || spec.automationType}
Platform: n8n

Provide a simple guide with:
1. How to import the JSON into n8n
2. What credentials are needed
3. How to test the workflow
4. Any important configuration notes

Keep it under 300 words.`

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
    
    if (lower.includes('json file') || lower.includes('.json')) return 'json'
    if (lower.includes('yaml') || lower.includes('.yaml')) return 'yaml'
    if (lower.includes('python') || lower.includes('.py')) return 'python'
    if (lower.includes('javascript') || lower.includes('.js')) return 'javascript'
    if (lower.includes('markdown') || lower.includes('.md')) return 'markdown'
    
    // Default to JSON for automation workflows
    return 'json'
  }
  
  /**
   * Ensure filename has the correct extension
   */
  private static ensureExtension(filename: string, extension: string): string {
    const base = filename.replace(/\.(json|yaml|py|js|md|txt)$/i, '')
    return `${base}.${extension}`
  }
  
  /**
   * Validate artifact format matches requirements
   */
  private static validateArtifactFormat(
    content: any,
    filename: string,
    fileType: string,
    mimeType: string,
    requestedFormat: string
  ): { valid: boolean; errors: string[] } {
    const errors: string[] = []
    
    // Check filename extension matches file type
    const expectedExtensions: Record<string, string> = {
      'json': 'json',
      'yaml': 'yaml',
      'py': 'py',
      'js': 'js',
      'markdown': 'md'
    }
    
    const expectedExt = expectedExtensions[fileType] || 'json'
    if (!filename.endsWith(`.${expectedExt}`)) {
      errors.push(`Filename ${filename} does not match file type ${fileType} (expected .${expectedExt})`)
    }
    
    // Check MIME type matches file type
    const expectedMimeTypes: Record<string, string> = {
      'json': 'application/json',
      'yaml': 'application/x-yaml',
      'py': 'text/x-python',
      'js': 'application/javascript',
      'markdown': 'text/markdown'
    }
    
    const expectedMime = expectedMimeTypes[fileType]
    if (mimeType !== expectedMime) {
      errors.push(`MIME type ${mimeType} does not match file type ${fileType} (expected ${expectedMime})`)
    }
    
    // Check requested format matches actual format
    if (requestedFormat === 'json' && fileType !== 'json') {
      errors.push(`User requested JSON but generated ${fileType}`)
    }
    
    // For JSON, verify content is actually JSON
    if (fileType === 'json') {
      try {
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content)
        JSON.parse(contentStr)
      } catch (e) {
        errors.push('Content is not valid JSON')
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
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
    console.log('[Workflow Manager V2] Attempting to repair workflow:', errors)
    
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
        
        // Ensure parameters is an object
        if (!node.parameters || typeof node.parameters !== 'object') {
          node.parameters = {}
        }
        
        // Fix "f[m] is not iterable" - ensure array fields are arrays
        if (node.parameters.conditions) {
          if (node.parameters.conditions.string && !Array.isArray(node.parameters.conditions.string)) {
            node.parameters.conditions.string = [node.parameters.conditions.string]
          }
          if (node.parameters.conditions.boolean && !Array.isArray(node.parameters.conditions.boolean)) {
            node.parameters.conditions.boolean = [node.parameters.conditions.boolean]
          }
          if (node.parameters.conditions.number && !Array.isArray(node.parameters.conditions.number)) {
            node.parameters.conditions.number = [node.parameters.conditions.number]
          }
        }
        
        // Fix bodyParameters - ensure parameters array exists
        if (node.parameters.bodyParameters && !node.parameters.bodyParameters.parameters) {
          node.parameters.bodyParameters.parameters = []
        }
      })
    }
    
    // Fix connections - ensure all connection arrays exist
    if (workflow.connections) {
      Object.keys(workflow.connections).forEach(sourceId => {
        const sourceConnections = workflow.connections[sourceId]
        if (!sourceConnections.main) {
          sourceConnections.main = []
        }
        if (!Array.isArray(sourceConnections.main)) {
          sourceConnections.main = []
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
   * Translate logical architecture to n8n-specific implementation
   */
  private static translateLogicalToN8n(
    logicalArchitecture: LogicalArchitecture,
    spec: AutomationSpec,
    originalRequest: string
  ): { name: string; nodes: any[]; connections: any } {
    console.log('[Workflow Manager V2] Translating logical architecture to n8n')
    
    const nodes: any[] = []
    const connections: any = {}
    let nodeIndex = 0
    const nodeMap = new Map<string, string>() // stage ID -> node ID
    
    // Build n8n nodes from logical stages
    logicalArchitecture.stages.forEach((stage, index) => {
      const nodeId = this.generateUUID()
      nodeMap.set(stage.id, nodeId)
      
      const node = this.createN8nNodeFromStage(stage, nodeId, nodeIndex, spec)
      nodes.push(node)
      nodeIndex++
    })
    
    // Build connections based on stage dependencies
    // Connect FROM dependencies TO the stage
    logicalArchitecture.stages.forEach(stage => {
      stage.dependencies.forEach(depId => {
        const sourceNodeId = nodeMap.get(depId)
        const targetNodeId = nodeMap.get(stage.id)
        
        if (sourceNodeId && targetNodeId) {
          if (!connections[sourceNodeId]) {
            connections[sourceNodeId] = { main: [] }
          }
          connections[sourceNodeId].main.push({
            node: targetNodeId,
            type: 'main',
            index: 0
          })
        }
      })
    })
    
    return {
      name: logicalArchitecture.name,
      nodes,
      connections
    }
  }
  
  /**
   * Create n8n node from logical stage
   */
  private static createN8nNodeFromStage(
    stage: LogicalStage,
    nodeId: string,
    index: number,
    spec: AutomationSpec
  ): any {
    const position: [number, number] = [index * 200, 100]
    
    // Map logical stages to n8n node types
    const nodeTypeMap: Record<string, { type: string; typeVersion: number; parameters: any }> = {
      'trigger': {
        type: this.getN8nTriggerType(spec.trigger?.type || 'manual'),
        typeVersion: 1,
        parameters: this.getN8nTriggerParameters(spec)
      },
      'normalize': {
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        parameters: {
          functionCode: `// Normalize email data\nreturn {\n  sender: $json.from,\n  subject: $json.subject,\n  body: $json.text || $json.html,\n  threadId: $json.threadId || $json.id,\n  hasAttachments: $json.attachments && $json.attachments.length > 0\n}`
        }
      },
      'deduplicate': {
        type: 'n8n-nodes-base.if',
        typeVersion: 1,
        parameters: {
          conditions: {
            string: [
              {
                value1: '={{ $json.threadId }}',
                operation: 'isEmpty'
              }
            ]
          }
        }
      },
      'classify': {
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        parameters: {
          url: '={{ $credentials.openaiApi.url }}/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          bodyParameters: {
            parameters: [
              {
                name: 'model',
                value: '={{ $json.model || "gpt-4" }}'
              },
              {
                name: 'messages',
                value: '={{ JSON.stringify([{role: "system", content: "Classify this email as: urgent, support, sales, or other"}, {role: "user", content: $json.body}]) }}'
              }
            ]
          }
        }
      },
      'assemble-context': {
        type: 'n8n-nodes-base.merge',
        typeVersion: 2,
        parameters: {
          mode: 'combine',
          combineOperation: 'merge'
        }
      },
      'ai-process': {
        type: 'n8n-nodes-base.httpRequest',
        typeVersion: 1,
        parameters: {
          url: '={{ $credentials.openaiApi.url }}/v1/chat/completions',
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          bodyParameters: {
            parameters: [
              {
                name: 'model',
                value: '={{ $credentials.openaiApi.model || "gpt-4" }}'
              },
              {
                name: 'messages',
                value: '={{ JSON.stringify([{role: "system", content: "Generate a helpful response"}, {role: "user", content: $json.body}]) }}'
              }
            ]
          }
        }
      },
      'confidence-check': {
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        parameters: {
          functionCode: `// Check confidence\nconst confidence = $json.confidence || 0.5;\nreturn {\n  ...$json,\n  isConfident: confidence >= 0.7,\n  confidence\n}`
        }
      },
      'branch': {
        type: 'n8n-nodes-base.if',
        typeVersion: 1,
        parameters: {
          conditions: {
            boolean: [
              {
                value1: '={{ $json.isConfident }}',
                value2: true
              }
            ]
          }
        }
      },
      'auto-reply': {
        type: this.getN8nEmailNodeType(spec.integrations?.emailProvider || 'gmail'),
        typeVersion: 1,
        parameters: this.getN8nEmailParameters(spec.integrations?.emailProvider || 'gmail')
      },
      'escalate': {
        type: 'n8n-nodes-base.slack',
        typeVersion: 1,
        parameters: {
          channel: '={{ $escalationChannel || "#support-escalation" }}',
          text: '={{ $json.body }}'
        }
      },
      'log': {
        type: 'n8n-nodes-base.function',
        typeVersion: 1,
        parameters: {
          functionCode: `// Log interaction\nconsole.log('Interaction logged:', $json);\nreturn $json;`
        }
      },
      'error-handler': {
        type: 'n8n-nodes-base.errorTrigger',
        typeVersion: 1,
        parameters: {}
      }
    }
    
    const nodeConfig = nodeTypeMap[stage.id] || {
      type: 'n8n-nodes-base.function',
      typeVersion: 1,
      parameters: {
        functionCode: `// ${stage.purpose}\nreturn $json;`
      }
    }
    
    return {
      id: nodeId,
      name: stage.name,
      type: nodeConfig.type,
      typeVersion: nodeConfig.typeVersion,
      position,
      parameters: nodeConfig.parameters
    }
  }
  
  /**
   * Get n8n trigger type based on trigger specification
   */
  private static getN8nTriggerType(triggerType: string): string {
    switch (triggerType) {
      case 'email':
        return 'n8n-nodes-base.gmailTrigger'
      case 'webhook':
        return 'n8n-nodes-base.webhook'
      case 'schedule':
        return 'n8n-nodes-base.scheduleTrigger'
      default:
        return 'n8n-nodes-base.manualTrigger'
    }
  }
  
  /**
   * Get n8n trigger parameters
   */
  private static getN8nTriggerParameters(spec: AutomationSpec): any {
    const triggerType = spec.trigger?.type || 'manual'
    
    switch (triggerType) {
      case 'email':
        return {
          event: 'messageReceived',
          filters: {
            from: '={{ $json.from }}'
          }
        }
      case 'webhook':
        return {
          httpMethod: 'POST',
          path: 'webhook'
        }
      case 'schedule':
        return {
          rule: {
            interval: [{ field: 'hours', hoursInterval: 1 }]
          }
        }
      default:
        return {}
    }
  }
  
  /**
   * Get n8n email node type
   */
  private static getN8nEmailNodeType(emailProvider: string): string {
    switch (emailProvider.toLowerCase()) {
      case 'gmail':
        return 'n8n-nodes-base.gmail'
      case 'outlook':
        return 'n8n-nodes-base.microsoftOutlook'
      default:
        return 'n8n-nodes-base.emailSend'
    }
  }
  
  /**
   * Get n8n email parameters
   */
  private static getN8nEmailParameters(emailProvider: string): any {
    return {
      to: '={{ $json.sender }}',
      subject: '={{ $json.subject }}',
      body: '={{ $json.body }}',
      attachments: '={{ $json.attachments }}'
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
