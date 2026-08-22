/**
 * ALEX Phase 7: Artifact Workflow Manager
 * Orchestrates the build workflow state machine
 */

import { ArtifactService } from './artifact-service'
import { AIEngine } from '../ai-engine'
import { 
  ArtifactBuild, 
  BuildStatus, 
  BuildType,
  ArtifactManifest
} from './types'

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
  questions?: string[]
  artifacts?: any[]
  specification?: Record<string, any>
}

export class ArtifactWorkflowManager {
  /**
   * Process a build request through the workflow
   */
  static async processRequest(request: WorkflowRequest): Promise<WorkflowResponse> {
    console.log('[Artifact Workflow] Processing request:', request.content.substring(0, 100))

    // Check for existing active build
    const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)

    if (existingBuild) {
      return this.continueWorkflow(existingBuild, request)
    }

    // Determine build type from request
    const buildType = this.detectBuildType(request.content)

    // Create new build
    const build = await ArtifactService.createBuild(
      request.conversationId,
      request.userId,
      request.content,
      buildType
    )

    // Start requirement gathering
    return this.gatherRequirements(build, request)
  }

  /**
   * Detect build type from content
   */
  private static detectBuildType(content: string): BuildType {
    const lower = content.toLowerCase()

    if (lower.includes('chatbot') || lower.includes('bot')) return 'chatbot'
    if (lower.includes('workflow') || lower.includes('n8n') || lower.includes('automation')) return 'workflow'
    if (lower.includes('agent') || lower.includes('assistant')) return 'agent'
    if (lower.includes('configuration') || lower.includes('config') || lower.includes('json')) return 'configuration'
    if (lower.includes('website') || lower.includes('web app')) return 'website'
    if (lower.includes('api') || lower.includes('endpoint')) return 'api'
    if (lower.includes('script') || lower.includes('code')) return 'script'

    return 'project' // Default
  }

  /**
   * Continue existing workflow
   */
  private static async continueWorkflow(build: ArtifactBuild, request: WorkflowRequest): Promise<WorkflowResponse> {
    console.log('[Artifact Workflow] Continuing workflow:', build.id, 'status:', build.status)

    switch (build.status) {
      case 'collecting_requirements':
        return this.gatherRequirements(build, request)
      case 'ready_for_confirmation':
        return this.confirmSpecification(build, request)
      case 'confirmed':
        return this.generateArtifacts(build, request)
      case 'generating':
      case 'validating':
      case 'persisting':
        return { status: build.status, message: 'Build in progress, please wait...' }
      case 'completed':
        return this.getCompletedBuild(build)
      case 'failed':
        return { status: 'failed', message: build.error_message || 'Build failed' }
      default:
        return { status: 'failed', message: 'Unknown build status' }
    }
  }

  /**
   * Gather requirements phase
   */
  private static async gatherRequirements(build: ArtifactBuild, request: WorkflowRequest): Promise<WorkflowResponse> {
    console.log('[Artifact Workflow] Gathering requirements for:', build.id)

    // For simple requests, skip requirement gathering and go straight to generation
    const isSimpleRequest = build.original_request.length < 200 ||
                          build.original_request.toLowerCase().includes('create a json') ||
                          build.original_request.toLowerCase().includes('generate a json')

    if (isSimpleRequest) {
      console.log('[Artifact Workflow] Simple request detected, skipping requirement gathering')
      // Create a basic specification from the request
      const basicSpec = {
        request: build.original_request,
        build_type: build.build_type,
        user_request: request.content
      }
      await ArtifactService.updateSpecification(build.id, basicSpec, [])
      await ArtifactService.updateBuildStatus(build.id, 'confirmed')
      return this.generateArtifacts(build, request)
    }

    // Use AI to analyze requirements
    const requirementsPrompt = this.buildRequirementsPrompt(build, request)

    try {
      const aiResponse = await this.getAIResponse(requirementsPrompt, request)

      // Parse AI response to determine if more questions are needed
      const analysis = this.parseRequirementsResponse(aiResponse)

      if (analysis.complete) {
        // Requirements complete, move to confirmation
        await ArtifactService.updateSpecification(build.id, analysis.specification, [])
        await ArtifactService.updateBuildStatus(build.id, 'ready_for_confirmation')

        return {
          status: 'ready_for_confirmation',
          message: 'Requirements collected. Ready for confirmation.',
          specification: analysis.specification
        }
      } else {
        // Ask questions
        for (const question of analysis.questions) {
          await ArtifactService.addQuestion(build.id, question, 'missing_requirement')
        }

        return {
          status: 'collecting_requirements',
          message: 'I need more information to build this.',
          needsInput: true,
          questions: analysis.questions
        }
      }
    } catch (error) {
      console.error('[Artifact Workflow] Requirements gathering failed:', error)
      await ArtifactService.markBuildFailed(build.id, 'Requirements gathering failed')
      return { status: 'failed', message: 'Failed to gather requirements' }
    }
  }

  /**
   * Confirm specification phase
   */
  private static async confirmSpecification(build: ArtifactBuild, request: WorkflowRequest): Promise<WorkflowResponse> {
    console.log('[Artifact Workflow] Confirming specification for:', build.id)

    // Check if user confirmed
    const userConfirmed = request.content.toLowerCase().includes('yes') || 
                        request.content.toLowerCase().includes('proceed') ||
                        request.content.toLowerCase().includes('continue') ||
                        request.content.toLowerCase().includes('generate')

    if (userConfirmed) {
      await ArtifactService.updateBuildStatus(build.id, 'confirmed', {
        generationStartedAt: new Date().toISOString()
      })
      return this.generateArtifacts(build, request)
    }

    // User declined or asked for changes
    if (request.content.toLowerCase().includes('no') || request.content.toLowerCase().includes('change')) {
      // Update specification based on user feedback
      await ArtifactService.updateBuildStatus(build.id, 'collecting_requirements')
      return this.gatherRequirements(build, request)
    }

    // Ask for confirmation
    return {
      status: 'ready_for_confirmation',
      message: this.buildConfirmationMessage(build),
      needsInput: true,
      specification: build.final_specification
    }
  }

  /**
   * Generate artifacts phase
   */
  private static async generateArtifacts(build: ArtifactBuild, request: WorkflowRequest): Promise<WorkflowResponse> {
    console.log('[Artifact Workflow] Generating artifacts for:', build.id)

    await ArtifactService.updateBuildStatus(build.id, 'generating')

    try {
      // Use AI to generate artifacts
      const generationPrompt = this.buildGenerationPrompt(build, request)
      const aiResponse = await this.getAIResponse(generationPrompt, request)

      console.log('[Artifact Workflow] AI response received, length:', aiResponse.length)
      console.log('[Artifact Workflow] AI response preview:', aiResponse.substring(0, 500))

      // Parse and validate artifacts
      const manifest = this.parseArtifactManifest(aiResponse, build.build_type)

      if (!manifest || manifest.files.length === 0) {
        console.error('[Artifact Workflow] Parsing failed or no files in manifest')
        throw new Error('No artifacts generated from AI response')
      }

      console.log('[Artifact Workflow] Manifest parsed successfully, files:', manifest.files.length)

      // Save artifacts
      const savedArtifacts = []
      for (const file of manifest.files) {
        console.log('[Artifact Workflow] Saving artifact:', file.filename, 'type:', file.file_type)
        const artifact = await ArtifactService.saveArtifact(
          build.id,
          request.userId,
          file.filename,
          file.file_type,
          file.mime_type,
          file.content,
          file.is_primary || false
        )

        console.log('[Artifact Workflow] Artifact saved, ID:', artifact.id)

        // Validate artifact
        const validation = await ArtifactService.validateArtifact(
          artifact.id,
          file.content,
          file.file_type
        )

        if (!validation.valid) {
          console.error('[Artifact Workflow] Artifact validation failed:', validation.errors)
          throw new Error(`Artifact validation failed: ${validation.errors.join(', ')}`)
        }

        savedArtifacts.push(artifact)
      }

      await ArtifactService.updateBuildStatus(build.id, 'completed', {
        generationCompletedAt: new Date().toISOString(),
        filesGenerated: savedArtifacts.length
      })

      console.log('[Artifact Workflow] Generation completed successfully, artifacts:', savedArtifacts.length)

      return {
        status: 'completed',
        message: this.buildCompletionMessage(savedArtifacts),
        artifacts: savedArtifacts
      }
    } catch (error) {
      console.error('[Artifact Workflow] Artifact generation failed:', error)
      await ArtifactService.markBuildFailed(build.id, (error as Error).message)
      return { status: 'failed', message: `Artifact generation failed: ${(error as Error).message}` }
    }
  }

  /**
   * Get completed build
   */
  private static async getCompletedBuild(build: ArtifactBuild): Promise<WorkflowResponse> {
    const artifacts = await ArtifactService.getBuildArtifacts(build.id)

    return {
      status: 'completed',
      message: this.buildCompletionMessage(artifacts),
      artifacts
    }
  }

  /**
   * Build requirements prompt for AI
   */
  private static buildRequirementsPrompt(build: ArtifactBuild, request: WorkflowRequest): string {
    return `You are ALEX, an artifact generation assistant. The user wants to build: ${build.original_request}

Build type: ${build.build_type}

Attached files: ${request.attachedFiles?.map(f => f.original_filename).join(', ') || 'None'}

Your task:
1. Analyze what the user wants to build
2. Check attached files for relevant information
3. Identify critical missing requirements
4. Ask ONLY necessary questions (3-5 max if truly needed)
5. If requirements are complete, say "REQUIREMENTS_COMPLETE" and provide the final specification

IMPORTANT: Respond ONLY in the exact format below. Do not add any other text, explanations, or conversational filler.

If questions needed:
QUESTION: [question 1]
QUESTION: [question 2]

If complete:
REQUIREMENTS_COMPLETE
SPECIFICATION: {"key": "value"}
`
  }

  /**
   * Build generation prompt for AI
   */
  private static buildGenerationPrompt(build: ArtifactBuild, request: WorkflowRequest): string {
    return `You are ALEX, an artifact generation assistant. Generate the requested artifacts.

Build type: ${build.build_type}
Specification: ${JSON.stringify(build.final_specification, null, 2)}

Your task:
1. Generate the required files based on the specification
2. Ensure files are internally consistent
3. Use placeholders for secrets (e.g., YOUR_API_KEY_HERE)
4. Generate usage guides where appropriate

IMPORTANT: Respond ONLY in one of these two formats (JSON is preferred):

OPTION 1 - JSON Format (preferred):
[
  {
    "FILENAME": "filename.ext",
    "FILE_TYPE": "json",
    "MIME_TYPE": "application/json",
    "CONTENT": "{...}",
    "IS_PRIMARY": true
  }
]

OPTION 2 - Text Format:
FILENAME: [filename]
FILE_TYPE: [file_type]
MIME_TYPE: [mime_type]
CONTENT: [file content - may span multiple lines]
IS_PRIMARY: [true/false]

Do not add any other text, explanations, or conversational filler.
`
  }

  /**
   * Parse requirements response from AI
   */
  private static parseRequirementsResponse(response: string): {
    complete: boolean
    questions: string[]
    specification: Record<string, any>
  } {
    const lines = response.split('\n')
    const questions: string[] = []
    let specification: Record<string, any> = {}
    let complete = false

    for (const line of lines) {
      if (line.startsWith('REQUIREMENTS_COMPLETE')) {
        complete = true
      } else if (line.startsWith('QUESTION:')) {
        questions.push(line.substring('QUESTION:'.length).trim())
      } else if (line.startsWith('SPECIFICATION:')) {
        try {
          specification = JSON.parse(line.substring('SPECIFICATION:'.length).trim())
        } catch (e) {
          console.error('[Artifact Workflow] Failed to parse specification:', e)
        }
      }
    }

    return { complete, questions, specification }
  }

  /**
   * Parse artifact manifest from AI response
   */
  private static parseArtifactManifest(response: string, buildType: BuildType): ArtifactManifest | null {
    const trimmed = response.trim()

    // Try JSON format first
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        // Handle case where AI returns comma-separated objects without outer brackets
        let jsonToParse = trimmed
        if (trimmed.startsWith('{') && !trimmed.startsWith('[')) {
          // Try to wrap in brackets if it looks like multiple objects
          if (trimmed.match(/},\s*{/)) {
            jsonToParse = `[${trimmed}]`
          }
        }

        const parsed = JSON.parse(jsonToParse)
        // Handle array of files
        const filesArray = Array.isArray(parsed) ? parsed : [parsed]

        const files = filesArray.map((file: any) => ({
          filename: file.FILENAME || file.filename || 'unnamed.txt',
          file_type: file.FILE_TYPE || file.file_type || 'txt',
          mime_type: file.MIME_TYPE || file.mime_type || 'text/plain',
          content: file.CONTENT || file.content || '',
          is_primary: file.IS_PRIMARY === true || file.is_primary === true
        }))

        if (files.length > 0) {
          console.log('[Artifact Workflow] Successfully parsed JSON format with', files.length, 'files')
          return {
            build_type: buildType,
            specification: {},
            files
          }
        }
      } catch (e) {
        console.log('[Artifact Workflow] JSON parsing failed, trying text format:', e)
      }
    }

    // Fall back to text format
    const lines = response.split('\n')
    const files: any[] = []
    let currentFile: any = null

    for (const line of lines) {
      if (line.startsWith('FILENAME:')) {
        if (currentFile) {
          // Ensure all required fields have defaults before pushing
          currentFile.is_primary = currentFile.is_primary || false
          currentFile.file_type = currentFile.file_type || 'txt'
          currentFile.mime_type = currentFile.mime_type || 'text/plain'
          files.push(currentFile)
        }
        currentFile = {
          filename: line.substring('FILENAME:'.length).trim(),
          file_type: '',
          mime_type: '',
          content: '',
          is_primary: false
        }
      } else if (line.startsWith('FILE_TYPE:') && currentFile) {
        currentFile.file_type = line.substring('FILE_TYPE:'.length).trim()
      } else if (line.startsWith('MIME_TYPE:') && currentFile) {
        currentFile.mime_type = line.substring('MIME_TYPE:'.length).trim()
      } else if (line.startsWith('IS_PRIMARY:') && currentFile) {
        currentFile.is_primary = line.substring('IS_PRIMARY:'.length).trim() === 'true'
      } else if (line.startsWith('CONTENT:') && currentFile) {
        currentFile.content = line.substring('CONTENT:'.length).trim()
      } else if (currentFile && !line.startsWith('FILENAME:') && !line.startsWith('FILE_TYPE:') && !line.startsWith('MIME_TYPE:') && !line.startsWith('IS_PRIMARY:') && !line.startsWith('CONTENT:')) {
        // Multi-line content
        currentFile.content += '\n' + line.trim()
      }
    }

    if (currentFile) {
      // Ensure all required fields have defaults for the last file
      currentFile.is_primary = currentFile.is_primary || false
      currentFile.file_type = currentFile.file_type || 'txt'
      currentFile.mime_type = currentFile.mime_type || 'text/plain'
      files.push(currentFile)
    }

    if (files.length === 0) {
      console.log('[Artifact Workflow] No files parsed from response')
      return null
    }

    console.log('[Artifact Workflow] Successfully parsed text format with', files.length, 'files')
    return {
      build_type: buildType,
      specification: {},
      files
    }
  }

  /**
   * Build confirmation message
   */
  private static buildConfirmationMessage(build: ArtifactBuild): string {
    const spec = build.final_specification || {}
    return `I'm ready to build this ${build.build_type}.

Here's what I'll create:
${Object.entries(spec).map(([key, value]) => `- ${key}: ${value}`).join('\n')}

Shall I proceed? (yes/no)`
  }

  /**
   * Build completion message
   */
  private static buildCompletionMessage(artifacts: any[]): string {
    const fileList = artifacts.map(a => `- ${a.filename} (${a.file_type})`).join('\n')
    return `Done! I've generated ${artifacts.length} file(s):\n\n${fileList}\n\nThe files have been validated and are ready for download.`
  }

  /**
   * Get AI response using existing AI engine
   */
  private static async getAIResponse(prompt: string, request: WorkflowRequest): Promise<string> {
    const { AIEngine } = await import('../ai-engine')

    const response = await AIEngine.streamChat({
      content: prompt,
      mode: 'agent_builder',
      conversationHistory: [
        { role: 'system', content: 'You are a JSON and structured data generator. Always respond in the exact format requested. Never add conversational filler, explanations, or extra text outside the specified format.' },
        ...(request.conversationHistory || [])
      ],
      userId: request.userId,
      attachedFiles: request.attachedFiles || [],
      conversationId: request.conversationId,
      enableRetrieval: false,
      enableWebResearch: false,
      enableMemory: false,
      enableTools: false,
      enableAgent: false
    })

    // Collect the stream response
    let fullResponse = ''
    for await (const chunk of response) {
      if (chunk.type === 'stream' && chunk.data.type === 'delta') {
        fullResponse += chunk.data.data?.content || ''
      }
    }

    console.log('[Artifact Workflow] AI Response length:', fullResponse.length)
    console.log('[Artifact Workflow] AI Response preview:', fullResponse.substring(0, 500))

    return fullResponse
  }
}
