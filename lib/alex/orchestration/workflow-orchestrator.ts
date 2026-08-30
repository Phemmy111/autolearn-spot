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
      
      // Attach download URL
      const artifactWithUrl = {
        ...artifact,
        download_url: `/api/alex/artifacts/${artifact.id}/download`
      }
      
      const setupMessage = this.generateSetupGuide(plan, platform)

      return {
        status: 'completed',
        message: setupMessage,
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
   * Generates a comprehensive, AI-quality markdown setup guide based on the automation plan.
   * This produces a detailed walkthrough with credential setup, testing, and troubleshooting.
   */
  private generateSetupGuide(plan: AutomationPlan, platform: string): string {
    const platformName = platform.charAt(0).toUpperCase() + platform.slice(1)
    const objective = plan.objective || 'your automation'
    
    let guide = `Your **${platformName}** workflow has been generated successfully! 🎉\n\n`
    guide += `---\n\n`
    guide += `## 🚀 Complete Setup Guide\n\n`
    
    // Step 1: Download & Import
    guide += `### Step 1: Download & Import\n`
    guide += `1. Click the **Download** button below to save the \`.json\` workflow file.\n`
    if (platform.toLowerCase() === 'n8n') {
      guide += `2. Open your n8n dashboard and click **Add Workflow** (or create a new blank workflow).\n`
      guide += `3. Click the **three-dot menu (⋯)** in the top-right corner of the canvas.\n`
      guide += `4. Select **Import from file...** and upload the downloaded JSON file.\n`
      guide += `5. All nodes will automatically populate on your canvas!\n\n`
    } else if (platform.toLowerCase() === 'zapier') {
      guide += `2. Open your Zapier dashboard and create a new Zap.\n`
      guide += `3. Configure each step according to the specification below.\n\n`
    } else {
      guide += `2. Open your ${platformName} workspace and import the downloaded file.\n\n`
    }
    
    // Step 2: Configure Credentials (dynamic based on plan)
    guide += `### Step 2: Configure Credentials\n`
    guide += `The imported workflow has the correct structure, but it needs **your personal API keys** to function:\n\n`
    
    const credentialSteps: string[] = []
    const allServices = new Set<string>()
    
    // Collect services from inputs
    if (plan.inputs?.sources) {
      plan.inputs.sources.forEach((src: string) => {
        const srcLower = (src || '').toLowerCase()
        if (srcLower.includes('gmail') || srcLower.includes('email')) allServices.add('gmail')
        if (srcLower.includes('slack')) allServices.add('slack')
        if (srcLower.includes('sheet')) allServices.add('google_sheets')
        if (srcLower.includes('notion')) allServices.add('notion')
        if (srcLower.includes('telegram')) allServices.add('telegram')
        if (srcLower.includes('discord')) allServices.add('discord')
        if (srcLower.includes('openai') || srcLower.includes('ai') || srcLower.includes('gpt')) allServices.add('openai')
      })
    }
    
    // Collect services from outputs
    if (plan.outputs?.destinations) {
      plan.outputs.destinations.forEach((dest: string) => {
        const destLower = (dest || '').toLowerCase()
        if (destLower.includes('gmail') || destLower.includes('email')) allServices.add('gmail')
        if (destLower.includes('slack')) allServices.add('slack')
        if (destLower.includes('sheet')) allServices.add('google_sheets')
        if (destLower.includes('notion')) allServices.add('notion')
        if (destLower.includes('telegram')) allServices.add('telegram')
        if (destLower.includes('discord')) allServices.add('discord')
      })
    }
    
    // Check objective for AI usage
    const objLower = (plan.objective || '').toLowerCase()
    if (objLower.includes('summar') || objLower.includes('ai') || objLower.includes('generat') || objLower.includes('analyz') || objLower.includes('bot') || objLower.includes('chat')) {
      allServices.add('openai')
    }
    
    // Generate credential instructions for detected services
    if (allServices.has('openai')) {
      credentialSteps.push(`- **OpenAI / AI Model**: Double-click the AI node → Create a new OpenAI credential → Paste your [OpenAI API key](https://platform.openai.com/api-keys).`)
    }
    if (allServices.has('gmail')) {
      credentialSteps.push(`- **Gmail**: Double-click the Gmail node → Follow the OAuth2 flow to connect your Google account, or provide your Gmail credentials.`)
    }
    if (allServices.has('slack')) {
      credentialSteps.push(`- **Slack**: Double-click the Slack node → Create a new Slack OAuth2 credential → Follow the authorization flow to connect your workspace. Set the **channel** to the one you want messages posted to.`)
    }
    if (allServices.has('google_sheets')) {
      credentialSteps.push(`- **Google Sheets**: Double-click the Google Sheets node → Connect your Google account via OAuth2 → Select the target spreadsheet and sheet.`)
    }
    if (allServices.has('notion')) {
      credentialSteps.push(`- **Notion**: Double-click the Notion node → Create a Notion credential with your [internal integration token](https://www.notion.so/my-integrations).`)
    }
    if (allServices.has('telegram')) {
      credentialSteps.push(`- **Telegram**: Double-click the Telegram node → Enter your Bot Token (get one from [@BotFather](https://t.me/BotFather)) → Set the Chat ID.`)
    }
    if (allServices.has('discord')) {
      credentialSteps.push(`- **Discord**: Double-click the Discord node → Provide your Discord Bot Token or Webhook URL.`)
    }
    
    if (credentialSteps.length > 0) {
      guide += credentialSteps.join('\n') + '\n\n'
    } else {
      guide += `- Open any nodes marked with a ⚠️ warning icon and create or select your credentials.\n\n`
    }
    
    // Step 3: Customize Parameters
    guide += `### Step 3: Review & Customize Parameters\n`
    
    if (plan.trigger) {
      const triggerType = (plan.trigger.type || '').toLowerCase()
      if (triggerType.includes('schedule') || triggerType.includes('cron')) {
        guide += `- **Schedule**: The trigger is set to run on a schedule. Double-click it to adjust the time/frequency if needed.\n`
      } else if (triggerType.includes('webhook')) {
        guide += `- **Webhook URL**: After activating the workflow, n8n will generate a unique webhook URL. Copy it and configure it in your source application.\n`
      }
    }
    
    guide += `- **Data Mapping**: Review each node's parameters to ensure the expressions (e.g. \`{{ $json.field }}\`) correctly reference the data from previous nodes.\n`
    guide += `- **Node Parameters**: Customize text templates, filters, and output formats to match your exact needs.\n\n`
    
    // Step 4: Test
    guide += `### Step 4: Test Your Workflow\n`
    guide += `1. Click the **Test Workflow** button (or "Execute Workflow") at the bottom of the canvas.\n`
    guide += `2. Check that data flows correctly through each node — you can click any node to inspect its output.\n`
    guide += `3. If any node shows an error, double-click it to review the configuration.\n\n`
    
    // Step 5: Activate
    guide += `### Step 5: Activate\n`
    guide += `Once testing is successful, toggle the **Active** switch in the top-right corner from \`Inactive\` to \`Active\`. Your workflow will now run automatically!\n\n`
    
    // Troubleshooting
    guide += `---\n\n`
    guide += `### 💡 Troubleshooting Tips\n`
    guide += `- **"Node type not recognized"**: Make sure your n8n instance is up-to-date. Some nodes (like AI/LangChain nodes) require n8n v1.19+.\n`
    guide += `- **Credential errors**: Re-check your API keys. Most issues come from expired tokens or incorrect scopes.\n`
    guide += `- **Empty output**: Verify that the data source (RSS feed, API, etc.) is reachable and returning data.\n\n`
    guide += `Let me know if you need any adjustments or help setting up the credentials! 🛠️`
    
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
}