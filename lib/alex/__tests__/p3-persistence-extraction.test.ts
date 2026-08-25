/**
 * P3 Production Bug Fix Tests
 * 
 * Tests for:
 * - Clarification persistence
 * - Architecture extraction robustness
 */

import { describe, it, expect } from 'vitest'
import { ArchitectureDesigner } from '../artifact-generation/architecture-designer'
import { AutomationSpec } from '../artifact-generation/automation-spec'

describe('P3 - Architecture Extraction Robustness', () => {
  it('should validate architecture with all required fields', () => {
    const validArchitecture = {
      id: 'test-arch',
      name: 'Test Architecture',
      description: 'Test description',
      goal: 'Test goal',
      domain: 'custom',
      complexity: 'simple' as const,
      reasoning: 'Test reasoning',
      stages: [
        {
          id: 'stage-1',
          name: 'Trigger Stage',
          purpose: 'Initiate automation',
          category: 'trigger' as const,
          inputs: [],
          outputs: ['data']
        }
      ],
      platformAgnostic: true
    }

    const validation = ArchitectureDesigner['validateArchitecture'](validArchitecture)
    expect(validation.valid).toBe(true)
    expect(validation.errors).toHaveLength(0)
  })

  it('should recover architecture with missing id', () => {
    const partialArchitecture = {
      name: 'Test Architecture',
      description: 'Test description',
      goal: 'Test goal',
      domain: 'custom',
      complexity: 'simple' as const,
      reasoning: 'Test reasoning',
      stages: [
        {
          id: 'stage-1',
          name: 'Trigger Stage',
          purpose: 'Initiate automation',
          category: 'trigger' as const,
          inputs: [],
          outputs: ['data']
        }
      ],
      platformAgnostic: true
    }

    const recovered = ArchitectureDesigner['recoverArchitecture'](partialArchitecture, ['Architecture is missing id'])
    expect(recovered).not.toBeNull()
    expect(recovered?.id).toBeDefined()
    expect(recovered?.id).toMatch(/^arch-/)
  })

  it('should recover architecture with missing name', () => {
    const partialArchitecture = {
      id: 'test-arch',
      description: 'Test description',
      goal: 'Test goal',
      domain: 'custom',
      complexity: 'simple' as const,
      reasoning: 'Test reasoning',
      stages: [
        {
          id: 'stage-1',
          name: 'Trigger Stage',
          purpose: 'Initiate automation',
          category: 'trigger' as const,
          inputs: [],
          outputs: ['data']
        }
      ],
      platformAgnostic: true
    }

    const recovered = ArchitectureDesigner['recoverArchitecture'](partialArchitecture, ['Architecture is missing name'])
    expect(recovered).not.toBeNull()
    expect(recovered?.name).toBe('Test description')
  })

  it('should recover architecture with missing complexity', () => {
    const partialArchitecture = {
      id: 'test-arch',
      name: 'Test Architecture',
      description: 'Test description',
      goal: 'Test goal',
      domain: 'custom',
      reasoning: 'Test reasoning',
      stages: [
        {
          id: 'stage-1',
          name: 'Trigger Stage',
          purpose: 'Initiate automation',
          category: 'trigger' as const,
          inputs: [],
          outputs: ['data']
        }
      ],
      platformAgnostic: true
    }

    const recovered = ArchitectureDesigner['recoverArchitecture'](partialArchitecture, ['Architecture is missing complexity'])
    expect(recovered).not.toBeNull()
    expect(recovered?.complexity).toBe('moderate')
  })

  it('should recover architecture with missing platformAgnostic', () => {
    const partialArchitecture = {
      id: 'test-arch',
      name: 'Test Architecture',
      description: 'Test description',
      goal: 'Test goal',
      domain: 'custom',
      complexity: 'simple' as const,
      reasoning: 'Test reasoning',
      stages: [
        {
          id: 'stage-1',
          name: 'Trigger Stage',
          purpose: 'Initiate automation',
          category: 'trigger' as const,
          inputs: [],
          outputs: ['data']
        }
      ]
    }

    const recovered = ArchitectureDesigner['recoverArchitecture'](partialArchitecture, ['Architecture must be platform-agnostic'])
    expect(recovered).not.toBeNull()
    expect(recovered?.platformAgnostic).toBe(true)
  })

  it('should fail recovery if critical fields cannot be recovered', () => {
    const invalidArchitecture = {
      id: 'test-arch',
      // Missing name, description, goal - cannot recover
      complexity: 'simple' as const,
      reasoning: 'Test reasoning',
      stages: [],
      platformAgnostic: true
    }

    const recovered = ArchitectureDesigner['recoverArchitecture'](
      invalidArchitecture,
      ['Architecture is missing name', 'Architecture is missing description', 'Architecture is missing goal']
    )
    expect(recovered).toBeNull()
  })

  it('should recover architecture with empty stages array', () => {
    const architectureWithEmptyStages = {
      id: 'test-arch',
      name: 'Test Architecture',
      description: 'Test description',
      goal: 'Test goal',
      domain: 'custom',
      complexity: 'simple' as const,
      reasoning: 'Test reasoning',
      stages: [],
      platformAgnostic: true
    }

    const recovered = ArchitectureDesigner['recoverArchitecture'](architectureWithEmptyStages, [])
    expect(recovered).not.toBeNull()
    expect(recovered?.stages).toEqual([])
  })
})

describe('P3 - Build Compact Context', () => {
  it('should build context with minimal spec', () => {
    const spec: AutomationSpec = {
      automationType: 'workflow',
      description: 'Create a lead capture bot',
      domain: 'custom',
      aiConfig: { enabled: false },
      humanApproval: { required: false },
      errorHandling: { retryStrategy: 'exponential-backoff', maxRetries: 3 },
      persistence: { enabled: true, logLevel: 'info', auditTrail: true },
      architecture: { complexity: 'moderate' }
    }

    const context = ArchitectureDesigner['buildCompactContext'](spec)
    expect(context).toContain('Goal: Create a lead capture bot')
    expect(context).toContain('Type: workflow')
    expect(context).toContain('Domain: custom')
  })

  it('should include trigger in context when present', () => {
    const spec: AutomationSpec = {
      automationType: 'workflow',
      description: 'Create a lead capture bot',
      domain: 'custom',
      trigger: {
        type: 'webhook',
        source: 'external',
        config: 'POST endpoint'
      },
      aiConfig: { enabled: false },
      humanApproval: { required: false },
      errorHandling: { retryStrategy: 'exponential-backoff', maxRetries: 3 },
      persistence: { enabled: true, logLevel: 'info', auditTrail: true },
      architecture: { complexity: 'moderate' }
    }

    const context = ArchitectureDesigner['buildCompactContext'](spec)
    expect(context).toContain('Trigger: webhook')
    expect(context).toContain('Source: external')
  })

  it('should include platform in context when present', () => {
    const spec: AutomationSpec = {
      automationType: 'workflow',
      description: 'Create a lead capture bot',
      domain: 'custom',
      platform: 'n8n',
      platformReasoning: 'Suitable for this automation',
      aiConfig: { enabled: false },
      humanApproval: { required: false },
      errorHandling: { retryStrategy: 'exponential-backoff', maxRetries: 3 },
      persistence: { enabled: true, logLevel: 'info', auditTrail: true },
      architecture: { complexity: 'moderate' }
    }

    const context = ArchitectureDesigner['buildCompactContext'](spec)
    expect(context).toContain('Platform: n8n')
  })
})
