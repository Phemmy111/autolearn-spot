/**
 * ALEX Orchestration Types
 * 
 * AI-driven orchestration layer for automation expert behavior
 * Replaces template-driven blocker/question system
 */

/**
 * AI-decided next action
 * The orchestrator returns one of these based on conversation context and automation plan
 */
export type AlexNextAction =
  | {
      type: "respond";
      message: string;
    }
  | {
      type: "clarify";
      question: string;
      reason?: string;
      options?: string[];
    }
  | {
      type: "recommend";
      message: string;
      recommendations?: string[];
    }
  | {
      type: "brainstorm";
      message: string;
      ideas?: string[];
    }
  | {
      type: "plan";
      plan: AutomationPlan;
    }
  | {
      type: "generate";
      plan: AutomationPlan;
    }
  | {
      type: "execute";
      plan: AutomationPlan;
      confirmationRequired?: boolean;
    }
  | {
      type: "revise";
      message: string;
      plan: AutomationPlan;
    };

/**
 * Evolving automation plan
 * Sparse, adaptive representation of what ALEX understands about the automation
 * Not a fixed schema - grows and shrinks based on conversation
 */
export interface AutomationPlan {
  // Core objective
  objective: string;
  
  // User context
  users?: string[];
  
  // Trigger mechanism
  trigger?: {
    type?: string;
    source?: string;
    description?: string;
  };
  
  // Workflow steps
  workflow?: Array<{
    step: string;
    description?: string;
  }>;
  
  // Inputs
  inputs?: {
    sources?: string[];
    description?: string;
  };
  
  // Outputs
  outputs?: {
    destinations?: string[];
    description?: string;
  };
  
  // Integrations
  integrations?: {
    platform?: string;
    services?: string[];
    description?: string;
  };
  
  // Platform
  platform?: {
    name?: string;
    reasoning?: string;
  };
  
  // Constraints
  constraints?: string[];
  
  // P2-A: Enhanced assumptions with metadata to distinguish from requirements
  assumptions?: Array<{
    statement: string;
    basis?: string;
    confidence?: number;
    category?: 'platform' | 'integration' | 'data' | 'timing' | 'other';
  }>;
  
  // P2-A: Enhanced recommendations with metadata to distinguish from requirements
  recommendations?: Array<{
    statement: string;
    reasoning?: string;
    priority?: 'high' | 'medium' | 'low';
  }>;
  
  // Unresolved questions
  unresolvedQuestions?: Array<{
    question: string;
    reason: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  
  // Architecture
  architecture?: {
    complexity?: 'simple' | 'moderate' | 'complex';
    stages?: string[];
  };
  
  // Status
  status?: 'draft' | 'planning' | 'ready' | 'generating' | 'generated';
  
  // Metadata
  confidence?: number; // 0-1
  lastUpdated?: string;
}

/**
 * Conversation context
 * Separated from workflow state
 */
export interface ConversationContext {
  conversationId: string;
  userId: string;
  messages: Array<{
    role: 'user' | 'assistant';
    content: string;
    timestamp: string;
  }>;
  activeAutomationPlanId?: string;
  mode: 'auto' | 'tutor' | 'developer' | 'automation' | 'research' | 'agent_builder';
}

/**
 * Question tracking
 * Prevents repeated questions
 */
export interface QuestionTracker {
  askedQuestions: Map<string, {
    question: string;
    context: string;
    askedAt: string;
    answered?: boolean;
    answer?: string;
    answeredAt?: string;
  }>;
  
  checkAlreadyAsked(question: string, context: string): boolean;
  recordQuestion(question: string, context: string): void;
  recordAnswer(question: string, answer: string): void;
  shouldAsk(question: string, context: string): boolean;
}

/**
 * Intent classification
 */
export type UserIntent =
  | 'new_automation'
  | 'revise_automation'
  | 'answer_question'
  | 'clarification'
  | 'brainstorm_request'
  | 'recommendation_request'
  | 'unrelated_conversation'
  | 'confirmation'
  | 'cancellation';

/**
 * Orchestration result
 */
export interface OrchestrationResult {
  action: AlexNextAction;
  intent: UserIntent;
  updatedPlan?: AutomationPlan;
  confidence: number;
  reasoning?: string;
}

/**
 * Conversation message with orchestration metadata
 */
export interface ConversationMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  orchestrationMetadata?: {
    intent?: UserIntent;
    actionType?: AlexNextAction['type'];
    planId?: string;
  };
}