/**
 * ALEX Platform Capability Model
 * 
 * Describes what each automation platform can do
 * Enables intelligent platform selection based on requirements
 */

export interface PlatformCapability {
  // Platform identification
  id: string
  name: string
  category: 'workflow-automation' | 'low-code' | 'code-first' | 'serverless' | 'specialized'
  
  // Trigger capabilities
  triggers: {
    email: boolean
    webhook: boolean
    schedule: boolean
    manual: boolean
    event: boolean
    database: boolean
    file: boolean
    custom: boolean
  }
  
  // Action capabilities
  actions: {
    email: boolean
    http: boolean
    database: boolean
    file: boolean
    ai: boolean
    code: boolean
    transformation: boolean
    branching: boolean
    loops: boolean
    errorHandling: boolean
    retries: boolean
    humanApproval: boolean
    webhooks: boolean
    storage: boolean
    monitoring: boolean
  }
  
  // AI capabilities
  ai: {
    native: boolean  // Has built-in AI nodes
    openai: boolean  // Native OpenAI integration
    anthropic: boolean  // Native Anthropic integration
    gemini: boolean  // Native Google Gemini integration
    custom: boolean  // Can call custom AI APIs
    rag: boolean  // Native RAG/knowledge base support
    agents: boolean  // Agent/workflow orchestration
  }
  
  // Database capabilities
  databases: {
    sql: boolean
    nosql: boolean
    native: boolean  // Has built-in database
    external: boolean  // Can connect to external databases
  }
  
  // HTTP/API capabilities
  http: {
    rest: boolean
    graphql: boolean
    soap: boolean
    websockets: boolean
    authentication: string[]  // api-key, oauth, basic, etc.
  }
  
  // Branching and logic
  logic: {
    conditions: boolean
    switches: boolean
    parallel: boolean
    sequential: boolean
    merge: boolean
  }
  
  // Error handling
  errorHandling: {
    tryCatch: boolean
    retries: boolean
    fallback: boolean
    customErrors: boolean
  }
  
  // Scheduling
  scheduling: {
    cron: boolean
    interval: boolean
    timezone: boolean
  }
  
  // Credentials and security
  security: {
    credentialStore: boolean
    encryption: boolean
    accessControl: boolean
    auditLogs: boolean
  }
  
  // Observability
  observability: {
    logging: boolean
    metrics: boolean
    tracing: boolean
    alerts: boolean
  }
  
  // Import/export
  importExport: {
    format: string  // json, yaml, etc.
    versioning: boolean
    gitIntegration: boolean
  }
  
  // Pricing/practical considerations
  practical: {
    complexity: 'low' | 'medium' | 'high'
    learningCurve: 'low' | 'medium' | 'high'
    costLevel: 'free' | 'freemium' | 'paid'
    bestFor: string[]  // use cases where this platform excels
    limitations: string[]  // known limitations
  }
}

/**
 * Platform capability definitions
 */
export const PLATFORM_CAPABILITIES: Record<string, PlatformCapability> = {
  n8n: {
    id: 'n8n',
    name: 'n8n',
    category: 'workflow-automation',
    triggers: {
      email: true,
      webhook: true,
      schedule: true,
      manual: true,
      event: true,
      database: true,
      file: true,
      custom: true
    },
    actions: {
      email: true,
      http: true,
      database: true,
      file: true,
      ai: true,
      code: true,
      transformation: true,
      branching: true,
      loops: true,
      errorHandling: true,
      retries: true,
      humanApproval: true,
      webhooks: true,
      storage: true,
      monitoring: true
    },
    ai: {
      native: true,
      openai: true,
      anthropic: true,
      gemini: true,
      custom: true,
      rag: false,
      agents: true
    },
    databases: {
      sql: true,
      nosql: true,
      native: false,
      external: true
    },
    http: {
      rest: true,
      graphql: true,
      soap: false,
      websockets: false,
      authentication: ['api-key', 'oauth', 'basic', 'bearer']
    },
    logic: {
      conditions: true,
      switches: true,
      parallel: true,
      sequential: true,
      merge: true
    },
    errorHandling: {
      tryCatch: true,
      retries: true,
      fallback: true,
      customErrors: true
    },
    scheduling: {
      cron: true,
      interval: true,
      timezone: true
    },
    security: {
      credentialStore: true,
      encryption: true,
      accessControl: true,
      auditLogs: true
    },
    observability: {
      logging: true,
      metrics: true,
      tracing: false,
      alerts: false
    },
    importExport: {
      format: 'json',
      versioning: true,
      gitIntegration: true
    },
    practical: {
      complexity: 'medium',
      learningCurve: 'medium',
      costLevel: 'freemium',
      bestFor: ['complex workflows', 'AI automation', 'email automation', 'API integration', 'self-hosted'],
      limitations: ['requires hosting', 'steep learning curve for complex flows']
    }
  },
  
  zapier: {
    id: 'zapier',
    name: 'Zapier',
    category: 'low-code',
    triggers: {
      email: true,
      webhook: true,
      schedule: true,
      manual: false,
      event: true,
      database: true,
      file: true,
      custom: false
    },
    actions: {
      email: true,
      http: true,
      database: true,
      file: true,
      ai: true,
      code: true,
      transformation: true,
      branching: true,
      loops: false,
      errorHandling: true,
      retries: true,
      humanApproval: false,
      webhooks: true,
      storage: true,
      monitoring: true
    },
    ai: {
      native: true,
      openai: true,
      anthropic: false,
      gemini: false,
      custom: true,
      rag: false,
      agents: false
    },
    databases: {
      sql: false,
      nosql: false,
      native: false,
      external: true
    },
    http: {
      rest: true,
      graphql: false,
      soap: false,
      websockets: false,
      authentication: ['api-key', 'oauth', 'basic']
    },
    logic: {
      conditions: true,
      switches: true,
      parallel: false,
      sequential: true,
      merge: false
    },
    errorHandling: {
      tryCatch: false,
      retries: true,
      fallback: false,
      customErrors: false
    },
    scheduling: {
      cron: false,
      interval: true,
      timezone: true
    },
    security: {
      credentialStore: true,
      encryption: true,
      accessControl: true,
      auditLogs: true
    },
    observability: {
      logging: true,
      metrics: true,
      tracing: false,
      alerts: true
    },
    importExport: {
      format: 'json',
      versioning: false,
      gitIntegration: false
    },
    practical: {
      complexity: 'low',
      learningCurve: 'low',
      costLevel: 'freemium',
      bestFor: ['simple integrations', 'non-technical users', 'quick prototyping', 'SaaS integrations'],
      limitations: ['limited branching', 'no loops', 'hosted only']
    }
  },
  
  make: {
    id: 'make',
    name: 'Make (formerly Integromat)',
    category: 'low-code',
    triggers: {
      email: true,
      webhook: true,
      schedule: true,
      manual: false,
      event: true,
      database: true,
      file: true,
      custom: false
    },
    actions: {
      email: true,
      http: true,
      database: true,
      file: true,
      ai: true,
      code: true,
      transformation: true,
      branching: true,
      loops: true,
      errorHandling: true,
      retries: true,
      humanApproval: false,
      webhooks: true,
      storage: true,
      monitoring: true
    },
    ai: {
      native: true,
      openai: true,
      anthropic: false,
      gemini: false,
      custom: true,
      rag: false,
      agents: false
    },
    databases: {
      sql: false,
      nosql: false,
      native: false,
      external: true
    },
    http: {
      rest: true,
      graphql: false,
      soap: false,
      websockets: false,
      authentication: ['api-key', 'oauth', 'basic']
    },
    logic: {
      conditions: true,
      switches: true,
      parallel: true,
      sequential: true,
      merge: true
    },
    errorHandling: {
      tryCatch: true,
      retries: true,
      fallback: true,
      customErrors: false
    },
    scheduling: {
      cron: false,
      interval: true,
      timezone: true
    },
    security: {
      credentialStore: true,
      encryption: true,
      accessControl: true,
      auditLogs: true
    },
    observability: {
      logging: true,
      metrics: true,
      tracing: false,
      alerts: true
    },
    importExport: {
      format: 'json',
      versioning: false,
      gitIntegration: false
    },
    practical: {
      complexity: 'medium',
      learningCurve: 'medium',
      costLevel: 'freemium',
      bestFor: ['complex integrations', 'data transformation', 'visual workflows', 'SaaS integrations'],
      limitations: ['can be complex for beginners', 'hosted only']
    }
  },
  
  'power-automate': {
    id: 'power-automate',
    name: 'Power Automate',
    category: 'low-code',
    triggers: {
      email: true,
      webhook: true,
      schedule: true,
      manual: true,
      event: true,
      database: true,
      file: true,
      custom: true
    },
    actions: {
      email: true,
      http: true,
      database: true,
      file: true,
      ai: true,
      code: true,
      transformation: true,
      branching: true,
      loops: true,
      errorHandling: true,
      retries: true,
      humanApproval: true,
      webhooks: true,
      storage: true,
      monitoring: true
    },
    ai: {
      native: true,
      openai: true,
      anthropic: false,
      gemini: false,
      custom: true,
      rag: false,
      agents: false
    },
    databases: {
      sql: true,
      nosql: false,
      native: true,
      external: true
    },
    http: {
      rest: true,
      graphql: false,
      soap: true,
      websockets: false,
      authentication: ['api-key', 'oauth', 'basic', 'windows']
    },
    logic: {
      conditions: true,
      switches: true,
      parallel: true,
      sequential: true,
      merge: true
    },
    errorHandling: {
      tryCatch: true,
      retries: true,
      fallback: true,
      customErrors: true
    },
    scheduling: {
      cron: false,
      interval: true,
      timezone: true
    },
    security: {
      credentialStore: true,
      encryption: true,
      accessControl: true,
      auditLogs: true
    },
    observability: {
      logging: true,
      metrics: true,
      tracing: false,
      alerts: true
    },
    importExport: {
      format: 'json',
      versioning: true,
      gitIntegration: false
    },
    practical: {
      complexity: 'medium',
      learningCurve: 'medium',
      costLevel: 'freemium',
      bestFor: ['Microsoft ecosystem', 'enterprise', 'Office 365', 'Azure integration'],
      limitations: ['Microsoft-centric', 'steep learning curve']
    }
  },
  
  pipedream: {
    id: 'pipedream',
    name: 'Pipedream',
    category: 'code-first',
    triggers: {
      email: true,
      webhook: true,
      schedule: true,
      manual: true,
      event: true,
      database: true,
      file: true,
      custom: true
    },
    actions: {
      email: true,
      http: true,
      database: true,
      file: true,
      ai: true,
      code: true,
      transformation: true,
      branching: true,
      loops: true,
      errorHandling: true,
      retries: true,
      humanApproval: false,
      webhooks: true,
      storage: true,
      monitoring: true
    },
    ai: {
      native: false,
      openai: false,
      anthropic: false,
      gemini: false,
      custom: true,
      rag: false,
      agents: false
    },
    databases: {
      sql: true,
      nosql: true,
      native: false,
      external: true
    },
    http: {
      rest: true,
      graphql: true,
      soap: false,
      websockets: true,
      authentication: ['api-key', 'oauth', 'basic']
    },
    logic: {
      conditions: true,
      switches: true,
      parallel: true,
      sequential: true,
      merge: true
    },
    errorHandling: {
      tryCatch: true,
      retries: true,
      fallback: true,
      customErrors: true
    },
    scheduling: {
      cron: true,
      interval: true,
      timezone: true
    },
    security: {
      credentialStore: true,
      encryption: true,
      accessControl: true,
      auditLogs: true
    },
    observability: {
      logging: true,
      metrics: true,
      tracing: true,
      alerts: true
    },
    importExport: {
      format: 'json',
      versioning: true,
      gitIntegration: true
    },
    practical: {
      complexity: 'high',
      learningCurve: 'high',
      costLevel: 'freemium',
      bestFor: ['developers', 'complex workflows', 'API-heavy', 'custom code', 'Git workflows'],
      limitations: ['requires coding', 'steeper learning curve']
    }
  },
  
  custom: {
    id: 'custom',
    name: 'Custom Code',
    category: 'code-first',
    triggers: {
      email: true,
      webhook: true,
      schedule: true,
      manual: true,
      event: true,
      database: true,
      file: true,
      custom: true
    },
    actions: {
      email: true,
      http: true,
      database: true,
      file: true,
      ai: true,
      code: true,
      transformation: true,
      branching: true,
      loops: true,
      errorHandling: true,
      retries: true,
      humanApproval: true,
      webhooks: true,
      storage: true,
      monitoring: true
    },
    ai: {
      native: false,
      openai: false,
      anthropic: false,
      gemini: false,
      custom: true,
      rag: true,
      agents: true
    },
    databases: {
      sql: true,
      nosql: true,
      native: true,
      external: true
    },
    http: {
      rest: true,
      graphql: true,
      soap: true,
      websockets: true,
      authentication: ['api-key', 'oauth', 'basic', 'bearer', 'custom']
    },
    logic: {
      conditions: true,
      switches: true,
      parallel: true,
      sequential: true,
      merge: true
    },
    errorHandling: {
      tryCatch: true,
      retries: true,
      fallback: true,
      customErrors: true
    },
    scheduling: {
      cron: true,
      interval: true,
      timezone: true
    },
    security: {
      credentialStore: false,
      encryption: true,
      accessControl: true,
      auditLogs: true
    },
    observability: {
      logging: true,
      metrics: true,
      tracing: true,
      alerts: true
    },
    importExport: {
      format: 'json',
      versioning: true,
      gitIntegration: true
    },
    practical: {
      complexity: 'high',
      learningCurve: 'high',
      costLevel: 'free',
      bestFor: ['maximum flexibility', 'custom requirements', 'existing codebase', 'full control'],
      limitations: ['requires development', 'maintenance overhead', 'no visual editor']
    }
  }
}

/**
 * Select appropriate platform based on requirements
 */
export function selectPlatform(requirements: {
  needsEmail?: boolean
  needsAI?: boolean
  needsDatabase?: boolean
  needsComplexLogic?: boolean
  needsLoops?: boolean
  needsHumanApproval?: boolean
  needsRAG?: boolean
  complexity?: 'simple' | 'moderate' | 'complex'
  userTechnicalLevel?: 'beginner' | 'intermediate' | 'advanced'
  costPreference?: 'free' | 'freemium' | 'paid'
  hostingPreference?: 'cloud' | 'self-hosted' | 'hybrid'
  explicitPlatform?: string
}): { platform: string; reasoning: string } {
  // If user explicitly specified a platform, respect it
  if (requirements.explicitPlatform && PLATFORM_CAPABILITIES[requirements.explicitPlatform]) {
    return {
      platform: requirements.explicitPlatform,
      reasoning: `You specified ${requirements.explicitPlatform}, so I'll use that platform.`
    }
  }
  
  // If user specified a platform we don't know, use custom
  if (requirements.explicitPlatform) {
    return {
      platform: 'custom',
      reasoning: `You specified ${requirements.explicitPlatform}, which I don't have specific templates for. I'll generate a custom implementation that you can adapt.`
    }
  }
  
  // Intelligent selection based on requirements
  const needs = {
    email: requirements.needsEmail,
    ai: requirements.needsAI,
    database: requirements.needsDatabase,
    complexLogic: requirements.needsComplexLogic,
    loops: requirements.needsLoops,
    humanApproval: requirements.needsHumanApproval,
    rag: requirements.needsRAG
  }
  
  const complexity = requirements.complexity || 'moderate'
  const techLevel = requirements.userTechnicalLevel || 'intermediate'
  const cost = requirements.costPreference || 'freemium'
  const hosting = requirements.hostingPreference || 'cloud'
  
  // RAG requirement forces custom or n8n with external KB
  if (needs.rag) {
    if (hosting === 'self-hosted') {
      return {
        platform: 'n8n',
        reasoning: 'For RAG with self-hosting, n8n is the best choice as it supports self-hosting and can integrate with external knowledge bases.'
      }
    }
    return {
      platform: 'custom',
      reasoning: 'For advanced RAG implementations, custom code gives you the most flexibility for knowledge base integration and retrieval strategies.'
    }
  }
  
  // Complex AI automation with loops and branching
  if (needs.ai && needs.complexLogic && needs.loops) {
    if (techLevel === 'beginner') {
      return {
        platform: 'make',
        reasoning: 'For complex AI workflows, Make offers a good balance of visual editing and powerful features, though it has a learning curve.'
      }
    }
    if (hosting === 'self-hosted') {
      return {
        platform: 'n8n',
        reasoning: 'For complex AI workflows with self-hosting, n8n provides the necessary features and can be run on your own infrastructure.'
      }
    }
    return {
      platform: 'n8n',
      reasoning: 'For complex AI workflows with loops and branching, n8n offers the most comprehensive feature set while remaining approachable.'
    }
  }
  
  // Simple email automation
  if (needs.email && complexity === 'simple' && !needs.ai) {
    if (techLevel === 'beginner') {
      return {
        platform: 'zapier',
        reasoning: 'For simple email automation, Zapier is the easiest to use with excellent email integrations and a gentle learning curve.'
      }
    }
    return {
      platform: 'n8n',
      reasoning: 'For email automation, n8n provides excellent email triggers and actions while remaining flexible for future expansion.'
    }
  }
  
  // AI-powered email (auto-responder, support)
  if (needs.email && needs.ai) {
    if (hosting === 'self-hosted') {
      return {
        platform: 'n8n',
        reasoning: 'For AI-powered email with self-hosting, n8n is ideal as it has native AI integrations and can be self-hosted.'
      }
    }
    if (techLevel === 'beginner') {
      return {
        platform: 'zapier',
        reasoning: 'For AI-powered email, Zapier has good OpenAI integration and is beginner-friendly.'
      }
    }
    return {
      platform: 'n8n',
      reasoning: 'For AI-powered email automation, n8n offers the best combination of native AI support, email capabilities, and flexibility.'
    }
  }
  
  // Database-heavy workflows
  if (needs.database && complexity === 'complex') {
    if (hosting === 'self-hosted') {
      return {
        platform: 'n8n',
        reasoning: 'For complex database workflows with self-hosting, n8n provides good database connectivity and can be self-hosted.'
      }
    }
    return {
      platform: 'custom',
      reasoning: 'For complex database workflows, custom code gives you the most control over database operations and performance.'
    }
  }
  
  // Default to n8n for most cases
  return {
    platform: 'n8n',
    reasoning: 'n8n is a versatile workflow automation platform that balances power, flexibility, and ease of use. It has excellent email, AI, and database integrations, and can be self-hosted if needed.'
  }
}
