/**
 * ALEX Requirement Option Generator
 * 
 * Deterministic, field/schema-aware option generation for workflow requirement questions.
 * Primary strategy: deterministic generation based on field type and existing registries.
 * Secondary strategy: safe generic defaults and free-form input.
 * Optional tertiary strategy: AI enhancement for complex/unknown fields (disabled by default).
 */

import { PLATFORM_CAPABILITIES } from './platform-capabilities'
import { AutomationSpec } from './automation-spec'

export interface OptionGenerationRequest {
  field: string
  specification?: Partial<AutomationSpec>
  context?: string
}

export interface OptionGenerationResult {
  options: string[] | null
  inputType: 'select' | 'multi-select' | 'text' | 'email' | 'url' | 'number' | 'time' | 'date' | 'boolean'
  strategy: 'schema-aware' | 'registry-based' | 'type-aware' | 'free-form' | 'ai-enhanced'
  reason?: string
}

export class RequirementOptionGenerator {
  /**
   * Generate options for a requirement field using deterministic strategies
   */
  static generateOptions(request: OptionGenerationRequest): OptionGenerationResult {
    const { field, specification, context } = request
    
    console.log('[Requirement Option Generator] Field:', field)
    console.log('[Requirement Option Generator] Strategy selection started')
    
    // Level 1: Schema-aware deterministic options
    const schemaResult = this.generateSchemaAwareOptions(field, specification)
    if (schemaResult.options !== null) {
      console.log('[Requirement Option Generator] Strategy: schema-aware')
      return schemaResult
    }
    
    // Level 2: Registry-based options
    const registryResult = this.generateRegistryBasedOptions(field)
    if (registryResult.options !== null) {
      console.log('[Requirement Option Generator] Strategy: registry-based')
      return registryResult
    }
    
    // Level 3: Type-aware fallback
    const typeResult = this.generateTypeAwareOptions(field)
    if (typeResult.options !== null) {
      console.log('[Requirement Option Generator] Strategy: type-aware')
      return typeResult
    }
    
    // Level 4: Free-form input (default)
    console.log('[Requirement Option Generator] No deterministic options; using free-form input')
    return {
      options: null,
      inputType: this.determineInputType(field),
      strategy: 'free-form',
      reason: 'Field does not match known patterns - using free-form input'
    }
  }
  
  /**
   * Level 1: Schema-aware deterministic options based on field patterns
   */
  private static generateSchemaAwareOptions(
    field: string,
    specification?: Partial<AutomationSpec>
  ): OptionGenerationResult | null {
    const lowerField = field.toLowerCase()
    
    // Schedule fields
    if (lowerField.startsWith('schedule.frequency')) {
      return {
        options: ['once', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'custom'],
        inputType: 'select',
        strategy: 'schema-aware',
        reason: 'Frequency field - standard scheduling options'
      }
    }
    
    if (lowerField.startsWith('schedule.timezone')) {
      return {
        options: this.getTimezoneOptions(),
        inputType: 'select',
        strategy: 'schema-aware',
        reason: 'Timezone field - common timezone options'
      }
    }
    
    if (lowerField.startsWith('schedule.day')) {
      return {
        options: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        inputType: 'select',
        strategy: 'schema-aware',
        reason: 'Day field - standard weekday options'
      }
    }
    
    // Platform field
    if (lowerField === 'platform') {
      const platformOptions = Object.keys(PLATFORM_CAPABILITIES).map(key => 
        PLATFORM_CAPABILITIES[key].name
      )
      return {
        options: [...platformOptions, 'Recommend for me'],
        inputType: 'select',
        strategy: 'schema-aware',
        reason: 'Platform field - derived from PLATFORM_CAPABILITIES registry'
      }
    }
    
    // Automation type
    if (lowerField === 'automationtype') {
      return {
        options: ['workflow', 'chatbot', 'agent', 'pipeline', 'integration', 'automation'],
        inputType: 'select',
        strategy: 'schema-aware',
        reason: 'Automation type field - standard type options'
      }
    }
    
    // Domain field
    if (lowerField === 'domain') {
      return {
        options: ['email', 'support', 'sales', 'marketing', 'finance', 'operations', 'ai', 'data', 'custom'],
        inputType: 'select',
        strategy: 'schema-aware',
        reason: 'Domain field - standard domain options'
      }
    }
    
    // Trigger type
    if (lowerField.startsWith('trigger.type')) {
      return {
        options: ['email', 'webhook', 'schedule', 'manual', 'event', 'database', 'file', 'custom'],
        inputType: 'select',
        strategy: 'schema-aware',
        reason: 'Trigger type field - standard trigger options'
      }
    }
    
    return null
  }
  
  /**
   * Level 2: Registry-based options from existing application registries
   */
  private static generateRegistryBasedOptions(field: string): OptionGenerationResult | null {
    const lowerField = field.toLowerCase()
    
    // Email provider options - could be enhanced with actual integration registry
    if (lowerField.includes('emailprovider') || lowerField.includes('email.provider')) {
      return {
        options: ['Gmail', 'Outlook', 'IMAP/SMTP', 'SendGrid', 'Mailgun', 'Amazon SES', 'Recommend for me'],
        inputType: 'select',
        strategy: 'registry-based',
        reason: 'Email provider field - common email service options'
      }
    }
    
    // AI provider options
    if (lowerField.includes('aiprovider') || lowerField.includes('ai.provider')) {
      return {
        options: ['OpenAI', 'Anthropic', 'Google Gemini', 'Local LLM', 'Recommend for me'],
        inputType: 'select',
        strategy: 'registry-based',
        reason: 'AI provider field - common AI service options'
      }
    }
    
    // AI model options
    if (lowerField.includes('aimodel') || lowerField.includes('ai.model')) {
      return {
        options: ['GPT-4', 'GPT-3.5 Turbo', 'Claude 3 Opus', 'Claude 3 Sonnet', 'Gemini Pro', 'Recommend for me'],
        inputType: 'select',
        strategy: 'registry-based',
        reason: 'AI model field - common model options'
      }
    }
    
    // Knowledge base options
    if (lowerField.includes('knowledgebase') || lowerField.includes('knowledge.base')) {
      return {
        options: ['None', 'Notion', 'Confluence', 'Google Drive', 'Pinecone', 'Recommend for me'],
        inputType: 'select',
        strategy: 'registry-based',
        reason: 'Knowledge base field - common KB service options'
      }
    }
    
    // Output destination options
    if (lowerField.includes('destination') || lowerField.includes('destinations')) {
      return {
        options: ['Email', 'Slack', 'Telegram', 'WhatsApp', 'Discord', 'Database', 'Webhook', 'Recommend for me'],
        inputType: 'multi-select',
        strategy: 'registry-based',
        reason: 'Destination field - common output channel options'
      }
    }
    
    // Input source options
    if (lowerField.includes('source') || lowerField.includes('sources')) {
      return {
        options: ['Email', 'Web Form', 'Database', 'API', 'File Upload', 'Webhook', 'Recommend for me'],
        inputType: 'multi-select',
        strategy: 'registry-based',
        reason: 'Source field - common input source options'
      }
    }
    
    return null
  }
  
  /**
   * Level 3: Type-aware fallback based on inferred field type
   */
  private static generateTypeAwareOptions(field: string): OptionGenerationResult | null {
    const lowerField = field.toLowerCase()
    
    // Boolean fields
    if (lowerField.includes('enabled') || lowerField.includes('required') || lowerField.includes('active')) {
      return {
        options: ['Yes', 'No'],
        inputType: 'boolean',
        strategy: 'type-aware',
        reason: 'Boolean field - yes/no options'
      }
    }
    
    // Retry strategy
    if (lowerField.includes('retr') && lowerField.includes('strategy')) {
      return {
        options: ['exponential-backoff', 'fixed', 'none'],
        inputType: 'select',
        strategy: 'type-aware',
        reason: 'Retry strategy field - standard retry options'
      }
    }
    
    // Log level
    if (lowerField.includes('loglevel') || lowerField.includes('log.level')) {
      return {
        options: ['error', 'warn', 'info', 'debug'],
        inputType: 'select',
        strategy: 'type-aware',
        reason: 'Log level field - standard logging options'
      }
    }
    
    // Format fields
    if (lowerField.includes('format')) {
      return {
        options: ['JSON', 'XML', 'CSV', 'Text'],
        inputType: 'select',
        strategy: 'type-aware',
        reason: 'Format field - common data format options'
      }
    }
    
    return null
  }
  
  /**
   * Determine appropriate input type for free-form fields
   */
  private static determineInputType(field: string): 'text' | 'email' | 'url' | 'number' | 'time' | 'date' {
    const lowerField = field.toLowerCase()
    
    if (lowerField.includes('email') || lowerField.includes('recipient')) {
      return 'email'
    }
    
    if (lowerField.includes('url') || lowerField.includes('endpoint') || lowerField.includes('webhook')) {
      return 'url'
    }
    
    if (lowerField.includes('time') && !lowerField.includes('timezone')) {
      return 'time'
    }
    
    if (lowerField.includes('date')) {
      return 'date'
    }
    
    if (lowerField.includes('count') || lowerField.includes('number') || lowerField.includes('limit') || lowerField.includes('max')) {
      return 'number'
    }
    
    return 'text'
  }
  
  /**
   * Get timezone options (sensible subset, not exhaustive)
   */
  private static getTimezoneOptions(): string[] {
    return [
      'UTC',
      'America/New_York',
      'America/Los_Angeles',
      'America/Chicago',
      'Europe/London',
      'Europe/Paris',
      'Europe/Berlin',
      'Asia/Tokyo',
      'Asia/Shanghai',
      'Asia/Singapore',
      'Australia/Sydney',
      'Recommend for me'
    ]
  }
}