/**
 * AI-Based Intent Classifier
 * 
 * Uses AI model to classify user intent dynamically instead of hardcoded keywords.
 * More flexible and adaptable than regex-based classification.
 */

import { AIEngine } from '../ai-engine';
import { TaskType, TaskComplexity, KnowledgeFreshness, TaskClassification, ClassificationResult } from './task-classifier';

export interface AIIntentClassificationRequest {
  content: string;
  conversationHistory?: Array<{ role: string; content: string }>;
  availableTaskTypes?: TaskType[];
}

export interface AIIntentClassificationResponse {
  primaryType: TaskType;
  secondaryTypes: TaskType[];
  complexity: TaskComplexity;
  knowledgeFreshness: KnowledgeFreshness[];
  requiredTools: string[];
  estimatedSubtasks: number;
  requiresPlanning: boolean;
  requiresVerification: boolean;
  confidence: number;
  reasoning: string;
}

/**
 * AI-based intent classifier
 */
export class AIIntentClassifier {
  private static ALL_TASK_TYPES: TaskType[] = [
    'conversation',
    'factual_question',
    'research',
    'current_information_research',
    'writing',
    'coding',
    'debugging',
    'website_creation',
    'ui_design',
    'data_analysis',
    'document_creation',
    'image_related',
    'workflow_creation',
    'automation',
    'lead_generation',
    'marketing',
    'business_planning',
    'file_analysis',
    'multi_step_execution',
    'tool_execution',
    'learning_teaching',
    'mixed_task',
  ];

  private static TASK_TYPE_DESCRIPTIONS: Record<TaskType, string> = {
    conversation: 'General conversational interaction, greetings, casual chat',
    factual_question: 'Questions asking for factual information, explanations, definitions',
    research: 'Tasks requiring research, investigation, comparison, analysis of information',
    current_information_research: 'Tasks requiring up-to-date information (news, prices, status)',
    writing: 'Creating written content (articles, emails, documents, stories)',
    coding: 'Writing code, developing software, implementing features, building applications',
    debugging: 'Fixing errors, troubleshooting issues, resolving bugs',
    website_creation: 'Building websites, web pages, landing pages, web applications',
    ui_design: 'Designing user interfaces, layouts, visual components, UX work',
    data_analysis: 'Analyzing data, statistics, generating insights from data',
    document_creation: 'Creating documents, PDFs, presentations, reports',
    image_related: 'Tasks involving images, visual content, diagrams, screenshots',
    workflow_creation: 'Creating automation workflows, process flows, n8n/zapier automations',
    automation: 'Automating tasks, scheduling, recurring processes, cron jobs',
    lead_generation: 'Finding prospects, generating leads, identifying potential customers',
    marketing: 'Marketing tasks, campaigns, funnels, content marketing, SEO',
    business_planning: 'Business strategy, startup planning, roadmaps, market analysis',
    file_analysis: 'Analyzing files, documents, extracting information from files',
    multi_step_execution: 'Tasks requiring multiple steps or phases to complete',
    tool_execution: 'Tasks requiring specific tools or calculations',
    learning_teaching: 'Educational tasks, teaching, tutorials, learning assistance',
    mixed_task: 'Tasks involving multiple different types of work',
  };

  /**
   * Classify intent using AI model
   */
  static async classifyWithAI(
    request: AIIntentClassificationRequest,
    aiEngine: AIEngine
  ): Promise<ClassificationResult> {
    const { content, conversationHistory, availableTaskTypes } = request;
    const taskTypes = availableTaskTypes || this.ALL_TASK_TYPES;

    // Build the classification prompt
    const prompt = this.buildClassificationPrompt(content, conversationHistory, taskTypes);

    try {
      // Call AI to classify the intent
      const response = await aiEngine.complete({
        messages: [
          {
            role: 'system',
            content: this.getSystemPrompt(taskTypes),
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3, // Low temperature for consistent classification
        maxTokens: 500,
      });

      // Parse the AI response
      const classification = this.parseAIResponse(response.content || '', taskTypes);

      // Build the classification result
      return this.buildClassificationResult(classification, content);
    } catch (error) {
      console.error('[AI Intent Classifier] AI classification failed, falling back to keyword-based:', error);
      // Fallback to keyword-based classification if AI fails
      const { TaskClassifier } = await import('./task-classifier');
      return TaskClassifier.classify(content);
    }
  }

  /**
   * Build classification prompt
   */
  private static buildClassificationPrompt(
    content: string,
    conversationHistory: Array<{ role: string; content: string }> | undefined,
    taskTypes: TaskType[]
  ): string {
    let prompt = `User request: "${content}"\n\n`;

    if (conversationHistory && conversationHistory.length > 0) {
      prompt += `Recent conversation context:\n`;
      const recentMessages = conversationHistory.slice(-3);
      recentMessages.forEach((msg, i) => {
        prompt += `${msg.role}: ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}\n`;
      });
      prompt += '\n';
    }

    prompt += `Classify this request. Respond in JSON format with this structure:
{
  "primaryType": "task_type",
  "secondaryTypes": ["task_type1", "task_type2"],
  "complexity": "simple|moderate|complex|multi_stage",
  "knowledgeFreshness": ["static|slow_changing|current|real_time"],
  "requiredTools": ["tool1", "tool2"],
  "estimatedSubtasks": number,
  "requiresPlanning": boolean,
  "requiresVerification": boolean,
  "confidence": number (0-1),
  "reasoning": "brief explanation"
}

Available task types: ${taskTypes.join(', ')}`;

    return prompt;
  }

  /**
   * Get system prompt for classification
   */
  private static getSystemPrompt(taskTypes: TaskType[]): string {
    let prompt = `You are a task classification AI. Your job is to classify user requests into appropriate task types.\n\n`;
    prompt += `Task type definitions:\n`;

    taskTypes.forEach(type => {
      prompt += `- ${type}: ${this.TASK_TYPE_DESCRIPTIONS[type]}\n`;
    });

    prompt += `\nClassification guidelines:\n`;
    prompt += `- Analyze the user's intent, not just keywords\n`;
    prompt += `- Consider the context from recent conversation if available\n`;
    prompt += `- Choose the most appropriate primary task type\n`;
    prompt += `- Include secondary types if the request involves multiple aspects\n`;
    prompt += `- Estimate complexity based on the scope of work\n`;
    prompt += `- Determine if the task requires planning or verification\n`;
    prompt += `- Provide a confidence score based on how clear the intent is\n`;
    prompt += `- Explain your reasoning briefly\n`;

    return prompt;
  }

  /**
   * Parse AI response
   */
  private static parseAIResponse(
    response: string,
    availableTaskTypes: TaskType[]
  ): AIIntentClassificationResponse {
    try {
      // Extract JSON from response (handle cases where AI adds extra text)
      const jsonMatch = response.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('No JSON found in response');
      }

      const parsed = JSON.parse(jsonMatch[0]);

      // Validate and normalize task types
      const primaryType = this.validateTaskType(parsed.primaryType, availableTaskTypes);
      const secondaryTypes = (parsed.secondaryTypes || [])
        .map((t: string) => this.validateTaskType(t, availableTaskTypes))
        .filter((t: TaskType) => t !== primaryType);

      return {
        primaryType,
        secondaryTypes,
        complexity: parsed.complexity || 'moderate',
        knowledgeFreshness: parsed.knowledgeFreshness || ['static'],
        requiredTools: parsed.requiredTools || [],
        estimatedSubtasks: parsed.estimatedSubtasks || 1,
        requiresPlanning: parsed.requiresPlanning || false,
        requiresVerification: parsed.requiresVerification || false,
        confidence: parsed.confidence || 0.5,
        reasoning: parsed.reasoning || 'AI-based classification',
      };
    } catch (error) {
      console.error('[AI Intent Classifier] Failed to parse AI response:', error);
      // Return default classification
      return {
        primaryType: 'conversation',
        secondaryTypes: [],
        complexity: 'moderate',
        knowledgeFreshness: ['static'],
        requiredTools: [],
        estimatedSubtasks: 1,
        requiresPlanning: false,
        requiresVerification: false,
        confidence: 0.3,
        reasoning: 'Failed to parse AI response, using default',
      };
    }
  }

  /**
   * Validate task type against available types
   */
  private static validateTaskType(type: string, availableTaskTypes: TaskType[]): TaskType {
    if (availableTaskTypes.includes(type as TaskType)) {
      return type as TaskType;
    }
    // Default to conversation if type is invalid
    return 'conversation';
  }

  /**
   * Build classification result
   */
  private static buildClassificationResult(
    classification: AIIntentClassificationResponse,
    content: string
  ): ClassificationResult {
    const classificationData: TaskClassification = {
      primaryType: classification.primaryType,
      secondaryTypes: classification.secondaryTypes,
      complexity: classification.complexity,
      requiredKnowledge: classification.knowledgeFreshness,
      requiredTools: classification.requiredTools,
      estimatedSubtasks: classification.estimatedSubtasks,
      requiresPlanning: classification.requiresPlanning,
      requiresVerification: classification.requiresVerification,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
    };

    // Determine mode based on classification
    const suggestedMode = this.determineSuggestedMode(classification.primaryType);

    // Determine if agent/web research/memory should be used
    const shouldUseAgent = classification.complexity === 'complex' || classification.complexity === 'multi_stage';
    const shouldUseWebResearch = classification.knowledgeFreshness.includes('current') || classification.knowledgeFreshness.includes('real_time');
    const shouldUseRetrieval = ['research', 'factual_question', 'learning_teaching'].includes(classification.primaryType);
    const shouldUseMemory = true; // Always use memory for context

    return {
      classification: classificationData,
      suggestedMode,
      shouldUseAgent,
      shouldUseWebResearch,
      shouldUseRetrieval,
      shouldUseMemory,
    };
  }

  /**
   * Determine suggested mode based on task type
   */
  private static determineSuggestedMode(taskType: TaskType): 'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder' {
    const modeMapping: Partial<Record<TaskType, 'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder'>> = {
      coding: 'developer',
      debugging: 'developer',
      website_creation: 'developer',
      ui_design: 'developer',
      workflow_creation: 'automation',
      automation: 'automation',
      research: 'research',
      current_information_research: 'research',
      learning_teaching: 'tutor',
      lead_generation: 'automation',
      marketing: 'automation',
      business_planning: 'automation',
    };

    return modeMapping[taskType] || 'auto';
  }
}
