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
  from: string  // Node name (not ID)
  to: string    // Node name (not ID)
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
    
    if (lowerRequest.includes('customer support') || lowerRequest.includes('ai support') || 
        lowerRequest.includes('support automation') || lowerFunctionality.includes('customer support')) {
      return this.designCustomerSupport(spec)
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
    const triggerNode = {
      id: generateUUID(),
      name: 'Gmail - Incoming Email',
      type: triggerType,
      typeVersion: 1,
      position: [positionX, positionY],
      parameters: this.getEmailTriggerParameters(spec.trigger),
      purpose: 'Listens for incoming emails to trigger the automation'
    }
    nodes.push(triggerNode)
    positionY += 150
    
    // 2. Normalize email data
    const normalizeNode = {
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
    }
    nodes.push(normalizeNode)
    connections.push({ from: triggerNode.name, to: normalizeNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 3. Duplicate/thread check
    const duplicateNode = {
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
    }
    nodes.push(duplicateNode)
    connections.push({ from: normalizeNode.name, to: duplicateNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 4. IF node to filter duplicates
    const ifNode = {
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
    }
    nodes.push(ifNode)
    connections.push({ from: duplicateNode.name, to: ifNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 5. Generate AI response
    const aiNode = {
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
    }
    nodes.push(aiNode)
    connections.push({ from: ifNode.name, to: aiNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 6. Format reply
    const formatNode = {
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
    }
    nodes.push(formatNode)
    connections.push({ from: aiNode.name, to: formatNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 7. Send reply
    const sendNode = {
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
    }
    nodes.push(sendNode)
    connections.push({ from: formatNode.name, to: sendNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 8. Log result
    const logNode = {
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
    }
    nodes.push(logNode)
    connections.push({ from: sendNode.name, to: logNode.name, type: 'main', index: 0 })
    
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
    const webhookNode = {
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
    }
    nodes.push(webhookNode)
    positionY += 150
    
    // Normalize message
    const normalizeNode = {
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
    }
    nodes.push(normalizeNode)
    connections.push({ from: webhookNode.name, to: normalizeNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // AI response
    const aiNode = {
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
    }
    nodes.push(aiNode)
    connections.push({ from: normalizeNode.name, to: aiNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // Format response
    const formatNode = {
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
    }
    nodes.push(formatNode)
    connections.push({ from: aiNode.name, to: formatNode.name, type: 'main', index: 0 })
    
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
   * Design AI customer support architecture with knowledge base
   */
  private static designCustomerSupport(spec: any): WorkflowArchitecture {
    const baseName = spec.filename?.replace('.json', '') || 'customer-support'
    const triggerType = this.determineEmailTrigger(spec.trigger)
    
    const nodes: NodeDesign[] = []
    const connections: ConnectionDesign[] = []
    let positionY = 0
    const positionX = 250
    
    // 1. Email trigger
    const triggerNode = {
      id: generateUUID(),
      name: 'Gmail - Incoming Support Email',
      type: triggerType,
      typeVersion: 1,
      position: [positionX, positionY],
      parameters: this.getEmailTriggerParameters(spec.trigger),
      purpose: 'Receives incoming customer support emails'
    }
    nodes.push(triggerNode)
    positionY += 150
    
    // 2. Normalize email
    const normalizeNode = {
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
      purpose: 'Extract and normalize email fields'
    }
    nodes.push(normalizeNode)
    connections.push({ from: triggerNode.name, to: normalizeNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 3. Classify customer intent
    const classifyNode = {
      id: generateUUID(),
      name: 'Classify Customer Intent',
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
              content: 'Classify the customer intent into one of: billing, technical_issue, product_question, feature_request, other. Return only the category name.'
            },
            {
              role: 'user',
              content: 'Subject: {{ $json.subject }}\n\n{{ $json.body }}'
            }
          ]
        }
      },
      purpose: 'Classify the customer issue type'
    }
    nodes.push(classifyNode)
    connections.push({ from: normalizeNode.name, to: classifyNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 4. Prepare embedding/query for knowledge base
    const prepareNode = {
      id: generateUUID(),
      name: 'Prepare Knowledge Query',
      type: 'n8n-nodes-base.set',
      typeVersion: 3,
      position: [positionX, positionY],
      parameters: {
        values: {
          string: [
            { name: 'query', value: '={{ $json.subject }} {{ $json.body }}' },
            { name: 'intent', value: '={{ $json.message }}' }
          ]
        }
      },
      purpose: 'Prepare the query for knowledge base search'
    }
    nodes.push(prepareNode)
    connections.push({ from: classifyNode.name, to: prepareNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 5. Search knowledge base (Pinecone or other)
    const searchNode = {
      id: generateUUID(),
      name: 'Search Knowledge Base',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [positionX, positionY],
      parameters: {
        url: 'https://api.pinecone.io/query',
        authentication: 'genericCredentialType',
        genericAuthType: 'httpHeaderAuth',
        method: 'POST',
        sendHeaders: true,
        headerParameters: {
          parameters: [
            { name: 'Api-Key', value: '={{ $credentials.pineconeApiKey }}' }
          ]
        },
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'vector', value: '={{ $json.query }}' },
            { name: 'topK', value: '3' },
            { name: 'includeMetadata', value: 'true' }
          ]
        }
      },
      purpose: 'Search knowledge base for relevant information'
    }
    nodes.push(searchNode)
    connections.push({ from: prepareNode.name, to: searchNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 6. Assemble context
    const assembleNode = {
      id: generateUUID(),
      name: 'Assemble Context',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        jsCode: `// Assemble customer question + retrieved knowledge
const customerQuestion = $input.item.json.query;
const knowledgeResults = $input.item.json.matches || [];
const knowledgeText = knowledgeResults.map(m => m.metadata?.text || m.text).join('\\n\\n');

return [{
  json: {
    customerQuestion,
    knowledgeText,
    context: 'Customer Question: ' + customerQuestion + '\\n\\nRelevant Knowledge:\\n' + knowledgeText
  }
}];`
      },
      purpose: 'Combine customer question with retrieved knowledge'
    }
    nodes.push(assembleNode)
    connections.push({ from: searchNode.name, to: assembleNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 7. Generate draft response
    const draftNode = {
      id: generateUUID(),
      name: 'Generate Draft Response',
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
              content: 'You are a customer support assistant. Generate a helpful, professional response based on the customer question and the knowledge base information. If the knowledge base is insufficient, indicate that.'
            },
            {
              role: 'user',
              content: '={{ $json.context }}'
            }
          ]
        }
      },
      purpose: 'Generate AI draft response using retrieved knowledge'
    }
    nodes.push(draftNode)
    connections.push({ from: assembleNode.name, to: draftNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 8. Evaluate confidence
    const confidenceNode = {
      id: generateUUID(),
      name: 'Evaluate Confidence',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        jsCode: `// Evaluate confidence in the response
const response = $input.item.json.message || '';
const knowledgeText = $input.item.json.knowledgeText || '';

// Simple heuristics for confidence
const hasKnowledge = knowledgeText.length > 50;
const responseLength = response.length;
const isSpecific = response.length > 100;

const confidenceScore = hasKnowledge && isSpecific ? 0.8 : 0.4;
const isConfident = confidenceScore > 0.6;

return [{
  json: {
    ...$input.item.json,
    confidenceScore,
    isConfident,
    response: $input.item.json.message
  }
}];`
      },
      purpose: 'Evaluate confidence in the generated response'
    }
    nodes.push(confidenceNode)
    connections.push({ from: draftNode.name, to: confidenceNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 9. IF: confident or not
    const ifNode = {
      id: generateUUID(),
      name: 'Confidence Sufficient?',
      type: 'n8n-nodes-base.if',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        conditions: {
          string: [
            { value1: '={{ $json.isConfident }}', operation: 'true', value2: '' }
          ]
        }
      },
      purpose: 'Branch based on confidence in response'
    }
    nodes.push(ifNode)
    connections.push({ from: confidenceNode.name, to: ifNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 10. High confidence: format and send reply
    const formatNode = {
      id: generateUUID(),
      name: 'Format Confident Reply',
      type: 'n8n-nodes-base.set',
      typeVersion: 3,
      position: [positionX, positionY],
      parameters: {
        values: {
          string: [
            { name: 'to', value: '={{ $json.senderEmail }}' },
            { name: 'subject', value: 'Re: {{ $json.subject }}' },
            { name: 'body', value: '={{ $json.response }}' }
          ]
        }
      },
      purpose: 'Format the confident response for sending'
    }
    nodes.push(formatNode)
    connections.push({ from: ifNode.name, to: formatNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 11. Send reply
    const sendNode = {
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
        toEmail: '={{ $json.to }}'
      },
      purpose: 'Send the confident reply via Gmail'
    }
    nodes.push(sendNode)
    connections.push({ from: formatNode.name, to: sendNode.name, type: 'main', index: 0 })
    positionY += 150
    
    // 12. Low confidence: human escalation
    const escalateNode = {
      id: generateUUID(),
      name: 'Create Human Escalation',
      type: 'n8n-nodes-base.httpRequest',
      typeVersion: 4.2,
      position: [positionX + 300, positionY], // Offset to show branch
      parameters: {
        url: 'https://api.slack.com/chat.postMessage',
        authentication: 'genericCredentialType',
        method: 'POST',
        sendBody: true,
        bodyParameters: {
          parameters: [
            { name: 'channel', value: '#support-escalations' },
            { name: 'text', value: 'Low confidence support case requiring review:\n\nFrom: {{ $json.senderEmail }}\nSubject: {{ $json.subject }}\n\nAI Draft: {{ $json.response }}\n\nConfidence: {{ $json.confidenceScore }}' }
          ]
        }
      },
      purpose: 'Escalate low-confidence cases to human agents'
    }
    nodes.push(escalateNode)
    connections.push({ from: ifNode.name, to: escalateNode.name, type: 'main', index: 1 })
    positionY += 150
    
    // 13. Log interaction
    const logNode = {
      id: generateUUID(),
      name: 'Log Interaction',
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        jsCode: `// Log the interaction for audit
const logEntry = {
  timestamp: new Date().toISOString(),
  emailId: $input.item.json.emailId,
  sender: $input.item.json.senderEmail,
  subject: $input.item.json.subject,
  intent: $input.item.json.intent,
  confidence: $input.item.json.confidenceScore,
  action: $input.item.json.isConfident ? 'auto_replied' : 'escalated'
};

console.log('Support interaction logged:', logEntry);

return [{ json: { ...$input.item.json, logged: true, logEntry } }];`
      },
      purpose: 'Log all support interactions for audit and analytics'
    }
    // Connect both paths to log
    connections.push({ from: sendNode.name, to: logNode.name, type: 'main', index: 0 })
    connections.push({ from: escalateNode.name, to: logNode.name, type: 'main', index: 0 })
    
    return {
      name: baseName,
      description: 'AI-powered customer support with knowledge base search, confidence evaluation, and human escalation',
      nodes,
      connections,
      complexity: 'complex',
      reasoning: 'Customer support automation requires: email trigger, normalization, intent classification, knowledge base search, context assembly, AI response generation, confidence evaluation, conditional branching (auto-reply vs human escalation), and comprehensive logging. This architecture ensures intelligent responses while handling uncertainty appropriately.'
    }
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
    let triggerName = 'Manual Trigger'
    
    if (spec.trigger?.toLowerCase().includes('webhook')) {
      triggerType = 'n8n-nodes-base.webhook'
      triggerParams = { path: 'automation', responseMode: 'onReceived' }
      triggerName = 'Webhook Trigger'
    } else if (spec.trigger?.toLowerCase().includes('email') || spec.trigger?.toLowerCase().includes('gmail')) {
      triggerType = 'n8n-nodes-base.gmailTrigger'
      triggerParams = { event: 'message' }
      triggerName = 'Gmail Trigger'
    } else if (spec.trigger?.toLowerCase().includes('schedule') || spec.trigger?.toLowerCase().includes('cron')) {
      triggerType = 'n8n-nodes-base.scheduleTrigger'
      triggerParams = { rule: { interval: [{ field: 'hours', hoursInterval: 1 }] } }
      triggerName = 'Schedule Trigger'
    }
    
    // Trigger
    const triggerNode = {
      id: generateUUID(),
      name: triggerName,
      type: triggerType,
      typeVersion: 1,
      position: [positionX, positionY],
      parameters: triggerParams,
      purpose: `Trigger: ${spec.trigger}`
    }
    nodes.push(triggerNode)
    positionY += 150
    
    // Process data - but use a meaningful name based on functionality
    const processNode = {
      id: generateUUID(),
      name: `Process ${spec.functionality || 'Data'}`,
      type: 'n8n-nodes-base.code',
      typeVersion: 2,
      position: [positionX, positionY],
      parameters: {
        jsCode: `// ${spec.functionality}\nconst inputData = $input.all();\nconst processedData = inputData.map(item => ({\n  ...item.json,\n  processedAt: new Date().toISOString()\n}));\nreturn processedData.map(item => ({ json: item }));`
      },
      purpose: `Process: ${spec.functionality}`
    }
    nodes.push(processNode)
    connections.push({ from: triggerNode.name, to: processNode.name, type: 'main', index: 0 })
    
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
