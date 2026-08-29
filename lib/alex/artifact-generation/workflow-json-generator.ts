/**
 * Workflow JSON Generator
 * 
 * Generates actual workflow JSON files based on AutomationPlan
 * Supports multiple platforms (n8n, Zapier, Make, etc.)
 */

import { AutomationPlan } from '../orchestration/types'

export class WorkflowJSONGenerator {
  /**
   * Generate n8n workflow JSON from AutomationPlan
   */
  static generateN8NWorkflow(plan: AutomationPlan): string {
    const nodes = this.generateN8NNodes(plan)
    const connections = this.generateN8NConnections(nodes)
    
    const workflow = {
      name: plan.objective || 'Generated Workflow',
      nodes: nodes,
      connections: connections,
      settings: {
        executionOrder: 'v1'
      },
      staticData: null,
      tags: [],
      pinData: {},
      versionId: '1.0.0',
      meta: {
        instanceId: 'generated-by-alex'
      }
    }
    
    return JSON.stringify(workflow, null, 2)
  }

  /**
   * Generate n8n nodes based on plan
   */
  private static generateN8NNodes(plan: AutomationPlan): any[] {
    const nodes: any[] = []
    let nodeId = 1

    // Trigger node
    if (plan.trigger) {
      const triggerNode = this.generateTriggerNode(plan.trigger, nodeId)
      nodes.push(triggerNode)
      nodeId++
    }

    // Process nodes based on workflow steps
    if (plan.workflow) {
      let workflowSteps = plan.workflow
      if (!Array.isArray(workflowSteps)) {
        if (typeof workflowSteps === 'object') {
          workflowSteps = Object.values(workflowSteps)
        } else {
          workflowSteps = [workflowSteps]
        }
      }
      workflowSteps.forEach((step, index) => {
        const processNode = this.generateProcessNode(step, nodeId)
        nodes.push(processNode)
        nodeId++
      })
    }

    // Output nodes
    if (plan.outputs) {
      const outputNode = this.generateOutputNode(plan.outputs, nodeId)
      nodes.push(outputNode)
    }

    return nodes
  }

  /**
   * Generate trigger node
   */
  private static generateTriggerNode(trigger: any, id: number): any {
    const triggerType = trigger.type || 'manual'
    
    switch (triggerType) {
      case 'webhook':
        return {
          parameters: {
            httpMethod: 'POST',
            path: 'webhook',
            responseMode: 'onReceived',
            options: {}
          },
          id: `node-${id}`,
          name: 'Webhook Trigger',
          type: 'n8n-nodes-base.webhook',
          typeVersion: 1.1,
          position: [250, 300],
          webhookId: 'auto-generated-webhook'
        }
      
      case 'schedule':
        return {
          parameters: {
            rule: {
              interval: [
                {
                  field: 'cronExpression',
                  expression: trigger.schedule || '0 9 * * *'
                }
              ]
            }
          },
          id: `node-${id}`,
          name: 'Schedule Trigger',
          type: 'n8n-nodes-base.scheduleTrigger',
          typeVersion: 1.2,
          position: [250, 300]
        }
      
      case 'manual':
      default:
        return {
          parameters: {},
          id: `node-${id}`,
          name: 'Manual Trigger',
          type: 'n8n-nodes-base.manualTrigger',
          typeVersion: 1,
          position: [250, 300]
        }
    }
  }

  /**
   * Generate process node
   */
  private static generateProcessNode(step: any, id: number): any {
    return {
      parameters: {
        functionCode: `// ${step.description || 'Process step'}\n// Add your processing logic here\nreturn items;`
      },
      id: `node-${id}`,
      name: step.step || 'Process Step',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [450 + (id * 200), 300]
    }
  }

  /**
   * Generate output node
   */
  private static generateOutputNode(outputs: any, id: number): any {
    return {
      parameters: {
        assignments: {
          assignments: [
            {
              id: 'assignment-1',
              name: 'output',
              value: '={{ $json }}',
              type: 'string'
            }
          ]
        },
        options: {}
      },
      id: `node-${id}`,
      name: 'Set Output',
      type: 'n8n-nodes-base.set',
      typeVersion: 3.4,
      position: [650 + (id * 200), 300]
    }
  }

  /**
   * Generate n8n connections
   */
  private static generateN8NConnections(nodes: any[]): any {
    const connections: any = {}
    
    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i]
      const next = nodes[i + 1]
      
      connections[current.name] = {
        main: [[{
          node: next.name,
          type: 'main',
          index: 0
        }]]
      }
    }
    
    return connections
  }

  /**
   * Generate Zapier zap (simplified)
   */
  static generateZapierZap(plan: AutomationPlan): string {
    const zap = {
      title: plan.objective || 'Generated Zap',
      description: plan.objective,
      steps: [
        {
          type: 'trigger',
          description: plan.trigger?.description || 'Trigger step'
        },
        ...(plan.workflow?.map((step: any) => ({
          type: 'action',
          description: step.description || step.step
        })) || [])
      ]
    }
    
    return JSON.stringify(zap, null, 2)
  }

  /**
   * Generate Make scenario (simplified)
   */
  static generateMakeScenario(plan: AutomationPlan): string {
    const scenario = {
      name: plan.objective || 'Generated Scenario',
      flow: [
        {
          modules: [
            {
              parameters: {},
              ...plan.trigger
            },
            ...(plan.workflow?.map((step: any) => ({
              parameters: {},
              ...step
            })) || [])
          ]
        }
      ]
    }
    
    return JSON.stringify(scenario, null, 2)
  }

  /**
   * Generate custom script
   */
  static generateCustomScript(plan: AutomationPlan): string {
    const script = `#!/usr/bin/env node

/**
 * Generated automation script
 * Objective: ${plan.objective}
 */

${plan.workflow?.map((step: any, index: number) => `
// Step ${index + 1}: ${step.description || step.step}
// ${step.step || 'Processing...'}
`).join('\n') || '// Add your automation logic here'}

console.log('Automation completed successfully')
`
    
    return script
  }

  /**
   * Main generator - routes to appropriate platform
   */
  static generateWorkflow(plan: AutomationPlan, platform: string): { content: string; filename: string; fileType: string } {
    switch (platform.toLowerCase()) {
      case 'n8n':
        return {
          content: this.generateN8NWorkflow(plan),
          filename: `${this.sanitizeFilename(plan.objective || 'workflow')}.json`,
          fileType: 'application/json'
        }
      
      case 'zapier':
        return {
          content: this.generateZapierZap(plan),
          filename: `${this.sanitizeFilename(plan.objective || 'zap')}.json`,
          fileType: 'application/json'
        }
      
      case 'make':
      case 'integromat':
        return {
          content: this.generateMakeScenario(plan),
          filename: `${this.sanitizeFilename(plan.objective || 'scenario')}.json`,
          fileType: 'application/json'
        }
      
      case 'custom':
      case 'script':
        return {
          content: this.generateCustomScript(plan),
          filename: `${this.sanitizeFilename(plan.objective || 'automation')}.js`,
          fileType: 'application/javascript'
        }
      
      default:
        return {
          content: this.generateN8NWorkflow(plan),
          filename: `${this.sanitizeFilename(plan.objective || 'workflow')}.json`,
          fileType: 'application/json'
        }
    }
  }

  /**
   * Sanitize filename
   */
  private static sanitizeFilename(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 50)
  }
}