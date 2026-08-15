/**
 * ALEX AI Engine
 * 
 * Coordinates between the orchestrator and provider registry.
 * This is the main entry point for AI operations in ALEX.
 */

import { AlexOrchestrator, OrchestratorRequest, OrchestratorResponse } from './orchestrator';
import { providerRegistry } from './provider/provider-registry';
import { AIProvider, AIStreamEvent } from './provider/provider-interface';

export class AIEngine {
  /**
   * Process a chat request through the ALEX AI engine
   */
  static async processChat(request: OrchestratorRequest): Promise<{
    orchestratorResponse: OrchestratorResponse;
    provider: AIProvider;
  }> {
    // Get orchestrator response with AI request
    const orchestratorResponse = await AlexOrchestrator.orchestrate(request);

    // Get active provider from registry
    const provider = providerRegistry.getActiveProvider();
    
    if (!provider) {
      throw new Error('No active AI provider configured');
    }

    return {
      orchestratorResponse,
      provider,
    };
  }

  /**
   * Stream a chat response
   */
  static async *streamChat(request: OrchestratorRequest): AsyncGenerator<{
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
