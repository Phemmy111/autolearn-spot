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
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    throw new Error('Missing Supabase environment variables for workflow manager')
  }
  return createClient(supabaseUrl, supabaseServiceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}

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

    // Check for retry command on failed builds
    if (build.status === 'failed' && 
        (request.content.toLowerCase().includes('try again') || 
         request.content.toLowerCase().includes('retry') ||
         request.content.toLowerCase().includes('regenerate'))) {
      console.log('[Artifact Workflow] Retry requested for failed build')
      // Reset build status and retry generation
      await ArtifactService.updateBuildStatus(build.id, 'confirmed', {
        generationStartedAt: new Date().toISOString(),
        retryCount: (build.generation_metadata?.retryCount || 0) + 1
      })
      return this.generateArtifacts(build, request)
    }

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
        return { 
          status: 'failed', 
          message: build.error_message || 'Build failed. Type "try again" to retry generation.',
          needsInput: true
        }
      default:
        return { status: 'failed', message: 'Unknown build status' }
    }
  }

  /**
   * Gather requirements phase
   */
  private static async gatherRequirements(build: ArtifactBuild, request: WorkflowRequest): Promise<WorkflowResponse> {
    console.log('[Artifact Workflow] Gathering requirements for:', build.id)

    // Check if user is providing a direct answer (simple response without AI analysis)
    const isDirectAnswer = request.content.length < 100 && 
                           (request.content.includes('.') || request.content.includes('json') || request.content.length < 20)

    if (isDirectAnswer) {
      console.log('[Artifact Workflow] Direct answer detected, processing user input')
      
      // Check if the answer looks like a filename (contains .json or other extension)
      const looksLikeFilename = request.content.includes('.') && 
                                request.content.length > 5 && 
                                request.content.length < 100
      
      if (looksLikeFilename) {
        // Valid filename provided
        const currentSpec = build.final_specification || {}
        const updatedSpec = {
          ...currentSpec,
          filename: request.content,
          user_provided_filename: true
        }
        
        await ArtifactService.updateSpecification(build.id, updatedSpec, [])
        await ArtifactService.updateBuildStatus(build.id, 'ready_for_confirmation')
        
        return this.confirmSpecification(build, request)
      } else {
        // Not a valid filename, ask again
        return {
          status: 'collecting_requirements',
          message: `That doesn't look like a valid filename. Please provide a filename with an extension (e.g., supportbot.json).`,
          needsInput: true,
          questions: ['Please provide a valid filename with extension (e.g., supportbot.json)']
        }
      }
    }

    // For simple JSON/configuration requests, just ask for filename and proceed
    if (build.build_type === 'configuration' || build.build_type === 'chatbot') {
      console.log('[Artifact Workflow] Simple request detected, asking for filename only')
      
      await ArtifactService.addQuestion(build.id, 'What filename would you like for the downloadable file (including .json extension)?', 'missing_requirement')
      await ArtifactService.updateBuildStatus(build.id, 'collecting_requirements')
      
      return {
        status: 'collecting_requirements',
        message: `I'll create a ${build.build_type} configuration for you. What filename would you like for the downloadable file (including .json extension)?`,
        needsInput: true,
        questions: ['What filename would you like for the downloadable file (including .json extension)?']
      }
    }

    // Use AI to determine if we need more information for complex requests
    const requirementsPrompt = this.buildRequirementsPrompt(build, request)
    
    try {
      const aiResponse = await this.getAIResponse(requirementsPrompt, request)
      const { complete, questions, specification } = this.parseRequirementsResponse(aiResponse)

      console.log('[Artifact Workflow] Requirements analysis:', { complete, questionCount: questions.length })

      if (complete && specification) {
        // Requirements are complete, move to confirmation
        await ArtifactService.updateSpecification(build.id, specification, [])
        await ArtifactService.updateBuildStatus(build.id, 'ready_for_confirmation')
        return this.confirmSpecification(build, request)
      }

      if (questions.length > 0) {
        // Ask the user questions
        for (const question of questions) {
          await ArtifactService.addQuestion(build.id, question, 'missing_requirement')
        }
        
        await ArtifactService.updateBuildStatus(build.id, 'collecting_requirements')
        
        return {
          status: 'collecting_requirements',
          message: `I need some more information to build this ${build.build_type}:\n\n${questions.map((q, i) => `${i + 1}. ${q}`).join('\n')}`,
          needsInput: true,
          questions
        }
      }

      // If no questions and not complete, proceed with basic spec
      const basicSpec = {
        request: build.original_request,
        build_type: build.build_type,
        user_request: request.content
      }
      await ArtifactService.updateSpecification(build.id, basicSpec, [])
      await ArtifactService.updateBuildStatus(build.id, 'ready_for_confirmation')
      return this.confirmSpecification(build, request)
    } catch (error) {
      console.error('[Artifact Workflow] Requirements gathering failed:', error)
      // If requirements gathering fails, proceed with basic spec to avoid blocking
      const basicSpec = {
        request: build.original_request,
        build_type: build.build_type,
        user_request: request.content
      }
      await ArtifactService.updateSpecification(build.id, basicSpec, [])
      await ArtifactService.updateBuildStatus(build.id, 'ready_for_confirmation')
      return this.confirmSpecification(build, request)
    }
  }

  /**
   * Confirm specification phase
   */
  private static async confirmSpecification(build: ArtifactBuild, request: WorkflowRequest): Promise<WorkflowResponse> {
    console.log('[Artifact Workflow] Confirming specification for:', build.id)

    // For simple requests with explicit specifications, skip confirmation
    const spec = build.final_specification || {}
    const isSimpleRequest = Object.keys(spec).length <= 3 && 
                           !spec.requires_complexity &&
                           request.content.length < 100

    if (isSimpleRequest) {
      console.log('[Artifact Workflow] Simple request, skipping confirmation')
      await ArtifactService.updateBuildStatus(build.id, 'confirmed', {
        generationStartedAt: new Date().toISOString()
      })
      return this.generateArtifacts(build, request)
    }

    // Check if user confirmed
    const userConfirmed = request.content.toLowerCase().includes('yes') || 
                        request.content.toLowerCase().includes('proceed') ||
                        request.content.toLowerCase().includes('continue') ||
                        request.content.toLowerCase().includes('generate') ||
                        request.content.toLowerCase().includes('go ahead')

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
      // Try primary generation method
      const primaryResult = await this.attemptArtifactGeneration(build, request, 1)
      
      if (primaryResult.success) {
        return primaryResult.response
      }

      // If primary failed, try fallback method
      console.log('[Artifact Workflow] Primary generation failed, trying fallback')
      const fallbackResult = await this.attemptFallbackGeneration(build, request)
      
      if (fallbackResult.success) {
        return fallbackResult.response
      }

      // Both methods failed
      console.error('[Artifact Workflow] All generation methods failed')
      await ArtifactService.markBuildFailed(build.id, 'All generation methods failed. Requirements preserved for retry.')
      
      return {
        status: 'failed',
        message: `I've captured your requirements, but the artifact generator couldn't produce a valid file this time. Your configuration is preserved. Type "try again" to retry generation.`,
        needsInput: true
      }
    } catch (error) {
      console.error('[Artifact Workflow] Artifact generation failed:', error)
      await ArtifactService.markBuildFailed(build.id, (error as Error).message)
      
      return {
        status: 'failed',
        message: `I've captured your requirements, but the artifact generator encountered an error: ${(error as Error).message}. Your configuration is preserved. Type "try again" to retry generation.`,
        needsInput: true
      }
    }
  }

  /**
   * Attempt primary artifact generation with structured output
   */
  private static async attemptArtifactGeneration(
    build: ArtifactBuild, 
    request: WorkflowRequest,
    attempt: number
  ): Promise<{ success: boolean; response?: WorkflowResponse }> {
    try {
      console.log('[Artifact Workflow] Primary generation attempt:', attempt)
      
      const generationPrompt = this.buildGenerationPrompt(build, request)
      const aiResponse = await this.getAIResponse(generationPrompt, request)

      console.log('[Artifact Workflow] AI response received, length:', aiResponse.length)
      console.log('[Artifact Workflow] AI response preview:', aiResponse.substring(0, 500))

      // Parse and validate artifacts
      const manifest = this.parseArtifactManifest(aiResponse, build.build_type)

      if (!manifest || manifest.files.length === 0) {
        console.error('[Artifact Workflow] Parsing failed or no files in manifest')
        return { success: false }
      }

      console.log('[Artifact Workflow] Manifest parsed successfully, files:', manifest.files.length)

      // Sanitize artifacts to remove secrets
      const sanitizedFiles = manifest.files.map(file => ({
        ...file,
        content: this.sanitizeContent(file.content)
      }))

      // Save artifacts
      const savedArtifacts = []
      for (const file of sanitizedFiles) {
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
          // Try to repair the artifact
          const repaired = await this.attemptArtifactRepair(artifact, file.content, file.file_type)
          if (!repaired) {
            return { success: false }
          }
        }

        savedArtifacts.push(artifact)
      }

      // Generate guide for the primary artifact
      const guideResult = await this.generateGuide(savedArtifacts, build, request)
      if (guideResult) {
        savedArtifacts.push(guideResult)
      }

      await ArtifactService.updateBuildStatus(build.id, 'completed', {
        generationCompletedAt: new Date().toISOString(),
        filesGenerated: savedArtifacts.length
      })

      console.log('[Artifact Workflow] Generation completed successfully, artifacts:', savedArtifacts.length)

      return {
        success: true,
        response: {
          status: 'completed',
          message: this.buildCompletionMessage(savedArtifacts),
          artifacts: savedArtifacts
        }
      }
    } catch (error) {
      console.error('[Artifact Workflow] Primary generation attempt failed:', error)
      return { success: false }
    }
  }

  /**
   * Attempt fallback generation using text extraction
   */
  private static async attemptFallbackGeneration(
    build: ArtifactBuild,
    request: WorkflowRequest
  ): Promise<{ success: boolean; response?: WorkflowResponse }> {
    try {
      console.log('[Artifact Workflow] Fallback generation attempt')
      
      const fallbackPrompt = `Generate a ${build.build_type} based on this request: ${build.original_request}

Please provide the output as a simple code block with the file content. Do not include any explanatory text outside the code block.

Format:
\`\`\`json
{
  "filename": "config.json",
  "content": {...}
}
\`\`\`

If multiple files are needed, provide multiple code blocks.`

      const aiResponse = await this.getAIResponse(fallbackPrompt, request)
      
      // Extract code blocks
      const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g
      const matches = Array.from(aiResponse.matchAll(codeBlockRegex))
      
      if (matches.length === 0) {
        console.error('[Artifact Workflow] No code blocks found in fallback response')
        return { success: false }
      }

      const savedArtifacts = []
      
      for (const match of matches) {
        const fileType = match[1] || 'json'
        const content = match[2].trim()
        
        try {
          // Parse the content to extract filename if it's JSON
          let filename = `${build.build_type}-${Date.now()}.${fileType}`
          let actualContent = content
          
          if (fileType === 'json') {
            try {
              const parsed = JSON.parse(content)
              filename = parsed.filename || filename
              actualContent = parsed.content || JSON.stringify(parsed, null, 2)
            } catch (e) {
              // Content is already the JSON
              actualContent = content
            }
          }

          // Sanitize content
          actualContent = this.sanitizeContent(actualContent)

          const artifact = await ArtifactService.saveArtifact(
            build.id,
            request.userId,
            filename,
            fileType,
            this.getMimeType(fileType),
            actualContent,
            true
          )

          // Validate
          const validation = await ArtifactService.validateArtifact(artifact.id, actualContent, fileType)
          if (!validation.valid) {
            console.error('[Artifact Workflow] Fallback validation failed:', validation.errors)
            continue
          }

          savedArtifacts.push(artifact)
        } catch (error) {
          console.error('[Artifact Workflow] Failed to process fallback code block:', error)
          continue
        }
      }

      if (savedArtifacts.length === 0) {
        return { success: false }
      }

      // Generate guide
      const guideResult = await this.generateGuide(savedArtifacts, build, request)
      if (guideResult) {
        savedArtifacts.push(guideResult)
      }

      await ArtifactService.updateBuildStatus(build.id, 'completed', {
        generationCompletedAt: new Date().toISOString(),
        filesGenerated: savedArtifacts.length
      })

      return {
        success: true,
        response: {
          status: 'completed',
          message: this.buildCompletionMessage(savedArtifacts),
          artifacts: savedArtifacts
        }
      }
    } catch (error) {
      console.error('[Artifact Workflow] Fallback generation failed:', error)
      return { success: false }
    }
  }

  /**
   * Attempt to repair a failed artifact
   */
  private static async attemptArtifactRepair(
    artifact: any,
    content: string,
    fileType: string
  ): Promise<boolean> {
    try {
      console.log('[Artifact Workflow] Attempting artifact repair for:', artifact.id)
      
      let repairedContent = content

      if (fileType === 'json') {
        // Try to fix common JSON issues
        repairedContent = content
          .replace(/,\s*}/g, '}')  // Remove trailing commas
          .replace(/,\s*]/g, ']')  // Remove trailing commas in arrays
          .replace(/'/g, '"')      // Replace single quotes with double quotes
          .trim()
        
        // Try parsing the repaired content
        try {
          JSON.parse(repairedContent)
          
          // Update the artifact with repaired content
          const { error } = await getSupabaseClient()
            .from('alex_artifacts')
            .update({ content: repairedContent })
            .eq('id', artifact.id)
          
          if (error) {
            console.error('[Artifact Workflow] Failed to update repaired artifact:', error)
            return false
          }

          // Re-validate
          const validation = await ArtifactService.validateArtifact(artifact.id, repairedContent, fileType)
          return validation.valid
        } catch (e) {
          console.error('[Artifact Workflow] Repair attempt failed:', e)
          return false
        }
      }

      return false
    } catch (error) {
      console.error('[Artifact Workflow] Artifact repair failed:', error)
      return false
    }
  }

  /**
   * Sanitize content to remove secrets
   */
  private static sanitizeContent(content: string): string {
    const secretPatterns = [
      { pattern: /sk-[a-zA-Z0-9]{20,}/g, replacement: 'sk-YOUR_API_KEY_HERE' },
      { pattern: /xox[bap]-[a-zA-Z0-9]{20,}/g, replacement: 'xoxb-YOUR_SLACK_TOKEN_HERE' },
      { pattern: /AIza[a-zA-Z0-9_-]{35}/g, replacement: 'AIza-YOUR_GOOGLE_API_KEY_HERE' },
      { pattern: /AKIA[a-zA-Z0-9]{16}/g, replacement: 'AKIA-YOUR_AWS_ACCESS_KEY_HERE' },
      { pattern: /eyJ[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+\.[a-zA-Z0-9_-]+/g, replacement: 'eyJ.YOUR_JWT_TOKEN_HERE' },
      { pattern: /service[_-]?role[_-]?key[:\s]*[a-zA-Z0-9_-]{20,}/gi, replacement: 'service_role_key: YOUR_SERVICE_ROLE_KEY_HERE' },
      { pattern: /supabase[_-]?key[:\s]*[a-zA-Z0-9_-]{20,}/gi, replacement: 'supabase_key: YOUR_SUPABASE_KEY_HERE' },
      { pattern: /clerk[_-]?secret[_-]?key[:\s]*[a-zA-Z0-9_-]{20,}/gi, replacement: 'clerk_secret_key: YOUR_CLERK_SECRET_KEY_HERE' }
    ]

    let sanitized = content
    for (const { pattern, replacement } of secretPatterns) {
      sanitized = sanitized.replace(pattern, replacement)
    }

    return sanitized
  }

  /**
   * Get MIME type for file type
   */
  private static getMimeType(fileType: string): string {
    const mimeTypes: Record<string, string> = {
      'json': 'application/json',
      'md': 'text/markdown',
      'txt': 'text/plain',
      'js': 'application/javascript',
      'py': 'text/x-python',
      'yaml': 'text/yaml',
      'yml': 'text/yaml',
      'xml': 'application/xml'
    }
    return mimeTypes[fileType] || 'text/plain'
  }

  /**
   * Generate guide for artifacts
   */
  private static async generateGuide(
    artifacts: any[],
    build: ArtifactBuild,
    request: WorkflowRequest
  ): Promise<any | null> {
    try {
      console.log('[Artifact Workflow] Generating guide for artifacts')
      
      const primaryArtifact = artifacts.find(a => a.is_primary) || artifacts[0]
      if (!primaryArtifact) return null

      const guidePrompt = `Generate a concise guide for using this ${build.build_type} artifact.

Original request: ${build.original_request}
Artifact filename: ${primaryArtifact.filename}
Artifact type: ${primaryArtifact.file_type}

Generate a guide in markdown format that explains:
1. What the file contains
2. What the configuration does
3. Required setup steps
4. How to import/use it
5. Important customization points
6. Any assumptions made
7. Next steps

Keep it practical and actionable. Do not include the actual file content in the guide.`

      const guideContent = await this.getAIResponse(guidePrompt, request)
      
      const guideFilename = primaryArtifact.filename.replace(/\.[^.]+$/, '-guide.md')
      
      const guideArtifact = await ArtifactService.saveArtifact(
        build.id,
        request.userId,
        guideFilename,
        'md',
        'text/markdown',
        guideContent,
        false
      )

      console.log('[Artifact Workflow] Guide generated:', guideArtifact.id)
      return guideArtifact
    } catch (error) {
      console.error('[Artifact Workflow] Guide generation failed:', error)
      // Guide generation is not critical, so return null on failure
      return null
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
3. Identify critical missing requirements that are essential for the artifact to be useful
4. Ask ONLY 1-2 critical questions maximum - be focused and concise
5. If requirements are complete or the request is simple enough to proceed, say "REQUIREMENTS_COMPLETE" and provide the final specification

IMPORTANT: Respond ONLY in the exact format below. Do not add any other text, explanations, or conversational filler.

If questions needed:
QUESTION: [single focused question]

If complete:
REQUIREMENTS_COMPLETE
SPECIFICATION: {"name": "extracted_name", "purpose": "extracted_purpose", "requires_complexity": false}
`
  }

  /**
   * Build generation prompt for AI
   */
  private static buildGenerationPrompt(build: ArtifactBuild, request: WorkflowRequest): string {
    return `Generate a ${build.build_type} configuration based on this request: ${build.original_request}

Respond ONLY with valid JSON in this exact format:
[
  {
    "FILENAME": "config.json",
    "FILE_TYPE": "json",
    "MIME_TYPE": "application/json",
    "CONTENT": "{...your JSON content...}",
    "IS_PRIMARY": true
  }
]

No other text. Just the JSON array.`
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
      enableWebResearch: false, // Disable web research to save TPM
      enableMemory: false,      // Disable memory to save TPM
      enableTools: false,      // Disable tools to save TPM
      enableAgent: false,      // Disable agent mode to save TPM
      enableTokenAwareAssembly: false // Disable token-aware assembly for simpler requests
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
