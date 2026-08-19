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

    // Get orchestrator response with AI request
    const orchestratorResponse = await AlexOrchestrator.orchestrate({
      ...request,
      platformContext,
      attachedFiles: request.attachedFiles,
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
      
      // Process through orchestrator first
      const { orchestratorResponse, platformContext } = await this.processChat({
        ...request,
        attachedFiles: request.attachedFiles,
        conversationId: request.conversationId,
        enableRetrieval: request.enableRetrieval,
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
      // Stream with fallback through ProviderManager (instead of single provider)
      for await (const event of providerManager.executeStreamingWithFallback({
        messages: orchestratorResponse.aiRequest.messages,
        model: request.model,
        temperature: request.temperature,
        maxTokens: request.maxTokens,
        stream: true,
        conversationId: request.conversationId,
        mode: request.mode,
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
