/**
 * Phase 6: Agent Service
 * 
 * Controlled multi-step agent execution with safety limits.
 * Reuses existing ToolRegistry and ToolExecutionService.
 * Delegates actual execution to orchestrator for simplicity.
 * 
 * PHASE 7 COMPATIBILITY:
 * This service can execute workflow generation tools registered in Phase 7:
 * - Consumes uploaded workflow JSON via attachedFiles
 * - Consumes workflow errors via workflowErrors parameter
 * - Supports artifact generation via generateWorkflowArtifact
 * - Works with vision-capable providers for screenshot analysis
 * - Integrates with web research for n8n documentation
 * - Uses RAG for stored workflow examples
 */

import {
  AgentExecutionState,
  AgentExecutionResult,
  AgentExecutionRequest,
  AgentStep,
  AgentExecutionStatus
} from './agent-types'
import { getAgentConfig, AgentConfig } from './agent-config'
import { ToolRegistry, ToolExecutionService } from '../tools'
import { AIEngine } from '../ai-engine'
import { WorkflowAgent } from '../workflows'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables for agent service')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

export class AgentService {
  private toolRegistry: ToolRegistry
  private toolExecutionService: ToolExecutionService
  private aiEngine: AIEngine
  private config: AgentConfig

  constructor(
    toolRegistry: ToolRegistry,
    toolExecutionService: ToolExecutionService,
    aiEngine: AIEngine,
    config?: Partial<AgentConfig>
  ) {
    this.toolRegistry = toolRegistry
    this.toolExecutionService = toolExecutionService
    this.aiEngine = aiEngine
    this.config = getAgentConfig(config)
  }

  /**
   * Execute an agent request with controlled multi-step execution
   * Simplified: delegates to AI engine with agent mode enabled
   */
  async execute(
    request: AgentExecutionRequest,
    onProgress?: (step: AgentStep) => void
  ): Promise<AgentExecutionResult> {
    const executionId = this.generateExecutionId()
    const startedAt = new Date().toISOString()

    console.log('[AgentDebug] execution_started', {
      executionId,
      userId: request.userId,
      content: request.content.substring(0, 100)
    })

    // Initialize execution state
    const state: AgentExecutionState = {
      executionId,
      userId: request.userId,
      conversationId: request.conversationId,
      status: 'executing',
      stepCount: 1,
      toolCallCount: 0,
      consecutiveFailures: 0,
      startedAt,
      history: [],
      metadata: {
        originalContent: request.content,
        mode: request.mode
      }
    }

    // Log execution start to database
    await this.logExecutionStart(state)

    try {
      // Check cancellation
      if (request.signal?.aborted) {
        console.log('[AgentDebug] cancelled', { executionId })
        state.status = 'cancelled'
        state.completedAt = new Date().toISOString()
        await this.updateExecutionStatus(executionId, 'cancelled')
        return this.buildResult(state, 'Agent execution cancelled by user')
      }

      // Phase 7: Check if this is a workflow-related request
      const isWorkflowRequest = this.isWorkflowRequest(request.content, request.attachedFiles, request.workflowJson)

      let responseContent: string
      let workflowArtifact: any = undefined

      if (isWorkflowRequest) {
        console.log('[AgentDebug] workflow_request_detected', { executionId })
        // Use WorkflowAgent for workflow-specific requests
        const workflowResult = await WorkflowAgent.processRequest(
          request.content,
          request.attachedFiles || [],
          request.workflowJson,
          request.workflowErrors,
          this.aiEngine,
          request.webResearchService
        )
        responseContent = workflowResult.response
        workflowArtifact = workflowResult.artifact
      } else {
        // Delegate to AI engine which handles the actual multi-step execution
        // The AI engine's existing Phase 5 tool execution already handles multiple tool calls
        const response = await this.aiEngine.chat({
          messages: [
            { role: 'system', content: request.systemPrompt },
            ...request.conversationHistory.slice(-5),
            { role: 'user', content: request.content }
          ],
          userId: request.userId,
          conversationId: request.conversationId,
          modelName: request.modelName,
          providerManager: request.providerManager,
          providerRegistry: request.providerRegistry,
          enableTools: true,
          toolRegistry: this.toolRegistry,
          toolExecutionService: this.toolExecutionService,
          enableWebResearch: request.enableWebResearch,
          webResearchService: request.webResearchService,
          enableMemory: request.enableMemory,
          disableTools: false,
          // Phase 7: Workflow generation support
          attachedFiles: request.attachedFiles,
          enableRetrieval: request.enableRetrieval
        })
        responseContent = response.content
      }

      state.status = 'completed'
      state.completedAt = new Date().toISOString()
      await this.updateExecutionStatus(executionId, 'completed')

      console.log('[AgentDebug] execution_completed', {
        executionId,
        stepCount: state.stepCount
      })

      return this.buildResult(state, undefined, responseContent, workflowArtifact)

    } catch (error) {
      console.error('[AgentDebug] execution_failed', {
        executionId,
        error: error instanceof Error ? error.message : 'Unknown error'
      })
      state.status = 'failed'
      state.completedAt = new Date().toISOString()
      await this.updateExecutionStatus(executionId, 'failed')
      return this.buildResult(
        state,
        error instanceof Error ? error.message : 'Unknown error'
      )
    }
  }

  /**
   * Build execution result
   */
  private buildResult(
    state: AgentExecutionState,
    error?: string,
    finalResponse?: string,
    workflowArtifact?: any
  ): AgentExecutionResult {
    const durationMs = Date.now() - new Date(state.startedAt).getTime()

    return {
      status: state.status,
      finalResponse,
      executionId: state.executionId,
      stepCount: state.stepCount,
      toolCallCount: state.toolCallCount,
      durationMs,
      steps: state.history,
      error,
      ...(workflowArtifact && { workflowArtifact })
    }
  }

  /**
   * Check if request is workflow-related
   */
  private isWorkflowRequest(
    content: string,
    attachedFiles?: any[],
    workflowJson?: string
  ): boolean {
    const contentLower = content.toLowerCase()

    // Workflow-related keywords
    const workflowKeywords = [
      'workflow',
      'n8n',
      'automation',
      'trigger',
      'node',
      'webhook',
      'google sheets',
      'email automation',
      'create a workflow',
      'generate workflow',
      'debug workflow',
      'validate workflow',
      'repair workflow',
      'analyze workflow'
    ]

    const hasWorkflowKeyword = workflowKeywords.some(keyword =>
      contentLower.includes(keyword)
    )

    // Has workflow JSON or file
    const hasWorkflowData = !!workflowJson || (attachedFiles && attachedFiles.length > 0)

    return hasWorkflowKeyword || hasWorkflowData
  }

  /**
   * Generate unique execution ID
   */
  private generateExecutionId(): string {
    return `agent_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
  }

  /**
   * Log execution start to database
   */
  private async logExecutionStart(state: AgentExecutionState): Promise<void> {
    try {
      const { error } = await supabase
        .from('alex_agent_executions')
        .insert({
          execution_id: state.executionId,
          user_id: state.userId,
          conversation_id: state.conversationId,
          status: state.status,
          step_count: state.stepCount,
          tool_call_count: state.toolCallCount,
          started_at: state.startedAt,
          metadata: state.metadata
        })

      if (error) {
        console.error('[AgentService] Failed to log execution start:', error)
      }
    } catch (error) {
      console.error('[AgentService] Failed to log execution start:', error)
    }
  }

  /**
   * Update execution status in database
   */
  private async updateExecutionStatus(
    executionId: string,
    status: AgentExecutionStatus
  ): Promise<void> {
    try {
      const { error } = await supabase
        .from('alex_agent_executions')
        .update({
          status,
          completed_at: new Date().toISOString()
        })
        .eq('execution_id', executionId)

      if (error) {
        console.error('[AgentService] Failed to update execution status:', error)
      }
    } catch (error) {
      console.error('[AgentService] Failed to update execution status:', error)
    }
  }
}
