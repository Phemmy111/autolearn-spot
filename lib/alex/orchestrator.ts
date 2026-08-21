import { AlexMode, AlexFile } from './types'
import { detectIntent } from './intent-detector'
import { assembleContext, AssemblyResult } from './context-assembly'
import { AIRequest, AIMessage, ImageContent } from './provider/provider-interface'
import { PlatformContext } from './context/context-types'
import { ProviderManager } from './provider/provider-manager'
import { ProviderRegistry } from './provider/provider-registry'
import { WebResearchService } from './web-research/web-research-service'
import { ToolRegistry, ToolExecutionService } from './tools'
import { AgentService, AgentExecutionResult } from './agents'
import { AIEngine } from './ai-engine'

export interface OrchestratorRequest {
  content: string
  mode: AlexMode
  conversationHistory: Array<{ role: string; content: string }>
  platformContext?: PlatformContext
  userIntent?: string
  attachedFiles?: AlexFile[]
  userId?: string
  conversationId?: string
  enableRetrieval?: boolean
  modelName?: string // Model name for context limit calculation
  enableTokenAwareAssembly?: boolean // Enable token-aware assembly for multi-file
  providerCapabilities?: string[] // Provider capabilities (e.g., 'vision', 'multimodal')
  providerManager?: ProviderManager // Provider manager for vision preprocessing
  providerRegistry?: ProviderRegistry // Provider registry for vision preprocessing
  webResearchService?: WebResearchService // Phase 3C: Web research service
  disableTools?: boolean // Disable model's built-in function calling to use Phase 3C web research instead
  enableMemory?: boolean // Phase 4: Enable memory retrieval
  enableTools?: boolean // Phase 5: Enable tool calling
  toolRegistry?: ToolRegistry // Phase 5: Tool registry
  toolExecutionService?: ToolExecutionService // Phase 5: Tool execution service
  enableAgent?: boolean // Phase 6: Enable agent mode for multi-step execution
  aiEngine?: AIEngine // Phase 6: AI engine for agent execution
  signal?: AbortSignal // Phase 6: Cancellation signal
  // Phase 7: Workflow generation support
  workflowJson?: string // Direct workflow JSON input
  workflowErrors?: string[] // Workflow error debugging
  generateWorkflowArtifact?: boolean // Generate downloadable workflow
}

export interface OrchestratorResponse {
  systemPrompt: string
  context: string
  detectedIntent?: string
  suggestedMode?: AlexMode
  aiRequest: AIRequest
  imageFiles?: AlexFile[]
  agentResult?: AgentExecutionResult // Phase 6: Agent execution result
}

/**
 * ALEX Orchestrator - Central coordination for AI interactions
 * Refactored for provider independence - communicates through AI Engine interface
 * Phase 2B: Integrated platform context from AutoLearn Spot
 */
export class AlexOrchestrator {
  /**
   * Orchestrate an AI request
   */
  static async orchestrate(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const { content, mode, conversationHistory, platformContext, userIntent, attachedFiles, userId, conversationId, enableRetrieval, modelName, enableTokenAwareAssembly, providerCapabilities, webResearchService, disableTools, enableMemory, enableTools, toolRegistry, toolExecutionService, enableAgent, aiEngine, signal } = request
    
    // Ensure providerCapabilities is always an array
    const capabilities = Array.isArray(providerCapabilities) ? providerCapabilities : []

    // Phase 6: Check if agent mode is enabled
    if (enableAgent && aiEngine && toolRegistry && toolExecutionService && userId) {
      console.log('[Orchestrator] Agent mode enabled, executing controlled multi-step execution')

      const agentService = new AgentService(toolRegistry, toolExecutionService, aiEngine)

      const agentRequest = {
        userId,
        conversationId,
        content,
        mode,
        conversationHistory,
        platformContext,
        systemPrompt: this.generateSystemPrompt(mode, undefined, platformContext, enableTools),
        enableWebResearch: mode === 'research' || request.enableWebResearch,
        enableMemory,
        enableRetrieval,
        webResearchService,
        memoryService: undefined, // Will be handled in context assembly
        toolRegistry,
        toolExecutionService,
        providerManager: request.providerManager,
        providerRegistry: request.providerRegistry,
        providerCapabilities: capabilities,
        modelName: modelName || 'openai/gpt-oss-120b',
        signal,
        // Phase 7: Workflow generation support
        attachedFiles: request.attachedFiles,
        workflowJson: request.workflowJson,
        workflowErrors: request.workflowErrors,
        generateWorkflowArtifact: request.generateWorkflowArtifact
      }

      const agentResult = await agentService.execute(agentRequest, (step) => {
        console.log('[AgentDebug] step_progress', {
          executionId: agentResult.executionId,
          stepNumber: step.stepNumber,
          type: step.type,
          toolName: step.toolName
        })
      })

      // Return agent result with minimal context for streaming
      return {
        systemPrompt: agentRequest.systemPrompt,
        context: `Agent execution completed with ${agentResult.stepCount} steps and ${agentResult.toolCallCount} tool calls.`,
        detectedIntent: 'Agent execution',
        suggestedMode: mode,
        aiRequest: {
          messages: [
            { role: 'system', content: agentRequest.systemPrompt },
            { role: 'user', content: content }
          ],
          stream: true,
          disableTools: true
        },
        imageFiles: [],
        agentResult
      }
    }

    // Detect intent if in Auto mode
    let detectedIntent: string | undefined
    let suggestedMode: AlexMode | undefined

    if (mode === 'auto') {
      const intentResult = await detectIntent(content)
      detectedIntent = intentResult.intent
      suggestedMode = intentResult.suggestedMode
    }

    // Generate system prompt for token estimation
    const systemPrompt = this.generateSystemPrompt(mode, detectedIntent, platformContext, enableTools)

    // Enable web research for research mode, when intent suggests research, or when explicitly requested
    const enableWebResearch = mode === 'research' || suggestedMode === 'research' || request.enableWebResearch

    // Assemble context with platform context, files, retrieval, web research, and memory if available
    const assemblyResult = await assembleContext(mode, conversationHistory, {
      platformContext,
      userIntent: userIntent || content,
      attachedFiles,
      userId,
      conversationId,
      enableRetrieval,
      enableTokenAwareAssembly: enableTokenAwareAssembly || (attachedFiles && attachedFiles.length > 0), // Auto-enable for all file attachments
      modelName: modelName || 'openai/gpt-oss-120b',
      systemPrompt,
      providerCapabilities: capabilities, // Pass capabilities to context assembly
      providerManager: request.providerManager, // Pass provider manager for vision preprocessing
      providerRegistry: request.providerRegistry, // Pass provider registry for vision preprocessing
      enableWebResearch, // Phase 3C: Enable web research
      webResearchService, // Phase 3C: Pass web research service
      enableMemory // Phase 4: Enable memory retrieval
    })

    const { context, imageFiles } = assemblyResult

    // Build AI request for provider-agnostic interface
    // Note: context already includes platform context, files, web research, memory, etc.
    // So we pass undefined for platformContext to avoid duplication
    const toolDefinitions = enableTools && toolRegistry ? toolRegistry.listEnabledTools().map(t => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema
    })) : undefined
    
    const aiRequest: AIRequest = {
      messages: this.buildMessages(content, systemPrompt, conversationHistory, undefined, context, imageFiles, capabilities),
      stream: true, // Default to streaming
      disableTools: !enableTools, // Disable model's built-in function calling unless Phase 5 tools are enabled
      tools: toolDefinitions // Include tools once to avoid duplication
    }

    console.log('[DIAGNOSTIC] ORCHESTRATOR OUTPUT', {
      messagesCount: aiRequest.messages.length,
      contextLength: context.length,
      hasFileContext: context.includes('Attached Documents'),
      hasImageFiles: imageFiles.length > 0,
      imageFilesCount: imageFiles.length,
      imageFilenames: imageFiles.map(f => f.original_filename),
      contextPreview: context.substring(0, 300),
      messagesPreview: aiRequest.messages.map(m => ({
        role: m.role,
        contentLength: typeof m.content === 'string' ? m.content.length : 'multimodal',
        contentPreview: typeof m.content === 'string' ? m.content.substring(0, 100) : 'multimodal content'
      }))
    })
    console.log('[Orchestrator] AI Request messages count:', aiRequest.messages.length)
    console.log('[Orchestrator] Context length:', context.length)
    console.log('[Orchestrator] Has file context:', context.includes('Attached Documents'))
    console.log('[Orchestrator] Has image files:', imageFiles.length > 0)

    return {
      systemPrompt,
      context,
      detectedIntent,
      suggestedMode,
      aiRequest,
      imageFiles,
    }
  }

  /**
   * Build message array for AI request
   */
  private static buildMessages(
    content: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }>,
    platformContext?: PlatformContext,
    fileContext?: string,
    imageFiles?: AlexFile[],
    providerCapabilities?: string[]
  ): AIMessage[] {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ]

    // Platform context is already included in the main context string, don't duplicate
    // The buildMessages function receives context as a parameter which includes platform context

    // Add file context as a system message if available (Phase 3A)
    if (fileContext && fileContext.trim().length > 0) {
      messages.push({
        role: 'system',
        content: fileContext,
      })
    }

    // Add conversation history with token-aware limiting
    // Use recent messages but limit based on token budget to prevent TPM issues
    const recentHistory = conversationHistory.slice(-10)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }

    // Add current user message with multimodal content if images are present
    // Only use multimodal content if provider supports vision/multimodal capabilities
    const capabilities = Array.isArray(providerCapabilities) ? providerCapabilities : []
    const supportsVision = capabilities.includes('vision') || capabilities.includes('multimodal')
    
    if (imageFiles && imageFiles.length > 0 && supportsVision) {
      // Build multimodal content: text + images
      const multimodalContent: Array<{ type: 'text'; text: string } | ImageContent> = [
        { type: 'text', text: content }
      ]

      // Add images to the content
      for (const imageFile of imageFiles) {
        // Use actual image data (now fetched before orchestrator for TPM accuracy)
        // Fall back to placeholder if image data fetch failed
        const imageUrl = imageFile.imageDataUrl || `placeholder://${imageFile.id}`;
        multimodalContent.push({
          type: 'image_url',
          image_url: {
            url: imageUrl,
            detail: 'auto'
          }
        });
      }

      messages.push({
        role: 'user',
        content: multimodalContent
      })
    } else {
      // Regular text-only message (either no images or provider doesn't support vision)
      // If there are images but provider doesn't support vision, add a note about them
      let messageContent = content
      if (imageFiles && imageFiles.length > 0 && !supportsVision) {
        const imageNames = imageFiles.map(f => f.original_filename).join(', ')
        messageContent = `${content}\n\n[Note: Images attached but current AI provider doesn't support vision: ${imageNames}]`
      }
      
      messages.push({
        role: 'user',
        content: messageContent,
      })
    }

    return messages
  }

  /**
   * Generate system prompt based on mode
   */
  private static generateSystemPrompt(mode: AlexMode, detectedIntent?: string, platformContext?: PlatformContext, enableTools?: boolean): string {
    const basePrompt = `You are ALEX (AutoLearn Intelligence & Execution Agent), an AI assistant for AutoLearn Spot students. You help students learn n8n automation, build AI-powered workflows, and master technical skills.

Your responses should be:
- Clear and educational
- Practical and actionable
- Encouraging and supportive
- Technical when appropriate, but accessible
- Focused on helping students succeed`

    // Add tool calling instructions based on whether tools are enabled
    let toolInstructions = ''
    if (enableTools) {
      toolInstructions = `

CURRENT TIME RULE:
For questions asking for the current time, current date/time, or "right now" time in a location, use the \`current_time\` tool.
- Do NOT use web research for current-time requests.
- Do NOT answer using stale timestamps from context.
- Do NOT calculate the current time from an old timestamp.
- Do NOT invent the current time.
- The actual current time must come from \`current_time\`.
- Use IANA timezone identifiers (e.g., "Africa/Lagos" for Nigeria, "America/New_York", "Europe/London").`
    } else {
      toolInstructions = `

IMPORTANT FUNCTION CALLING RESTRICTION:
- DO NOT use any function calling, tool calling, or plugin syntax
- DO NOT generate <tool_use>, <function_call>, or similar XML-style tags
- DO NOT attempt to call search, web browsing, or other functions
- Respond only with plain text content
- If you need to search the web, rely on the provided web research context in the system messages
- Any web search has already been performed server-side before you receive this request`
    }

    // Add platform context awareness if platform data is available
    let platformAwareness = ''
    if (platformContext && Object.keys(platformContext).length > 0) {
      platformAwareness = `

IMPORTANT: You have been provided with AutoLearn Spot platform context above.
- Platform context contains authoritative data about the user's actual account, enrollments, progress, scholarships, and certificates.
- Use this information to answer platform-specific questions accurately.
- If the platform context does not contain information needed to answer a platform-specific question, state that the information is not available.
- Do not invent or hallucinate platform-specific facts when the platform context is available.
- Distinguish clearly between authoritative platform facts and general knowledge.
- For questions about progress, enrollment, certificates, or scholarships, rely on the provided platform context.`
    }

    const modePrompts: Record<AlexMode, string> = {
      auto: `${basePrompt}${toolInstructions}${platformAwareness}

In Auto mode, you determine the best approach based on the user's request. You can switch between tutoring, development assistance, automation guidance, research, or agent building as needed.

Current detected intent: ${detectedIntent || 'general assistance'}

${enableTools ? 'You have access to tools. Use them when appropriate for the user\'s request.' : 'IMPORTANT: DO NOT use function calling, tool calling, or plugin syntax. Respond only with plain text content.'}`,

      tutor: `${basePrompt}${toolInstructions}

In Tutor mode, your primary focus is learning and education. You should:
- Explain concepts step by step
- Provide examples and analogies
- Ask questions to check understanding
- Encourage active learning
- Reference AutoLearn course content when relevant
- Help students understand the "why" behind the "how"

${enableTools ? 'You have access to tools. Use them when appropriate for educational purposes.' : 'IMPORTANT: DO NOT use function calling, tool calling, or plugin syntax. Respond only with plain text content.'}`,

      developer: `${basePrompt}${toolInstructions}

In Developer mode, you provide technical assistance for:
- Code generation and debugging
- API troubleshooting
- Database assistance
- Configuration issues
- Error analysis
- Best practices
- Code review

Focus on practical, working solutions with clear explanations.

${enableTools ? 'You have access to tools. Use them when appropriate for technical tasks.' : 'IMPORTANT: DO NOT use function calling, tool calling, or plugin syntax. Respond only with plain text content.'}`,

      automation: `${basePrompt}${toolInstructions}

In Automation mode, you specialize in:
- n8n workflow design and troubleshooting
- API integrations
- Webhooks
- Automation best practices
- Business process automation
- Data processing workflows

Provide specific, actionable guidance for building automations.

${enableTools ? 'You have access to tools. Use them when appropriate for automation tasks.' : 'IMPORTANT: DO NOT use function calling, tool calling, or plugin syntax. Respond only with plain text content.'}`,

      research: `${basePrompt}${toolInstructions}

In Research mode, you help with:
- Finding and verifying information
- Comparing sources
- Summarizing complex topics
- Identifying current vs outdated information
- Providing citations where possible

IMPORTANT: Web search has already been performed server-side using the provided search context.
${enableTools ? 'You have access to tools. Use them when appropriate for research tasks.' : '- DO NOT attempt to call search functions or tools\n- DO NOT generate search-related function call syntax\n- Use the provided web research context in the system messages\n- Be thorough and cite your sources when available.'}`,

      agent_builder: `${basePrompt}${toolInstructions}

In Agent Builder mode, you help users:
- Design AI agents
- Define agent purposes and personalities
- Configure agent capabilities
- Plan agent workflows
- Set up agent knowledge bases
- Design agent interactions

Focus on creating practical, deployable agent configurations.

${enableTools ? 'You have access to tools. Use them when appropriate for agent configuration.' : 'IMPORTANT: DO NOT use function calling, tool calling, or plugin syntax. Respond only with plain text content.'}`
    }

    return modePrompts[mode] || modePrompts.auto
  }
}
