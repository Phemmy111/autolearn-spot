/**
 * ALEX Provider Interface - Provider-Agnostic AI Contract
 * 
 * This interface defines the contract that all AI providers must implement.
 * ALEX itself must not depend on any specific provider implementation.
 */

export type AIProviderType = 'self_hosted' | 'openrouter' | 'openai' | 'groq' | 'gemini' | 'openai_compatible';

export type MessageRole = 'user' | 'assistant' | 'system';

export interface ImageContent {
  type: 'image_url';
  image_url: {
    url: string;
    detail?: 'low' | 'high' | 'auto';
  };
}

export interface AIMessage {
  role: MessageRole;
  content: string | Array<{ type: 'text'; text: string } | ImageContent>;
}

export interface AIRequest {
  messages: AIMessage[];
  model?: string;
  temperature?: number;
  maxTokens?: number;
  stream?: boolean;
  tools?: string[]; // Optional: list of tools to enable/disable
  disableTools?: boolean; // Optional: disable all tool/function calling
}

export interface AIUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  content: string;
  model: string;
  usage?: AIUsage;
  finishReason?: string;
  providerMetadata?: Record<string, any>;
}

export type AIStreamEventType = 
  | 'start'
  | 'delta'
  | 'usage'
  | 'finish'
  | 'error';

export interface AIStreamEvent {
  type: AIStreamEventType;
  data?: any;
}

// Phase 5: Tool-related interfaces for provider-agnostic tool calling
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, any>;
}

export interface ToolCall {
  id: string;
  toolName: string;
  arguments: Record<string, any>;
}

export interface ToolCallEvent {
  type: 'tool_call';
  data: {
    toolCall: ToolCall;
  };
}

export interface ToolResultEvent {
  type: 'tool_result';
  data: {
    toolCallId: string;
    toolName: string;
    result: any;
    success: boolean;
    error?: string;
  };
}

export type AIProviderHealthStatus = 'healthy' | 'degraded' | 'unavailable' | 'unknown';

export interface AIProviderHealth {
  status: AIProviderHealthStatus;
  lastChecked: Date;
  latency?: number;
  error?: string;
}

export interface AIProviderConfig {
  id: string;
  name: string;
  type: AIProviderType;
  priority: number;
  enabled: boolean;
  config: Record<string, any>;
}

/**
 * The core AI Provider interface that all providers must implement.
 */
export interface AIProvider {
  /**
   * Unique identifier for this provider instance
   */
  readonly id: string;
  
  /**
   * Human-readable name for this provider
   */
  readonly name: string;
  
  /**
   * Provider type classification
   */
  readonly type: AIProviderType;
  
  /**
   * Priority for provider selection (lower = higher priority)
   */
  readonly priority: number;
  
  /**
   * Whether this provider is currently enabled
   */
  readonly enabled: boolean;

  /**
   * Check if this provider supports streaming responses
   */
  supportsStreaming(): boolean;

  /**
   * Generate a non-streaming AI response
   */
  generate(request: AIRequest): Promise<AIResponse>;

  /**
   * Generate a streaming AI response
   */
  stream(request: AIRequest): AsyncIterable<AIStreamEvent>;

  /**
   * Perform a health check on this provider
   */
  healthCheck(): Promise<AIProviderHealth>;

  /**
   * Validate the provider configuration
   */
  validateConfig(): Promise<{ valid: boolean; error?: string }>;
}
