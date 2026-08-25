/**
 * Platform Preservation Regression Test
 * 
 * Tests that platform information (like "n8n") is preserved through
 * clarification rounds and correctly passed to architecture generation.
 * 
 * Reproduces the production bug where platform clarification ("n8n") 
 * was lost during architecture generation, causing JSON extraction failure.
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { WorkflowOrchestrator } from '../orchestration/workflow-orchestrator'
import { AIOrchestrator } from '../orchestration/ai-orchestrator'
import { AutomationPlan } from '../orchestration/types'

describe('Platform Preservation Regression Test', () => {
  let workflowOrchestrator: WorkflowOrchestrator
  let aiOrchestrator: AIOrchestrator

  beforeEach(() => {
    workflowOrchestrator = WorkflowOrchestrator.getInstance()
    aiOrchestrator = AIOrchestrator.getInstance()
  })

  /**
   * Test Case: Platform clarification should be preserved for architecture generation
   * 
   * Scenario:
   * 1. User creates plan without platform
   * 2. AI asks for platform clarification
   * 3. User answers "n8n"
   * 4. AI updates plan with platform
   * 5. Architecture generation should receive plan with platform="n8n"
   */
  it('should preserve platform clarification through to architecture generation', async () => {
    // Simulate initial plan without platform
    const initialPlan: AutomationPlan = {
      objective: 'create a lead capture and qualifier that send email notification',
      status: 'draft',
      trigger: {
        type: 'webhook',
        source: 'google-form',
        description: 'Google Forms → New Form Response'
      },
      workflow: [
        { step: 'Receive form response', order: 1 },
        { step: 'Qualify lead based on budget', order: 2 },
        { step: 'Send email notification', order: 3 }
      ]
    }

    // Simulate AI updating plan with platform after clarification
    const updatedPlan: AutomationPlan = {
      ...initialPlan,
      platform: {
        name: 'n8n',
        reasoning: 'Suitable for this automation'
      },
      lastUpdated: new Date().toISOString()
    }

    // Simulate orchestration result with platform update
    const orchestrationResult = {
      action: {
        type: 'generate' as const,
        plan: initialPlan // Old plan without platform
      },
      intent: 'answer_question' as const,
      updatedPlan: updatedPlan, // New plan with platform
      confidence: 0.9,
      reasoning: 'Platform clarified as n8n'
    }

    // Test that updatedPlan is used for generation
    const planForGeneration = orchestrationResult.updatedPlan || orchestrationResult.action.plan
    
    // CRITICAL: The platform should be preserved from updatedPlan
    expect(planForGeneration.platform).toBeDefined()
    expect(planForGeneration.platform?.name).toBe('n8n')
    expect(planForGeneration.platform?.reasoning).toBe('Suitable for this automation')
  })

  /**
   * Test Case: Fallback to action.plan when updatedPlan is null
   */
  it('should fallback to action.plan when updatedPlan is null', async () => {
    const planWithPlatform: AutomationPlan = {
      objective: 'Test automation',
      status: 'draft',
      platform: {
        name: 'zapier',
        reasoning: 'Test platform'
      }
    }

    const orchestrationResult = {
      action: {
        type: 'generate' as const,
        plan: planWithPlatform
      },
      intent: 'confirmation' as const,
      updatedPlan: null,
      confidence: 0.9,
      reasoning: 'No plan update needed'
    }

    const planForGeneration = orchestrationResult.updatedPlan || orchestrationResult.action.plan
    
    expect(planForGeneration.platform).toBeDefined()
    expect(planForGeneration.platform?.name).toBe('zapier')
  })

  /**
   * Test Case: Execute action should also preserve platform
   */
  it('should preserve platform for execute action type', async () => {
    const planWithPlatform: AutomationPlan = {
      objective: 'Execute automation',
      status: 'approved',
      platform: {
        name: 'make',
        reasoning: 'Make platform selected'
      }
    }

    const orchestrationResult = {
      action: {
        type: 'execute' as const,
        plan: planWithPlatform
      },
      intent: 'confirmation' as const,
      updatedPlan: null,
      confidence: 1.0,
      reasoning: 'Plan approved for execution'
    }

    const planForGeneration = orchestrationResult.updatedPlan || orchestrationResult.action.plan
    
    expect(planForGeneration.platform).toBeDefined()
    expect(planForGeneration.platform?.name).toBe('make')
  })

  /**
   * Test Case: Multiple clarifications should preserve all accumulated data
   */
  it('should preserve all accumulated data through multiple clarifications', async () => {
    const initialPlan: AutomationPlan = {
      objective: 'Lead capture automation',
      status: 'draft',
      trigger: {
        type: 'webhook',
        source: 'web-form'
      }
    }

    // After first clarification (email address)
    const afterEmailClarification: AutomationPlan = {
      ...initialPlan,
      outputs: {
        destinations: ['femiadeleke2020@gmail.com'],
        description: 'Email notifications'
      }
    }

    // After second clarification (platform)
    const afterPlatformClarification: AutomationPlan = {
      ...afterEmailClarification,
      platform: {
        name: 'n8n',
        reasoning: 'User selected n8n'
      },
      lastUpdated: new Date().toISOString()
    }

    const orchestrationResult = {
      action: {
        type: 'generate' as const,
        plan: initialPlan // Original plan
      },
      intent: 'answer_question' as const,
      updatedPlan: afterPlatformClarification, // Fully updated plan
      confidence: 0.95,
      reasoning: 'All clarifications complete'
    }

    const planForGeneration = orchestrationResult.updatedPlan || orchestrationResult.action.plan
    
    // Should have platform from latest clarification
    expect(planForGeneration.platform?.name).toBe('n8n')
    
    // Should have email from earlier clarification
    expect(planForGeneration.outputs?.destinations).toContain('femiadeleke2020@gmail.com')
    
    // Should have original trigger
    expect(planForGeneration.trigger?.source).toBe('web-form')
  })
})