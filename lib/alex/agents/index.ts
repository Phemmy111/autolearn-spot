/**
 * Phase 6: Agent System Index
 * 
 * Main entry point for agent functionality.
 */

export { AgentService } from './agent-service'
export { getAgentConfig, validateAgentConfig, DEFAULT_AGENT_CONFIG } from './agent-config'
export type {
  AgentExecutionState,
  AgentExecutionResult,
  AgentExecutionRequest,
  AgentStep,
  AgentExecutionStatus,
  AgentStepType,
  AgentConfig
} from './agent-types'
