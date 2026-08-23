/**
 * ALEX Automation Specification
 * 
 * Structured specification for maintaining semantic conversation state
 * across automation design interactions.
 */

export interface AutomationSpec {
  // Core identification
  automationType: 'workflow' | 'chatbot' | 'agent' | 'pipeline' | 'integration' | 'automation'
  
  // Platform selection
  platform?: string  // n8n, zapier, make, power-automate, pipedream, custom, etc.
  platformReasoning?: string  // Why this platform was chosen/recommended
  
  // Automation domain
  domain?: 'email' | 'support' | 'sales' | 'marketing' | 'finance' | 'operations' | 'ai' | 'data' | 'custom'
  
  // Trigger mechanism
  trigger?: {
    type: string  // email, webhook, schedule, manual, event, etc.
    source?: string  // gmail, outlook, slack, etc.
    config?: any  // trigger-specific configuration
  }
  
  // Inputs and data sources
  inputs?: {
    sources: string[]  // email, web form, database, api, etc.
    format?: string  // json, xml, csv, etc.
    validation?: string[]  // required validations
  }
  
  // Outputs and destinations
  outputs?: {
    destinations: string[]  // email, slack, database, api, etc.
    format?: string
    notification?: boolean
  }
  
  // Integrations and services
  integrations?: {
    emailProvider?: string  // gmail, outlook, smtp, imap
    aiProvider?: string  // openai, anthropic, gemini, etc.
    aiModel?: string  // gpt-4, claude-3, gemini-pro, etc.
    knowledgeBase?: string  // system to query for RAG
    databases?: string[]
    apis?: string[]
    webhooks?: string[]
    crm?: string
    other?: string[]
  }
  
  // Business logic and rules
  businessRules?: {
    conditions?: string[]  // branching logic
    routing?: string[]  // how to route different cases
    filters?: string[]  // what to include/exclude
    transformations?: string[]  // data transformations
  }
  
  // AI-specific configuration
  aiConfig?: {
    enabled: boolean
    task?: string  // classification, generation, extraction, etc.
    confidenceThreshold?: number
    humanEscalation?: boolean
    fallbackBehavior?: string
    promptTemplate?: string
    systemPrompt?: string
  }
  
  // Human-in-the-loop
  humanApproval?: {
    required: boolean
    stages?: string[]  // where human approval is needed
    escalationPath?: string
  }
  
  // Error handling
  errorHandling?: {
    retryStrategy?: string  // exponential-backoff, fixed, none
    maxRetries?: number
    fallbackPath?: string
    errorNotification?: string
  }
  
  // Persistence and logging
  persistence?: {
    enabled: boolean
    storage?: string  // database, file, etc.
    logLevel?: string  // error, warn, info, debug
    auditTrail?: boolean
  }
  
  // Scheduling
  schedule?: {
    enabled: boolean
    frequency?: string  // daily, hourly, weekly, cron
    timezone?: string
    time?: string
  }
  
  // Security and credentials
  security?: {
    credentials?: string[]  // what credentials are needed
    encryption?: boolean
    accessControl?: string[]
    dataRetention?: string
  }
  
  // Observability
  observability?: {
    monitoring?: boolean
    metrics?: string[]
    alerts?: string[]
  }
  
  // Architecture decisions
  architecture?: {
    complexity: 'simple' | 'moderate' | 'complex'
    stages?: string[]  // high-level stages
    patterns?: string[]  // design patterns used
    assumptions?: string[]  // architectural assumptions
  }
  
  // Metadata
  filename?: string
  description?: string
  
  // What's still unresolved
  unresolvedBlockers?: string[]
  
  // What we're assuming
  assumptions?: string[]
  
  // Our recommendations
  recommendations?: string[]
  
  // Track known fields (for persistence)
  _knownFields?: string[]
  
  // Track blocker fields (for persistence)
  _blockerFields?: string[]
}

/**
 * Specification state tracking
 */
export interface SpecState {
  spec: AutomationSpec
  // What's been explicitly provided by user
  known: Set<string>
  // What we've inferred from context
  inferred: Set<string>
  // What we've recommended
  recommended: Set<string>
  // What's blocking generation
  blockers: Set<string>
  // What we're assuming (not blockers)
  assumptions: Set<string>
  // Current question being asked
  currentQuestion?: string
  // Question context (which field we're trying to resolve)
  questionContext?: string
}

/**
 * Create a new empty specification
 */
export function createEmptySpec(): AutomationSpec {
  return {
    automationType: 'workflow',
    aiConfig: { enabled: false },
    humanApproval: { required: false },
    errorHandling: { retryStrategy: 'exponential-backoff', maxRetries: 3 },
    persistence: { enabled: true, logLevel: 'info', auditTrail: true },
    architecture: { complexity: 'moderate' }
  }
}

/**
 * Create a new spec state
 */
export function createSpecState(spec?: AutomationSpec, known?: string[], blockers?: string[]): SpecState {
  return {
    spec: spec || createEmptySpec(),
    known: new Set(known || []),
    inferred: new Set(),
    recommended: new Set(),
    blockers: new Set(blockers || []),
    assumptions: new Set()
  }
}

/**
 * Update specification with a key-value pair
 */
export function updateSpec(spec: AutomationSpec, key: string, value: any, source: 'known' | 'inferred' | 'recommended'): AutomationSpec {
  const keys = key.split('.')
  let current = spec
  
  for (let i = 0; i < keys.length - 1; i++) {
    if (!current[keys[i]]) {
      current[keys[i]] = {}
    }
    current = current[keys[i]]
  }
  
  current[keys[keys.length - 1]] = value
  return spec
}

/**
 * Merge partial spec into full spec
 */
export function mergeSpec(base: AutomationSpec, update: Partial<AutomationSpec>): AutomationSpec {
  return { ...base, ...update }
}
