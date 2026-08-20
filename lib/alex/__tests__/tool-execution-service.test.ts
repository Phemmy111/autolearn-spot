/**
 * Tool Execution Service Tests
 */

import { ToolRegistry } from '../tools/tool-registry'
import { ToolExecutionService } from '../tools/tool-execution-service'
import { ToolDefinition, ToolExecutor, ToolExecutionContext, ToolCall } from '../types'

describe('ToolExecutionService', () => {
  let registry: ToolRegistry
  let executionService: ToolExecutionService
  let mockToolDefinition: ToolDefinition
  let mockToolExecutor: ToolExecutor
  let mockContext: ToolExecutionContext

  beforeEach(() => {
    registry = new ToolRegistry()
    executionService = new ToolExecutionService(registry)
    mockContext = {
      userId: 'test-user-id',
      conversationId: 'test-conversation-id'
    }

    mockToolDefinition = {
      name: 'test_tool',
      description: 'A test tool',
      inputSchema: {
        type: 'object',
        required: ['value'],
        properties: {
          value: { type: 'string' }
        }
      },
      category: 'utility',
      permissions: [],
      enabled: true,
      timeoutMs: 5000
    }

    mockToolExecutor = {
      name: 'test_tool',
      async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
        return { result: args.value, context: context.userId }
      }
    }

    registry.registerTool(mockToolDefinition, mockToolExecutor)
  })

  describe('Tool Execution', () => {
    test('should execute a tool successfully', async () => {
      const call: ToolCall = {
        id: 'test-call-1',
        toolName: 'test_tool',
        arguments: { value: 'test-value' },
        userId: mockContext.userId,
        conversationId: mockContext.conversationId
      }

      const result = await executionService.executeTool(call, mockContext)

      expect(result.success).toBe(true)
      expect(result.toolName).toBe('test_tool')
      expect(result.result).toEqual({ result: 'test-value', context: mockContext.userId })
      expect(result.executionTimeMs).toBeGreaterThan(0)
    })

    test('should fail for non-existent tool', async () => {
      const call: ToolCall = {
        id: 'test-call-2',
        toolName: 'non_existent_tool',
        arguments: {},
        userId: mockContext.userId
      }

      const result = await executionService.executeTool(call, mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('not found')
    })

    test('should fail for disabled tool', async () => {
      const disabledTool = { ...mockToolDefinition, name: 'disabled_tool', enabled: false }
      registry.registerTool(disabledTool, mockToolExecutor)

      const call: ToolCall = {
        id: 'test-call-3',
        toolName: 'disabled_tool',
        arguments: { value: 'test' },
        userId: mockContext.userId
      }

      const result = await executionService.executeTool(call, mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('disabled')
    })

    test('should fail for invalid arguments', async () => {
      const call: ToolCall = {
        id: 'test-call-4',
        toolName: 'test_tool',
        arguments: {}, // Missing required 'value'
        userId: mockContext.userId
      }

      const result = await executionService.executeTool(call, mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid arguments')
    })

    test('should handle tool execution timeout', async () => {
      const slowTool: ToolDefinition = {
        name: 'slow_tool',
        description: 'A slow tool',
        inputSchema: { type: 'object', properties: {} },
        category: 'utility',
        permissions: [],
        enabled: true,
        timeoutMs: 100 // 100ms timeout
      }

      const slowExecutor: ToolExecutor = {
        name: 'slow_tool',
        async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
          await new Promise(resolve => setTimeout(resolve, 500)) // 500ms execution
          return { result: 'done' }
        }
      }

      registry.registerTool(slowTool, slowExecutor)

      const call: ToolCall = {
        id: 'test-call-5',
        toolName: 'slow_tool',
        arguments: {},
        userId: mockContext.userId
      }

      const result = await executionService.executeTool(call, mockContext)

      expect(result.success).toBe(false)
      expect(result.error).toContain('timeout')
    })
  })

  describe('Tool Call Limit', () => {
    test('should enforce max tool calls per request', async () => {
      executionService.setMaxToolCallsPerRequest(2)
      executionService.resetRequestCallCount(mockContext.userId, mockContext.conversationId)

      const call: ToolCall = {
        id: 'test-call-6',
        toolName: 'test_tool',
        arguments: { value: 'test' },
        userId: mockContext.userId,
        conversationId: mockContext.conversationId
      }

      // First two calls should succeed
      const result1 = await executionService.executeTool(call, mockContext)
      const result2 = await executionService.executeTool(call, mockContext)
      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Third call should fail due to limit
      const result3 = await executionService.executeTool(call, mockContext)
      expect(result3.success).toBe(false)
      expect(result3.error).toContain('Maximum tool call limit')
    })

    test('should reset call count on reset', async () => {
      executionService.setMaxToolCallsPerRequest(2)
      executionService.resetRequestCallCount(mockContext.userId, mockContext.conversationId)

      const call: ToolCall = {
        id: 'test-call-7',
        toolName: 'test_tool',
        arguments: { value: 'test' },
        userId: mockContext.userId,
        conversationId: mockContext.conversationId
      }

      // Make 2 calls to hit limit
      await executionService.executeTool(call, mockContext)
      await executionService.executeTool(call, mockContext)

      // Reset
      executionService.resetRequestCallCount(mockContext.userId, mockContext.conversationId)

      // Should succeed again
      const result = await executionService.executeTool(call, mockContext)
      expect(result.success).toBe(true)
    })
  })

  describe('Multiple Tool Execution', () => {
    test('should execute multiple tools in parallel', async () => {
      const calls: ToolCall[] = [
        {
          id: 'test-call-8a',
          toolName: 'test_tool',
          arguments: { value: 'value1' },
          userId: mockContext.userId
        },
        {
          id: 'test-call-8b',
          toolName: 'test_tool',
          arguments: { value: 'value2' },
          userId: mockContext.userId
        }
      ]

      const results = await executionService.executeTools(calls, mockContext)

      expect(results).toHaveLength(2)
      expect(results[0].success).toBe(true)
      expect(results[1].success).toBe(true)
      expect(results[0].result.result).toBe('value1')
      expect(results[1].result.result).toBe('value2')
    })

    test('should limit total tool calls to max limit', async () => {
      executionService.setMaxToolCallsPerRequest(3)

      const calls: ToolCall[] = Array.from({ length: 5 }, (_, i) => ({
        id: `test-call-9-${i}`,
        toolName: 'test_tool',
        arguments: { value: `value${i}` },
        userId: mockContext.userId
      }))

      const results = await executionService.executeTools(calls, mockContext)

      expect(results.length).toBe(3) // Limited to max
    })
  })

  describe('Max Tool Calls Configuration', () => {
    test('should set max tool calls per request', () => {
      executionService.setMaxToolCallsPerRequest(10)
      // Should not throw
    })

    test('should reject invalid max tool calls', () => {
      expect(() => executionService.setMaxToolCallsPerRequest(0)).toThrow()
      expect(() => executionService.setMaxToolCallsPerRequest(25)).toThrow()
    })
  })
})
