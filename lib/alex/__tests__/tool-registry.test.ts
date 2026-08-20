/**
 * Tool Registry Tests
 */

import { ToolRegistry } from '../tools/tool-registry'
import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../types'

describe('ToolRegistry', () => {
  let registry: ToolRegistry
  let mockToolDefinition: ToolDefinition
  let mockToolExecutor: ToolExecutor

  beforeEach(() => {
    registry = new ToolRegistry()
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
      enabled: true
    }
    mockToolExecutor = {
      name: 'test_tool',
      async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
        return { result: args.value }
      }
    }
  })

  describe('Tool Registration', () => {
    test('should register a tool successfully', () => {
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      expect(registry.hasTool('test_tool')).toBe(true)
    })

    test('should prevent duplicate registration', () => {
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      expect(() => {
        registry.registerTool(mockToolDefinition, mockToolExecutor)
      }).toThrow('Tool "test_tool" is already registered')
    })

    test('should validate tool definition structure', () => {
      const invalidDefinition = { name: '', description: '', inputSchema: {}, category: '', permissions: [], enabled: true }
      expect(() => {
        registry.registerTool(invalidDefinition as any, mockToolExecutor)
      }).toThrow()
    })
  })

  describe('Tool Lookup', () => {
    test('should get a registered tool', () => {
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      const tool = registry.getTool('test_tool')
      expect(tool).toBeDefined()
      expect(tool?.definition.name).toBe('test_tool')
    })

    test('should return undefined for non-existent tool', () => {
      const tool = registry.getTool('non_existent')
      expect(tool).toBeUndefined()
    })

    test('should check if tool exists', () => {
      expect(registry.hasTool('test_tool')).toBe(false)
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      expect(registry.hasTool('test_tool')).toBe(true)
    })
  })

  describe('Tool Listing', () => {
    test('should list all registered tools', () => {
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      const tools = registry.listTools()
      expect(tools).toHaveLength(1)
      expect(tools[0].name).toBe('test_tool')
    })

    test('should list only enabled tools', () => {
      const disabledTool = { ...mockToolDefinition, name: 'disabled_tool', enabled: false }
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      registry.registerTool(disabledTool, mockToolExecutor)
      const enabledTools = registry.listEnabledTools()
      expect(enabledTools).toHaveLength(1)
      expect(enabledTools[0].name).toBe('test_tool')
    })
  })

  describe('Tool Unregistration', () => {
    test('should unregister a tool', () => {
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      expect(registry.hasTool('test_tool')).toBe(true)
      const result = registry.unregisterTool('test_tool')
      expect(result).toBe(true)
      expect(registry.hasTool('test_tool')).toBe(false)
    })

    test('should return false when unregistering non-existent tool', () => {
      const result = registry.unregisterTool('non_existent')
      expect(result).toBe(false)
    })
  })

  describe('Argument Validation', () => {
    test('should validate required arguments', () => {
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      const validation = registry.validateToolArguments('test_tool', {})
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('Missing required argument: value')
    })

    test('should validate argument types', () => {
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      const validation = registry.validateToolArguments('test_tool', { value: 123 })
      expect(validation.valid).toBe(false)
      expect(validation.error).toContain('must be a string')
    })

    test('should pass validation for valid arguments', () => {
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      const validation = registry.validateToolArguments('test_tool', { value: 'test' })
      expect(validation.valid).toBe(true)
    })

    test('should validate number ranges', () => {
      const numberTool: ToolDefinition = {
        name: 'number_tool',
        description: 'Number tool',
        inputSchema: {
          type: 'object',
          required: ['num'],
          properties: {
            num: { type: 'number', minimum: 0, maximum: 100 }
          }
        },
        category: 'utility',
        permissions: [],
        enabled: true
      }
      registry.registerTool(numberTool, mockToolExecutor)

      let validation = registry.validateToolArguments('number_tool', { num: -1 })
      expect(validation.valid).toBe(false)

      validation = registry.validateToolArguments('number_tool', { num: 101 })
      expect(validation.valid).toBe(false)

      validation = registry.validateToolArguments('number_tool', { num: 50 })
      expect(validation.valid).toBe(true)
    })

    test('should validate string length', () => {
      const stringTool: ToolDefinition = {
        name: 'string_tool',
        description: 'String tool',
        inputSchema: {
          type: 'object',
          required: ['str'],
          properties: {
            str: { type: 'string', minLength: 3, maxLength: 10 }
          }
        },
        category: 'utility',
        permissions: [],
        enabled: true
      }
      registry.registerTool(stringTool, mockToolExecutor)

      let validation = registry.validateToolArguments('string_tool', { str: 'ab' })
      expect(validation.valid).toBe(false)

      validation = registry.validateToolArguments('string_tool', { str: 'abcdefghijk' })
      expect(validation.valid).toBe(false)

      validation = registry.validateToolArguments('string_tool', { str: 'abc' })
      expect(validation.valid).toBe(true)
    })

    test('should validate enum values', () => {
      const enumTool: ToolDefinition = {
        name: 'enum_tool',
        description: 'Enum tool',
        inputSchema: {
          type: 'object',
          required: ['choice'],
          properties: {
            choice: { type: 'string', enum: ['a', 'b', 'c'] }
          }
        },
        category: 'utility',
        permissions: [],
        enabled: true
      }
      registry.registerTool(enumTool, mockToolExecutor)

      let validation = registry.validateToolArguments('enum_tool', { choice: 'd' })
      expect(validation.valid).toBe(false)

      validation = registry.validateToolArguments('enum_tool', { choice: 'a' })
      expect(validation.valid).toBe(true)
    })
  })

  describe('Tool Count', () => {
    test('should return correct tool count', () => {
      expect(registry.getToolCount()).toBe(0)
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      expect(registry.getToolCount()).toBe(1)
    })
  })

  describe('Clear', () => {
    test('should clear all tools', () => {
      registry.registerTool(mockToolDefinition, mockToolExecutor)
      expect(registry.getToolCount()).toBe(1)
      registry.clear()
      expect(registry.getToolCount()).toBe(0)
    })
  })
})
