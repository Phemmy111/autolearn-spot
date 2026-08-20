/**
 * Calculator Tool Tests
 */

import { calculatorToolDefinition, calculatorToolExecutor } from '../tools/builtin/calculator-tool'
import { ToolExecutionContext } from '../types'

describe('Calculator Tool', () => {
  let context: ToolExecutionContext

  beforeEach(() => {
    context = {
      userId: 'test-user-id'
    }
  })

  describe('Tool Definition', () => {
    test('should have correct definition', () => {
      expect(calculatorToolDefinition.name).toBe('calculator')
      expect(calculatorToolDefinition.category).toBe('computation')
      expect(calculatorToolDefinition.enabled).toBe(true)
      expect(calculatorToolDefinition.inputSchema.required).toContain('expression')
    })
  })

  describe('Tool Execution', () => {
    test('should perform basic addition', async () => {
      const result = await calculatorToolExecutor.execute({ expression: '2 + 3' }, context)
      expect(result.result).toBe(5)
    })

    test('should perform multiplication', async () => {
      const result = await calculatorToolExecutor.execute({ expression: '245 * 37' }, context)
      expect(result.result).toBe(9065)
    })

    test('should perform division', async () => {
      const result = await calculatorToolExecutor.execute({ expression: '100 / 4' }, context)
      expect(result.result).toBe(25)
    })

    test('should handle complex expressions', async () => {
      const result = await calculatorToolExecutor.execute({ expression: '10 + 5 * 2' }, context)
      expect(result.result).toBe(20) // Order of operations
    })

    test('should handle exponentiation', async () => {
      const result = await calculatorToolExecutor.execute({ expression: '2 ^ 3' }, context)
      expect(result.result).toBe(8)
    })

    test('should handle modulo', async () => {
      const result = await calculatorToolExecutor.execute({ expression: '10 % 3' }, context)
      expect(result.result).toBe(1)
    })

    test('should handle parentheses', async () => {
      const result = await calculatorToolExecutor.execute({ expression: '(2 + 3) * 4' }, context)
      expect(result.result).toBe(20)
    })

    test('should reject invalid characters', async () => {
      await expect(
        calculatorToolExecutor.execute({ expression: 'eval("malicious")' }, context)
      ).rejects.toThrow('invalid characters')
    })

    test('should reject non-string expression', async () => {
      await expect(
        calculatorToolExecutor.execute({ expression: 123 }, context)
      ).rejects.toThrow('must be a string')
    })

    test('should reject missing expression', async () => {
      await expect(
        calculatorToolExecutor.execute({}, context)
      ).rejects.toThrow('required')
    })

    test('should handle division by zero', async () => {
      const result = await calculatorToolExecutor.execute({ expression: '1 / 0' }, context)
      expect(result.result).toBe(Infinity) // JavaScript behavior
    })

    test('should return formatted result', async () => {
      const result = await calculatorToolExecutor.execute({ expression: '1000000' }, context)
      expect(result.formatted).toBeDefined()
    })
  })
})
