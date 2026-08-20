/**
 * Phase 7: Workflow Parser Tests
 */

import { WorkflowParser } from '../workflow-parser'

describe('WorkflowParser', () => {
  describe('parseFromJson', () => {
    test('should parse valid workflow JSON', () => {
      const validJson = JSON.stringify({
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
        connections: []
      })

      const result = WorkflowParser.parseFromJson(validJson)

      expect(result.success).toBe(true)
      expect(result.workflow).toBeDefined()
      expect(result.workflow?.nodes).toHaveLength(1)
      expect(result.workflow?.nodes[0].id).toBe('node1')
    })

    test('should reject malformed JSON', () => {
      const malformedJson = '{ invalid json }'

      const result = WorkflowParser.parseFromJson(malformedJson)

      expect(result.success).toBe(false)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0].code).toBe('JSON_PARSE_ERROR')
    })

    test('should reject non-object input', () => {
      const arrayJson = '[]'

      const result = WorkflowParser.parseFromJson(arrayJson)

      expect(result.success).toBe(false)
      expect(result.errors[0].code).toBe('INVALID_TYPE')
    })

    test('should warn for unrecognized format', () => {
      const unrecognizedJson = JSON.stringify({
        data: 'something'
      })

      const result = WorkflowParser.parseFromJson(unrecognizedJson)

      expect(result.success).toBe(false)
      expect(result.warnings).toHaveLength(1)
      expect(result.warnings[0].code).toBe('UNRECOGNIZED_FORMAT')
    })

    test('should warn for missing nodes', () => {
      const noNodesJson = JSON.stringify({
        connections: []
      })

      const result = WorkflowParser.parseFromJson(noNodesJson)

      expect(result.success).toBe(false)
      expect(result.errors[0].code).toBe('MISSING_NODES')
    })

    test('should handle nodes with missing fields', () => {
      const incompleteNodeJson = JSON.stringify({
        nodes: [
          {
            id: 'node1',
            name: 'Webhook'
            // Missing type
          }
        ],
        connections: []
      })

      const result = WorkflowParser.parseFromJson(incompleteNodeJson)

      expect(result.success).toBe(false)
      expect(result.errors.some(e => e.code === 'NODE_PARSE_ERROR')).toBe(true)
    })
  })

  describe('parseFromObject', () => {
    test('should parse valid workflow object', () => {
      const workflow = {
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
        connections: []
      }

      const result = WorkflowParser.parseFromObject(workflow)

      expect(result.success).toBe(true)
      expect(result.workflow).toBeDefined()
    })

    test('should preserve unknown fields', () => {
      const workflow = {
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
        connections: [],
        customField: 'value'
      }

      const result = WorkflowParser.parseFromObject(workflow)

      expect(result.success).toBe(true)
      expect(result.workflow).toBeDefined()
      expect((result.workflow as any).customField).toBe('value')
    })
  })

  describe('serializeToJson', () => {
    test('should serialize workflow to JSON', () => {
      const workflow = {
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
        connections: [],
        metadata: {
          name: 'Test Workflow'
        }
      }

      const json = WorkflowParser.serializeToJson(workflow)

      const parsed = JSON.parse(json)
      expect(parsed.nodes).toHaveLength(1)
      expect(parsed.name).toBe('Test Workflow')
    })
  })
})
