/**
 * Tool Registry - Centralized tool registration and management
 * 
 * This registry provides:
 * - Tool registration/unregistration
 * - Tool lookup and validation
 * - Argument validation
 * - Duplicate prevention
 */

import { ToolDefinition, ToolExecutor, ToolExecutionContext } from '../types'

export class ToolRegistry {
  private tools: Map<string, { definition: ToolDefinition; executor: ToolExecutor }> = new Map()

  /**
   * Register a tool
   */
  registerTool(definition: ToolDefinition, executor: ToolExecutor): void {
    if (this.tools.has(definition.name)) {
      throw new Error(`Tool "${definition.name}" is already registered`)
    }

    // Validate tool definition
    this.validateToolDefinition(definition)

    this.tools.set(definition.name, { definition, executor })
    console.log(`[Tool Registry] Registered tool: ${definition.name}`)
  }

  /**
   * Unregister a tool
   */
  unregisterTool(name: string): boolean {
    const result = this.tools.delete(name)
    if (result) {
      console.log(`[Tool Registry] Unregistered tool: ${name}`)
    }
    return result
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): { definition: ToolDefinition; executor: ToolExecutor } | undefined {
    return this.tools.get(name)
  }

  /**
   * List all registered tools
   */
  listTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map(({ definition }) => definition)
  }

  /**
   * List only enabled tools
   */
  listEnabledTools(): ToolDefinition[] {
    return Array.from(this.tools.values())
      .filter(({ definition }) => definition.enabled)
      .map(({ definition }) => definition)
  }

  /**
   * Check if a tool is registered
   */
  hasTool(name: string): boolean {
    return this.tools.has(name)
  }

  /**
   * Validate tool arguments against input schema
   */
  validateToolArguments(toolName: string, arguments: Record<string, any>): { valid: boolean; error?: string } {
    const tool = this.tools.get(toolName)
    if (!tool) {
      return { valid: false, error: `Tool "${toolName}" not found` }
    }

    const { definition } = tool

    // Basic validation - check required fields
    if (definition.inputSchema.required) {
      for (const requiredField of definition.inputSchema.required) {
        if (!(requiredField in arguments)) {
          return { valid: false, error: `Missing required argument: ${requiredField}` }
        }
      }
    }

    // Type validation for known fields
    if (definition.inputSchema.properties) {
      for (const [fieldName, fieldSchema] of Object.entries(definition.inputSchema.properties)) {
        if (fieldName in arguments) {
          const value = arguments[fieldName]
          const schema = fieldSchema as any

          // Type checking
          if (schema.type === 'string' && typeof value !== 'string') {
            return { valid: false, error: `Argument "${fieldName}" must be a string` }
          }
          if (schema.type === 'number' && typeof value !== 'number') {
            return { valid: false, error: `Argument "${fieldName}" must be a number` }
          }
          if (schema.type === 'boolean' && typeof value !== 'boolean') {
            return { valid: false, error: `Argument "${fieldName}" must be a boolean` }
          }
          if (schema.type === 'array' && !Array.isArray(value)) {
            return { valid: false, error: `Argument "${fieldName}" must be an array` }
          }

          // Enum validation
          if (schema.enum && !schema.enum.includes(value)) {
            return { valid: false, error: `Argument "${fieldName}" must be one of: ${schema.enum.join(', ')}` }
          }

          // Range validation for numbers
          if (schema.type === 'number') {
            if (schema.minimum !== undefined && value < schema.minimum) {
              return { valid: false, error: `Argument "${fieldName}" must be >= ${schema.minimum}` }
            }
            if (schema.maximum !== undefined && value > schema.maximum) {
              return { valid: false, error: `Argument "${fieldName}" must be <= ${schema.maximum}` }
            }
          }

          // String length validation
          if (schema.type === 'string') {
            if (schema.minLength !== undefined && value.length < schema.minLength) {
              return { valid: false, error: `Argument "${fieldName}" must be at least ${schema.minLength} characters` }
            }
            if (schema.maxLength !== undefined && value.length > schema.maxLength) {
              return { valid: false, error: `Argument "${fieldName}" must be at most ${schema.maxLength} characters` }
            }
          }
        }
      }
    }

    return { valid: true }
  }

  /**
   * Validate tool definition structure
   */
  private validateToolDefinition(definition: ToolDefinition): void {
    if (!definition.name || typeof definition.name !== 'string') {
      throw new Error('Tool name is required and must be a string')
    }

    if (!definition.description || typeof definition.description !== 'string') {
      throw new Error('Tool description is required and must be a string')
    }

    if (!definition.inputSchema || typeof definition.inputSchema !== 'object') {
      throw new Error('Tool inputSchema is required and must be an object')
    }

    if (!definition.category || typeof definition.category !== 'string') {
      throw new Error('Tool category is required and must be a string')
    }

    if (!Array.isArray(definition.permissions)) {
      throw new Error('Tool permissions must be an array')
    }

    if (typeof definition.enabled !== 'boolean') {
      throw new Error('Tool enabled must be a boolean')
    }
  }

  /**
   * Get tool count
   */
  getToolCount(): number {
    return this.tools.size
  }

  /**
   * Clear all tools (useful for testing)
   */
  clear(): void {
    this.tools.clear()
    console.log('[Tool Registry] All tools cleared')
  }
}
