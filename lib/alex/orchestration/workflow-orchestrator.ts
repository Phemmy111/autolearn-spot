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
    
    // Load current automation plan if exists
    const currentPlan = await this.loadCurrentPlan(request.conversationId, request.userId)
    
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
        // Change to respond action
        orchestrationResult.action = {
          type: 'respond',
          message: "I think we've already covered that. Let me proceed with the information we have."
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
      
      case 'plan':
        return {
          status: 'planning',
          message: `Here's my plan for your automation:\n${JSON.stringify(action.plan, null, 2)}`,
          plan: action.plan
        }
      
      case 'generate':
        // Convert plan to spec and generate architecture
        return await this.handleGenerate(action.plan, request)
      
      case 'execute':
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
        return await this.handleGenerate(action.plan, request)
      
      case 'revise':
        return {
          status: 'revising',
          message: action.message,
          plan: action.plan
        }
      
      case 'generate_artifact':
        return await this.handleArtifactGeneration(action.plan, request)
      
      case 'approve':
        // User approved the architecture - proceed to artifact generation
        return await this.handleArtifactGeneration(action.plan, request)
      
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
    
    // CRITICAL: Check if platform is specified before proceeding
    if (!plan.platform?.name) {
      console.log('[Workflow Orchestrator] Platform not specified, asking for platform selection')
      return {
        status: 'collecting_requirements',
        message: 'I need to know which platform to use before generating the workflow.',
        needsInput: true,
        question: {
          text: 'Which automation platform would you like to use?',
          reason: 'Platform selection is required for workflow generation',
          field: 'platform',
          enrichedOptions: [
            { label: 'n8n', value: 'n8n', description: 'Visual workflow automation with 400+ integrations', recommended: true },
            { label: 'Zapier', value: 'zapier', description: 'Easy-to-use automation with 5,000+ app integrations' },
            { label: 'Make (Integromat)', value: 'make', description: 'Advanced scenarios with powerful data transformation' },
            { label: 'Custom Script', value: 'custom', description: 'Python/Node.js script for maximum flexibility' }
          ]
        }
      }
    }
    
    // Convert plan to AutomationSpec (legacy compatibility)
    const spec = this.planToSpec(plan)
    
    // Design architecture
    const architecture = await ArchitectureDesigner.design(spec)
    
    // Create or update build
    const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)
    
    let build
    if (existingBuild) {
      // Update existing build
      await ArtifactService.updateSpecification(existingBuild.id, spec, [])
      await ArtifactService.updateBuildStatus(existingBuild.id, 'designing_architecture')
      build = existingBuild
    } else {
      // Create new build
      build = await ArtifactService.createBuild(
        request.conversationId,
        request.userId,
        request.userMessage,
        'workflow'
      )
      await ArtifactService.updateSpecification(build.id, spec, [])
    }
    
    // Return architecture proposal
    return {
      status: 'awaiting_architecture_verification',
      message: 'I\'ve designed the architecture for your automation. Please review and confirm.',
      architectureProposal: {
        description: plan.objective,
        platform: plan.platform?.name || null, // Don't default to n8n - ask if not specified
        platformReasoning: plan.platform?.reasoning || 'Platform selection needed',
        complexity: plan.architecture?.complexity || 'moderate',
        stages: plan.architecture?.stages || [],
        assumptions: plan.assumptions || [],
        recommendations: plan.recommendations || []
      },
      specification: spec,
      plan
    }
  }
  
  /**
   * Handle actual artifact generation (JSON file creation)
   */
  private async handleArtifactGeneration(
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
      
      // Create artifact record
      const { data: artifact, error: artifactError } = await ArtifactService.saveArtifact(
        existingBuild.id,
        request.userId,
        workflowData.filename,
        workflowData.fileType,
        workflowData.fileType,
        workflowData.content,
        true, // isPrimary
        {
          platform: platform,
          generation_stage: 'final',
          architecture_approved: true
        }
      )
      
      if (artifactError || !artifact) {
        throw new Error(`Failed to create artifact: ${artifactError?.message || 'Unknown error'}`)
      }
      
      // Update build status to completed
      await ArtifactService.updateBuildStatus(existingBuild.id, 'completed')
      
      // Update build with final specification
      const spec = this.planToSpec(plan)
      await ArtifactService.updateSpecification(existingBuild.id, spec, [])
      
      return {
        status: 'completed',
        message: 'Your workflow has been generated successfully! You can download it below.',
        artifacts: [artifact],
        specification: spec,
        plan
      }
    } catch (error) {
      console.error('[Workflow Orchestrator] Artifact generation failed:', error)
      
      // Update build status to failed
      const existingBuild = await ArtifactService.getActiveBuild(request.conversationId, request.userId)
      if (existingBuild) {
        await ArtifactService.updateBuildStatus(existingBuild.id, 'failed')
      }
      
      return {
        status: 'failed',
        message: `Failed to generate workflow: ${error instanceof Error ? error.message : 'Unknown error'}`
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
}