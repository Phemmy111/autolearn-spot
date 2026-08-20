/**
 * Phase 6: Agent Types and Interfaces
 * 
 * Defines the type system for controlled multi-step agent execution.
 */

export type AgentExecutionStatus =
  | 'planning'
  | 'executing'
  | 'waiting'
  | 'completed'
  | 'failed'
  | 'cancelled'
  | 'limit_reached'

export type AgentStepType =
  | 'model'
  | 'tool_call'
  | 'tool_result'
  | 'final'

export interface AgentStep {
  stepNumber: number
  type: AgentStepType
  toolName?: string
  toolCallId?: string
  arguments?: Record<string, unknown>
  result?: unknown
  success?: boolean
  durationMs?: number
  timestamp: string
  error?: string
}

export interface AgentExecutionState {
  executionId: string
  userId: string
  conversationId?: string
  status: AgentExecutionStatus
  stepCount: number
  toolCallCount: number
  consecutiveFailures: number
  startedAt: string
  completedAt?: string
  currentToolCallId?: string
  history: AgentStep[]
  metadata?: Record<string, unknown>
}

export interface AgentExecutionResult {
  status: AgentExecutionStatus
  finalResponse?: string
  executionId: string
  stepCount: number
  toolCallCount: number
  durationMs: number
  steps?: AgentStep[]
  error?: string
}

export interface AgentExecutionRequest {
  userId: string
  conversationId?: string
  content: string
  mode: string
  conversationHistory: Array<{ role: string; content: string }>
  platformContext?: any
  systemPrompt: string
  enableWebResearch?: boolean
  enableMemory?: boolean
  enableRetrieval?: boolean
  webResearchService?: any
  memoryService?: any
  toolRegistry?: any
  toolExecutionService?: any
  providerManager?: any
  providerRegistry?: any
  providerCapabilities?: string[]
  modelName?: string
  signal?: AbortSignal
}

export interface AgentConfig {
  maxAgentSteps: number
  maxToolCalls: number
  maxAgentExecutionTime: number
  maxConsecutiveFailures: number
  maxSameToolRepetitions: number
  maxAgentContextTokens: number
}
