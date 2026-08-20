/**
 * Phase 7: Workflow Validator Tests
 */

import { WorkflowValidator } from '../workflow-validator'

describe('WorkflowValidator', () => {
  const validWorkflow = {
    nodes: [
      {
        id: 'node1',
        name: 'Webhook',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 1,
        position: [250, 300],
        parameters: {}
      },
      {
        id: 'node2',
        name: 'Set',
        type: 'n8n-nodes-base.set',
        typeVersion: 1,
        position: [450, 300],
        parameters: {}
      }
    ],
    connections: [
      {
        source: 'node1',
        target: 'node2'
      }
    ]
  }

  describe('validate', () => {
    test('should validate valid workflow', () => {
      const result = WorkflowValidator.validate(validWorkflow)

      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect duplicate node IDs', () => {
      const duplicateIdWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          },
          {
            id: 'node1', // Duplicate
            name: 'Set',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {}
          }
        ],
        connections: []
      }

      const result = WorkflowValidator.validate(duplicateIdWorkflow)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'DUPLICATE_NODE_ID')).toBe(true)
    })

    test('should detect broken connection', () => {
      const brokenConnectionWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: [
          {
            source: 'node1',
            target: 'node2' // node2 doesn't exist
          }
        ]
      }

      const result = WorkflowValidator.validate(brokenConnectionWorkflow)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_TARGET')).toBe(true)
    })

    test('should detect missing destination', () => {
      const missingDestinationWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: [
          {
            source: 'node2', // node2 doesn't exist
            target: 'node1'
          }
        ]
      }

      const result = WorkflowValidator.validate(missingDestinationWorkflow)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'INVALID_SOURCE')).toBe(true)
    })

    test('should detect malformed node', () => {
      const malformedNodeWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Webhook'
            // Missing type
          }
        ],
        connections: []
      }

      const result = WorkflowValidator.validate(malformedNodeWorkflow)

      expect(result.isValid).toBe(false)
      expect(result.errors.some(e => e.code === 'MISSING_NODE_TYPE')).toBe(true)
    })

    test('should warn for disconnected nodes', () => {
      const disconnectedWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          },
          {
            id: 'node2',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [450, 300],
            parameters: {}
          }
        ],
        connections: [] // No connections
      }

      const result = WorkflowValidator.validate(disconnectedWorkflow)

      expect(result.info.some(e => e.code === 'DISCONNECTED_NODE')).toBe(true)
    })

    test('should warn for self-connection', () => {
      const selfConnectionWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: [
          {
            source: 'node1',
            target: 'node1' // Self-connection
          }
        ]
      }

      const result = WorkflowValidator.validate(selfConnectionWorkflow)

      expect(result.warnings.some(e => e.code === 'SELF_CONNECTION')).toBe(true)
    })

    test('should extract integrations', () => {
      const result = WorkflowValidator.validate(validWorkflow)

      expect(result.integrations).toContain('webhook')
      expect(result.integrations).toContain('set')
    })

    test('should extract required credentials', () => {
      const workflowWithCreds = {
        nodes: [
          {
            id: 'node1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {},
            credentials: {
              googleSheets: 'credential1'
            }
          }
        ],
        connections: []
      }

      const result = WorkflowValidator.validate(workflowWithCreds)

      expect(result.requiredCredentials).toContain('googleSheets')
    })
  })
})
