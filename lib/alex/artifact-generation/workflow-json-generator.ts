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
   * Detect the use case from the plan to generate appropriate nodes
   */
  private static detectUseCase(plan: AutomationPlan): string {
    const objective = (plan.objective || '').toLowerCase()
    const triggerSource = (plan.trigger?.source || '').toLowerCase()
    const triggerType = (plan.trigger?.type || '').toLowerCase()
    const triggerDesc = (plan.trigger?.description || '').toLowerCase()
    const allText = `${objective} ${triggerSource} ${triggerType} ${triggerDesc}`

    if (allText.includes('email') || allText.includes('gmail') || allText.includes('mail')) {
      if (allText.includes('respond') || allText.includes('reply') || allText.includes('auto-reply') || allText.includes('autorespond')) {
        return 'email-auto-responder'
      }
      if (allText.includes('forward')) return 'email-forwarder'
      if (allText.includes('classify') || allText.includes('categorize') || allText.includes('label')) return 'email-classifier'
      return 'email-auto-responder' // default email use case
    }
    if (allText.includes('slack')) return 'slack-bot'
    if (allText.includes('webhook')) return 'webhook-handler'
    if (allText.includes('schedule') || allText.includes('cron') || allText.includes('daily') || allText.includes('weekly')) return 'scheduled-task'
    if (allText.includes('spreadsheet') || allText.includes('google sheet')) return 'sheets-automation'
    
    return 'generic'
  }

  /**
   * Generate n8n nodes based on plan
   */
  private static generateN8NNodes(plan: AutomationPlan): any[] {
    const useCase = this.detectUseCase(plan)

    switch (useCase) {
      case 'email-auto-responder':
        return this.generateEmailAutoResponderNodes(plan)
      case 'email-forwarder':
        return this.generateEmailForwarderNodes(plan)
      case 'email-classifier':
        return this.generateEmailClassifierNodes(plan)
      case 'slack-bot':
        return this.generateSlackBotNodes(plan)
      case 'webhook-handler':
        return this.generateWebhookHandlerNodes(plan)
      case 'scheduled-task':
        return this.generateScheduledTaskNodes(plan)
      case 'sheets-automation':
        return this.generateSheetsAutomationNodes(plan)
      default:
        return this.generateGenericNodes(plan)
    }
  }

  /**
   * Email Auto-Responder: Gmail Trigger → IF Filter → Gmail Reply
   */
  private static generateEmailAutoResponderNodes(plan: AutomationPlan): any[] {
    return [
      {
        parameters: {
          pollTimes: {
            item: [{ mode: 'everyMinute' }]
          },
          simple: true
        },
        id: 'node-1',
        name: 'Gmail Trigger',
        type: 'n8n-nodes-base.gmailTrigger',
        typeVersion: 1,
        position: [250, 300],
        credentials: {
          gmailOAuth2: {
            id: 'GMAIL_CREDENTIAL_ID',
            name: 'Gmail account'
          }
        }
      },
      {
        parameters: {
          conditions: {
            options: {
              caseSensitive: false,
              leftValue: '',
              typeValidation: 'strict'
            },
            conditions: [
              {
                id: 'condition-1',
                leftValue: '={{ $json.from.value[0].address }}',
                rightValue: '',
                operator: {
                  type: 'string',
                  operation: 'notEmpty'
                }
              }
            ],
            combinator: 'and'
          },
          options: {}
        },
        id: 'node-2',
        name: 'Filter Emails',
        type: 'n8n-nodes-base.if',
        typeVersion: 2,
        position: [480, 300]
      },
      {
        parameters: {
          sendTo: '={{ $json.from.value[0].address }}',
          subject: '=Re: {{ $json.subject }}',
          message: 'Thank you for your email. This is an automated acknowledgment. I have received your message and will get back to you as soon as possible.\n\nBest regards',
          options: {
            appendAttribution: false,
            replyTo: ''
          }
        },
        id: 'node-3',
        name: 'Send Auto-Reply',
        type: 'n8n-nodes-base.gmail',
        typeVersion: 2.1,
        position: [720, 200],
        credentials: {
          gmailOAuth2: {
            id: 'GMAIL_CREDENTIAL_ID',
            name: 'Gmail account'
          }
        }
      },
      {
        parameters: {
          options: {}
        },
        id: 'node-4',
        name: 'No Reply Needed',
        type: 'n8n-nodes-base.noOp',
        typeVersion: 1,
        position: [720, 420]
      }
    ]
  }

  /**
   * Email Forwarder: Gmail Trigger → Gmail Send
   */
  private static generateEmailForwarderNodes(plan: AutomationPlan): any[] {
    return [
      {
        parameters: {
          pollTimes: {
            item: [{ mode: 'everyMinute' }]
          },
          simple: true
        },
        id: 'node-1',
        name: 'Gmail Trigger',
        type: 'n8n-nodes-base.gmailTrigger',
        typeVersion: 1,
        position: [250, 300],
        credentials: {
          gmailOAuth2: {
            id: 'GMAIL_CREDENTIAL_ID',
            name: 'Gmail account'
          }
        }
      },
      {
        parameters: {
          sendTo: 'FORWARD_TO_EMAIL@example.com',
          subject: '=Fwd: {{ $json.subject }}',
          message: '=---------- Forwarded message ----------\nFrom: {{ $json.from.value[0].address }}\nDate: {{ $json.date }}\nSubject: {{ $json.subject }}\n\n{{ $json.textPlain || $json.snippet }}',
          options: {}
        },
        id: 'node-2',
        name: 'Forward Email',
        type: 'n8n-nodes-base.gmail',
        typeVersion: 2.1,
        position: [500, 300],
        credentials: {
          gmailOAuth2: {
            id: 'GMAIL_CREDENTIAL_ID',
            name: 'Gmail account'
          }
        }
      }
    ]
  }

  /**
   * Email Classifier: Gmail Trigger → Code (classify) → Switch → Gmail Label
   */
  private static generateEmailClassifierNodes(plan: AutomationPlan): any[] {
    return [
      {
        parameters: {
          pollTimes: {
            item: [{ mode: 'everyMinute' }]
          },
          simple: true
        },
        id: 'node-1',
        name: 'Gmail Trigger',
        type: 'n8n-nodes-base.gmailTrigger',
        typeVersion: 1,
        position: [250, 300],
        credentials: {
          gmailOAuth2: {
            id: 'GMAIL_CREDENTIAL_ID',
            name: 'Gmail account'
          }
        }
      },
      {
        parameters: {
          jsCode: `// Classify email based on subject and content
const subject = ($input.item.json.subject || '').toLowerCase();
const body = ($input.item.json.textPlain || $input.item.json.snippet || '').toLowerCase();

let category = 'general';

if (subject.includes('urgent') || subject.includes('asap') || body.includes('urgent')) {
  category = 'urgent';
} else if (subject.includes('invoice') || subject.includes('payment') || subject.includes('receipt')) {
  category = 'billing';
} else if (subject.includes('support') || subject.includes('help') || subject.includes('issue')) {
  category = 'support';
} else if (subject.includes('meeting') || subject.includes('calendar') || subject.includes('schedule')) {
  category = 'meetings';
}

return { ...($input.item.json), category };`
        },
        id: 'node-2',
        name: 'Classify Email',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [500, 300]
      },
      {
        parameters: {
          assignments: {
            assignments: [
              {
                id: 'assignment-1',
                name: 'result',
                value: '={{ "Email classified as: " + $json.category }}',
                type: 'string'
              }
            ]
          },
          options: {}
        },
        id: 'node-3',
        name: 'Set Result',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [740, 300]
      }
    ]
  }

  /**
   * Slack Bot: Slack Trigger → Code → Slack Send
   */
  private static generateSlackBotNodes(plan: AutomationPlan): any[] {
    return [
      {
        parameters: {
          triggerOn: 'message',
          channelId: 'CHANNEL_ID'
        },
        id: 'node-1',
        name: 'Slack Trigger',
        type: 'n8n-nodes-base.slackTrigger',
        typeVersion: 1,
        position: [250, 300],
        credentials: {
          slackOAuth2Api: {
            id: 'SLACK_CREDENTIAL_ID',
            name: 'Slack account'
          }
        }
      },
      {
        parameters: {
          jsCode: `// Process the incoming Slack message
const message = $input.item.json.text || '';
let response = "Thanks for your message! I'll process that for you.";

// Add your custom logic here
return { response, originalMessage: message };`
        },
        id: 'node-2',
        name: 'Process Message',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [500, 300]
      },
      {
        parameters: {
          channel: 'CHANNEL_ID',
          text: '={{ $json.response }}',
          otherOptions: {}
        },
        id: 'node-3',
        name: 'Send Reply',
        type: 'n8n-nodes-base.slack',
        typeVersion: 2.2,
        position: [740, 300],
        credentials: {
          slackOAuth2Api: {
            id: 'SLACK_CREDENTIAL_ID',
            name: 'Slack account'
          }
        }
      }
    ]
  }

  /**
   * Webhook Handler: Webhook → Code → Respond
   */
  private static generateWebhookHandlerNodes(plan: AutomationPlan): any[] {
    return [
      {
        parameters: {
          httpMethod: 'POST',
          path: 'webhook',
          responseMode: 'lastNode',
          options: {}
        },
        id: 'node-1',
        name: 'Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [250, 300],
        webhookId: 'auto-generated-webhook'
      },
      {
        parameters: {
          jsCode: `// Process the incoming webhook payload
const payload = $input.item.json.body || $input.item.json;

// Add your processing logic here
return { 
  processed: true, 
  message: "Webhook received and processed",
  data: payload 
};`
        },
        id: 'node-2',
        name: 'Process Webhook',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [500, 300]
      },
      {
        parameters: {
          respondWith: 'json',
          responseBody: '={{ JSON.stringify($json) }}',
          options: {}
        },
        id: 'node-3',
        name: 'Respond',
        type: 'n8n-nodes-base.respondToWebhook',
        typeVersion: 1.1,
        position: [740, 300]
      }
    ]
  }

  /**
   * Scheduled Task: Schedule Trigger → Code → Set Output
   */
  private static generateScheduledTaskNodes(plan: AutomationPlan): any[] {
    return [
      {
        parameters: {
          rule: {
            interval: [
              {
                field: 'cronExpression',
                expression: '0 9 * * *'
              }
            ]
          }
        },
        id: 'node-1',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [250, 300]
      },
      {
        parameters: {
          jsCode: `// Scheduled task logic
// This runs at the configured schedule
const now = new Date().toISOString();

// Add your scheduled task logic here
return { 
  executedAt: now, 
  status: "completed",
  message: "${plan.objective || 'Scheduled task completed'}"
};`
        },
        id: 'node-2',
        name: 'Run Task',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [500, 300]
      },
      {
        parameters: {
          assignments: {
            assignments: [
              {
                id: 'assignment-1',
                name: 'result',
                value: '={{ $json.message }}',
                type: 'string'
              }
            ]
          },
          options: {}
        },
        id: 'node-3',
        name: 'Set Output',
        type: 'n8n-nodes-base.set',
        typeVersion: 3.4,
        position: [740, 300]
      }
    ]
  }

  /**
   * Sheets Automation: Schedule/Webhook Trigger → Google Sheets → Set
   */
  private static generateSheetsAutomationNodes(plan: AutomationPlan): any[] {
    return [
      {
        parameters: {
          rule: {
            interval: [
              {
                field: 'cronExpression',
                expression: '0 */6 * * *'
              }
            ]
          }
        },
        id: 'node-1',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [250, 300]
      },
      {
        parameters: {
          operation: 'read',
          documentId: {
            __rl: true,
            value: 'YOUR_SPREADSHEET_ID',
            mode: 'id'
          },
          sheetName: {
            __rl: true,
            value: 'Sheet1',
            mode: 'name'
          },
          options: {}
        },
        id: 'node-2',
        name: 'Read Google Sheet',
        type: 'n8n-nodes-base.googleSheets',
        typeVersion: 4.5,
        position: [500, 300],
        credentials: {
          googleSheetsOAuth2Api: {
            id: 'SHEETS_CREDENTIAL_ID',
            name: 'Google Sheets account'
          }
        }
      },
      {
        parameters: {
          jsCode: `// Process the spreadsheet data
const rows = $input.all();
return rows.map(row => ({
  ...row.json,
  processed: true,
  processedAt: new Date().toISOString()
}));`
        },
        id: 'node-3',
        name: 'Process Data',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [740, 300]
      }
    ]
  }

  /**
   * Generic workflow from plan steps
   */
  private static generateGenericNodes(plan: AutomationPlan): any[] {
    const nodes: any[] = []
    let xPos = 250

    // Trigger
    const triggerType = (plan.trigger?.type || '').toLowerCase()
    if (triggerType === 'webhook') {
      nodes.push({
        parameters: {
          httpMethod: 'POST',
          path: 'webhook',
          responseMode: 'onReceived',
          options: {}
        },
        id: 'node-1',
        name: 'Webhook Trigger',
        type: 'n8n-nodes-base.webhook',
        typeVersion: 2,
        position: [xPos, 300],
        webhookId: 'auto-generated-webhook'
      })
    } else if (triggerType === 'schedule') {
      nodes.push({
        parameters: {
          rule: {
            interval: [{ field: 'cronExpression', expression: '0 9 * * *' }]
          }
        },
        id: 'node-1',
        name: 'Schedule Trigger',
        type: 'n8n-nodes-base.scheduleTrigger',
        typeVersion: 1.2,
        position: [xPos, 300]
      })
    } else {
      nodes.push({
        parameters: {},
        id: 'node-1',
        name: 'Manual Trigger',
        type: 'n8n-nodes-base.manualTrigger',
        typeVersion: 1,
        position: [xPos, 300]
      })
    }
    xPos += 250

    // Workflow steps
    if (plan.workflow && Array.isArray(plan.workflow)) {
      plan.workflow.forEach((step, index) => {
        nodes.push({
          parameters: {
            jsCode: `// ${step.step || 'Process step'}\n// ${step.description || 'Add your processing logic here'}\nreturn $input.all();`
          },
          id: `node-${index + 2}`,
          name: step.step || `Step ${index + 1}`,
          type: 'n8n-nodes-base.code',
          typeVersion: 2,
          position: [xPos, 300]
        })
        xPos += 250
      })
    }

    // Add at least one processing node if none from workflow steps
    if (nodes.length === 1) {
      nodes.push({
        parameters: {
          jsCode: `// ${plan.objective || 'Process step'}\n// Add your processing logic here\nreturn $input.all();`
        },
        id: 'node-2',
        name: 'Process',
        type: 'n8n-nodes-base.code',
        typeVersion: 2,
        position: [xPos, 300]
      })
    }

    return nodes
  }

  /**
   * Generate n8n connections — handles IF node true/false branches
   */
  private static generateN8NConnections(nodes: any[]): any {
    const connections: any = {}
    
    for (let i = 0; i < nodes.length - 1; i++) {
      const current = nodes[i]
      const next = nodes[i + 1]
      
      // If current is an IF node and there's a node after next, wire both branches
      if (current.type === 'n8n-nodes-base.if' && i + 2 < nodes.length) {
        connections[current.name] = {
          main: [
            [{ node: next.name, type: 'main', index: 0 }],        // true branch
            [{ node: nodes[i + 2].name, type: 'main', index: 0 }] // false branch
          ]
        }
        // Skip the false-branch node in the next iteration
        i++
      } else {
        connections[current.name] = {
          main: [[{
            node: next.name,
            type: 'main',
            index: 0
          }]]
        }
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