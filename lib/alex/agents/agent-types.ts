/**
 * Phase 6: Agent Types and Interfaces
 * 
 * Defines the type system for controlled multi-step agent execution.
 * 
 * PHASE 7 COMPATIBILITY:
 * This architecture supports future n8n workflow generation tools that can:
 * - Consume uploaded workflow JSON (via attachedFiles)
 * - Consume workflow errors (via content)
 * - Consume screenshots/images (via image support + vision preprocessing)
 * - Consume web research results (via enableWebResearch)
 * - Consume n8n documentation (via web research + RAG)
 * - Be registered through ToolRegistry
 * - Be executed through ToolExecutionService
 * - Generate downloadable workflow artifacts
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
  // Phase 7: Workflow generation support
  attachedFiles?: any[] // For workflow JSON uploads
  workflowJson?: string // For direct workflow JSON input
  workflowErrors?: string[] // For workflow error debugging
  generateWorkflowArtifact?: boolean // For downloadable workflow generation
}

export interface AgentConfig {
  maxAgentSteps: number
  maxToolCalls: number
  maxAgentExecutionTime: number
  maxConsecutiveFailures: number
  maxSameToolRepetitions: number
  maxAgentContextTokens: number
}
