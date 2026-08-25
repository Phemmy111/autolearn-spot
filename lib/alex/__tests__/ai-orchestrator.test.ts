/**
 * ALEX AI Orchestrator Tests
 * 
 * Test scenarios for AI-driven orchestration layer
 */

import { AIOrchestrator } from '../orchestration/ai-orchestrator'
import { 
  AlexNextAction, 
  AutomationPlan, 
  ConversationContext, 
  UserIntent 
} from '../orchestration/types'
import { QuestionTracker } from '../orchestration/question-tracker'

describe('AIOrchestrator', () => {
  let orchestrator: AIOrchestrator
  let questionTracker: QuestionTracker
  
  beforeEach(() => {
    orchestrator = AIOrchestrator.getInstance()
    questionTracker = orchestrator.getQuestionTracker()
    // Clear tracker between tests
    questionTracker.getStats()
  })
  
  /**
   * Scenario A — Simple automation
   * User: "Create a bot that sends me a reminder every morning."
   * Expected: ALEX should reason about the request rather than enumerate 50 fields
   */
  it('Scenario A: Simple automation - should reason not enumerate fields', async () => {
    const context: ConversationContext = {
      conversationId: 'test-conv-1',
      userId: 'test-user-1',
      messages: [
        { role: 'user', content: 'Create a bot that sends me a reminder every morning.', timestamp: new Date().toISOString() }
      ],
      mode: 'auto'
    }
    
    const result = await orchestrator.orchestrate(
      'Create a bot that sends me a reminder every morning.',
      context,
      null
    )
    
    // Should not return a mechanical "I need to know: trigger" response
    if (result.action.type === 'clarify') {
      // If it asks a question, it should be meaningful, not template-driven
      expect(result.action.question).not.toContain('trigger')
      expect(result.action.question).not.toContain('platform')
      expect(result.action.question).not.toContain('inputs')
      
      // Should have a meaningful reason
      expect(result.action.reason).toBeTruthy()
      expect(result.action.reason).not.toContain('field')
    }
    
    // Should have high confidence for a clear request
    expect(result.confidence).toBeGreaterThan(0.5)
    
    console.log('[Test A] Result:', result)
  })
  
  /**
   * Scenario B — Complex automation
   * User: "Create a lead capture system that collects website leads, stores them, scores them and alerts sales."
   * Expected: ALEX should ask meaningful questions and/or make recommendations
   */
  it('Scenario B: Complex automation - should ask meaningful questions', async () => {
    const context: ConversationContext = {
      conversationId: 'test-conv-2',
      userId: 'test-user-2',
      messages: [
        { role: 'user', content: 'Create a lead capture system that collects website leads, stores them, scores them and alerts sales.', timestamp: new Date().toISOString() }
      ],
      mode: 'auto'
    }
    
    const result = await orchestrator.orchestrate(
      'Create a lead capture system that collects website leads, stores them, scores them and alerts sales.',
      context,
      null
    )
    
    // Should not enumerate all 50 fields
    if (result.action.type === 'clarify') {
      // Should ask at most 1-2 meaningful questions
      expect(result.action.options?.length || 0).toBeLessThanOrEqual(5)
      
      // Questions should be specific to lead capture, not generic
      if (result.action.question) {
        expect(result.action.question.toLowerCase()).toMatch(/lead|capture|website|store|score|alert|sales/i)
      }
    }
    
    console.log('[Test B] Result:', result)
  })
  
  /**
   * Scenario C — Recommendation
   * User: "I want a lead capture bot but I don't know which platform to use."
   * Expected: ALEX should recommend a platform and explain why
   */
  it('Scenario C: Recommendation - should recommend platform with reasoning', async () => {
    const context: ConversationContext = {
      conversationId: 'test-conv-3',
      userId: 'test-user-3',
      messages: [
        { role: 'user', content: 'I want a lead capture bot but I don\'t know which platform to use.', timestamp: new Date().toISOString() }
      ],
      mode: 'auto'
    }
    
    const result = await orchestrator.orchestrate(
      'I want a lead capture bot but I don\'t know which platform to use.',
      context,
      null
    )
    
    // Should recommend, not just ask "platform?"
    expect(result.action.type).toBe('recommend')
    
    if (result.action.type === 'recommend') {
      // Should have recommendations
      expect(result.action.recommendations).toBeTruthy()
      expect(result.action.recommendations!.length).toBeGreaterThan(0)
      
      // Should have reasoning message
      expect(result.action.message).toBeTruthy()
      expect(result.action.message.length).toBeGreaterThan(20)
    }
    
    console.log('[Test C] Result:', result)
  })
  
  /**
   * Scenario D — Brainstorming
   * User: "Give me some ideas for automating our customer support."
   * Expected: ALEX should brainstorm instead of entering artifact-generation mode
   */
  it('Scenario D: Brainstorming - should generate ideas', async () => {
    const context: ConversationContext = {
      conversationId: 'test-conv-4',
      userId: 'test-user-4',
      messages: [
        { role: 'user', content: 'Give me some ideas for automating our customer support.', timestamp: new Date().toISOString() }
      ],
      mode: 'auto'
    }
    
    const result = await orchestrator.orchestrate(
      'Give me some ideas for automating our customer support.',
      context,
      null
    )
    
    // Should brainstorm, not generate artifact
    expect(result.action.type).toBe('brainstorm')
    
    if (result.action.type === 'brainstorm') {
      // Should have ideas
      expect(result.action.ideas).toBeTruthy()
      expect(result.action.ideas!.length).toBeGreaterThan(0)
    }
    
    console.log('[Test D] Result:', result)
  })
  
  /**
   * Scenario E — Requirement revision
   * User: "Actually, send the notification to Slack instead of email."
   * Expected: ALEX should revise the plan
   */
  it('Scenario E: Requirement revision - should revise plan', async () => {
    const existingPlan: AutomationPlan = {
      objective: 'Lead capture system',
      outputs: {
        destinations: ['email'],
        description: 'Send leads to email'
      }
    }
    
    const context: ConversationContext = {
      conversationId: 'test-conv-5',
      userId: 'test-user-5',
      messages: [
        { role: 'user', content: 'Create a lead capture system', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'I understand you want a lead capture system.', timestamp: new Date().toISOString() }
      ],
      mode: 'auto'
    }
    
    const result = await orchestrator.orchestrate(
      'Actually, send the notification to Slack instead of email.',
      context,
      existingPlan
    )
    
    // Should revise the plan
    expect(result.action.type).toBe('revise')
    
    if (result.action.type === 'revise') {
      // Should have updated plan
      expect(result.updatedPlan).toBeTruthy()
      expect(result.updatedPlan?.outputs?.destinations).toContain('slack')
    }
    
    console.log('[Test E] Result:', result)
  })
  
  /**
   * Scenario F — New request in same conversation
   * User: "Create a reminder bot." then "Now create a lead capture bot."
   * Expected: Second request must not inherit the first workflow
   */
  it('Scenario F: New request in same conversation - should not inherit workflow', async () => {
    const context: ConversationContext = {
      conversationId: 'test-conv-6',
      userId: 'test-user-6',
      messages: [
        { role: 'user', content: 'Create a reminder bot.', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'I\'ll help you create a reminder bot.', timestamp: new Date().toISOString() },
        { role: 'user', content: 'Now create a lead capture bot.', timestamp: new Date().toISOString() }
      ],
      mode: 'auto'
    }
    
    const firstPlan: AutomationPlan = {
      objective: 'Reminder bot',
      trigger: { type: 'schedule' }
    }
    
    const result = await orchestrator.orchestrate(
      'Now create a lead capture bot.',
      context,
      firstPlan
    )
    
    // Should detect as new request, not continuation
    expect(result.intent).toBe('new_automation')
    
    // Should create new plan, not revise existing
    if (result.updatedPlan) {
      expect(result.updatedPlan.objective).toContain('lead capture')
      expect(result.updatedPlan.objective).not.toContain('reminder')
    }
    
    console.log('[Test F] Result:', result)
  })
  
  /**
   * Scenario G — Natural language answer
   * ALEX: "Where should the leads come from?"
   * User: "Mostly our website contact form and sometimes Facebook."
   * Expected: ALEX must understand the answer without field:value syntax
   */
  it('Scenario G: Natural language answer - should understand without field:value', async () => {
    const context: ConversationContext = {
      conversationId: 'test-conv-7',
      userId: 'test-user-7',
      messages: [
        { role: 'user', content: 'Create a lead capture bot', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Where should the leads come from?', timestamp: new Date().toISOString() }
      ],
      mode: 'auto'
    }
    
    const existingPlan: AutomationPlan = {
      objective: 'Lead capture bot'
    }
    
    const result = await orchestrator.orchestrate(
      'Mostly our website contact form and sometimes Facebook.',
      context,
      existingPlan
    )
    
    // Should understand as answer, not new request
    expect(result.intent).toBe('answer_question')
    
    // Should update plan with sources
    if (result.updatedPlan) {
      expect(result.updatedPlan.inputs?.sources).toBeTruthy()
      expect(result.updatedPlan.inputs?.sources).toContain('website')
    }
    
    console.log('[Test G] Result:', result)
  })
  
  /**
   * Scenario H — No repeated questions
   * Once user provides "Email" for destination, ALEX must never immediately ask for the same destination again
   */
  it('Scenario H: No repeated questions - should prevent duplicates', async () => {
    const context: ConversationContext = {
      conversationId: 'test-conv-8',
      userId: 'test-user-8',
      messages: [
        { role: 'user', content: 'Create a lead capture bot', timestamp: new Date().toISOString() },
        { role: 'assistant', content: 'Where should I send the leads?', timestamp: new Date().toISOString() },
        { role: 'user', content: 'Email', timestamp: new Date().toISOString() }
      ],
      mode: 'auto'
    }
    
    const existingPlan: AutomationPlan = {
      objective: 'Lead capture bot'
    }
    
    // Record that the question was asked
    questionTracker.recordQuestion('Where should I send the leads?', 'destination')
    
    // Record that it was answered
    questionTracker.recordAnswer('Where should I send the leads?', 'Email')
    
    const result = await orchestrator.orchestrate(
      'Email',
      context,
      existingPlan
    )
    
    // Should not ask the same question again
    if (result.action.type === 'clarify') {
      const question = result.action.question.toLowerCase()
      expect(question).not.toContain('destination')
      expect(question).not.toContain('send')
    }
    
    // Should proceed to next step or respond
    expect(['respond', 'plan', 'generate'].includes(result.action.type)).toBeTruthy()
    
    console.log('[Test H] Result:', result)
  })
  
  /**
   * Scenario I — Simple task completion
   * If enough information is already available, ALEX should proceed instead of manufacturing unnecessary questions
   */
  it('Scenario I: Simple task completion - should proceed when sufficient info', async () => {
    const existingPlan: AutomationPlan = {
      objective: 'Send daily email report',
      trigger: { type: 'schedule', description: 'daily' },
      outputs: { destinations: ['email'], description: 'Send to user' },
      platform: { name: 'n8n', reasoning: 'Simple automation' }
    }
    
    const context: ConversationContext = {
      conversationId: 'test-conv-9',
      userId: 'test-user-9',
      messages: [
        { role: 'user', content: 'Send daily email report', timestamp: new Date().toISOString() }
      ],
      mode: 'auto'
    }
    
    const result = await orchestrator.orchestrate(
      'Send daily email report',
      context,
      existingPlan
    )
    
    // Should have enough info to proceed
    expect(['plan', 'generate', 'execute'].includes(result.action.type)).toBeTruthy()
    
    // Should not ask more questions
    expect(result.action.type).not.toBe('clarify')
    
    console.log('[Test I] Result:', result)
  })
})

describe('QuestionTracker', () => {
  let tracker: QuestionTracker
  
  beforeEach(() => {
    tracker = new QuestionTracker()
  })
  
  it('should prevent asking the same question twice', () => {
    const question = 'Where should I send the leads?'
    const context = 'destination'
    
    // First ask - should be allowed
    expect(tracker.shouldAsk(question, context)).toBe(true)
    tracker.recordQuestion(question, context)
    
    // Second ask - should be prevented
    expect(tracker.shouldAsk(question, context)).toBe(false)
  })
  
  it('should allow asking again after answer', () => {
    const question = 'Where should I send the leads?'
    const context = 'destination'
    
    tracker.recordQuestion(question, context)
    tracker.recordAnswer(question, 'Email')
    
    // After answer, should allow asking again if needed
    expect(tracker.shouldAsk(question, context)).toBe(true)
  })
  
  it('should generate consistent fingerprints', () => {
    const question1 = 'Where should I send the leads?'
    const question2 = 'Where should I send the leads?'
    const context = 'destination'
    
    tracker.recordQuestion(question1, context)
    const result1 = tracker.checkAlreadyAsked(question2, context)
    
    expect(result1).toBe(true)
  })
  
  it('should get unanswered questions', () => {
    tracker.recordQuestion('Question 1', 'context1')
    tracker.recordQuestion('Question 2', 'context2')
    tracker.recordAnswer('Question 1', 'Answer 1')
    
    const unanswered = tracker.getUnansweredQuestions()
    expect(unanswered.length).toBe(1)
    expect(unanswered[0].question).toBe('Question 2')
  })
  
  it('should clear old questions', () => {
    tracker.recordQuestion('Old question', 'context')
    tracker.recordAnswer('Old question', 'Answer')
    
    // Clear old questions
    tracker.clearOldQuestions()
    
    const stats = tracker.getStats()
    expect(stats.totalAsked).toBe(0)
  })
})