/**
 * ALEX Workflow Orchestrator
 * 
 * Integrates the new AI-driven orchestration layer with the existing workflow infrastructure
 * Bridges between AIOrchestrator and the artifact generation system
 */

import { AIOrchestrator } from './ai-orchestrator'
import { 
  AlexNextAction, 
  AutomationPlan, 
  ConversationContext, 
  OrchestrationResult 
} from './types'
import { ArtifactService } from '../artifact-generation/artifact-service'
import { ArchitectureDesigner } from '../artifact-generation/architecture-designer'
import { AutomationSpec } from '../artifact-generation/automation-spec'
import { OrchestrationQuestionService } from './orchestration-question-service'
import { WorkflowJSONGenerator } from '../artifact-generation/workflow-json-generator'
import { QuestionOptionsGenerator } from '../artifact-generation/question-options-generator'

export interface WorkflowOrchestrationRequest {
  conversationId: string
  userId: string
  userMessage: string
  conversationHistory: Array<{ role: string; content: string }>
  mode: string
  attachedFiles?: any[]
}

export interface WorkflowOrchestrationResponse {
  status: string
  message: string
  needsInput?: boolean
  question?: {
    text: string
    reason?: string
    options?: string[]
    // Enhanced interactive question support
    enrichedOptions?: Array<{
      label: string
      value: string
      description?: string
      recommended?: boolean
    }>
    inputType?: 'select' | 'multi-select' | 'text' | 'email' | 'url' | 'number' | 'time' | 'date' | 'boolean'
    header?: string
    field?: string
  }
  architectureProposal?: any
  artifacts?: any[]
  specification?: AutomationSpec
  plan?: AutomationPlan
}

export class WorkflowOrchestrator {
  private static instance: WorkflowOrchestrator
  private aiOrchestrator: AIOrchestrator
  
  private constructor() {
    this.aiOrchestrator = AIOrchestrator.getInstance()
  }
  
  static getInstance(): WorkflowOrchestrator {
    if (!WorkflowOrchestrator.instance) {
      WorkflowOrchestrator.instance = new WorkflowOrchestrator()
    }
    return WorkflowOrchestrator.instance
  }
  
  /**
   * Main orchestration entry point
   * Replaces WorkflowManagerV2.processRequest for AI-driven behavior
   */
  async orchestrateWorkflow(request: WorkflowOrchestrationRequest): Promise<WorkflowOrchestrationResponse> {
    console.log('[Workflow Orchestrator] ===== ORCHESTRATION START =====')
    console.log('[Workflow Orchestrator] Request:', {
      conversationId: request.conversationId,
      userId: request.userId,
      message: request.userMessage.substring(0, 100),
      mode: request.mode
    })
    
    // Load current automation plan if exists
    const currentPlan = await this.loadCurrentPlan(request.conversationId, request.userId)
    
    // EARLY EXIT: If the user explicitly asked to generate the architecture,
    // skip the AI decision loop entirely and go straight to generation.
    // This prevents the infinite loop where the AI keeps asking the same question.
    const generatePhrases = [
      'please generate the architecture now',
      'generate the architecture',
      'yes, generate architecture',
      'generate architecture',
      'proceed to generation',
      'go ahead and propose the architecture',
      'yes, go ahead',
      'generate now',
      'proceed'
    ]
    const normalizedMessage = request.userMessage.toLowerCase().trim()
    const isExplicitGenerateRequest = generatePhrases.some(phrase => normalizedMessage.includes(phrase))
    
    if (isExplicitGenerateRequest && currentPlan) {
      console.log('[Workflow Orchestrator] Explicit generate request detected — skipping AI loop')
      return await this.handleGenerate(currentPlan, request)
    }
    
    // Load conversation context
    const context: ConversationContext = {
      conversationId: request.conversationId,
      userId: request.userId,
      messages: request.conversationHistory.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
        timestamp: new Date().toISOString()
      })),
      mode: request.mode as any
    }
    
    // Let AI decide what to do
    const orchestrationResult = await this.aiOrchestrator.orchestrate(
      request.userMessage,
      context,
      currentPlan
    )
    
    console.log('[Workflow Orchestrator] Orchestration result:', {
      actionType: orchestrationResult.action.type,
      intent: orchestrationResult.intent,
      confidence: orchestrationResult.confidence,
      hasUpdatedPlan: !!orchestrationResult.updatedPlan
    })
    
    // Special handling for looping failure prevention
    // If AI wants to ask a question that was just answered, prevent it
    if (orchestrationResult.action.type === 'clarify' && request.userId && request.conversationId) {
      const question = orchestrationResult.action.question
      const wasRecentlyAnswered = await this.checkRecentlyAnswered(
        request.conversationId,
        request.userId,
        question
      )
      
      if (wasRecentlyAnswered) {
        console.log('[Workflow Orchestrator] Preventing repeated question:', question.substring(0, 50))
        
        // Instead of asking the same "proceed to generation?" question (which loops),
        // directly proceed to architecture generation if we have a plan
        if (currentPlan) {
          console.log('[Workflow Orchestrator] Have a plan — proceeding directly to architecture generation')
          return await this.handleGenerate(currentPlan, request)
        }
        
        // No plan yet — ask the user what to do (but only once)
        orchestrationResult.action = {
          type: 'clarify',
          question: 'We\'ve covered that part. Should I go ahead and propose the architecture for this automation, or is there anything else to add?',
          reason: 'Preventing repeated question',
          field: 'proceed_to_generation',
          enrichedOptions: [
            { label: 'Yes, generate architecture', value: 'Please generate the architecture now' },
            { label: 'No, I have more details', value: 'I want to add more details' }
          ]
        }
      }
    }
    
    // Handle the AI's decision
    return await this.handleOrchestrationResult(
      orchestrationResult,
      request,
      currentPlan
    )
  }
  
  /**
   * Handle the orchestration result and execute the appropriate action
   */
  private async handleOrchestrationResult(
    result: OrchestrationResult,
    request: WorkflowOrchestrationRequest,
    currentPlan: AutomationPlan | null
  ): Promise<WorkflowOrchestrationResponse> {
    const { action, updatedPlan } = result
    
    // Save updated plan if provided
    if (updatedPlan) {
      await this.savePlan(request.conversationId, request.userId, updatedPlan, action.type)
    }

    // CRITICAL FIX: Ensure a build record always exists when we're in a
    // collecting_requirements phase (clarify / respond / recommend / brainstorm).
    // Without this, the next user turn won't be routed back to the workflow
    // orchestrator because route.ts checks alex_artifact_builds for active builds.
    const requirementGatheringActions = ['clarify', 'respond', 'recommend', 'brainstorm']
    if (requirementGatheringActions.includes(action.type) && !updatedPlan) {
      try {
        const existingBuild = await ArtifactService.getActiveBuild(
          request.conversationId,
          request.userId
        )
        if (!existingBuild) {
          console.log('[Workflow Orchestrator] No build record found during requirement gathering — creating one now to anchor the conversation')
          const newBuild = await ArtifactService.createBuild(
            request.conversationId,
            request.userId,
            request.userMessage,
            'workflow'
          )
          console.log('[Workflow Orchestrator] Anchor build created:', newBuild.id)
        }
      } catch (err) {
        console.error('[Workflow Orchestrator] Failed to create anchor build:', err)
        // Non-fatal — continue so the user still gets their response
      }
    }
    
    switch (action.type) {
      case 'respond':
        return {
          status: 'collecting_requirements',
          message: action.message
        }
      
      case 'clarify':
        return {
          status: 'collecting_requirements',
          message: action.message || 'I need some information to proceed.',
          needsInput: true,
          question: {
            text: action.question,
            reason: action.reason,
            options: action.options,
            enrichedOptions: action.enrichedOptions,
            inputType: action.inputType || 'select',
            header: action.header || action.field,
            field: action.field || 'general'
          }
        }
      
      case 'recommend':
        return {
          status: 'collecting_requirements',
          message: action.message,
          needsInput: true,
          question: {
            text: action.recommendations?.join('\n') || '',
            reason: 'Here are my recommendations',
            options: action.recommendations,
            enrichedOptions: action.enrichedOptions
          }
        }
      
      case 'brainstorm':
        return {
          status: 'collecting_requirements',
          message: action.message,
          needsInput: true,
          question: {
            text: action.ideas?.join('\n') || '',
            reason: 'Here are some ideas to consider',
            options: action.ideas,
            enrichedOptions: action.enrichedOptions
          }
        }
            case 'plan': {
          // When the AI has a complete plan, proceed directly to architecture design
          // so the user sees the "Approve & Generate" button immediately.
          console.log('[Workflow Orchestrator] Plan action received — proceeding to architecture design')
          const planForGenerate = (action.plan && Object.keys(action.plan).length > 0)
            ? action.plan
            : (updatedPlan || currentPlan || {})
          return await this.handleGenerate(planForGenerate, request)
        }
      
      case 'generate': {
        // Convert plan to spec and generate architecture
        // If the AI didn't provide the plan again in the action, use the accumulated plan
        const planToGenerate = (action.plan && Object.keys(action.plan).length > 0) 
          ? action.plan 
          : (updatedPlan || currentPlan || {});
        return await this.handleGenerate(planToGenerate, request)
      }
      
      case 'execute': {
        // Execute the plan (generate artifact)
        if (action.confirmationRequired) {
          return {
            status: 'awaiting_confirmation',
            message: 'I\'m ready to generate your automation. Should I proceed?',
            needsInput: true,
            question: {
              text: 'Generate automation now?',
              options: ['Yes, generate it', 'No, make changes first']
            }
          }
        }
        const planToExecute = (action.plan && Object.keys(action.plan).length > 0) 
          ? action.plan 
          : (updatedPlan || currentPlan || {});
        return await this.handleGenerate(planToExecute, request)
      }
      
      case 'revise':
        return {
          status: 'revising',
          message: action.message,
          plan: action.plan
        }
      
      case 'generate_artifact':
        return await this.generateArtifactFromPlan(action.plan, request)
      
      case 'approve':
        // User approved the architecture - proceed to artifact generation
        return await this.generateArtifactFromPlan(action.plan, request)
      
      default:
        console.warn('[Workflow Orchestrator] Unknown action type:', action.type)
        return {
          status: 'collecting_requirements',
          message: 'I\'m not sure how to proceed. Could you clarify?'
        }
    }
  }
  
  /**
   * Handle artifact generation
   */
  private async handleGenerate(
    plan: AutomationPlan,
    request: WorkflowOrchestrationRequest
  ): Promise<WorkflowOrchestrationResponse> {
    console.log('[Workflow Orchestrator] Generating artifact from plan')

    // Auto‑fix if AI generated platform as a string instead of object
    if (plan && typeof plan.platform === 'string') {
      plan.platform = { name: plan.platform };
    }

    // CRITICAL: Ensure a platform is selected before proceeding
    if (!plan.platform?.name) {
      console.log('[Workflow Orchestrator] Platform not specified – prompting user')
      return {
        status: 'collecting_requirements',
        message: 'I need to know which platform to use before generating the workflow.',
        needsInput: true,
        question: {
          text: 'Which automation platform would you like to use?',
          reason: 'Platform selection is required for workflow generation',
          field: 'platform',
          enrichedOptions: QuestionOptionsGenerator.generatePlatformOptions()
        }
      };
    }

    // Convert the plan to a legacy‑compatible AutomationSpec
    const spec = this.planToSpec(plan);

    // Attempt to generate a logical architecture via the AI service
    let architecture: any = null;
    try {
      architecture = await ArchitectureDesigner.design(spec);
    } catch (err) {
      console.error('[Workflow Orchestrator] Architecture design failed:', err);
      // Provide a minimal placeholder so the UI does not break
      architecture = {
        id: 'fallback-arch',
        name: 'Fallback Architecture',
        description: 'Placeholder architecture generated because the AI designer failed.',
        goal: plan.objective || 'unknown',
        domain: spec.domain || 'custom',
        complexity: 'moderate',
        reasoning: 'Fallback architecture – AI response could not be parsed.',
        stages: [],
        dataFlow: undefined,
        assumptions: [],
        recommendations: [],
        unresolvedDecisions: [],
        platformAgnostic: true
      };
    }

    // Persist the build record (create if missing)
    const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId);
    let build;
    if (existingBuild) {
      await ArtifactService.updateSpecification(existingBuild.id, spec, []);
      build = existingBuild;
    } else {
      build = await ArtifactService.createBuild(
        request.conversationId,
        request.userId,
        request.userMessage,
        'workflow'
      );
      await ArtifactService.updateSpecification(build.id, spec, []);
    }

    // Set the status to awaiting_architecture_verification so the approval endpoint can find it
    await ArtifactService.updateBuildStatus(build.id, 'awaiting_architecture_verification');

    // Return a full architecture proposal for the UI
    return {
      status: 'awaiting_architecture_verification',
      message: 'I\'ve designed the architecture for your automation. Please review and confirm.',
      architectureProposal: {
        description: plan.objective,
        platform: plan.platform?.name || null,
        platformReasoning: plan.platform?.reasoning || 'Platform selection needed',
        complexity: architecture.complexity || plan.architecture?.complexity || 'moderate',
        // Include the complete architecture object for richer UI rendering
        architecture,
        assumptions: architecture.assumptions || [],
        recommendations: architecture.recommendations || []
      },
      specification: spec,
      plan
    };
  }
  
  /**
   * Handle actual artifact generation (JSON file creation)
   */
  public async generateArtifactFromPlan(
    plan: AutomationPlan,
    request: WorkflowOrchestrationRequest
  ): Promise<WorkflowOrchestrationResponse> {
    console.log('[Workflow Orchestrator] Generating actual artifact from plan')
    
    try {
      // Get active build
      const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)
      
      if (!existingBuild) {
        throw new Error('No active build found for artifact generation')
      }
      
      // Update build status
      await ArtifactService.updateBuildStatus(existingBuild.id, 'generating')
      
      // Generate workflow JSON
      const platform = plan.platform?.name || 'n8n'
      const workflowData = WorkflowJSONGenerator.generateWorkflow(plan, platform)
      
      console.log('[Workflow Orchestrator] Generated workflow data:', {
        platform,
        filename: workflowData.filename,
        fileType: workflowData.fileType,
        contentLength: workflowData.content.length
      })
      
      // Create artifact record — saveArtifact returns the artifact directly (throws on error)
      let artifact: any
      try {
        artifact = await ArtifactService.saveArtifact(
          existingBuild.id,
          request.userId,
          workflowData.filename,
          workflowData.fileType,
          workflowData.fileType,
          workflowData.content,
          true // isPrimary
        )
      } catch (saveError) {
        throw new Error(`Failed to create artifact: ${saveError instanceof Error ? saveError.message : 'Unknown error'}`)
      }
      
      // Update build status to completed
      await ArtifactService.updateBuildStatus(existingBuild.id, 'completed')
      
      // Update build with final specification
      const spec = this.planToSpec(plan)
      await ArtifactService.updateSpecification(existingBuild.id, spec, [])
      
      // Attach download URL
      const artifactWithUrl = {
        ...artifact,
        download_url: `/api/alex/artifacts/${artifact.id}/download`
      }
      
      return {
        status: 'completed',
        message: 'Your workflow has been generated successfully! You can download it below.',
        artifacts: [artifactWithUrl],
        specification: spec,
        plan
      }
    } catch (error) {
      console.error('[Workflow Orchestrator] Artifact generation failed:', error)
      console.error('[Workflow Orchestrator] Error stack:', error instanceof Error ? error.stack : 'No stack')
      
      // Update build status to failed
      const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)
      if (existingBuild) {
        await ArtifactService.updateBuildStatus(existingBuild.id, 'failed')
      }
      
      return {
        status: 'failed',
        message: `Failed to generate workflow: ${error instanceof Error ? error.message : 'Unknown error'}\n\nStack: ${error instanceof Error ? error.stack : ''}`
      }
    }
  }
  
  /**
   * Convert AutomationPlan to AutomationSpec (legacy compatibility)
   */
  private planToSpec(plan: AutomationPlan): AutomationSpec {
    const spec: AutomationSpec = {
      automationType: 'workflow',
      description: plan.objective,
      domain: 'custom',
      aiConfig: { enabled: false },
      humanApproval: { required: false },
      errorHandling: { retryStrategy: 'exponential-backoff', maxRetries: 3 },
      persistence: { enabled: true, logLevel: 'info', auditTrail: true },
      architecture: { complexity: plan.architecture?.complexity || 'moderate' }
    }
    
    // Map plan fields to spec fields
    if (plan.trigger) {
      spec.trigger = {
        type: plan.trigger.type || 'manual',
        source: plan.trigger.source,
        config: plan.trigger.description
      }
    }
    
    if (plan.inputs) {
      spec.inputs = {
        sources: plan.inputs.sources || [],
        format: 'json'
      }
    }
    
    if (plan.outputs) {
      spec.outputs = {
        destinations: plan.outputs.destinations || [],
        notification: true
      }
    }
    
    if (plan.integrations) {
      spec.integrations = {
        platform: plan.integrations.platform
      }
    }
    
    if (plan.platform) {
      spec.platform = plan.platform.name
      spec.platformReasoning = plan.platform.reasoning
    }
    
    if (plan.assumptions) {
      spec.assumptions = plan.assumptions
    }
    
    if (plan.recommendations) {
      spec.recommendations = plan.recommendations
    }
    
    return spec
  }
  
  /**
   * Convert AutomationSpec to AutomationPlan (reverse conversion for persistence)
   * This is the legacy compatibility bridge - converts rigid spec to evolving plan
   */
  private specToPlan(spec: AutomationSpec): AutomationPlan {
    const plan: AutomationPlan = {
      objective: spec.description || 'Unknown automation',
      status: 'draft'
    }
    
    // Map spec fields to plan fields
    if (spec.trigger) {
      plan.trigger = {
        type: spec.trigger.type,
        source: spec.trigger.source,
        description: spec.trigger.config
      }
    }
    
    if (spec.inputs) {
      plan.inputs = {
        sources: spec.inputs.sources || [],
        description: 'Input sources'
      }
    }
    
    if (spec.outputs) {
      plan.outputs = {
        destinations: spec.outputs.destinations || [],
        description: 'Output destinations'
      }
    }
    
    if (spec.integrations) {
      plan.integrations = {
        platform: spec.integrations.platform
      }
    }
    
    if (spec.platform) {
      plan.platform = {
        name: spec.platform,
        reasoning: spec.platformReasoning || 'Platform selection'
      }
    }
    
    if (spec.assumptions) {
      plan.assumptions = spec.assumptions
    }
    
    if (spec.recommendations) {
      plan.recommendations = spec.recommendations
    }
    
    if (spec.architecture) {
      plan.architecture = {
        complexity: spec.architecture.complexity
      }
    }
    
    // Extract known fields from spec metadata if available
    if (spec._knownFields) {
      plan.assumptions = plan.assumptions || []
      plan.assumptions.push(`Known fields: ${spec._knownFields.join(', ')}`)
    }
    
    return plan
  }
  
  /**
   * Load current automation plan from database
   */
  private async loadCurrentPlan(
    conversationId: string,
    userId: string
  ): Promise<AutomationPlan | null> {
    try {
      const build = await ArtifactService.getActiveBuild(conversationId, userId)
      if (build) {
        // First try to load from automation_plan column (new persistence)
        if (build.automation_plan) {
          console.log('[Workflow Orchestrator] Loading plan from automation_plan column')
          return build.automation_plan as AutomationPlan
        }
        
        // Fallback: try to extract plan from spec (reverse of planToSpec)
        if (build.final_specification) {
          console.log('[Workflow Orchestrator] Converting spec to plan (fallback)')
          return this.specToPlan(build.final_specification)
        }
      }
      return null
    } catch (error) {
      console.error('[Workflow Orchestrator] Failed to load plan:', error)
      return null
    }
  }
  
  /**
   * Save automation plan to database
   */
  private async savePlan(
    conversationId: string,
    userId: string,
    plan: AutomationPlan,
    lastAction?: string
  ): Promise<void> {
    try {
      const build = await ArtifactService.getActiveBuild(conversationId, userId)
      if (build) {
        // Save plan to automation_plan column (new persistence)
        const supabase = await this.getSupabaseClient()
        const { error } = await supabase
          .from('alex_artifact_builds')
          .update({
            automation_plan: plan,
            last_orchestration_action: lastAction,
            orchestration_metadata: {
              lastUpdated: new Date().toISOString(),
              action: lastAction
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', build.id)
        
        if (error) {
          console.error('[Workflow Orchestrator] Failed to save plan to automation_plan column:', error)
          // Fallback: convert plan to spec and save
          const spec = this.planToSpec(plan)
          await ArtifactService.updateSpecification(build.id, spec, [])
          console.log('[Workflow Orchestrator] Plan saved via spec conversion (fallback)')
        } else {
          console.log('[Workflow Orchestrator] Plan saved to automation_plan column')
        }
      } else {
        // Create new build
        const newBuild = await ArtifactService.createBuild(
          conversationId,
          userId,
          plan.objective,
          'workflow'
        )
        
        // Save plan to new build
        const supabase = await this.getSupabaseClient()
        const { error } = await supabase
          .from('alex_artifact_builds')
          .update({
            automation_plan: plan,
            last_orchestration_action: lastAction,
            orchestration_metadata: {
              lastUpdated: new Date().toISOString(),
              action: lastAction
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', newBuild.id)
        
        if (error) {
          console.error('[Workflow Orchestrator] Failed to save plan to new build:', error)
          // Fallback: convert plan to spec and save
          const spec = this.planToSpec(plan)
          await ArtifactService.updateSpecification(newBuild.id, spec, [])
          console.log('[Workflow Orchestrator] Plan saved via spec conversion (fallback)')
        } else {
          console.log('[Workflow Orchestrator] Plan saved to new build')
        }
      }
    } catch (error) {
      console.error('[Workflow Orchestrator] Failed to save plan:', error)
    }
  }
  
  /**
   * Get Supabase client for direct database access
   */
  private async getSupabaseClient() {
    const { createClient } = await import('@supabase/supabase-js')
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    
    if (!supabaseUrl || !supabaseServiceRoleKey) {
      throw new Error('Missing Supabase environment variables')
    }
    
    return createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  
  /**
   * Check if a question was recently answered (to prevent looping)
   */
  private async checkRecentlyAnswered(
    conversationId: string,
    userId: string,
    question: string
  ): Promise<boolean> {
    try {
      const recentlyAnswered = await OrchestrationQuestionService.checkAlreadyAnswered({
        conversationId,
        userId,
        question
      })
      
      return recentlyAnswered
    } catch (error) {
      console.error('[Workflow Orchestrator] Failed to check recently answered:', error)
      return false
    }
  }

  /**
   * Handle direct architecture approval bypassing the AI loop
   */
  public async handleApproval(
    conversationId: string,
    userId: string
  ): Promise<WorkflowOrchestrationResponse> {
    console.log('[Workflow Orchestrator] Handling direct approval for conversation:', conversationId)
    
    // Load the fully populated plan from database
    const plan = await this.loadCurrentPlan(conversationId, userId)
    if (!plan) {
      throw new Error('No active plan found to generate artifact')
    }
    
    // Create the workflow request context
    const request: WorkflowOrchestrationRequest = {
      conversationId,
      userId,
      userMessage: 'User approved architecture - generate artifact',
      conversationHistory: [],
      mode: 'automation'
    }
    
    // Directly generate artifact from the plan
    return await this.generateArtifactFromPlan(plan, request)
  }
}