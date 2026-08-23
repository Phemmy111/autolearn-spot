/**
 * ALEX Architecture Planner
 * 
 * Designs the actual workflow architecture based on business requirements
 * Converts high-level specifications into detailed node sequences
 */

export interface WorkflowArchitecture {
  name: string
  description: string
  nodes: NodeDesign[]
  connections: ConnectionDesign[]
  complexity: 'simple' | 'moderate' | 'complex'
  reasoning: string
}

export interface NodeDesign {
  id: string
  name: string
  type: string
  typeVersion: number
  position: [number, number]
  parameters: any
  purpose: string
}

export interface ConnectionDesign {
  from: string
  to: string
  type: 'main' | 'branch'
  index: number
}

/**
 * Generate UUID for node IDs
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export class ArchitecturePlanner {
  /**
   * Design workflow architecture based on specifications
   */
  static design(spec: {
    originalRequest: string
    platform: string
    trigger: string
    functionality: string
    integrations: string
    filename?: string
  }): WorkflowArchitecture {
    console.log('[Architecture Planner] Designing workflow for:', spec.functionality)
    
    const lowerRequest = spec.originalRequest.toLowerCase()
    const lowerFunctionality = spec.functionality.toLowerCase()
    
    // Detect workflow type and design appropriate architecture
    if (lowerRequest.includes('auto responder') || lowerRequest.includes('auto-responder') || 
        lowerRequest.includes('auto email') || (lowerRequest.includes('email') && lowerRequest.includes('responder'))) {
      return this.designEmailAutoResponder(spec)
    }
    
    if (lowerFunctionality.includes('chatbot') || lowerRequest.includes('chatbot')) {
      return this.designChatbot(spec)
    }
    
    if (lowerRequest.includes('lead') || lowerFunctionality.includes('lead')) {
      return this.designLeadAutomation(spec)
    }
    
    if (lowerRequest.includes('invoice') || lowerFunctionality.includes('invoice')) {
      return this.designInvoiceProcessing(spec)
    }
    
    if (lowerRequest.includes('document') || lowerFunctionality.includes('document')) {
      return this.designDocumentProcessing(spec)
    }
    
    // Default to moderate complexity workflow
    return this.designGenericAutomation(spec)
  }
  
  /**
   * Design email auto-responder architecture
   */
  private static designEmailAutoResponder(spec: any): WorkflowArchitecture {
    const baseName = spec.filename?.replace('.json', '') || 'email-responder'
    const triggerType = this.determineEmailTrigger(spec.trigger)
    
    const nodes: NodeDesign[] = []
    const connections: ConnectionDesign[] = []
    let positionY = 0
    const positionX = 250
    
    // 1. Trigger node
    nodes.push({
      id: generateUUID(),
      name: 'Gmail - Incoming Email',
      type: triggerType,
      typeVersion: 1,
      position: [positionX, positionY],
      parameters: this.getEmailTriggerParameters(spec.trigger),
      purpose: 'Listens for incoming emails to trigger the automation'
    })
    positionY += 150
    
    // 2. Normalize email data
    nodes.push({
      id: generateUUID(),
      name: 'Normalize Email',
      type: 'n8n-nodes-base.set',
      typeVersion: 3,
      position: [positionX, positionY],
      parameters: {
        values: {
          string: [
            { name: 'senderEmail', value: '={{ $json.from }}' },
            { name: 'subject', value: '={{ $json.subject }}' },
            { name: 'body', value: '={{ $json.text || $json.html }}' },
            { name: 'emailId', value: '={{ $json.id }}' }
          ]
        }
      },
      purpose: 'Extract and normalize key email fields for consistent processing'
    })
    connections.push({ from: nodes[0].id, to: nodes[1].id, type: 'main', index: 0 })
    positionY += 150
    
    // 3. Duplicate/thread check
    nodes.push({
      id: generateUUID(),
      name: 'Check Duplicate / Thread',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        jsCode: `// Check if this is a reply to our own automated response
const subject = $input.item.json.subject || '';
const sender = $input.item.json.senderEmail || '';
const isInThread = subject.toLowerCase().startsWith('re:') || subject.toLowerCase().startsWith('fw:');

// In production, check database/Redis for processed email IDs
const isDuplicate = false; // Would check against processed emails log

return [{
  json: {
    ...$input.item.json,
    isDuplicate,
    isInThread,
    shouldProcess: !isDuplicate && !isInThread
  }
}];`
      },
      purpose: 'Prevent processing duplicates and replies to our own messages'
    })
    connections.push({ from: nodes[1].id, to: nodes[2].id, type: 'main', index: 0 })
    positionY += 150
    
    // 4. IF node to filter duplicates
    nodes.push({
      id: generateUUID(),
      name: 'Should Process?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        conditions: {
          string: [
            { value1: '={{ $json.shouldProcess }}', operation: 'true', value2: '' }
          ]
        }
      },
      purpose: 'Only proceed for valid new emails'
    })
    connections.push({ from: nodes[2].id, to: nodes[3].id, type: 'main', index: 0 })
    positionY += 150
    
    // 5. Generate AI response
    nodes.push({
      id: generateUUID(),
      name: 'Generate AI Response',
      type: 'n8n-nodes-base.openAi',
      typeVersion: 1,
      position: [positionX, positionY],
      parameters: {
        resource: 'text',
        operation: 'message',
        modelId: 'gpt-4',
        messages: {
          values: [
            {
              role: 'system',
              content: 'You are a helpful customer service assistant for AutoLearn Spot. Generate a professional, friendly email response. Keep it concise but helpful.'
            },
            {
              role: 'user',
              content: 'Subject: {{ $json.subject }}\n\nFrom: {{ $json.senderEmail }}\n\n{{ $json.body }}'
            }
          ]
        }
      },
      purpose: 'Use AI to generate an appropriate response based on email content'
    })
    connections.push({ from: nodes[3].id, to: nodes[4].id, type: 'main', index: 0 })
    positionY += 150
    
    // 6. Format reply
    nodes.push({
      id: generateUUID(),
      name: 'Format Reply',
      type: 'n8n-nodes-base.set',
      typeVersion: 3,
      position: [positionX, positionY],
      parameters: {
        values: {
          string: [
            { name: 'to', value: '={{ $json.senderEmail }}' },
            { name: 'subject', value: 'Re: {{ $json.subject }}' },
            { name: 'body', value: '={{ $json.message }}' },
            { name: 'inReplyTo', value: '={{ $json.emailId }}' }
          ]
        }
      },
      purpose: 'Format the AI response for sending via Gmail'
    })
    connections.push({ from: nodes[4].id, to: nodes[5].id, type: 'main', index: 0 })
    positionY += 150
    
    // 7. Send reply
    nodes.push({
      id: generateUUID(),
      name: 'Send Gmail Reply',
      type: 'n8n-nodes-base.gmail',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        resource: 'message',
        operation: 'send',
        subject: '={{ $json.subject }}',
        body: '={{ $json.body }}',
        toEmail: '={{ $json.to }}',
        options: {
          replyTo: '={{ $json.inReplyTo }}'
        }
      },
      purpose: 'Send the AI-generated reply via Gmail'
    })
    connections.push({ from: nodes[5].id, to: nodes[6].id, type: 'main', index: 0 })
    positionY += 150
    
    // 8. Log result
    nodes.push({
      id: generateUUID(),
      name: 'Log Response',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        jsCode: `// Log the response for audit purposes
const logEntry = {
  timestamp: new Date().toISOString(),
  emailId: $input.item.json.emailId,
  sender: $input.item.json.senderEmail,
  subject: $input.item.json.subject,
  action: 'auto_replied',
  status: 'sent'
};

// In production, write to database or Google Sheets
console.log('Auto-response logged:', logEntry);

return [{ json: { ...$input.item.json, logged: true, logEntry } }];`
      },
      purpose: 'Log the auto-response for audit and tracking'
    })
    connections.push({ from: nodes[6].id, to: nodes[7].id, type: 'main', index: 0 })
    
    return {
      name: baseName,
      description: 'Automated email responder with AI-generated responses, duplicate protection, and audit logging',
      nodes,
      connections,
      complexity: 'moderate',
      reasoning: 'Email auto-responder requires: trigger, normalization, duplicate prevention, AI response generation, reply formatting, sending, and logging. This architecture ensures reliable, professional automated responses while preventing infinite loops and maintaining audit trails.'
    }
  }
  
  /**
   * Design chatbot architecture
   */
  private static designChatbot(spec: any): WorkflowArchitecture {
    const baseName = spec.filename?.replace('.json', '') || 'chatbot'
    const nodes: NodeDesign[] = []
    const connections: ConnectionDesign[] = []
    let positionY = 0
    const positionX = 250
    
    // Webhook trigger
    nodes.push({
      id: generateUUID(),
      name: 'Webhook - Chat Message',
      type: 'n8n-nodes-base.webhook',
      typeVersion: 1,
      position: [positionX, positionY],
      parameters: {
        path: 'chatbot',
        responseMode: 'onReceived',
        options: {}
      },
      purpose: 'Receives incoming chat messages from frontend'
    })
    positionY += 150
    
    // Normalize message
    nodes.push({
      id: generateUUID(),
      name: 'Normalize Message',
      type: 'n8n-nodes-base.set',
      typeVersion: 3,
      position: [positionX, positionY],
      parameters: {
        values: {
          string: [
            { name: 'userMessage', value: '={{ $json.body.message }}' },
            { name: 'userId', value: '={{ $json.body.userId }}' },
            { name: 'timestamp', value: '={{ $now }}' }
          ]
        }
      },
      purpose: 'Extract and normalize chat message data'
    })
    connections.push({ from: nodes[0].id, to: nodes[1].id, type: 'main', index: 0 })
    positionY += 150
    
    // AI response
    nodes.push({
      id: generateUUID(),
      name: 'Generate AI Response',
      type: 'n8n-nodes-base.openAi',
      typeVersion: 1,
      position: [positionX, positionY],
      parameters: {
        resource: 'text',
        operation: 'message',
        modelId: 'gpt-4',
        messages: {
          values: [
            {
              role: 'system',
              content: 'You are a helpful assistant for AutoLearn Spot. Provide friendly, accurate responses about the platform, courses, and learning resources.'
            },
            {
              role: 'user',
              content: '={{ $json.userMessage }}'
            }
          ]
        }
      },
      purpose: 'Generate AI response to user message'
    })
    connections.push({ from: nodes[1].id, to: nodes[2].id, type: 'main', index: 0 })
    positionY += 150
    
    // Format response
    nodes.push({
      id: generateUUID(),
      name: 'Format Response',
      type: 'n8n-nodes-base.set',
      typeVersion: 3,
      position: [positionX, positionY],
      parameters: {
        values: {
          string: [
            { name: 'response', value: '={{ $json.message }}' },
            { name: 'userId', value: '={{ $json.userId }}' }
          ]
        }
      },
      purpose: 'Format the AI response for the frontend'
    })
    connections.push({ from: nodes[2].id, to: nodes[3].id, type: 'main', index: 0 })
    
    return {
      name: baseName,
      description: 'AI-powered chatbot with webhook trigger and response generation',
      nodes,
      connections,
      complexity: 'simple',
      reasoning: 'Chatbot requires webhook trigger, message normalization, AI response generation, and response formatting. Simple architecture suitable for real-time chat interactions.'
    }
  }
  
  /**
   * Design lead automation architecture
   */
  private static designLeadAutomation(spec: any): WorkflowArchitecture {
    const baseName = spec.filename?.replace('.json', '') || 'lead-automation'
    
    // Moderate complexity: trigger, qualification, routing, CRM integration
    return this.designGenericAutomation(spec)
  }
  
  /**
   * Design invoice processing architecture
   */
  private static designInvoiceProcessing(spec: any): WorkflowArchitecture {
    const baseName = spec.filename?.replace('.json', '') || 'invoice-processor'
    
    // Complex: trigger, extraction, validation, approval routing, payment integration
    return this.designGenericAutomation(spec)
  }
  
  /**
   * Design document processing architecture
   */
  private static designDocumentProcessing(spec: any): WorkflowArchitecture {
    const baseName = spec.filename?.replace('.json', '') || 'document-processor'
    
    // Moderate: trigger, extraction, classification, storage
    return this.designGenericAutomation(spec)
  }
  
  /**
   * Design generic automation (fallback)
   */
  private static designGenericAutomation(spec: any): WorkflowArchitecture {
    const baseName = spec.filename?.replace('.json', '') || 'automation'
    const nodes: NodeDesign[] = []
    const connections: ConnectionDesign[] = []
    let positionY = 0
    const positionX = 250
    
    // Determine trigger type
    let triggerType = 'n8n-nodes-base.manualTrigger'
    let triggerParams = {}
    
    if (spec.trigger?.toLowerCase().includes('webhook')) {
      triggerType = 'n8n-nodes-base.webhook'
      triggerParams = { path: 'automation', responseMode: 'onReceived' }
    } else if (spec.trigger?.toLowerCase().includes('email') || spec.trigger?.toLowerCase().includes('gmail')) {
      triggerType = 'n8n-nodes-base.gmailTrigger'
      triggerParams = { event: 'message' }
    }
    
    // Trigger
    nodes.push({
      id: generateUUID(),
      name: this.getTriggerName(spec.trigger),
      type: triggerType,
      typeVersion: 1,
      position: [positionX, positionY],
      parameters: triggerParams,
      purpose: `Trigger: ${spec.trigger}`
    })
    positionY += 150
    
    // Process data
    nodes.push({
      id: generateUUID(),
      name: 'Process Data',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        jsCode: `// ${spec.functionality}\nconst inputData = $input.all();\nconst processedData = inputData.map(item => ({\n  ...item.json,\n  processedAt: new Date().toISOString()\n}));\nreturn processedData.map(item => ({ json: item }));`
      },
      purpose: `Process: ${spec.functionality}`
    })
    connections.push({ from: nodes[0].id, to: nodes[1].id, type: 'main', index: 0 })
    
    return {
      name: baseName,
      description: `Automation for ${spec.functionality}`,
      nodes,
      connections,
      complexity: 'simple',
      reasoning: 'Generic automation with trigger and processing. Architecture can be enhanced based on specific requirements.'
    }
  }
  
  /**
   * Determine appropriate email trigger type
   */
  private static determineEmailTrigger(trigger: string): string {
    const lower = trigger.toLowerCase()
    
    if (lower.includes('gmail')) return 'n8n-nodes-base.gmailTrigger'
    if (lower.includes('outlook') || lower.includes('exchange')) return 'n8n-nodes-base.microsoftOutlookTrigger'
    if (lower.includes('imap')) return 'n8n-nodes-base.imapEmailTrigger'
    
    return 'n8n-nodes-base.gmailTrigger' // Default to Gmail
  }
  
  /**
   * Get email trigger parameters
   */
  private static getEmailTriggerParameters(trigger: string): any {
    const lower = trigger.toLowerCase()
    
    if (lower.includes('gmail')) {
      return {
        event: 'message',
        filters: {
          readStatus: 'unread'
        }
      }
    }
    
    if (lower.includes('imap')) {
      return {
        host: 'imap.gmail.com',
        port: 993,
        secure: true,
        mailbox: 'INBOX',
        markAsRead: false
      }
    }
    
    return { event: 'message' }
  }
  
  /**
   * Get meaningful trigger node name
   */
  private static getTriggerName(trigger: string): string {
    const lower = trigger.toLowerCase()
    
    if (lower.includes('webhook')) return 'Webhook Trigger'
    if (lower.includes('gmail') || lower.includes('email')) return 'Gmail Trigger'
    if (lower.includes('schedule') || lower.includes('cron')) return 'Schedule Trigger'
    
    return 'Manual Trigger'
  }
}
