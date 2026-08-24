/**
 * ALEX Architecture Designer
 * 
 * Platform-agnostic automation architecture design
 * Designs logical flow first, then translates to platform-specific implementation
 */

import { AutomationSpec } from './automation-spec'

export interface LogicalStage {
  id: string
  name: string
  purpose: string
  inputs: string[]
  outputs: string[]
  optional: boolean
  dependencies: string[]  // IDs of stages this depends on
}

export interface LogicalArchitecture {
  name: string
  description: string
  stages: LogicalStage[]
  complexity: 'simple' | 'moderate' | 'complex'
  reasoning: string
  assumptions: string[]
  recommendations: string[]
}

export class ArchitectureDesigner {
  /**
   * Design logical architecture based on automation specification
   */
  static design(spec: AutomationSpec): LogicalArchitecture {
    console.log('[Architecture Designer] Designing logical architecture for:', spec.automationType)
    
    const lowerDesc = (spec.description || '').toLowerCase()
    const domain = spec.domain || 'custom'
    
    // Design based on automation type and domain
    if (domain === 'email' && spec.aiConfig?.enabled) {
      return this.designAIEmailAutomation(spec)
    }
    
    if (domain === 'email') {
      return this.designEmailAutomation(spec)
    }
    
    if (domain === 'support' && spec.aiConfig?.enabled) {
      return this.designAICustomerSupport(spec)
    }
    
    if (domain === 'support') {
      return this.designCustomerSupport(spec)
    }
    
    if (spec.aiConfig?.enabled) {
      return this.designAIAutomation(spec)
    }
    
    if (spec.schedule?.enabled) {
      return this.designScheduledAutomation(spec)
    }
    
    // Default architecture
    return this.designGenericAutomation(spec)
  }
  
  /**
   * Design AI-powered email automation (auto-responder, etc.)
   */
  private static designAIEmailAutomation(spec: AutomationSpec): LogicalArchitecture {
    const stages: LogicalStage[] = [
      {
        id: 'trigger',
        name: 'Email Trigger',
        purpose: 'Receive incoming email messages',
        inputs: ['incoming email'],
        outputs: ['email data'],
        optional: false,
        dependencies: []
      },
      {
        id: 'normalize',
        name: 'Normalize Email',
        purpose: 'Extract and standardize email fields (sender, subject, body, thread ID, attachments)',
        inputs: ['email data'],
        outputs: ['normalized email'],
        optional: false,
        dependencies: ['trigger']
      },
      {
        id: 'deduplicate',
        name: 'Duplicate/Thread Check',
        purpose: 'Prevent duplicate responses and preserve conversation context',
        inputs: ['normalized email'],
        outputs: ['email with thread context'],
        optional: false,
        dependencies: ['normalize']
      },
      {
        id: 'classify',
        name: 'Classify Request',
        purpose: 'Determine intent, urgency, and category of the email',
        inputs: ['email with thread context'],
        outputs: ['classification result'],
        optional: true,
        dependencies: ['deduplicate']
      },
      {
        id: 'assemble-context',
        name: 'Assemble Context',
        purpose: 'Gather relevant context for AI processing (thread history, sender info, classification)',
        inputs: ['email with thread context', 'classification result'],
        outputs: ['assembled context'],
        optional: false,
        dependencies: ['deduplicate', 'classify']
      },
      {
        id: 'ai-process',
        name: 'AI Processing',
        purpose: 'Generate contextual response using AI model',
        inputs: ['assembled context'],
        outputs: ['draft response'],
        optional: false,
        dependencies: ['assemble-context']
      },
      {
        id: 'confidence-check',
        name: 'Confidence Evaluation',
        purpose: 'Evaluate AI response confidence and quality',
        inputs: ['draft response'],
        outputs: ['confidence score', 'decision'],
        optional: spec.humanApproval?.required || false,
        dependencies: ['ai-process']
      },
      {
        id: 'branch',
        name: 'Confidence Branch',
        purpose: 'Route to auto-reply or human escalation based on confidence',
        inputs: ['confidence score', 'decision'],
        outputs: ['routing decision'],
        optional: spec.humanApproval?.required || false,
        dependencies: ['confidence-check']
      },
      {
        id: 'auto-reply',
        name: 'Send Auto Reply',
        purpose: 'Send AI-generated reply preserving thread context',
        inputs: ['draft response', 'email with thread context'],
        outputs: ['sent confirmation'],
        optional: false,
        dependencies: ['ai-process', 'branch']
      },
      {
        id: 'escalate',
        name: 'Human Escalation',
        purpose: 'Route to human for review and response',
        inputs: ['draft response', 'email with thread context'],
        outputs: ['escalation confirmation'],
        optional: spec.humanApproval?.required || false,
        dependencies: ['branch']
      },
      {
        id: 'log',
        name: 'Log Interaction',
        purpose: 'Record input, classification, response, confidence, and outcome',
        inputs: ['email data', 'classification result', 'draft response', 'confidence score', 'sent confirmation'],
        outputs: ['log entry'],
        optional: false,
        dependencies: ['auto-reply', 'escalate']
      },
      {
        id: 'error-handler',
        name: 'Error Handler',
        purpose: 'Handle failed API calls and retry safely',
        inputs: ['error'],
        outputs: ['error recovery action'],
        optional: false,
        dependencies: ['auto-reply', 'escalate', 'log']
      }
    ]
    
    // Remove optional stages if not needed
    const filteredStages = stages.filter(stage => {
      if (stage.optional) {
        if (stage.id === 'classify' && !spec.businessRules?.conditions) return false
        if (stage.id === 'confidence-check' && !spec.humanApproval?.required) return false
        if (stage.id === 'branch' && !spec.humanApproval?.required) return false
        if (stage.id === 'escalate' && !spec.humanApproval?.required) return false
      }
      return true
    })
    
    // Generate dynamic reasoning based on actual stages
    const stageNames = filteredStages.map(s => s.name).join(', ')
    const hasEscalation = filteredStages.some(s => s.id === 'escalate')

    return {
      name: spec.filename?.replace('.json', '') || 'ai-email-automation',
      description: 'AI-powered email automation with intelligent response generation',
      stages: filteredStages,
      complexity: spec.humanApproval?.required ? 'complex' : 'moderate',
      reasoning: `AI email automation includes: ${stageNames}. ${hasEscalation ? 'Human escalation is included for low-confidence responses.' : ''}`,
      assumptions: [
        'Email provider supports IMAP/webhook triggers',
        'AI model is accessible via API',
        'Thread preservation is important for conversation context',
        'Duplicate prevention prevents infinite loops'
      ],
      recommendations: [
        'Preserve original email thread for conversation continuity',
        'Use confidence thresholds to determine when to escalate',
        'Log all interactions for audit and improvement',
        'Implement retry logic for external API failures'
      ]
    }
  }
  
  /**
   * Design simple email automation (non-AI)
   */
  private static designEmailAutomation(spec: AutomationSpec): LogicalArchitecture {
    const stages: LogicalStage[] = [
      {
        id: 'trigger',
        name: 'Email Trigger',
        purpose: 'Receive incoming email messages',
        inputs: ['incoming email'],
        outputs: ['email data'],
        optional: false,
        dependencies: []
      },
      {
        id: 'normalize',
        name: 'Normalize Email',
        purpose: 'Extract and standardize email fields',
        inputs: ['email data'],
        outputs: ['normalized email'],
        optional: false,
        dependencies: ['trigger']
      },
      {
        id: 'process',
        name: 'Process Email',
        purpose: 'Apply business rules and transformations',
        inputs: ['normalized email'],
        outputs: ['processed email'],
        optional: false,
        dependencies: ['normalize']
      },
      {
        id: 'action',
        name: 'Take Action',
        purpose: 'Send notification, update database, or trigger downstream process',
        inputs: ['processed email'],
        outputs: ['action result'],
        optional: false,
        dependencies: ['process']
      },
      {
        id: 'log',
        name: 'Log Interaction',
        purpose: 'Record the interaction for audit',
        inputs: ['email data', 'action result'],
        outputs: ['log entry'],
        optional: true,
        dependencies: ['action']
      }
    ]
    
    // Generate dynamic reasoning based on actual stages
    const stageNames = stages.map(s => s.name).join(', ')

    return {
      name: spec.filename?.replace('.json', '') || 'email-automation',
      description: 'Email automation with processing and action',
      stages: stages,
      complexity: 'simple',
      reasoning: `Simple email automation includes: ${stageNames}.`,
      assumptions: [
        'Email provider supports triggers',
        'Business rules are straightforward'
      ],
      recommendations: [
        'Add logging for production use',
        'Consider error handling for external actions'
      ]
    }
  }
  
  /**
   * Design AI customer support automation
   */
  private static designAICustomerSupport(spec: AutomationSpec): LogicalArchitecture {
    const hasKnowledgeBase = !!spec.integrations?.knowledgeBase
    
    const stages: LogicalStage[] = [
      {
        id: 'trigger',
        name: 'Email Trigger',
        purpose: 'Receive customer support emails',
        inputs: ['incoming email'],
        outputs: ['email data'],
        optional: false,
        dependencies: []
      },
      {
        id: 'normalize',
        name: 'Normalize Email',
        purpose: 'Extract sender, subject, body, thread ID, attachments',
        inputs: ['email data'],
        outputs: ['normalized email'],
        optional: false,
        dependencies: ['trigger']
      },
      {
        id: 'deduplicate',
        name: 'Duplicate/Thread Check',
        purpose: 'Prevent duplicate responses and preserve conversation context',
        inputs: ['normalized email'],
        outputs: ['email with thread context'],
        optional: false,
        dependencies: ['normalize']
      },
      {
        id: 'classify',
        name: 'Classify Intent & Urgency',
        purpose: 'Determine customer intent, support category, and urgency level',
        inputs: ['email with thread context'],
        outputs: ['classification result'],
        optional: false,
        dependencies: ['deduplicate']
      },
      {
        id: 'retrieve-knowledge',
        name: 'Knowledge Base Retrieval',
        purpose: 'Search knowledge base for relevant documentation and answers',
        inputs: ['classification result', 'email with thread context'],
        outputs: ['knowledge context'],
        optional: !hasKnowledgeBase,
        dependencies: ['classify']
      },
      {
        id: 'assemble-context',
        name: 'Assemble Context',
        purpose: 'Combine email, thread history, classification, and knowledge base context',
        inputs: ['email with thread context', 'classification result', 'knowledge context'],
        outputs: ['assembled context'],
        optional: false,
        dependencies: ['classify', 'retrieve-knowledge']
      },
      {
        id: 'ai-draft',
        name: 'AI Response Draft',
        purpose: 'Generate grounded response using AI with retrieved context',
        inputs: ['assembled context'],
        outputs: ['draft response'],
        optional: false,
        dependencies: ['assemble-context']
      },
      {
        id: 'confidence-eval',
        name: 'Confidence & Evidence Evaluation',
        purpose: 'Evaluate response confidence and evidence quality',
        inputs: ['draft response', 'knowledge context'],
        outputs: ['confidence score', 'evidence score'],
        optional: false,
        dependencies: ['ai-draft']
      },
      {
        id: 'branch',
        name: 'Confidence Branch',
        purpose: 'Route to auto-reply if confident, escalate if uncertain',
        inputs: ['confidence score', 'evidence score'],
        outputs: ['routing decision'],
        optional: false,
        dependencies: ['confidence-eval']
      },
      {
        id: 'auto-reply',
        name: 'Send Auto Reply',
        purpose: 'Send confident response to customer',
        inputs: ['draft response', 'email with thread context'],
        outputs: ['sent confirmation'],
        optional: false,
        dependencies: ['branch']
      },
      {
        id: 'escalate',
        name: 'Human Escalation',
        purpose: 'Route uncertain cases to human support agent',
        inputs: ['draft response', 'email with thread context', 'confidence score'],
        outputs: ['escalation ticket'],
        optional: false,
        dependencies: ['branch']
      },
      {
        id: 'log',
        name: 'Log Interaction',
        purpose: 'Record input, classification, retrieval, response, confidence, and outcome',
        inputs: ['email data', 'classification result', 'knowledge context', 'draft response', 'confidence score', 'sent confirmation'],
        outputs: ['log entry'],
        optional: false,
        dependencies: ['auto-reply', 'escalate']
      },
      {
        id: 'error-handler',
        name: 'Error Handler',
        purpose: 'Handle failed API calls, knowledge base errors, and retry safely',
        inputs: ['error'],
        outputs: ['error recovery action'],
        optional: false,
        dependencies: ['retrieve-knowledge', 'auto-reply', 'escalate', 'log']
      }
    ]
    
    // Remove knowledge retrieval if no KB specified
    const filteredStages = hasKnowledgeBase ? stages : stages.filter(s => s.id !== 'retrieve-knowledge')

    // Generate dynamic reasoning based on actual stages
    const stageNames = filteredStages.map(s => s.name).join(', ')

    return {
      name: spec.filename?.replace('.json', '') || 'ai-customer-support',
      description: 'AI-powered customer support with knowledge base and human escalation',
      stages: filteredStages,
      complexity: 'complex',
      reasoning: `AI customer support includes: ${stageNames}. ${hasKnowledgeBase ? 'Knowledge base retrieval is enabled for improved accuracy.' : 'Knowledge base retrieval is not configured.'}`,
      assumptions: [
        hasKnowledgeBase ? 'Knowledge base system is accessible' : 'AI will generate responses without external knowledge base',
        'Email provider supports triggers',
        'AI model is accessible via API',
        'Human escalation path is configured'
      ],
      recommendations: [
        'Use confidence thresholds to balance automation vs human touch',
        'Log all interactions for continuous improvement',
        'Monitor escalation rates to optimize AI responses',
        'Regularly update knowledge base for better grounding'
      ]
    }
  }
  
  /**
   * Design simple customer support (non-AI)
   */
  private static designCustomerSupport(spec: AutomationSpec): LogicalArchitecture {
    const stages: LogicalStage[] = [
      {
        id: 'trigger',
        name: 'Email Trigger',
        purpose: 'Receive customer support emails',
        inputs: ['incoming email'],
        outputs: ['email data'],
        optional: false,
        dependencies: []
      },
      {
        id: 'normalize',
        name: 'Normalize Email',
        purpose: 'Extract and standardize email fields',
        inputs: ['email data'],
        outputs: ['normalized email'],
        optional: false,
        dependencies: ['trigger']
      },
      {
        id: 'route',
        name: 'Route Request',
        purpose: 'Route to appropriate team or queue based on rules',
        inputs: ['normalized email'],
        outputs: ['routing decision'],
        optional: false,
        dependencies: ['normalize']
      },
      {
        id: 'notify',
        name: 'Notify Team',
        purpose: 'Send notification to support team',
        inputs: ['routing decision', 'normalized email'],
        outputs: ['notification sent'],
        optional: false,
        dependencies: ['route']
      },
      {
        id: 'log',
        name: 'Log Interaction',
        purpose: 'Record the support request',
        inputs: ['email data', 'routing decision'],
        outputs: ['log entry'],
        optional: true,
        dependencies: ['route']
      }
    ]
    
    return {
      name: spec.filename?.replace('.json', '') || 'customer-support',
      description: 'Customer support request routing',
      stages: stages,
      complexity: 'simple',
      reasoning: 'Simple customer support needs: trigger, normalization, routing, notification, and optional logging.',
      assumptions: [
        'Support team notification method is configured'
      ],
      recommendations: [
        'Add logging for ticket tracking',
        'Consider auto-response to acknowledge receipt'
      ]
    }
  }
  
  /**
   * Design general AI automation
   */
  private static designAIAutomation(spec: AutomationSpec): LogicalArchitecture {
    const stages: LogicalStage[] = [
      {
        id: 'trigger',
        name: 'Trigger',
        purpose: 'Initiate automation based on event or schedule',
        inputs: ['trigger event'],
        outputs: ['trigger data'],
        optional: false,
        dependencies: []
      },
      {
        id: 'prepare-input',
        name: 'Prepare Input',
        purpose: 'Normalize and prepare data for AI processing',
        inputs: ['trigger data'],
        outputs: ['prepared input'],
        optional: false,
        dependencies: ['trigger']
      },
      {
        id: 'ai-process',
        name: 'AI Processing',
        purpose: 'Process data with AI model',
        inputs: ['prepared input'],
        outputs: ['AI output'],
        optional: false,
        dependencies: ['prepare-input']
      },
      {
        id: 'validate-output',
        name: 'Validate Output',
        purpose: 'Validate AI output quality and structure',
        inputs: ['AI output'],
        outputs: ['validated output'],
        optional: true,
        dependencies: ['ai-process']
      },
      {
        id: 'action',
        name: 'Take Action',
        purpose: 'Execute downstream action based on AI output',
        inputs: ['validated output'],
        outputs: ['action result'],
        optional: false,
        dependencies: ['ai-process', 'validate-output']
      },
      {
        id: 'log',
        name: 'Log Interaction',
        purpose: 'Record input, output, and result',
        inputs: ['prepared input', 'AI output', 'action result'],
        outputs: ['log entry'],
        optional: true,
        dependencies: ['action']
      }
    ]
    
    return {
      name: spec.filename?.replace('.json', '') || 'ai-automation',
      description: 'General AI automation',
      stages: stages,
      complexity: 'moderate',
      reasoning: 'AI automation needs: trigger, input preparation, AI processing, output validation, action, and optional logging.',
      assumptions: [
        'AI model is accessible via API',
        'Input data is compatible with AI model'
      ],
      recommendations: [
        'Add output validation for production use',
        'Implement error handling for AI API failures'
      ]
    }
  }
  
  /**
   * Design scheduled automation
   */
  private static designScheduledAutomation(spec: AutomationSpec): LogicalArchitecture {
    const stages: LogicalStage[] = [
      {
        id: 'schedule-trigger',
        name: 'Schedule Trigger',
        purpose: 'Trigger at specified time/frequency',
        inputs: ['schedule'],
        outputs: ['trigger event'],
        optional: false,
        dependencies: []
      },
      {
        id: 'fetch-data',
        name: 'Fetch Data',
        purpose: 'Retrieve data needed for the automation',
        inputs: ['trigger event'],
        outputs: ['fetched data'],
        optional: false,
        dependencies: ['schedule-trigger']
      },
      {
        id: 'process',
        name: 'Process Data',
        purpose: 'Apply transformations and business logic',
        inputs: ['fetched data'],
        outputs: ['processed data'],
        optional: false,
        dependencies: ['fetch-data']
      },
      {
        id: 'action',
        name: 'Take Action',
        purpose: 'Send notification, update records, or trigger downstream process',
        inputs: ['processed data'],
        outputs: ['action result'],
        optional: false,
        dependencies: ['process']
      },
      {
        id: 'log',
        name: 'Log Execution',
        purpose: 'Record the automation execution',
        inputs: ['trigger event', 'action result'],
        outputs: ['log entry'],
        optional: true,
        dependencies: ['action']
      }
    ]
    
    return {
      name: spec.filename?.replace('.json', '') || 'scheduled-automation',
      description: 'Scheduled automation',
      stages: stages,
      complexity: 'simple',
      reasoning: 'Scheduled automation needs: schedule trigger, data fetch, processing, action, and optional logging.',
      assumptions: [
        'Data source is accessible at scheduled time',
        'Action destination is available'
      ],
      recommendations: [
        'Add error handling for data fetch failures',
        'Consider timezone handling for distributed teams'
      ]
    }
  }
  
  /**
   * Design generic automation
   */
  private static designGenericAutomation(spec: AutomationSpec): LogicalArchitecture {
    const stages: LogicalStage[] = [
      {
        id: 'trigger',
        name: 'Trigger',
        purpose: 'Initiate the automation',
        inputs: ['trigger event'],
        outputs: ['trigger data'],
        optional: false,
        dependencies: []
      },
      {
        id: 'process',
        name: 'Process',
        purpose: 'Process data according to business rules',
        inputs: ['trigger data'],
        outputs: ['processed data'],
        optional: false,
        dependencies: ['trigger']
      },
      {
        id: 'action',
        name: 'Action',
        purpose: 'Execute the intended action',
        inputs: ['processed data'],
        outputs: ['action result'],
        optional: false,
        dependencies: ['process']
      }
    ]
    
    return {
      name: spec.filename?.replace('.json', '') || 'automation',
      description: 'Generic automation',
      stages: stages,
      complexity: 'simple',
      reasoning: 'Generic automation needs: trigger, processing, and action.',
      assumptions: [],
      recommendations: [
        'Add logging for production use',
        'Consider error handling'
      ]
    }
  }
  
  /**
   * Generate human-readable architecture description
   */
  static describeArchitecture(architecture: LogicalArchitecture): string {
    let description = `I recommend the following architecture:\n\n`
    
    architecture.stages.forEach((stage, index) => {
      description += `${index + 1}. ${stage.name}\n`
      description += `   ${stage.purpose}\n\n`
    })
    
    description += `\nComplexity: ${architecture.complexity}\n\n`
    description += `Reasoning: ${architecture.reasoning}\n\n`
    
    if (architecture.assumptions.length > 0) {
      description += `Assumptions:\n`
      architecture.assumptions.forEach(assumption => {
        description += `- ${assumption}\n`
      })
      description += `\n`
    }
    
    if (architecture.recommendations.length > 0) {
      description += `Recommendations:\n`
      architecture.recommendations.forEach(rec => {
        description += `- ${rec}\n`
      })
    }
    
    return description
  }
}
