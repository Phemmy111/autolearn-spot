/**
 * Phase 6: Agent System Index
 * Phase 7: Multi-Agent Coordination
 *
 * Main entry point for agent functionality.
 */

export { AgentService } from './agent-service'
export { getAgentConfig, validateAgentConfig, DEFAULT_AGENT_CONFIG } from './agent-config'
export { MultiAgentCoordinator } from './multi-agent-coordinator'
export type {
  AgentExecutionState,
  AgentExecutionResult,
  AgentExecutionRequest,
  AgentStep,
  AgentExecutionStatus,
  AgentStepType,
  AgentConfig
} from './agent-types'
export type {
  AgentTask,
  AgentCollaborationPlan,
  AgentExecutionResult as MultiAgentExecutionResult
} from './multi-agent-coordinator'
