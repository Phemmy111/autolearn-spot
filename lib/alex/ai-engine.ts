/**
 * ALEX AI Engine
 *
 * Coordinates between the orchestrator and provider manager.
 * This is the main entry point for AI operations in ALEX.
 * Phase 2B: Integrated platform context loading
 * Phase 2C: Database-driven provider management with fallback
 * Phase 2D: Request-local provider isolation for concurrency safety
 * Phase 3A: File/document context integration
 */

import { AlexOrchestrator, OrchestratorRequest, OrchestratorResponse } from './orchestrator';
import { ProviderRegistry } from './provider/provider-registry';
import { ProviderManager } from './provider/provider-manager';
import { AIProvider, AIStreamEvent, AIMessage } from './provider/provider-interface';
import { PlatformContext } from './context/context-types';
import { loadPlatformContext } from './context';
import { AlexFile } from './types';

export class AIEngine {
  private static adminProviderManager: ProviderManager | null = null

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
  }): Promise<{
    orchestratorResponse: OrchestratorResponse;
    provider: AIProvider;
    platformContext?: PlatformContext;
    imageFiles?: AlexFile[];
  }> {
    // Create request-local provider registry
    const registry = new ProviderRegistry()
    const providerManager = new ProviderManager(registry)

    // Load providers from database (per-request)
    await providerManager.loadProviders()

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

    // Get orchestrator response with AI request
    const orchestratorResponse = await AlexOrchestrator.orchestrate({
      ...request,
      platformContext,
      attachedFiles: request.attachedFiles,
    });

    // Get active provider from registry (request-local)
    const provider = registry.getActiveProvider();

    if (!provider) {
      throw new Error('No active AI provider configured');
    }

    return {
      orchestratorResponse,
      provider,
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
  }): AsyncGenerator<{
    type: 'orchestrator' | 'stream';
    data: any;
    imageFiles?: AlexFile[];
  }> {
    let hasEmittedContent = false
    let streamError: Error | null = null
    let fallbackAttempted = false
    let constructedMessages: AIMessage[] | null = null

    try {
      console.log('[DIAGNOSTIC] AI ENGINE START', {
        hasAttachedFiles: !!request.attachedFiles,
        attachedFilesCount: request.attachedFiles?.length || 0,
        attachedFileIds: request.attachedFiles?.map(f => f.id) || []
      })
      console.log('[AI Engine] Starting streamChat')
      // Process through orchestrator
      const { orchestratorResponse, provider } = await this.processChat({
        ...request,
        attachedFiles: request.attachedFiles,
        conversationId: request.conversationId,
        enableRetrieval: request.enableRetrieval,
      });
      console.log('[DIAGNOSTIC] AI ENGINE ORCHESTRATOR COMPLETE', {
        providerId: provider.id,
        orchestratorMessagesCount: orchestratorResponse.aiRequest.messages.length,
        orchestratorHasFileContext: orchestratorResponse.aiRequest.messages.some(m =>
          m.content?.includes('Attached Documents') || m.content?.includes('ALPHA-7391')
        )
      })
      console.log('[AI Engine] Orchestrator response received, provider:', provider.id)

      // Preserve constructed messages for potential fallback
      constructedMessages = orchestratorResponse.aiRequest.messages

      yield {
        type: 'orchestrator',
        data: {
          detectedIntent: orchestratorResponse.detectedIntent,
          suggestedMode: orchestratorResponse.suggestedMode,
          aiRequest: orchestratorResponse.aiRequest,
        },
        imageFiles: orchestratorResponse.imageFiles,
      };

      console.log('[AI Engine] Starting provider stream, supportsStreaming:', provider.supportsStreaming())
      // Stream from provider
      if (provider.supportsStreaming()) {
        for await (const event of provider.stream(orchestratorResponse.aiRequest)) {
          console.log('[AI Engine] Stream event:', event.type)

          // Track if meaningful content has been emitted
          if (event.type === 'delta' && event.data?.text) {
            hasEmittedContent = true
          }

          // If this is an error event, throw it to trigger fallback
          if (event.type === 'error') {
            console.log('[AI Engine] Error event received from provider, throwing to trigger fallback:', event.error || event.data?.error)
            throw new Error(event.error || event.data?.error || 'Stream error')
          }

          yield {
            type: 'stream',
            data: event,
          };
        }
      } else {
        // Fallback to non-streaming for providers that don't support it
        const response = await provider.generate(orchestratorResponse.aiRequest);
        hasEmittedContent = true
        yield {
          type: 'stream',
          data: {
            type: 'delta',
            data: { text: response.content },
          },
        };
        yield {
          type: 'stream',
          data: {
            type: 'finish',
            data: { usage: response.usage },
          },
        };
      }
    } catch (error) {
      streamError = error instanceof Error ? error : new Error('Unknown error')

      // If content was already emitted, do NOT attempt fallback
      // Terminate stream with error instead
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

      // If no content emitted yet and fallback not yet attempted, try fallback
      if (!fallbackAttempted) {
        fallbackAttempted = true
        try {
          const registry = new ProviderRegistry()
          const providerManager = new ProviderManager(registry)

          // Use the preserved constructed messages to maintain file context in fallback
          const messagesForFallback = constructedMessages || [{ role: 'user', content: request.content }]

          console.log('[AI Engine] Attempting fallback with preserved messages:', messagesForFallback.length)

          // Stream with fallback through ProviderManager
          for await (const event of providerManager.executeStreamingWithFallback({
            messages: messagesForFallback,
            model: request.model,
            temperature: request.temperature,
            maxTokens: request.maxTokens,
            stream: true,
            conversationId: request.conversationId,
            mode: request.mode,
          })) {
            if (event.type === 'delta' && event.data?.text) {
              hasEmittedContent = true
            }
            yield {
              type: 'stream',
              data: event,
            };
          }
        } catch (fallbackError) {
          // Fallback also failed
          yield {
            type: 'stream',
            data: {
              type: 'error',
              data: {
                error: streamError.message,
                fallbackFailed: true,
              },
            },
          };
        }
      } else {
        // Already attempted fallback and it failed
        yield {
          type: 'stream',
          data: {
            type: 'error',
            data: { error: streamError.message },
          },
        };
      }
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
