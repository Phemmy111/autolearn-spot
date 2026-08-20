/**
 * Phase 7: Workflow Artifact Generation
 * 
 * Generates downloadable JSON workflow artifacts.
 */

import { Workflow, WorkflowArtifact, WorkflowMetadata } from './workflow-types'
import { WorkflowParser } from './workflow-parser'
import crypto from 'crypto'

export class WorkflowArtifactService {
  /**
   * Generate a workflow artifact
   */
  static generateArtifact(
    workflow: Workflow,
    filename?: string
  ): WorkflowArtifact {
    // Serialize workflow to JSON
    const content = WorkflowParser.serializeToJson(workflow)

    // Generate filename if not provided
    const safeFilename = filename || this.generateFilename(workflow)

    // Calculate size
    const size = Buffer.byteLength(content, 'utf8')

    // Extract metadata
    const workflowMetadata = workflow.metadata || {}

    return {
      filename: safeFilename,
      content,
      size,
      createdAt: new Date().toISOString(),
      workflowMetadata
    }
  }

  /**
   * Generate a safe filename for the workflow
   */
  private static generateFilename(workflow: Workflow): string {
    let baseName = 'n8n-workflow'

    // Use workflow name if available
    if (workflow.metadata?.name) {
      baseName = workflow.metadata.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
    }

    // Add timestamp
    const timestamp = Date.now()
    const random = crypto.randomBytes(4).toString('hex')

    return `${baseName}-${timestamp}-${random}.json`
  }

  /**
   * Validate artifact before generation
   */
  static validateForArtifact(workflow: Workflow): {
    valid: boolean
    errors: string[]
  } {
    const errors: string[] = []

    // Check if workflow has nodes
    if (!workflow.nodes || workflow.nodes.length === 0) {
      errors.push('Workflow has no nodes')
    }

    // Check for secrets in workflow
    const secrets = this.detectSecrets(workflow)
    if (secrets.length > 0) {
      errors.push(`Workflow contains potential secrets: ${secrets.join(', ')}`)
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  /**
   * Detect potential secrets in workflow
   */
  private static detectSecrets(workflow: Workflow): string[] {
    const secrets: string[] = []
    const secretPatterns = [
      /api[_-]?key/i,
      /secret/i,
      /password/i,
      /token/i,
      /private[_-]?key/i,
      /aws[_-]?access[_-]?key/i,
      /service[_-]?role[_-]?key/i
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
    patterns: RegExp[],
    secrets: string[],
    path: string
  ): void {
    if (typeof obj === 'string') {
      patterns.forEach(pattern => {
        if (pattern.test(obj) && obj.length > 10) {
          secrets.push(path)
        }
      })
    } else if (typeof obj === 'object' && obj !== null) {
      Object.entries(obj).forEach(([key, value]) => {
        const newPath = `${path}.${key}`
        // Check key name for secret indicators
        patterns.forEach(pattern => {
          if (pattern.test(key)) {
            secrets.push(newPath)
          }
        })
        this.checkObjectForSecrets(value, patterns, secrets, newPath)
      })
    }
  }

  /**
   * Sanitize workflow for artifact generation
   */
  static sanitizeForArtifact(workflow: Workflow): Workflow {
    const sanitized = JSON.parse(JSON.stringify(workflow))

    // Remove any potential secrets from parameters
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
      // Don't sanitize short values or expressions
      if (obj.length > 50 && !obj.includes('=')) {
        return '[REDACTED]'
      }
      return obj
    } else if (typeof obj === 'object' && obj !== null) {
      if (Array.isArray(obj)) {
        return obj.map(item => this.sanitizeObject(item))
      }

      const sanitized: any = {}
      Object.entries(obj).forEach(([key, value]) => {
        sanitized[key] = this.sanitizeObject(value)
      })
      return sanitized
    }

    return obj
  }

  /**
   * Generate import instructions
   */
  static generateImportInstructions(artifact: WorkflowArtifact): string {
    let instructions = `**Import Instructions:**\n\n`
    instructions += `1. Open n8n\n`
    instructions += `2. Click "Import from File" or drag and drop the workflow file\n`
    instructions += `3. Select the file: ${artifact.filename}\n`
    instructions += `4. Review the workflow structure in the editor\n`
    instructions += `5. Configure required credentials\n`
    instructions += `6. Update any placeholder configuration values\n`
    instructions += `7. Activate the workflow\n\n`

    return instructions
  }

  /**
   * Generate credential configuration instructions
   */
  static generateCredentialInstructions(
    requiredCredentials: Record<string, string>
  ): string {
    if (Object.keys(requiredCredentials).length === 0) {
      return 'No additional credentials are required for this workflow.'
    }

    let instructions = `**Credential Configuration:**\n\n`
    instructions += `The following credentials need to be configured in n8n:\n\n`

    Object.entries(requiredCredentials).forEach(([cred, description]) => {
      instructions += `- **${cred}**: ${description}\n`
    })

    instructions += `\nTo configure credentials:\n`
    instructions += `1. Go to Credentials in n8n\n`
    instructions += `2. Add new credential for each required service\n`
    instructions += `3. The workflow will reference these credentials by name\n\n`

    return instructions
  }

  /**
   * Generate configuration instructions
   */
  static generateConfigurationInstructions(
    requiredConfiguration: Record<string, string>
  ): string {
    if (Object.keys(requiredConfiguration).length === 0) {
      return 'No additional configuration is required for this workflow.'
    }

    let instructions = `**Configuration Required:**\n\n`
    instructions += `The following values need to be configured:\n\n`

    Object.entries(requiredConfiguration).forEach(([key, description]) => {
      instructions += `- **${key}**: ${description}\n`
    })

    instructions += `\nUpdate these values in the workflow nodes before activation.\n\n`

    return instructions
  }
}
