/**
 * Phase 2: Intelligent Task Router
 * 
 * Routes tasks to appropriate execution paths based on classification
 * Integrates with existing ALEX orchestrator
 */

import { TaskClassifier, ClassificationResult, TaskType } from './task-classifier'
import { AlexMode } from '../types'

export interface RouterRequest {
  content: string
  currentMode: AlexMode
  conversationHistory: Array<{ role: string; content: string }>
  userId?: string
  conversationId?: string
  attachedFiles?: any[]
}

export interface RouterDecision {
  classification: ClassificationResult
  executionPath: 'direct_chat' | 'agent_execution' | 'artifact_workflow' | 'research_mode'
  recommendedMode: AlexMode
  executionParameters: {
    enableAgent: boolean
    enableWebResearch: boolean
    enableRetrieval: boolean
    enableMemory: boolean
    enableTools: boolean
    requirePlanning: boolean
    requireVerification: boolean
  }
  estimatedSubtasks: number
  reasoning: string
}

/**
 * Task Router - Central routing for ALEX task execution
 */
export class TaskRouter {
  /**
   * Route a task to the appropriate execution path
   */
  static async route(request: RouterRequest): Promise<RouterDecision> {
    const { content, currentMode, conversationHistory } = request

    // Classify the task
    const classification = TaskClassifier.classify(content)

    // Determine execution path
    const executionPath = this.determineExecutionPath(classification, request)

    // Determine recommended mode
    const recommendedMode = this.determineRecommendedMode(classification, currentMode)

    // Build execution parameters
    const executionParameters = this.buildExecutionParameters(classification)

    return {
      classification,
      executionPath,
      recommendedMode,
      executionParameters,
      estimatedSubtasks: classification.classification.estimatedSubtasks,
      reasoning: classification.classification.reasoning,
    }
  }

  /**
   * Determine execution path based on classification
   */
  private static determineExecutionPath(
    classification: ClassificationResult,
    request: RouterRequest
  ): 'direct_chat' | 'agent_execution' | 'artifact_workflow' | 'research_mode' {
    const { primaryType, complexity, requiresPlanning } = classification.classification

    // Check for artifact generation intent
    if (this.isArtifactGenerationRequest(request.content)) {
      return 'artifact_workflow'
    }

    // Check for complex multi-step tasks
    if (classification.shouldUseAgent) {
      return 'agent_execution'
    }

    // Check for research tasks
    if (classification.shouldUseWebResearch) {
      return 'research_mode'
    }

    // Default to direct chat
    return 'direct_chat'
  }

  /**
   * Determine recommended mode
   */
  private static determineRecommendedMode(
    classification: ClassificationResult,
    currentMode: AlexMode
  ): AlexMode {
    // If already in auto mode, use the suggested mode from classification
    if (currentMode === 'auto') {
      return classification.suggestedMode
    }

    // If in a specific mode that matches the classification, keep it
    if (currentMode === classification.suggestedMode) {
      return currentMode
    }

    // Otherwise, suggest the appropriate mode
    return classification.suggestedMode
  }

  /**
   * Build execution parameters
   */
  private static buildExecutionParameters(classification: ClassificationResult) {
    return {
      enableAgent: classification.shouldUseAgent,
      enableWebResearch: classification.shouldUseWebResearch,
      enableRetrieval: classification.shouldUseRetrieval,
      enableMemory: classification.shouldUseMemory,
      enableTools: classification.classification.requiredTools.length > 0,
      requirePlanning: classification.classification.requiresPlanning,
      requireVerification: classification.classification.requiresVerification,
    }
  }

  /**
   * Check if request is for artifact generation
   */
  private static isArtifactGenerationRequest(content: string): boolean {
    const artifactKeywords = [
      'build me a website',
      'create a workflow',
      'design a landing page',
      'generate automation',
      'make an app',
      'build a dashboard',
    ]

    const lowerContent = content.toLowerCase()
    return artifactKeywords.some(keyword => lowerContent.includes(keyword))
  }

  /**
   * Get task type description for user feedback
   */
  static getTaskTypeDescription(taskType: TaskType): string {
    const descriptions: Record<TaskType, string> = {
      conversation: 'General conversation',
      factual_question: 'Factual question',
      research: 'Research task',
      current_information_research: 'Current information research',
      writing: 'Writing task',
      coding: 'Coding task',
      debugging: 'Debugging task',
      website_creation: 'Website creation',
      ui_design: 'UI design',
      data_analysis: 'Data analysis',
      document_creation: 'Document creation',
      image_related: 'Image-related task',
      workflow_creation: 'Workflow creation',
      automation: 'Automation task',
      lead_generation: 'Lead generation',
      marketing: 'Marketing task',
      business_planning: 'Business planning',
      file_analysis: 'File analysis',
      multi_step_execution: 'Multi-step execution',
      tool_execution: 'Tool execution',
      learning_teaching: 'Learning/teaching',
      mixed_task: 'Mixed task',
    }

    return descriptions[taskType] || 'Unknown task type'
  }
}
