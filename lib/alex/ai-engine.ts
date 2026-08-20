/**
 * ALEX AI Engine
 *
 * Coordinates between the orchestrator and provider manager.
 * This is the main entry point for AI operations in ALEX.
 * Phase 2B: Integrated platform context loading
 * Phase 2C: Database-driven provider management with fallback
 * Phase 2D: Request-local provider isolation for concurrency safety
 * Phase 3A: File/document context integration
 * Phase 3C: Web research integration
 */

import { AlexOrchestrator, OrchestratorRequest, OrchestratorResponse } from './orchestrator';
import { ProviderRegistry } from './provider/provider-registry';
import { ProviderManager } from './provider/provider-manager';
import { AIProvider, AIStreamEvent, AIMessage } from './provider/provider-interface';
import { PlatformContext } from './context/context-types';
import { loadPlatformContext } from './context';
import { AlexFile } from './types';
import { WebResearchService } from './web-research/web-research-service';
import { MockSearchProvider } from './web-research/mock-search-provider';
import { TavilySearchProvider } from './web-research/tavily-search-provider';
import { ToolRegistry, ToolExecutionService, calculatorToolDefinition, calculatorToolExecutor, currentTimeToolDefinition, currentTimeToolExecutor, webSearchToolDefinition, createWebSearchToolExecutor } from './tools';

export class AIEngine {
  private static adminProviderManager: ProviderManager | null = null
  private static adminProviderRegistry: ProviderRegistry | null = null
  private static webResearchService: WebResearchService | null = null
  private static toolRegistry: ToolRegistry | null = null
  private static toolExecutionService: ToolExecutionService | null = null

  /**
   * Initialize tool registry with built-in tools
   */
  private static initializeToolRegistry(): void {
    if (!this.toolRegistry) {
      this.toolRegistry = new ToolRegistry()

      // Register built-in tools
      this.toolRegistry.registerTool(calculatorToolDefinition, calculatorToolExecutor)
      this.toolRegistry.registerTool(currentTimeToolDefinition, currentTimeToolExecutor)

      console.log('[AI Engine] Tool registry initialized with', this.toolRegistry.getToolCount(), 'tools')
    }
  }

  /**
   * Initialize web search tool (called after web research service is initialized)
   */
  private static initializeWebSearchTool(): void {
    if (this.toolRegistry && this.webResearchService) {
      // Check if web_search is already registered
      if (!this.toolRegistry.hasTool('web_search')) {
        const webSearchExecutor = createWebSearchToolExecutor(this.webResearchService)
        this.toolRegistry.registerTool(webSearchToolDefinition, webSearchExecutor)
        console.log('[AI Engine] Web search tool registered')
      }
    }
  }

  /**
   * Initialize tool execution service
   */
  private static initializeToolExecutionService(): void {
    if (!this.toolExecutionService && this.toolRegistry) {
      this.toolExecutionService = new ToolExecutionService(this.toolRegistry)
      console.log('[AI Engine] Tool execution service initialized')
    }
  }

  /**
   * Initialize web research service with Tavily provider
   * Falls back to mock provider if Tavily API key is not configured
   */
  private static initializeWebResearchService(): void {
    if (!this.webResearchService) {
      // Try to use Tavily if API key is available
      const tavilyApiKey = process.env.TAVILY_API_KEY;
      
      console.log('[AI Engine] Web research initialization check:', {
        hasApiKey: !!tavilyApiKey,
        keyLength: tavilyApiKey?.length || 0,
        keyPrefix: tavilyApiKey?.substring(0, 8) + '...' || 'none'
      });
      
      if (tavilyApiKey) {
        console.log('[AI Engine] Initializing web research service with Tavily provider');
        const tavilyProvider = new TavilySearchProvider({
          id: 'tavily-search',
          name: 'Tavily Search',
          type: 'tavily',
          priority: 1, // Higher priority than mock
          enabled: true,
          config: { apiKey: tavilyApiKey }
        });
        this.webResearchService = new WebResearchService(tavilyProvider);
        console.log('[AI Engine] Tavily provider initialized successfully');
      } else {
        console.log('[AI Engine] Tavily API key not configured, using mock provider');
        // Fall back to mock provider for development/testing
        const mockProvider = new MockSearchProvider({
          id: 'mock-search',
          name: 'Mock Search Provider',
          type: 'custom',
          priority: 100,
          enabled: true,
          config: {}
        });
        this.webResearchService = new WebResearchService(mockProvider);
      }

      // Initialize web search tool after web research service is ready
      this.initializeWebSearchTool()
    }
  }

  /**
   * Process a chat request through the ALEX AI engine
   * Creates request-local provider registry for concurrency safety
   */
  static async processChat(request: OrchestratorRequest & {
    userId?: string;
    userEmail?: string;
    userName?: string;
    attachedFiles?: AlexFile[];
    conversationId?: string;
    enableRetrieval?: boolean;
    modelName?: string;
    enableTokenAwareAssembly?: boolean;
    providerCapabilities?: string[];
    enableWebResearch?: boolean;
    disableTools?: boolean;
    enableMemory?: boolean;
    enableAgent?: boolean; // Phase 6: Enable agent mode
    aiEngine?: AIEngine; // Phase 6: AI engine instance
  }): Promise<{
    orchestratorResponse: OrchestratorResponse;
    platformContext?: PlatformContext;
    imageFiles?: AlexFile[];
  }> {
    // Load platform context if user ID is provided
    let platformContext: PlatformContext | undefined;
    if (request.userId) {
      try {
        const contextResult = await loadPlatformContext({
          userId: request.userId,
          userEmail: request.userEmail,
          userName: request.userName,
          userIntent: request.content,
          conversationMode: request.mode,
        });
        platformContext = contextResult.context;

        // Log context loading results
        if (contextResult.unavailableContexts.length > 0) {
          console.log('[AI Engine] Some contexts unavailable:', contextResult.unavailableContexts);
        }
        if (contextResult.errors.length > 0) {
          console.log('[AI Engine] Context loading errors:', contextResult.errors);
        }
      } catch (error) {
        console.error('[AI Engine] Failed to load platform context:', error);
        // Continue without platform context if loading fails
      }
    }

    // Initialize web research service if enabled
    let webResearchService: WebResearchService | undefined;
    if (request.enableWebResearch) {
      this.initializeWebResearchService();
      webResearchService = this.webResearchService;
    }

    // Get orchestrator response with AI request
    const orchestratorResponse = await AlexOrchestrator.orchestrate({
      ...request,
      platformContext,
      attachedFiles: request.attachedFiles,
      providerCapabilities: request.providerCapabilities,
      webResearchService,
      enableAgent: request.enableAgent, // Phase 6: Pass agent flag
      aiEngine: request.aiEngine || this, // Phase 6: Pass AI engine
    });

    return {
      orchestratorResponse,
      platformContext,
      imageFiles: orchestratorResponse.imageFiles,
    };
  }

  /**
   * Stream a chat response with safe fallback handling
   * Creates request-local provider registry for concurrency safety
   */
  static async *streamChat(request: OrchestratorRequest & {
    userId?: string;
    userEmail?: string;
    userName?: string;
    attachedFiles?: AlexFile[];
    conversationId?: string;
    enableRetrieval?: boolean;
    modelName?: string;
    enableTokenAwareAssembly?: boolean;
    providerCapabilities?: string[];
    enableWebResearch?: boolean;
    disableTools?: boolean;
    enableMemory?: boolean;
    enableTools?: boolean;
    enableAgent?: boolean; // Phase 6: Enable agent mode
  }): AsyncGenerator<{
    type: 'orchestrator' | 'stream';
    data: any;
    imageFiles?: AlexFile[];
  }> {
    let hasEmittedContent = false

    try {
      console.log('[FALLBACK] Starting provider selection for streaming request')
      console.log('[DIAGNOSTIC] AI ENGINE START', {
        hasAttachedFiles: !!request.attachedFiles,
        attachedFilesCount: request.attachedFiles?.length || 0,
        attachedFileIds: request.attachedFiles?.map(f => f.id) || []
      })
      console.log('[AI Engine] Starting streamChat')

      // Initialize tool registry and execution service if tools are enabled
      if (request.enableTools) {
        this.initializeToolRegistry()
        this.initializeToolExecutionService()
      }

      // Create request-local provider registry and manager
      const registry = new ProviderRegistry()
      const providerManager = new ProviderManager(registry)
      
      // Load all providers from database
      await providerManager.loadProviders()
      
      console.log('[FALLBACK] Providers loaded from database')
      
      // Get all enabled providers
      const allProviders = registry.getEnabledProviders()
      console.log('[FALLBACK] Available providers:', allProviders.map(p => ({
        id: p.id,
        name: p.name,
        priority: p.priority,
        type: p.type
      })))
      
      // Check if providers are available
      if (!allProviders || allProviders.length === 0) {
        throw new Error('No AI providers configured. Please configure at least one provider in the admin panel.')
      }
      
      // Process through orchestrator first
      const firstProvider = allProviders[0]

      // Enable web research for research mode or when explicitly requested
      const enableWebResearch = request.enableWebResearch || request.mode === 'research';

      const { orchestratorResponse, platformContext } = await this.processChat({
        ...request,
        attachedFiles: request.attachedFiles,
        conversationId: request.conversationId,
        enableRetrieval: request.enableRetrieval,
        modelName: firstProvider?.model || 'openai/gpt-oss-120b', // Use active provider's model
        enableTokenAwareAssembly: (request.attachedFiles?.length || 0) > 1, // Auto-enable for multi-file
        providerCapabilities: request.providerCapabilities || firstProvider?.capabilities || [], // Pass provider capabilities
        providerManager: providerManager, // Pass provider manager for vision preprocessing
        providerRegistry: registry, // Pass provider registry for vision preprocessing
        enableWebResearch, // Phase 3C: Enable web research
        disableTools: true, // Disable model's built-in function calling to use our Phase 3C web research instead
        enableMemory: request.enableMemory, // Phase 4: Enable memory retrieval
        enableTools: request.enableTools, // Phase 5: Enable tool calling
        toolRegistry: this.toolRegistry, // Phase 5: Pass tool registry
        toolExecutionService: this.toolExecutionService, // Phase 5: Pass tool execution service
        enableAgent: request.enableAgent, // Phase 6: Enable agent mode
        aiEngine: this // Phase 6: Pass AI engine instance for agent execution
      });
      
      console.log('[DIAGNOSTIC] AI ENGINE ORCHESTRATOR COMPLETE', {
        orchestratorMessagesCount: orchestratorResponse.aiRequest.messages.length,
        orchestratorHasFileContext: orchestratorResponse.aiRequest.messages.some(m =>
          m.content?.includes('Attached Documents') || m.content?.includes('ALPHA-7391')
        )
      })
      console.log('[AI Engine] Orchestrator response received')

      yield {
        type: 'orchestrator',
        data: {
          detectedIntent: orchestratorResponse.detectedIntent,
          suggestedMode: orchestratorResponse.suggestedMode,
          aiRequest: orchestratorResponse.aiRequest,
        },
        imageFiles: orchestratorResponse.imageFiles,
      };

      console.log('[FALLBACK] Starting streaming with fallback through ProviderManager')
      console.log('[ToolDebug] tools_enabled:', request.enableTools)
      console.log('[ToolDebug] tool_definitions_count:', request.enableTools && this.toolRegistry ? this.toolRegistry.listEnabledTools().length : 0)

      // First streaming attempt - check for tool calls
      let toolCallReceived = false
      let receivedToolCall: any = null

      for await (const event of providerManager.executeStreamingWithFallback({
        messages: orchestratorResponse.aiRequest.messages,
        model: request.model,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        stream: true,
        conversationId: request.conversationId,
        mode: request.mode,
        disableTools: !request.enableTools, // Pass through tool enable/disable
        tools: request.enableTools && this.toolRegistry ? this.toolRegistry.listEnabledTools() : undefined,
      })) {
        // Check for error events and convert to thrown errors for proper fallback handling
        if (event.type === 'error') {
          console.log('[AI Engine] Error event from provider - throwing to trigger fallback:', event.data?.error)
          throw new Error(event.data?.error || 'Stream error')
        }

        // Handle tool calls
        if (event.type === 'tool_call' && request.enableTools && this.toolExecutionService) {
          const toolCall = event.data.toolCall
          console.log('[ToolDebug] tool_call_received:', toolCall.toolName)
          console.log('[ToolDebug] tool_name:', toolCall.toolName)
          toolCallReceived = true
          receivedToolCall = toolCall
          break // Stop streaming, execute tool
        }

        if (event.type === 'delta' && event.data?.text) {
          hasEmittedContent = true
        }
        yield {
          type: 'stream',
          data: event,
        };
      }

      // If no tool call, we're done
      if (!toolCallReceived) {
        console.log('[ToolDebug] no_tool_call - normal response')
        return
      }

      // Execute tool
      console.log('[ToolDebug] tool_execution_started:', receivedToolCall.toolName)
      this.toolExecutionService.resetRequestCallCount(request.userId || '', request.conversationId)
      const toolResult = await this.toolExecutionService.executeTool(
        {
          id: receivedToolCall.id,
          toolName: receivedToolCall.toolName,
          arguments: receivedToolCall.arguments,
          userId: request.userId || '',
          conversationId: request.conversationId
        },
        { userId: request.userId || '', conversationId: request.conversationId }
      )

      console.log('[ToolDebug] tool_execution_completed:', receivedToolCall.toolName)
      console.log('[ToolDebug] tool_result:', toolResult.success ? 'success' : 'failed')

      // Yield tool result event to frontend
      yield {
        type: 'stream',
        data: {
          type: 'tool_result',
          data: {
            toolCallId: receivedToolCall.id,
            toolName: receivedToolCall.toolName,
            result: toolResult.success ? toolResult.result : { error: toolResult.error },
            success: toolResult.success,
            error: toolResult.error
          }
        }
      }

      // Add tool result to conversation for final response
      const updatedMessages = [
        ...orchestratorResponse.aiRequest.messages,
        {
          role: 'assistant',
          content: JSON.stringify({
            tool_call_id: receivedToolCall.id,
            tool_name: receivedToolCall.toolName,
            result: toolResult.success ? toolResult.result : { error: toolResult.error }
          })
        }
      ]

      console.log('[ToolDebug] tool_result_sent_to_model')
      console.log('[ToolDebug] starting_final_response')

      // Stream final response with tool result
      for await (const event of providerManager.executeStreamingWithFallback({
        messages: updatedMessages,
        model: request.model,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        stream: true,
        conversationId: request.conversationId,
        mode: request.mode,
        disableTools: true, // Disable tools for final response
        tools: undefined, // No tools for final response
      })) {
        // Check for error events and convert to thrown errors for proper fallback handling
        if (event.type === 'error') {
          console.log('[AI Engine] Error event from provider - throwing to trigger fallback:', event.data?.error)
          throw new Error(event.data?.error || 'Stream error')
        }

        if (event.type === 'delta' && event.data?.text) {
          hasEmittedContent = true
        }
        yield {
          type: 'stream',
          data: event,
        };
      }

      console.log('[ToolDebug] final_response')
    } catch (error) {
      const streamError = error instanceof Error ? error : new Error('Unknown error')
      console.log('[FALLBACK] All providers failed - final error:', streamError.message)

      // If content was already emitted, indicate partial response
      if (hasEmittedContent) {
        yield {
          type: 'stream',
          data: {
            type: 'error',
            data: {
              error: streamError.message,
              partial: true,
              message: 'Stream interrupted after partial response. Please retry.',
            },
          },
        };
        return
      }

      // No content emitted - yield final error after all providers failed
      yield {
        type: 'stream',
        data: {
          type: 'error',
          data: {
            error: streamError.message,
            allProvidersFailed: true,
          },
        },
      };
    }
  }

  /**
   * Get provider manager instance (for admin operations)
   * Admin operations use a singleton for consistency across requests
   */
  static getProviderManager(): ProviderManager {
    if (!this.adminProviderManager) {
      const singletonRegistry = new ProviderRegistry()
      this.adminProviderManager = new ProviderManager(singletonRegistry)
    }
    return this.adminProviderManager
  }
}
