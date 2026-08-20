/**
 * Phase 7: Workflow Security
 * 
 * Security validation and protections for workflow operations.
 */

import { Workflow, WorkflowValidationError } from './workflow-types'

export class WorkflowSecurity {
  /**
   * Validate workflow for security issues before processing
   */
  static validateWorkflowSecurity(workflow: Workflow): {
    safe: boolean
    errors: WorkflowValidationError[]
    warnings: WorkflowValidationError[]
  } {
    const errors: WorkflowValidationError[] = []
    const warnings: WorkflowValidationError[] = []

    // Check for exposed secrets
    const secrets = this.detectExposedSecrets(workflow)
    if (secrets.length > 0) {
      errors.push({
        severity: 'error',
        code: 'EXPOSED_SECRETS',
        message: `Workflow contains potential exposed secrets in ${secrets.length} location(s)`,
        suggestion: 'Remove any actual credentials, API keys, or secrets from the workflow. Use credential references instead.'
      })
      secrets.forEach(secret => {
        errors.push({
          severity: 'error',
          code: 'EXPOSED_SECRET',
          message: `Potential secret at: ${secret}`,
          suggestion: 'Replace with credential reference'
        })
      })
    }

    // Check for dangerous node types
    const dangerousNodes = this.detectDangerousNodes(workflow)
    if (dangerousNodes.length > 0) {
      warnings.push({
        severity: 'warning',
        code: 'DANGEROUS_NODES',
        message: `Workflow contains potentially dangerous node types: ${dangerousNodes.join(', ')}`,
        suggestion: 'Review these nodes to ensure they are used safely.'
      })
    }

    // Check for code execution nodes
    const codeNodes = this.detectCodeExecutionNodes(workflow)
    if (codeNodes.length > 0) {
      warnings.push({
        severity: 'warning',
        code: 'CODE_EXECUTION',
        message: `Workflow contains code execution nodes: ${codeNodes.join(', ')}`,
        suggestion: 'Ensure code in these nodes is safe and does not execute arbitrary user input.'
      })
    }

    // Check for external command execution
    const commandNodes = this.detectCommandExecutionNodes(workflow)
    if (commandNodes.length > 0) {
      errors.push({
        severity: 'error',
        code: 'COMMAND_EXECUTION',
        message: `Workflow contains command execution nodes: ${commandNodes.join(', ')}`,
        suggestion: 'Command execution is not allowed in generated workflows for security reasons.'
      })
    }

    return {
      safe: errors.length === 0,
      errors,
      warnings
    }
  }

  /**
   * Detect exposed secrets in workflow
   */
  private static detectExposedSecrets(workflow: Workflow): string[] {
    const secrets: string[] = []
    const secretPatterns = [
      { pattern: /sk-[a-zA-Z0-9]{32,}/, name: 'OpenAI API key' },
      { pattern: /AIza[a-zA-Z0-9_-]{35}/, name: 'Google API key' },
      { pattern: /AKIA[a-zA-Z0-9]{16}/, name: 'AWS access key' },
      { pattern: /xox[bap]-[a-zA-Z0-9-]{10,}/, name: 'Slack token' },
      { pattern: /Bearer\s+[a-zA-Z0-9_-]{20,}/, name: 'Bearer token' },
      { pattern: /password\s*[:=]\s*["']?[^\s"']{8,}/, name: 'Password' },
      { pattern: /api[_-]?key\s*[:=]\s*["']?[^\s"']{20,}/, name: 'API key' },
      { pattern: /secret[_-]?key\s*[:=]\s*["']?[^\s"']{20,}/, name: 'Secret key' },
      { pattern: /private[_-]?key\s*[:=]\s*["']?[^\s"']{20,}/, name: 'Private key' },
      { pattern: /service[_-]?role[_-]?key/i, name: 'Service role key' }
    ]

    workflow.nodes.forEach(node => {
      if (node.parameters) {
        this.checkObjectForSecrets(node.parameters, secretPatterns, secrets, `node.${node.name}`)
      }
    })

    return secrets
  }

  /**
   * Recursively check object for secrets
   */
  private static checkObjectForSecrets(
    obj: any,
    patterns: Array<{ pattern: RegExp; name: string }>,
    secrets: string[],
    path: string
  ): void {
    if (typeof obj === 'string') {
      patterns.forEach(({ pattern, name }) => {
        if (pattern.test(obj)) {
          secrets.push(`${path} (${name})`)
        }
      })
    } else if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        obj.forEach((item, index) => {
          this.checkObjectForSecrets(item, patterns, secrets, `${path}[${index}]`)
        })
      } else {
        Object.entries(obj).forEach(([key, value]) => {
          const newPath = `${path}.${key}`
          this.checkObjectForSecrets(value, patterns, secrets, newPath)
        })
      }
    }
  }

  /**
   * Detect potentially dangerous node types
   */
  private static detectDangerousNodes(workflow: Workflow): string[] {
    const dangerous: string[] = []
    const dangerousTypes = [
      'delete',
      'drop',
      'truncate',
      'exec',
      'command',
      'shell'
    ]

    workflow.nodes.forEach(node => {
      const typeLower = node.type.toLowerCase()
      if (dangerousTypes.some(dangerous => typeLower.includes(dangerous))) {
        dangerous.push(node.name)
      }
    })

    return dangerous
  }

  /**
   * Detect code execution nodes
   */
  private static detectCodeExecutionNodes(workflow: Workflow): string[] {
    const codeNodes: string[] = []
    const codeTypes = [
      'function',
      'code',
      'javascript',
      'python',
      'typescript',
      'evaluate'
    ]

    workflow.nodes.forEach(node => {
      const typeLower = node.type.toLowerCase()
      if (codeTypes.some(code => typeLower.includes(code))) {
        codeNodes.push(node.name)
      }
    })

    return codeNodes
  }

  /**
   * Detect command execution nodes
   */
  private static detectCommandExecutionNodes(workflow: Workflow): string[] {
    const commandNodes: string[] = []
    const commandTypes = [
      'execute',
      'command',
      'shell',
      'ssh',
      'local'
    ]

    workflow.nodes.forEach(node => {
      const typeLower = node.type.toLowerCase()
      if (commandTypes.some(cmd => typeLower.includes(cmd))) {
        commandNodes.push(node.name)
      }
    })

    return commandNodes
  }

  /**
   * Sanitize workflow for safe processing
   */
  static sanitizeWorkflow(workflow: Workflow): Workflow {
    const sanitized = JSON.parse(JSON.stringify(workflow))

    // Remove potential secrets from parameters
    sanitized.nodes.forEach((node: any) => {
      if (node.parameters) {
        node.parameters = this.sanitizeObject(node.parameters)
      }
    })

    return sanitized
  }

  /**
   * Recursively sanitize object
   */
  private static sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
      // Don't sanitize short values, expressions, or boolean strings
      if (obj.length > 50 && !obj.includes('=') && !obj.toLowerCase().includes('true') && !obj.toLowerCase().includes('false')) {
        return '[REDACTED]'
      }
      return obj
    } else if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(item => this.sanitizeObject(item))
      }

      const sanitized: any = {}
      Object.entries(obj).forEach(([key, value]) => {
        // Skip keys that look like they might contain secrets
        const keyLower = key.toLowerCase()
        if (keyLower.includes('secret') || keyLower.includes('password') || keyLower.includes('key') || keyLower.includes('token')) {
          sanitized[key] = '[REDACTED]'
        } else {
          sanitized[key] = this.sanitizeObject(value)
        }
      })
      return sanitized
    }

    return obj
  }

  /**
   * Validate user input for workflow generation
   */
  static validateGenerationInput(input: string): {
    safe: boolean
    error?: string
  } {
    // Check for injection attempts
    const injectionPatterns = [
      /<script/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /eval\s*\(/i,
      /exec\s*\(/i,
      /system\s*\(/i
    ]

    for (const pattern of injectionPatterns) {
      if (pattern.test(input)) {
        return {
          safe: false,
          error: 'Input contains potentially dangerous patterns'
        }
      }
    }

    // Check for excessive length
    if (input.length > 10000) {
      return {
        safe: false,
        error: 'Input is too long'
      }
    }

    return { safe: true }
  }

  /**
   * Check if workflow execution is allowed
   * IMPORTANT: Phase 7 does NOT execute workflows, only generates them
   */
  static isExecutionAllowed(): boolean {
    // Workflow execution is NOT allowed in Phase 7
    // Only generation, validation, analysis, debugging, and repair
    return false
  }

  /**
   * Get security disclaimer
   */
  static getSecurityDisclaimer(): string {
    return `SECURITY NOTICE:
- Generated workflows do NOT contain actual credentials or secrets
- You must configure credentials in n8n separately
- Workflows are not executed by this system
- Review all generated workflows before use
- Never share workflows that contain actual credentials
- Code execution nodes require manual review
- This system does not connect to external services`
  }
}
