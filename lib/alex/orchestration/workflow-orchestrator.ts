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
    const userMessage = request.userMessage || ''
    console.log('[Workflow Orchestrator] ===== ORCHESTRATION START =====')
    console.log('[Workflow Orchestrator] Request:', {
      conversationId: request.conversationId,
      userId: request.userId,
      message: userMessage.substring(0, 100),
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
      'proceed',
      'yes, generate it',
      'yes, generate the json',
      'yes generate it',
      'yes generate the json',
      'generate the json',
      'generate json',
      'generate the complete json',
      'generate the complete json file',
      'generate the complete json file for import',
      'generate the json file',
      'yes, generate',
      'generate it'
    ]
    const normalizedMessage = userMessage.toLowerCase().trim()
    const isExplicitGenerateRequest = generatePhrases.some(phrase => normalizedMessage.includes(phrase))
    
    // Also detect short affirmative answers when a plan already exists
    // (user is likely confirming after being asked "Would you like me to generate a ready-made JSON file?")
    const shortAffirmatives = ['yes', 'yep', 'yeah', 'sure', 'ok', 'okay', 'go ahead', 'do it', 'please', 'y']
    const isShortConfirmation = currentPlan && shortAffirmatives.includes(normalizedMessage)
    
    if ((isExplicitGenerateRequest || isShortConfirmation) && currentPlan) {
      console.log('[Workflow Orchestrator] Explicit generate/confirm request detected — skipping AI loop')
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
      currentPlan,
      {
        personalProvider: (request as any).personalProvider,
        personalApiKey: (request as any).personalApiKey,
        personalModel: (request as any).personalModel
      }
    )
    
    console.log('[Workflow Orchestrator] Orchestration result:', {
      actionType: orchestrationResult.action.type,
      intent: orchestrationResult.intent,
      confidence: orchestrationResult.confidence,
      hasUpdatedPlan: !!orchestrationResult.updatedPlan
    })
    
    // We no longer manually intercept questions here. 
    // The AI's system prompt has been updated to prevent asking the same question twice,
    // and manual fuzzy-matching causes false positives leading to infinite loops.
    
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
          
          // Create and save an initial plan so it's not null on next turn
          const initialPlan: AutomationPlan = currentPlan || {
            objective: request.userMessage || 'New automation request',
            status: 'draft'
          }
          await this.savePlan(request.conversationId, request.userId, initialPlan, action.type)
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
          // AI decided the plan is ready — proceed to generation
          console.log('[Workflow Orchestrator] Plan action received — proceeding to generation (no template gate)')
          const planForGenerate = (action.plan && Object.keys(action.plan).length > 0)
            ? action.plan
            : (updatedPlan || currentPlan || {})
          
          return await this.handleGenerate(planForGenerate, request)
        }
      
      case 'generate': {
        // AI decided to generate — proceed directly (no template gate)
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
          enrichedOptions: [
            { label: 'n8n', value: 'n8n', recommended: true },
            { label: 'Make (Integromat)', value: 'Make' },
            { label: 'Zapier', value: 'Zapier' }
          ]
        }
      };
    }

    // Convert the plan to a legacy‑compatible AutomationSpec
    const spec = this.planToSpec(plan);

    // Attempt to generate a logical architecture via the AI service
    let architecture: any = null;
    try {
      architecture = await ArchitectureDesigner.design(spec, {
        personalProvider: (request as any).personalProvider,
        personalApiKey: (request as any).personalApiKey,
        personalModel: (request as any).personalModel
      });
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

    // Build a visual illustration of the architecture for the chat UI
    let visualArchitecture = 'I\'ve designed the architecture for your automation. Please review the visual breakdown below before we generate the JSON:\n\n'
    if (architecture.stages && architecture.stages.length > 0) {
      visualArchitecture += '```mermaid\nflowchart TD\n'
      architecture.stages.forEach((stage: any, index: number) => {
        const shape = stage.category === 'trigger' ? '(( ' : stage.category === 'decision' ? '{ ' : '[ '
        const shapeEnd = stage.category === 'trigger' ? ' ))' : stage.category === 'decision' ? ' }' : ' ]'
        const nodeName = `${stage.id}${shape}"**${stage.name}**<br/>_${stage.purpose}_"${shapeEnd}`
        visualArchitecture += `    ${nodeName}\n`
        
        if (index < architecture.stages.length - 1) {
          visualArchitecture += `    ${stage.id} --> ${architecture.stages[index + 1].id}\n`
        }
      })
      visualArchitecture += '```\n\n'
      
      if (architecture.recommendations && architecture.recommendations.length > 0) {
        visualArchitecture += `**💡 Recommendations:**\n`
        architecture.recommendations.forEach((rec: string) => {
          visualArchitecture += `- ${rec}\n`
        })
      }
    } else {
      visualArchitecture += '_(Architecture diagram unavailable. Click "Approve & Generate" to build it.)_'
    }

    // Return a full architecture proposal for the UI
    return {
      status: 'awaiting_architecture_verification',
      message: visualArchitecture,
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
      
      // Generate workflow JSON (AI-powered)
      const platform = plan.platform?.name || 'n8n'
      const workflowData = await WorkflowJSONGenerator.generateWorkflowAsync(plan, platform, {
        personalProvider: (request as any).personalProvider,
        personalApiKey: (request as any).personalApiKey,
        personalModel: (request as any).personalModel
      })
      
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
      
      const setupMessage = this.generateSetupGuide(plan, platform)

      // Create secondary artifact for the setup guide
      let guideArtifact: any
      try {
        guideArtifact = await ArtifactService.saveArtifact(
          existingBuild.id,
          request.userId,
          `setup-guide.md`,
          'text/markdown',
          'text/markdown',
          setupMessage,
          false // isPrimary
        )
      } catch (saveError) {
        console.error('[Workflow Orchestrator] Failed to save setup guide artifact', saveError)
      }

      // Attach download URL for JSON artifact
      const artifactWithUrl = {
        ...artifact,
        download_url: `/api/alex/artifacts/${artifact.id}/download`
      }
      
      const artifactsList = [artifactWithUrl]
      if (guideArtifact) {
        artifactsList.push({
          ...guideArtifact,
          download_url: `/api/alex/artifacts/${guideArtifact.id}/download`
        })
      }

      // Generate follow-up suggestions based on the workflow type
      const followUpSuggestions = this.generateFollowUpSuggestions(plan)
      const fullMessage = setupMessage + '\n\n' + followUpSuggestions

      return {
        status: 'completed',
        message: fullMessage,
        artifacts: artifactsList,
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
   * Generates a comprehensive, AI-quality markdown setup guide based on the automation plan.
   * This produces a detailed walkthrough with credential setup, testing, and troubleshooting.
   */
  private generateSetupGuide(plan: AutomationPlan, platform: string): string {
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1)
    const objective = plan.objective || 'your automation'
    
    let guide = `# 📋 Setup Guide: ${objective}\n\n`
    guide += `**Platform:** ${platformName}  \n`
    guide += `**Trigger:** ${plan.trigger?.description || plan.trigger?.type || 'Not specified'}  \n`
    if (plan.inputs?.sources?.length) guide += `**Data Sources:** ${plan.inputs.sources.join(', ')}  \n`
    if (plan.outputs?.destinations?.length) guide += `**Outputs:** ${plan.outputs.destinations.join(', ')}  \n`
    
    // Calculate Complexity Score
    const nodeCount = plan.workflow ? plan.workflow.length : 0
    let complexity = 'Moderate'
    if (nodeCount <= 3) complexity = 'Simple (Beginner friendly)'
    else if (nodeCount >= 7) complexity = 'Advanced (Requires careful testing)'
    guide += `**Complexity:** ${complexity} (${nodeCount > 0 ? nodeCount : 'auto-generated'} nodes)  \n`
    
    // Calculate Cost Estimate (rough approximation based on AI models)
    const planText = JSON.stringify(plan).toLowerCase()
    if (planText.includes('gemini') || planText.includes('lmchatgooglegemini')) {
      guide += `**Est. Cost:** Very Low (~$0.00 - $0.50/mo depending on volume via Google Gemini Flash)  \n`
    } else if (planText.includes('openai') || planText.includes('lmchatopenai') || planText.includes('gpt-4')) {
      guide += `**Est. Cost:** Moderate (~$2.00 - $10.00/mo depending on volume via OpenAI API)  \n`
    } else if (planText.includes('claude') || planText.includes('anthropic')) {
      guide += `**Est. Cost:** Moderate (~$3.00 - $15.00/mo depending on volume via Anthropic API)  \n`
    } else if (planText.includes('chat bot') || planText.includes('chatbot') || planText.includes('chainllm') || planText.includes('agent')) {
      guide += `**Est. Cost:** Variable (depends on the AI provider you select in the workflow)  \n`
    } else {
      guide += `**Est. Cost:** Free (no paid AI APIs required, standard n8n integrations)  \n`
    }

    guide += `\n---\n\n`
    
    // Step 1: Download & Import
    guide += `## Step 1: Download & Import the Workflow\n\n`
    if (platform.toLowerCase() === 'n8n') {
      guide += `1. Click the **Download** button to save the \`.json\` workflow file to your computer.\n`
      guide += `2. Open your n8n dashboard (e.g., \`https://your-n8n-instance.com\`).\n`
      guide += `3. Click **"Add Workflow"** or open an existing blank workflow.\n`
      guide += `4. Click the **three-dot menu (⋯)** in the top-right corner of the canvas.\n`
      guide += `5. Select **"Import from File..."** and upload the downloaded \`.json\` file.\n`
      guide += `6. All nodes will be placed on your canvas with connections already wired.\n\n`
    } else {
      guide += `1. Download the workflow file and import it into your ${platformName} workspace.\n\n`
    }
    
    // Step 2: Workflow Architecture Overview
    guide += `## Step 2: Understand Your Workflow Architecture\n\n`
    guide += `Here's what each part of the workflow does:\n\n`
    
    if (plan.workflow && plan.workflow.length > 0) {
      plan.workflow.forEach((step: any, index: number) => {
        guide += `**Node ${index + 1}: ${step.step}**  \n`
        guide += `> ${step.description}  \n`
        if (step.nodeType) guide += `> _n8n node type:_ \`${step.nodeType}\`  \n`
        guide += `\n`
      })
    } else {
      guide += `_Workflow steps were generated dynamically by the AI. Open the JSON to see all nodes._\n\n`
    }

    // Live Preview / Data Flow Simulation
    guide += `### 🔄 Data Flow Simulation (Live Preview)\n\n`
    guide += `_Here is an animated text preview of how data moves through this workflow when it runs:_  \n\n`
    
    // Simulate a payload based on the trigger
    const triggerLower = (plan.trigger?.type || '').toLowerCase()
    let dummyPayload = ''
    if (triggerLower.includes('webhook') || triggerLower.includes('whatsapp') || triggerLower.includes('twilio')) {
      dummyPayload = `{"body": {"From": "whatsapp:+1234567890", "Body": "Hello, I need help with my account."}}`
    } else if (triggerLower.includes('form')) {
      dummyPayload = `{"name": "John Doe", "email": "john@example.com", "budget": "High"}`
    } else if (triggerLower.includes('schedule') || triggerLower.includes('cron')) {
      dummyPayload = `{"timestamp": "${new Date().toISOString()}"}`
    } else {
      dummyPayload = `{"event": "triggered"}`
    }

    guide += `1. 🟢 **Trigger Event**: Workflow starts. Payload received: \`${dummyPayload}\`\n`
    if (plan.workflow && plan.workflow.length > 0) {
      plan.workflow.forEach((step: any, index: number) => {
        const actionText = step.step.toLowerCase()
        if (actionText.includes('if') || actionText.includes('switch')) {
          guide += `${index + 2}. 🔀 **Condition Check**: Evaluates \`${step.step}\`. Routes data to the appropriate branch.\n`
        } else if (actionText.includes('ai') || actionText.includes('summarize') || actionText.includes('agent')) {
          guide += `${index + 2}. 🧠 **AI Processing**: Sends data to the AI model. AI generates response based on system prompt.\n`
        } else if (actionText.includes('slack') || actionText.includes('email') || actionText.includes('gmail') || actionText.includes('message')) {
          guide += `${index + 2}. 📤 **Outgoing Message**: Formats data and sends via ${step.step}.\n`
        } else if (actionText.includes('sheet') || actionText.includes('airtable') || actionText.includes('database')) {
          guide += `${index + 2}. 💾 **Data Storage**: Appends a new row/record to the database.\n`
        } else {
          guide += `${index + 2}. ⚙️ **Processing**: ${step.step} executes.\n`
        }
      })
      guide += `${plan.workflow.length + 2}. 🏁 **Workflow Complete**.\n\n`
    } else {
      guide += `2. ⚙️ **Processing**: Data flows through the generated nodes.\n`
      guide += `3. 🏁 **Workflow Complete**.\n\n`
    }
    
    // Step 3: Configure Credentials (dynamic based on plan)
    guide += `## Step 3: Configure Credentials & API Keys\n\n`
    guide += `The imported workflow has the correct structure, but you need to connect **your personal accounts and API keys** for each service.\n\n`
    
    const credentialSteps: string[] = []
    const allServices = new Set<string>()
    
    // Collect services from inputs, outputs, objective, trigger, and workflow steps
    const allText = [
      ...(plan.inputs?.sources || []),
      ...(plan.outputs?.destinations || []),
      plan.objective || '',
      plan.trigger?.type || '',
      plan.trigger?.description || '',
      ...(plan.workflow?.map((s: any) => `${s.step} ${s.description} ${s.nodeType || ''}`) || [])
    ].join(' ').toLowerCase()
    
    if (allText.includes('gmail') || allText.includes('email')) allServices.add('gmail')
    if (allText.includes('slack')) allServices.add('slack')
    if (allText.includes('sheet') || allText.includes('spreadsheet')) allServices.add('google_sheets')
    if (allText.includes('notion')) allServices.add('notion')
    if (allText.includes('telegram')) allServices.add('telegram')
    if (allText.includes('discord')) allServices.add('discord')
    if (allText.includes('twilio') || allText.includes('whatsapp')) allServices.add('twilio')
    if (allText.includes('openai') || allText.includes('gpt')) allServices.add('openai')
    if (allText.includes('gemini') || allText.includes('google ai')) allServices.add('gemini')
    if (allText.includes('claude') || allText.includes('anthropic')) allServices.add('anthropic')
    if (allText.includes('airtable')) allServices.add('airtable')
    if (allText.includes('webhook')) allServices.add('webhook')
    if (allText.includes('http') || allText.includes('api')) allServices.add('http')

    // If objective mentions AI/bot/chat but no specific model was detected, add a generic AI entry
    const objLower = (plan.objective || '').toLowerCase()
    if ((objLower.includes('summar') || objLower.includes('ai') || objLower.includes('generat') || objLower.includes('analyz') || objLower.includes('bot') || objLower.includes('chat')) &&
        !allServices.has('openai') && !allServices.has('gemini') && !allServices.has('anthropic')) {
      allServices.add('openai')
    }
    
    // Generate credential instructions for detected services
    if (allServices.has('twilio')) {
      credentialSteps.push(`### 📱 Twilio (WhatsApp)\n1. Go to [Twilio Console](https://console.twilio.com/).\n2. Copy your **Account SID** and **Auth Token** from the dashboard.\n3. In n8n, double-click the Webhook node (or Twilio node) and create a new **Twilio API** credential.\n4. Paste your Account SID and Auth Token.\n5. **WhatsApp Setup**: In the Twilio Console, go to **Messaging → Try it Out → Send a WhatsApp Message** to get your Twilio WhatsApp sandbox number. Follow the instructions to join the sandbox.\n6. Set your n8n webhook URL as the **"When a message comes in"** callback URL in Twilio's WhatsApp sandbox settings.`)
    }
    if (allServices.has('openai')) {
      credentialSteps.push(`### 🤖 OpenAI\n1. Go to [OpenAI API Keys](https://platform.openai.com/api-keys) and create a new secret key.\n2. In n8n, double-click the AI/OpenAI node → click **"Create New Credential"** → paste your API key.\n3. Make sure you have sufficient API credits in your OpenAI account.`)
    }
    if (allServices.has('gemini')) {
      credentialSteps.push(`### 🤖 Google Gemini\n1. Go to [Google AI Studio](https://aistudio.google.com/app/apikey) and create a new API key.\n2. In n8n, double-click the Google Gemini / AI node → click **"Create New Credential"** → select **Google Gemini (PaLM) API** → paste your API key.\n3. Note: Gemini 1.5 Flash is free for low usage. For production, check [Google AI pricing](https://ai.google.dev/pricing).`)
    }
    if (allServices.has('anthropic')) {
      credentialSteps.push(`### 🤖 Anthropic (Claude)\n1. Go to [Anthropic Console](https://console.anthropic.com/) and create an API key.\n2. In n8n, double-click the Anthropic node → click **"Create New Credential"** → paste your API key.`)
    }
    if (allServices.has('gmail')) {
      credentialSteps.push(`### 📧 Gmail\n1. In n8n, double-click the Gmail node → click **"Create New Credential"** → select **Gmail OAuth2**.\n2. Follow the Google OAuth consent screen flow to authorize n8n to access your Gmail.\n3. Set the **To** address, **Subject**, and **Body** fields as needed.`)
    }
    if (allServices.has('slack')) {
      credentialSteps.push(`### 💬 Slack\n1. In n8n, double-click the Slack node → click **"Create New Credential"** → select **Slack OAuth2 API**.\n2. Follow the authorization flow to connect your Slack workspace.\n3. Set the **Channel** to the target channel name (e.g., \`#general\`).`)
    }
    if (allServices.has('google_sheets')) {
      credentialSteps.push(`### 📊 Google Sheets\n1. In n8n, double-click the Google Sheets node → click **"Create New Credential"** → select **Google Sheets OAuth2**.\n2. Authorize n8n to access your Google account.\n3. Select the target **Spreadsheet** and **Sheet** from the dropdowns.`)
    }
    if (allServices.has('notion')) {
      credentialSteps.push(`### 📓 Notion\n1. Go to [Notion Integrations](https://www.notion.so/my-integrations) and create a new internal integration.\n2. Copy the **Internal Integration Token**.\n3. In n8n, double-click the Notion node → click **"Create New Credential"** → paste the token.\n4. **Important**: Share the target Notion page/database with your integration via the page's "Share" menu.`)
    }
    if (allServices.has('telegram')) {
      credentialSteps.push(`### 📨 Telegram\n1. Open Telegram and message [@BotFather](https://t.me/BotFather) → send \`/newbot\` to create a bot.\n2. Copy the **Bot Token** BotFather gives you.\n3. In n8n, double-click the Telegram node → click **"Create New Credential"** → paste the Bot Token.\n4. Set the **Chat ID** (you can get it by messaging [@userinfobot](https://t.me/userinfobot)).`)
    }
    if (allServices.has('discord')) {
      credentialSteps.push(`### 🎮 Discord\n1. Go to [Discord Developer Portal](https://discord.com/developers/applications) and create a new application.\n2. Under **Bot**, create a bot and copy the **Bot Token**.\n3. In n8n, double-click the Discord node → paste the Bot Token or use a Webhook URL.`)
    }
    if (allServices.has('airtable')) {
      credentialSteps.push(`### 📋 Airtable\n1. Go to [Airtable Account](https://airtable.com/account) → generate a Personal Access Token.\n2. In n8n, double-click the Airtable node → paste the token.\n3. Select the target Base and Table.`)
    }
    
    if (credentialSteps.length > 0) {
      guide += credentialSteps.join('\n\n') + '\n\n'
    } else {
      guide += `Open any nodes marked with a ⚠️ warning icon and create or select your credentials.\n\n`
    }
    
    // Step 4: Trigger-specific setup
    guide += `## Step 4: Configure the Trigger\n\n`
    const triggerType = (plan.trigger?.type || '').toLowerCase()
    if (triggerType.includes('schedule') || triggerType.includes('cron')) {
      guide += `Your workflow uses a **Schedule Trigger**. By default it may be set to run every hour.\n`
      guide += `- Double-click the trigger node to customize the schedule (e.g., daily at 9 AM, every 30 minutes, etc.).\n`
      guide += `- Use the **Cron Expression** field for advanced scheduling.\n\n`
    } else if (triggerType.includes('webhook') || triggerType.includes('whatsapp') || triggerType.includes('twilio')) {
      guide += `Your workflow uses a **Webhook Trigger**.\n`
      guide += `1. After activating the workflow, n8n will generate a unique **Production Webhook URL** (e.g., \`https://your-n8n.com/webhook/abc123\`).\n`
      guide += `2. Copy this URL and paste it into the external service that will send data to it.\n`
      if (allServices.has('twilio')) {
        guide += `3. **For Twilio/WhatsApp**: Go to your Twilio Console → Messaging → WhatsApp Sandbox → paste the webhook URL into the **"When a message comes in"** field.\n`
      }
      guide += `\n`
    } else if (triggerType.includes('form')) {
      guide += `Your workflow uses a **Form Trigger**. n8n will generate a hosted web form for you.\n`
      guide += `- After activating, click the trigger node to get the **Form URL** you can share with users.\n`
      guide += `- Customize the form fields by editing the trigger node's parameters.\n\n`
    } else if (triggerType.includes('chat')) {
      guide += `Your workflow uses a **Chat Trigger** for AI chatbot functionality.\n`
      guide += `- After activating, n8n provides a built-in chat widget URL you can embed on your website.\n\n`
    } else if (triggerType.includes('manual')) {
      guide += `Your workflow uses a **Manual Trigger**. Click **"Execute Workflow"** to run it on-demand.\n\n`
    } else {
      guide += `Double-click the first (trigger) node to review and configure how the workflow starts.\n\n`
    }
    
    // Step 5: Test
    guide += `## Step 5: Test Your Workflow\n\n`
    guide += `1. Click the **"Test Workflow"** button (or **"Execute Workflow"**) at the bottom of the canvas.\n`
    guide += `2. Watch data flow through each node — click any node to inspect its input/output.\n`
    guide += `3. If a node shows a ⚠️ or ❌ error:\n`
    guide += `   - Double-click it to check the configuration.\n`
    guide += `   - Verify credentials are connected and valid.\n`
    guide += `   - Check that data expressions (e.g., \`{{ $json.body }}\`) match the actual incoming data structure.\n`
    if (allServices.has('twilio')) {
      guide += `4. **WhatsApp Testing**: Send a message from your WhatsApp to the Twilio sandbox number and check if the workflow triggers.\n`
    }
    guide += `\n`
    
    // Step 6: Activate
    guide += `## Step 6: Activate for Production\n\n`
    guide += `Once testing is successful:\n`
    guide += `1. Toggle the **Active** switch in the top-right corner from \`Inactive\` to \`Active\`.\n`
    guide += `2. Your workflow will now run automatically based on the trigger!\n`
    guide += `3. Monitor executions in the **Executions** tab to ensure everything runs smoothly.\n\n`
    
    // Troubleshooting
    guide += `---\n\n`
    guide += `## 🛠️ Troubleshooting\n\n`
    guide += `| Problem | Solution |\n`
    guide += `|---------|----------|\n`
    guide += `| **"Node type not recognized"** | Update n8n to the latest version. AI/LangChain nodes require n8n v1.19+. |\n`
    guide += `| **Credential errors (401/403)** | Re-check your API keys. Tokens may have expired or have insufficient scopes. |\n`
    guide += `| **Empty output** | Verify the data source is reachable and returning data. Test the URL/API in your browser first. |\n`
    guide += `| **Webhook not triggering** | Make sure the workflow is set to **Active** (not just saved). Test with a tool like [webhook.site](https://webhook.site). |\n`
    if (allServices.has('twilio')) {
      guide += `| **WhatsApp messages not arriving** | Ensure you've joined the Twilio sandbox by sending the join code. Check the webhook URL is the **Production** URL (not Test). |\n`
    }
    guide += `\n`
    guide += `---\n\n`
    guide += `Need adjustments? Just ask and I'll modify the workflow for you! 🚀`
    
    return guide
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

  /**
   * Generate context-aware follow-up suggestions based on the workflow type.
   * Suggests complementary workflows or enhancements the user might want next.
   */
  private generateFollowUpSuggestions(plan: AutomationPlan): string {
    const objective = (plan.objective || '').toLowerCase()
    const trigger = (plan.trigger?.type || '').toLowerCase()
    const workflow = plan.workflow || []
    const workflowStr = JSON.stringify(workflow).toLowerCase()
    
    const suggestions: string[] = []

    // ── Chatbot / WhatsApp / Telegram / Customer Service ──
    if (objective.includes('chatbot') || objective.includes('chat bot') || objective.includes('customer service') || objective.includes('whatsapp') || objective.includes('telegram')) {
      suggestions.push('📊 **Conversation Analytics Dashboard** — Build a workflow that logs every conversation to Google Sheets or Airtable, then generates a daily summary report (busiest hours, common questions, sentiment analysis).')
      suggestions.push('🚨 **Human Escalation Workflow** — Create a separate workflow that gets triggered when the AI bot detects an angry customer or a question it cannot answer, automatically notifying a human agent via Slack or Email.')
      suggestions.push('📝 **FAQ Auto-Updater** — Build a workflow that analyzes repeated unanswered questions and automatically suggests new FAQ entries to add to the bot\'s knowledge base.')
    }

    // ── Content / Summarization / RSS ──
    if (objective.includes('summar') || objective.includes('content') || objective.includes('rss') || objective.includes('news') || objective.includes('digest')) {
      suggestions.push('📅 **Weekly Digest Compiler** — Instead of individual summaries, build a workflow that collects all summaries from the week and sends a single polished digest every Monday morning.')
      suggestions.push('🔍 **Trending Topics Alert** — Add a workflow that detects when a topic appears across multiple sources and sends a "trending" alert to your team immediately.')
    }

    // ── Email / Lead / CRM ──
    if (objective.includes('email') || objective.includes('lead') || objective.includes('crm') || objective.includes('sales')) {
      suggestions.push('🏷️ **Lead Scoring Workflow** — Build a workflow that scores incoming leads (based on company size, job title, urgency keywords) and routes hot leads directly to your sales team on Slack.')
      suggestions.push('📧 **Follow-up Email Sequence** — Create an automated follow-up workflow that sends a thank-you email after 1 hour and a check-in email after 3 days if no response.')
    }

    // ── Webhook-triggered ──
    if (trigger.includes('webhook') || trigger.includes('form')) {
      suggestions.push('🛡️ **Input Validation Workflow** — Add a pre-processing workflow that validates and sanitizes incoming webhook data before it reaches your main workflow, rejecting spam or malformed requests.')
    }

    // ── Schedule-triggered ──
    if (trigger.includes('schedule') || trigger.includes('cron')) {
      suggestions.push('📊 **Execution Report** — Build a monitoring workflow that tracks every run of this scheduled workflow and sends you a weekly success/failure report.')
    }

    // ── Generic (always useful) ──
    if (suggestions.length < 2) {
      suggestions.push('🔔 **Error Alert Workflow** — Build a companion workflow using the Error Trigger that notifies you on Slack or Email whenever this workflow fails, so you can fix issues quickly.')
      suggestions.push('📈 **Usage Tracker** — Add a simple logging workflow that records every execution to Google Sheets, helping you track usage patterns over time.')
    }

    // Take at most 3 suggestions
    const selectedSuggestions = suggestions.slice(0, 3)

    let output = '---\n\n'
    output += '## 🚀 What\'s Next? Recommended Follow-Up Workflows\n\n'
    output += 'To make your automation even more powerful, consider adding:\n\n'
    for (const suggestion of selectedSuggestions) {
      output += `${suggestion}\n\n`
    }
    output += '> 💬 Just ask me to build any of these and I\'ll design it for you!\n'

    return output
  }
}