/**
 * Phase 6: Agent Configuration
 * 
 * Centralized safety limits and configuration for agent execution.
 * 
 * PHASE 7 COMPATIBILITY:
 * These limits can be overridden for workflow generation tasks which may require:
 * - More steps for complex workflow creation
 * - More tool calls for multi-step workflow building
 * - Longer execution time for artifact generation
 * 
 * Workflow tools registered in Phase 7 will use this same configuration.
 */

import { AgentConfig } from './agent-types'

export const DEFAULT_AGENT_CONFIG: AgentConfig = {
  maxAgentSteps: 8,
  maxToolCalls: 8,
  maxAgentExecutionTime: 60000, // 60 seconds
  maxConsecutiveFailures: 3,
  maxSameToolRepetitions: 3,
  maxAgentContextTokens: 6000
}

/**
 * Get agent configuration with optional overrides
 */
export function getAgentConfig(overrides?: Partial<AgentConfig>): AgentConfig {
  return {
    ...DEFAULT_AGENT_CONFIG,
    ...overrides
  }
}

/**
 * Validate agent configuration
 */
export function validateAgentConfig(config: AgentConfig): { valid: boolean; error?: string } {
  if (config.maxAgentSteps < 1 || config.maxAgentSteps > 20) {
    return { valid: false, error: 'maxAgentSteps must be between 1 and 20' }
  }

  if (config.maxToolCalls < 1 || config.maxToolCalls > 20) {
    return { valid: false, error: 'maxToolCalls must be between 1 and 20' }
  }

  if (config.maxAgentExecutionTime < 5000 || config.maxAgentExecutionTime > 300000) {
    return { valid: false, error: 'maxAgentExecutionTime must be between 5s and 300s' }
  }

  if (config.maxConsecutiveFailures < 1 || config.maxConsecutiveFailures > 10) {
    return { valid: false, error: 'maxConsecutiveFailures must be between 1 and 10' }
  }

  if (config.maxSameToolRepetitions < 1 || config.maxSameToolRepetitions > 10) {
    return { valid: false, error: 'maxSameToolRepetitions must be between 1 and 10' }
  }

  if (config.maxAgentContextTokens < 1000 || config.maxAgentContextTokens > 32000) {
    return { valid: false, error: 'maxAgentContextTokens must be between 1000 and 32000' }
  }

  return { valid: true }
}
