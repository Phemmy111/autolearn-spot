/**
 * Phase 7: Workflow Import & Configuration Guidance
 * 
 * Generates comprehensive instructions for importing, configuring, and testing n8n workflows.
 */

import { Workflow, WorkflowAnalysis } from './workflow-types'
import { WorkflowArtifactService } from './workflow-artifact'

export class WorkflowGuidance {
  /**
   * Generate complete guidance for a workflow
   */
  static generateCompleteGuidance(
    workflow: Workflow,
    analysis: WorkflowAnalysis,
    artifactFilename: string
  ): {
    importInstructions: string
    credentialInstructions: string
    configurationInstructions: string
    testingInstructions: string
  } {
    return {
      importInstructions: this.generateImportInstructions(artifactFilename),
      credentialInstructions: this.generateCredentialInstructions(analysis),
      configurationInstructions: this.generateConfigurationInstructions(workflow, analysis),
      testingInstructions: this.generateTestingInstructions(workflow, analysis)
    }
  }

  /**
   * Generate import instructions
   */
  static generateImportInstructions(artifactFilename: string): string {
    let instructions = `## Import Instructions\n\n`
    instructions += `1. Open n8n in your browser\n`
    instructions += `2. Click "Import from File" in the top right corner\n`
    instructions += `3. Select the file: \`${artifactFilename}\`\n`
    instructions += `4. The workflow will appear in the editor\n`
    instructions += `5. Review the workflow structure\n`
    instructions += `6. Configure required credentials (see below)\n`
    instructions += `7. Update configuration values (see below)\n`
    instructions += `8. Activate the workflow by clicking the toggle switch\n\n`

    return instructions
  }

  /**
   * Generate credential instructions
   */
  static generateCredentialInstructions(analysis: WorkflowAnalysis): string {
    if (analysis.requiredCredentials.length === 0) {
      return `## Credential Configuration\n\nNo additional credentials are required for this workflow.\n\n`
    }

    let instructions = `## Credential Configuration\n\n`
    instructions += `The following credentials need to be configured in n8n:\n\n`

    analysis.requiredCredentials.forEach(cred => {
      instructions += `### ${cred}\n`
      instructions += `- Go to **Credentials** in n8n\n`
      instructions += `- Click **Add Credential**\n`
      instructions += `- Search for "${cred}"\n`
      instructions += `- Follow the authentication flow\n`
      instructions += `- Name the credential appropriately\n`
      instructions += `- The workflow will reference this credential by name\n\n`
    })

    instructions += `**Important:** The workflow JSON does not contain your actual credential secrets. You must configure them in n8n separately.\n\n`

    return instructions
  }

  /**
   * Generate configuration instructions
   */
  static generateConfigurationInstructions(workflow: Workflow, analysis: WorkflowAnalysis): string {
    const configItems = this.extractConfigurationItems(workflow)

    if (configItems.length === 0) {
      return `## Configuration\n\nNo additional configuration is required for this workflow.\n\n`
    }

    let instructions = `## Configuration\n\n`
    instructions += `The following values need to be configured in the workflow nodes:\n\n`

    configItems.forEach(item => {
      instructions += `### ${item.node}: ${item.field}\n`
      instructions += `- **Current value:** \`${item.currentValue}\`\n`
      instructions += `- **Action:** ${item.action}\n\n`
    })

    instructions += `To update these values:\n`
    instructions += `1. Click on the node in the workflow editor\n`
    instructions += `2. Locate the field in the node parameters\n`
    instructions += `3. Replace the placeholder with your actual value\n`
    instructions += `4. Save the node\n\n`

    return instructions
  }

  /**
   * Extract configuration items from workflow
   */
  private static extractConfigurationItems(workflow: Workflow): Array<{
    node: string
    field: string
    currentValue: string
    action: string
  }> {
    const items: Array<{
      node: string
      field: string
      currentValue: string
      action: string
    }> = []

    workflow.nodes.forEach(node => {
      if (node.parameters) {
        // Webhook path
        if (node.type.includes('webhook') && node.parameters.path) {
          items.push({
            node: node.name,
            field: 'Webhook Path',
            currentValue: node.parameters.path,
            action: 'Update with your desired webhook path'
          })
        }

        // Spreadsheet ID
        if (node.type.includes('sheets') && node.parameters.sheetId) {
          items.push({
            node: node.name,
            field: 'Spreadsheet ID',
            currentValue: node.parameters.sheetId,
            action: 'Replace with your actual Google Sheets ID from the URL'
          })
        }

        // Sheet name
        if (node.type.includes('sheets') && node.parameters.sheetName) {
          items.push({
            node: node.name,
            field: 'Sheet Name',
            currentValue: node.parameters.sheetName,
            action: 'Update with your actual sheet name'
          })
        }

        // Email address
        if (node.type.includes('email') && node.parameters.email) {
          items.push({
            node: node.name,
            field: 'Email Address',
            currentValue: node.parameters.email,
            action: 'Update with the actual recipient email address'
          })
        }

        // API URL
        if (node.type.includes('http') && node.parameters.url) {
          items.push({
            node: node.name,
            field: 'API URL',
            currentValue: node.parameters.url,
            action: 'Update with your actual API endpoint URL'
          })
        }

        // Database connection
        if (node.type.includes('database') && node.parameters.connection) {
          items.push({
            node: node.name,
            field: 'Database Connection',
            currentValue: node.parameters.connection,
            action: 'Configure your database connection string'
          })
        }
      }
    })

    return items
  }

  /**
   * Generate testing instructions
   */
  static generateTestingInstructions(workflow: Workflow, analysis: WorkflowAnalysis): string {
    let instructions = `## Testing Instructions\n\n`

    // Find trigger nodes
    const triggers = analysis.triggers
    if (triggers.length > 0) {
      instructions += `### 1. Activate the Workflow\n`
      instructions += `- Click the toggle switch in the top right of the workflow editor\n`
      instructions += `- The workflow status should change to "Active"\n\n`

      instructions += `### 2. Trigger the Workflow\n`

      const trigger = triggers[0]
      if (trigger.type.includes('webhook')) {
        instructions += `- The workflow has a Webhook trigger\n`
        instructions += `- n8n will provide a webhook URL after activation\n`
        instructions += `- Send a test HTTP request to that URL\n`
        instructions += `- Example: \`curl -X POST <webhook-url> -d '{"test": "data"}'\`\n\n`
      } else if (trigger.type.includes('manual')) {
        instructions += `- The workflow has a Manual trigger\n`
        instructions += `- Click "Execute Workflow" in the top right\n`
        instructions += `- Monitor the execution in the bottom panel\n\n`
      } else if (trigger.type.includes('cron') || trigger.type.includes('schedule')) {
        instructions += `- The workflow has a Schedule trigger\n`
        instructions += `- It will execute automatically based on the schedule\n`
        instructions += `- You can test immediately by clicking "Execute Workflow"\n\n`
      } else {
        instructions += `- Trigger the workflow according to its type (${trigger.type})\n\n`
      }
    } else {
      instructions += `### 1. Execute the Workflow\n`
      instructions += `- Click "Execute Workflow" in the top right\n`
      instructions += `- The workflow will start from the first node\n\n`
    }

    instructions += `### 3. Monitor Execution\n`
    instructions += `- Watch the execution panel at the bottom\n`
    instructions += `- Each node will show its execution status\n`
    instructions += `- Click on nodes to see their input/output data\n\n`

    instructions += `### 4. Expected Results\n`
    instructions += `- All nodes should complete successfully (green checkmarks)\n`
    instructions += `- Data should flow correctly between nodes\n`
    instructions += `- External services should be called with correct parameters\n`
    instructions += `- No errors should appear in the execution log\n\n`

    instructions += `### 5. If Issues Occur\n`
    instructions += `- Check the execution log for error messages\n`
    instructions += `- Verify all credentials are configured correctly\n`
    instructions += `- Ensure all configuration values are set\n`
    instructions += `- Test individual nodes by executing them separately\n`
    instructions += `- Use the "Execute Node" feature on specific nodes\n\n`

    return instructions
  }

  /**
   * Generate formatted markdown guidance
   */
  static generateMarkdownGuidance(
    workflow: Workflow,
    analysis: WorkflowAnalysis,
    artifactFilename: string
  ): string {
    const guidance = this.generateCompleteGuidance(workflow, analysis, artifactFilename)

    let markdown = `# Workflow Setup Guide\n\n`
    markdown += `This guide will help you import, configure, and test your n8n workflow.\n\n`
    markdown += `---\n\n`
    markdown += guidance.importInstructions
    markdown += `---\n\n`
    markdown += guidance.credentialInstructions
    markdown += `---\n\n`
    markdown += guidance.configurationInstructions
    markdown += `---\n\n`
    markdown += guidance.testingInstructions

    return markdown
  }
}
