/**
 * ALEX AI Engine
 * 
 * Coordinates between the orchestrator and provider registry.
 * This is the main entry point for AI operations in ALEX.
 * Phase 2B: Integrated platform context loading
 */

import { AlexOrchestrator, OrchestratorRequest, OrchestratorResponse } from './orchestrator';
import { providerRegistry } from './provider/provider-registry';
import { AIProvider, AIStreamEvent } from './provider/provider-interface';
import { PlatformContext } from './context/context-types';
import { loadPlatformContext } from './context';

export class AIEngine {
  /**
   * Process a chat request through the ALEX AI engine
   */
  static async processChat(request: OrchestratorRequest & { 
    userId?: string;
    userEmail?: string;
    userName?: string;
  }): Promise<{
    orchestratorResponse: OrchestratorResponse;
    provider: AIProvider;
    platformContext?: PlatformContext;
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
    });

    // Get active provider from registry
    const provider = providerRegistry.getActiveProvider();
    
    if (!provider) {
      throw new Error('No active AI provider configured');
    }

    return {
      orchestratorResponse,
      provider,
      platformContext,
    };
  }

  /**
   * Stream a chat response
   */
  static async *streamChat(request: OrchestratorRequest & {
    userId?: string;
    userEmail?: string;
    userName?: string;
  }): AsyncGenerator<{
    type: 'orchestrator' | 'stream';
    data: any;
  }> {
    try {
      // Process through orchestrator
      const { orchestratorResponse, provider } = await this.processChat(request);
      
      yield {
        type: 'orchestrator',
        data: {
          detectedIntent: orchestratorResponse.detectedIntent,
          suggestedMode: orchestratorResponse.suggestedMode,
        },
      };

      // Stream from provider
      if (provider.supportsStreaming()) {
        for await (const event of provider.stream(orchestratorResponse.aiRequest)) {
          yield {
            type: 'stream',
            data: event,
          };
        }
      } else {
        // Fallback to non-streaming for providers that don't support it
        const response = await provider.generate(orchestratorResponse.aiRequest);
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
      yield {
        type: 'stream',
        data: {
          type: 'error',
          data: { error: error instanceof Error ? error.message : 'Unknown error' },
        },
      };
    }
  }

  /**
   * Get current provider health status
   */
  static async getProviderHealth() {
    return await providerRegistry.checkAllProvidersHealth();
  }

  /**
   * Get active provider information
   */
  static getActiveProvider() {
    return providerRegistry.getActiveProvider();
  }
}
