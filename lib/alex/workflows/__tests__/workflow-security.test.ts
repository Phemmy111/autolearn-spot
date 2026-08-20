/**
 * Phase 7: Workflow Security Tests
 */

import { WorkflowSecurity } from '../workflow-security'

describe('WorkflowSecurity', () => {
  describe('validateWorkflowSecurity', () => {
    test('should pass security check for safe workflow', () => {
      const safeWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Webhook',
            type: 'n8n-nodes-base.webhook',
            typeVersion: 1,
            position: [250, 300],
            parameters: {
              path: 'webhook'
            }
          }
        ],
        connections: []
      }

      const result = WorkflowSecurity.validateWorkflowSecurity(safeWorkflow)

      expect(result.safe).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    test('should detect exposed API keys', () => {
      const unsafeWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'HTTP',
            type: 'n8n-nodes-base.http',
            typeVersion: 1,
            position: [250, 300],
            parameters: {
              url: 'https://api.example.com',
              authentication: 'genericCredentialType',
              genericAuthType: 'httpHeaderAuth',
              headerAuth: {
                name: 'Authorization',
                value: 'Bearer sk-1234567890abcdefghijklmnopqrstuvwxyz1234567890ab' // OpenAI-like key
              }
            }
          }
        ],
        connections: []
      }

      const result = WorkflowSecurity.validateWorkflowSecurity(unsafeWorkflow)

      expect(result.safe).toBe(false)
      expect(result.errors.some(e => e.code === 'EXPOSED_SECRETS')).toBe(true)
    })

    test('should detect dangerous node types', () => {
      const dangerousWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Execute',
            type: 'n8n-nodes-base.executeCommand',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: []
      }

      const result = WorkflowSecurity.validateWorkflowSecurity(dangerousWorkflow)

      expect(result.errors.some(e => e.code === 'COMMAND_EXECUTION')).toBe(true)
    })

    test('should warn for code execution nodes', () => {
      const codeWorkflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Function',
            type: 'n8n-nodes-base.function',
            typeVersion: 1,
            position: [250, 300],
            parameters: {}
          }
        ],
        connections: []
      }

      const result = WorkflowSecurity.validateWorkflowSecurity(codeWorkflow)

      expect(result.warnings.some(e => e.code === 'CODE_EXECUTION')).toBe(true)
    })
  })

  describe('sanitizeWorkflow', () => {
    test('should sanitize secrets from workflow', () => {
      const workflow = {
        nodes: [
          {
            id: 'node1',
            name: 'HTTP',
            type: 'n8n-nodes-base.http',
            typeVersion: 1,
            position: [250, 300],
            parameters: {
              apiKey: 'this-is-a-very-long-api-key-that-should-be-redacted'
            }
          }
        ],
        connections: []
      }

      const sanitized = WorkflowSecurity.sanitizeWorkflow(workflow)

      expect(sanitized.nodes[0].parameters.apiKey).toBe('[REDACTED]')
    })

    test('should preserve short values', () => {
      const workflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [250, 300],
            parameters: {
              value: 'short'
            }
          }
        ],
        connections: []
      }

      const sanitized = WorkflowSecurity.sanitizeWorkflow(workflow)

      expect(sanitized.nodes[0].parameters.value).toBe('short')
    })

    test('should preserve expressions', () => {
      const workflow = {
        nodes: [
          {
            id: 'node1',
            name: 'Set',
            type: 'n8n-nodes-base.set',
            typeVersion: 1,
            position: [250, 300],
            parameters: {
              value: '={{ $json.data }}'
            }
          }
        ],
        connections: []
      }

      const sanitized = WorkflowSecurity.sanitizeWorkflow(workflow)

      expect(sanitized.nodes[0].parameters.value).toBe('={{ $json.data }}')
    })
  })

  describe('validateGenerationInput', () => {
    test('should pass for safe input', () => {
      const result = WorkflowSecurity.validateGenerationInput('Create a workflow for email automation')

      expect(result.safe).toBe(true)
    })

    test('should reject script injection', () => {
      const result = WorkflowSecurity.validateGenerationInput('<script>alert("xss")</script>')

      expect(result.safe).toBe(false)
      expect(result.error).toContain('dangerous')
    })

    test('should reject javascript: protocol', () => {
      const result = WorkflowSecurity.validateGenerationInput('javascript:alert(1)')

      expect(result.safe).toBe(false)
    })

    test('should reject eval pattern', () => {
      const result = WorkflowSecurity.validateGenerationInput('Use eval() to execute code')

      expect(result.safe).toBe(false)
    })

    test('should reject excessively long input', () => {
      const longInput = 'a'.repeat(10001)

      const result = WorkflowSecurity.validateGenerationInput(longInput)

      expect(result.safe).toBe(false)
      expect(result.error).toContain('too long')
    })
  })

  describe('isExecutionAllowed', () => {
    test('should always return false', () => {
      expect(WorkflowSecurity.isExecutionAllowed()).toBe(false)
    })
  })
})
