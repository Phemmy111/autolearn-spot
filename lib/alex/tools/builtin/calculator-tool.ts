/**
 * Calculator Tool - Safe mathematical calculations
 * 
 * This tool performs basic mathematical calculations.
 * It does NOT execute arbitrary JavaScript code.
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../../types'

export const calculatorToolDefinition: ToolDefinition = {
  name: 'calculator',
  description: 'Perform basic mathematical calculations including addition, subtraction, multiplication, division, and basic operations. Supports numbers and basic operators (+, -, *, /, ^, %).',
  inputSchema: {
    type: 'object',
    required: ['expression'],
    properties: {
      expression: {
        type: 'string',
        description: 'Mathematical expression to evaluate (e.g., "245 * 37", "10 + 5 * 2")',
        minLength: 1,
        maxLength: 200
      }
    }
  },
  category: 'computation',
  permissions: [],
  enabled: true,
  timeoutMs: 5000 // 5 second timeout
}

export const calculatorToolExecutor: ToolExecutor = {
  name: 'calculator',
  async execute(args: Record<string, any>, context: ToolExecutionContext): Promise<any> {
    const { expression } = args

    if (!expression || typeof expression !== 'string') {
      throw new Error('Expression is required and must be a string')
    }

    // Sanitize expression - only allow safe characters
    const sanitized = expression.trim()
    const allowedChars = /^[0-9+\-*/^%().\s]+$/

    if (!allowedChars.test(sanitized)) {
      throw new Error('Expression contains invalid characters. Only numbers and operators (+, -, *, /, ^, %) are allowed.')
    }

    try {
      // Safe evaluation using Function constructor with restricted scope
      // This is safer than eval() but still requires validation
      const result = Function('"use strict"; return (' + sanitized + ')')()

      if (typeof result !== 'number' || !isFinite(result)) {
        throw new Error('Expression did not evaluate to a valid number')
      }

      // Round to reasonable precision
      const rounded = Math.round(result * 1000000) / 1000000

      return {
        expression: sanitized,
        result: rounded,
        formatted: rounded.toLocaleString()
      }
    } catch (error) {
      throw new Error(`Failed to evaluate expression: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}
