/**
 * ALEX Intelligence Analyzer
 * 
 * Enhances artifact generation with expert-level reasoning:
 * - Inspects attachments and reference files
 * - Understands conversation context
 * - Distinguishes known vs unknown vs assumed requirements
 * - Makes intelligent recommendations
 * - Asks only genuine blockers
 */

import { AlexFile } from '../types'

export interface AnalysisResult {
  // What the user wants
  intent: string
  artifactType: string
  
  // What we know
  known: {
    platform?: string
    trigger?: string
    functionality?: string
    integrations?: string
    filename?: string
  }
  
  // What we can reasonably infer
  inferred: {
    platform?: string
    trigger?: string
    integrations?: string
    architecture?: string
  }
  
  // What genuinely blocks implementation
  blockers: string[]
  
  // What are important assumptions (not blockers)
  assumptions: string[]
  
  // Reference file analysis
  referenceFile?: {
    type: string
    architecture: string
    reusablePatterns: string[]
    projectSpecific: string[]
  }
  
  // Recommended defaults
  recommendations: {
    platform?: string
    trigger?: string
    integrations?: string
  }
  
  // Should we proceed or ask questions?
  canProceed: boolean
  
  // If asking, what's the single most important question?
  primaryQuestion?: string
}

export class IntelligenceAnalyzer {
  /**
   * Analyze the request with full context to determine smart next action
   */
  static async analyze(request: {
    content: string
    conversationHistory?: Array<{ role: string; content: string }>
    attachedFiles?: AlexFile[]
    existingSpec?: any
  }): Promise<AnalysisResult> {
    const { content, conversationHistory, attachedFiles, existingSpec } = request
    
    console.log('[Intelligence Analyzer] Analyzing request:', content.substring(0, 100))
    console.log('[Intelligence Analyzer] Attached files:', attachedFiles?.length || 0)
    console.log('[Intelligence Analyzer] Existing spec:', existingSpec ? 'present' : 'none')
    
    const result: AnalysisResult = {
      intent: this.detectIntent(content),
      artifactType: this.detectArtifactType(content),
      known: { ...existingSpec },
      inferred: {},
      blockers: [],
      assumptions: [],
      recommendations: {},
      canProceed: false
    }
    
    console.log('[Intelligence Analyzer] Detected artifact type:', result.artifactType)
    console.log('[Intelligence Analyzer] Detected intent:', result.intent)
    
    // Check for reference file indicators
    const hasReferenceFile = this.detectReferenceFileRequest(content)
    console.log('[Intelligence Analyzer] Has reference file request:', hasReferenceFile)
    
    // Inspect attachments if present
    if (attachedFiles && attachedFiles.length > 0) {
      console.log('[Intelligence Analyzer] Inspecting attachments...')
      const referenceAnalysis = await this.analyzeAttachments(attachedFiles, content)
      if (referenceAnalysis) {
        result.referenceFile = referenceAnalysis
        result.inferred.architecture = referenceAnalysis.architecture
        
        // Extract known info from reference
        if (referenceAnalysis.reusablePatterns.length > 0) {
          result.inferred.trigger = referenceAnalysis.reusablePatterns.find(p => 
            p.toLowerCase().includes('trigger') || p.toLowerCase().includes('webhook') || p.toLowerCase().includes('email')
          )
        }
        console.log('[Intelligence Analyzer] Reference file analyzed:', referenceAnalysis.type)
      }
    }
    
    // Analyze conversation context for continuation
    const isContinuation = this.detectContinuation(content, conversationHistory)
    if (isContinuation && existingSpec) {
      console.log('[Intelligence Analyzer] This is a continuation of existing workflow')
      // Don't reset known requirements
    }
    
    // Extract direct specifications from content
    const directSpecs = this.extractDirectSpecs(content)
    console.log('[Intelligence Analyzer] Direct specs extracted:', Object.keys(directSpecs))
    Object.assign(result.known, directSpecs)
    
    // Make intelligent inferences
    this.makeInferences(result, content)
    console.log('[Intelligence Analyzer] Inferences made:', Object.keys(result.inferred))
    
    // Determine what blocks implementation
    this.identifyBlockers(result, content)
    console.log('[Intelligence Analyzer] Blockers identified:', result.blockers.length, result.blockers)
    
    // Make recommendations for missing but inferable info
    this.makeRecommendations(result)
    console.log('[Intelligence Analyzer] Recommendations made:', Object.keys(result.recommendations))
    
    // Determine if we can proceed
    result.canProceed = result.blockers.length === 0
    console.log('[Intelligence Analyzer] Can proceed:', result.canProceed)
    
    // If we need to ask, identify the primary question
    if (!result.canProceed && result.blockers.length > 0) {
      result.primaryQuestion = this.formulatePrimaryQuestion(result, content)
      console.log('[Intelligence Analyzer] Primary question:', result.primaryQuestion)
    }
    
    console.log('[Intelligence Analyzer] Analysis complete:', {
      canProceed: result.canProceed,
      blockers: result.blockers.length,
      known: Object.keys(result.known).length,
      inferred: Object.keys(result.inferred).length
    })
    
    return result
  }
  
  /**
   * Detect the user's core intent
   */
  private static detectIntent(content: string): string {
    const lower = content.toLowerCase()
    
    if (lower.includes('like this file') || lower.includes('based on this') || lower.includes('use this as reference')) {
      return 'modify_reference'
    }
    
    if (lower.includes('create') || lower.includes('build') || lower.includes('generate')) {
      return 'create_new'
    }
    
    if (lower.includes('modify') || lower.includes('update') || lower.includes('change')) {
      return 'modify_existing'
    }
    
    return 'create_new' // Default
  }
  
  /**
   * Detect the type of artifact requested
   */
  private static detectArtifactType(content: string): string {
    const lower = content.toLowerCase()
    
    // Check for automation/workflow indicators first (higher priority)
    if (lower.includes('workflow') || lower.includes('n8n') || lower.includes('automation') || 
        lower.includes('auto responder') || lower.includes('auto-responder') || lower.includes('auto email')) {
      return 'workflow'
    }
    
    if (lower.includes('chatbot') || lower.includes('bot')) return 'chatbot'
    if (lower.includes('agent') || lower.includes('assistant')) return 'agent'
    if (lower.includes('configuration') || lower.includes('config') || lower.includes('json')) return 'configuration'
    
    return 'workflow' // Default for automation context
  }
  
  /**
   * Detect if user is referring to an attached file as reference
   */
  private static detectReferenceFileRequest(content: string): boolean {
    const patterns = [
      'like this file', 'like this workflow', 'based on this',
      'use this as reference', 'similar to this', 'make it like this',
      'copy this', 'adapt this', 'use this pattern'
    ]
    
    const lower = content.toLowerCase()
    return patterns.some(pattern => lower.includes(pattern))
  }
  
  /**
   * Detect if this is a continuation of a previous artifact discussion
   */
  private static detectContinuation(
    content: string,
    history?: Array<{ role: string; content: string }>
  ): boolean {
    if (!history || history.length < 2) return false
    
    const lower = content.toLowerCase()
    
    // Short, direct answers are continuations
    if (content.length < 100 && 
        (lower.includes('yes') || lower.includes('okay') || lower.includes('go ahead') ||
         lower.includes('proceed') || lower.includes('generate'))) {
      return true
    }
    
    // Providing a specific value (not a full new request)
    if (content.length < 50 && 
        (lower.includes('use') || lower.includes('trigger') || lower.includes('webhook'))) {
      return true
    }
    
    return false
  }
  
  /**
   * Analyze attached files to extract reference information
   */
  private static async analyzeAttachments(
    files: AlexFile[],
    userRequest: string
  ): Promise<AnalysisResult['referenceFile']> {
    for (const file of files) {
      // If it's a JSON file, try to parse it as a workflow
      if (file.mime_type === 'application/json' || file.original_filename?.endsWith('.json')) {
        try {
          const content = file.extracted_text || await this.getFileContent(file)
          if (content) {
            const parsed = JSON.parse(content)
            
            // Check if it looks like an n8n workflow
            if (parsed.nodes && Array.isArray(parsed.nodes)) {
              return this.analyzeN8nWorkflow(parsed, file.original_filename)
            }
          }
        } catch (error) {
          console.error('[Intelligence Analyzer] Failed to parse JSON file:', error)
        }
      }
      
      // TODO: Add analysis for other file types (images, docs, etc.)
    }
    
    return undefined
  }
  
  /**
   * Analyze an n8n workflow JSON to extract architecture
   */
  private static analyzeN8nWorkflow(workflow: any, filename: string): AnalysisResult['referenceFile'] {
    const nodes = workflow.nodes || []
    
    // Identify trigger nodes
    const triggers = nodes.filter((n: any) => 
      n.type?.includes('trigger') || n.type?.includes('webhook') || n.type?.includes('email')
    )
    
    // Identify AI/LLM nodes
    const aiNodes = nodes.filter((n: any) => 
      n.type?.includes('openai') || n.type?.includes('anthropic') || n.type?.includes('ai')
    )
    
    // Identify integration nodes
    const integrationNodes = nodes.filter((n: any) => 
      n.type?.includes('http') || n.type?.includes('sheets') || n.type?.includes('slack')
    )
    
    // Build architecture description
    const architecture = this.describeArchitecture(nodes, workflow.connections)
    
    // Identify reusable patterns
    const reusablePatterns = [
      ...triggers.map((n: any) => `Trigger: ${n.name || n.type}`),
      ...aiNodes.map((n: any) => `AI Processing: ${n.name || n.type}`),
      ...integrationNodes.map((n: any) => `Integration: ${n.name || n.type}`)
    ]
    
    // Identify project-specific elements (credentials, specific IDs)
    const projectSpecific = nodes
      .filter((n: any) => n.parameters?.credentials || n.parameters?.url)
      .map((n: any) => `Configurable: ${n.name}`)
    
    return {
      type: 'n8n_workflow',
      architecture,
      reusablePatterns,
      projectSpecific
    }
  }
  
  /**
   * Describe the architecture of a workflow
   */
  private static describeArchitecture(nodes: any[], connections: any): string {
    if (nodes.length === 0) return 'Empty workflow'
    
    const trigger = nodes.find((n: any) => n.type?.includes('trigger') || n.type?.includes('webhook'))
    const ai = nodes.find((n: any) => n.type?.includes('openai') || n.type?.includes('ai'))
    const output = nodes.find((n: any) => n.type?.includes('send') || n.type?.includes('slack') || n.type?.includes('sheets'))
    
    const parts = []
    if (trigger) parts.push(`${trigger.name || 'Trigger'}`)
    if (ai) parts.push(`→ ${ai.name || 'AI Processing'}`)
    if (output) parts.push(`→ ${output.name || 'Output'}`)
    
    return parts.length > 0 ? parts.join(' ') : 'Custom workflow'
  }
  
  /**
   * Extract direct specifications from user content
   */
  private static extractDirectSpecs(content: string): any {
    const specs: any = {}
    const lower = content.toLowerCase()
    
    // Extract platform
    if (lower.includes('n8n')) specs.platform = 'n8n'
    if (lower.includes('gmail') || lower.includes('email')) specs.integrations = 'Gmail'
    if (lower.includes('slack')) specs.integrations = 'Slack'
    if (lower.includes('whatsapp')) specs.integrations = 'WhatsApp'
    
    // Extract trigger
    if (lower.includes('webhook')) specs.trigger = 'Webhook'
    if (lower.includes('email') && lower.includes('trigger')) specs.trigger = 'Email Trigger'
    if (lower.includes('schedule') || lower.includes('cron')) specs.trigger = 'Schedule'
    
    // Extract functionality
    if (lower.includes('auto responder') || lower.includes('auto-responder')) {
      specs.functionality = 'Auto-responder'
    }
    if (lower.includes('chatbot') || lower.includes('chat bot')) {
      specs.functionality = 'Chatbot'
    }
    
    return specs
  }
  
  /**
   * Make intelligent inferences from context
   */
  private static makeInferences(result: AnalysisResult, content: string): void {
    // If no platform specified but it's a workflow request, infer n8n
    if (!result.known.platform && result.artifactType === 'workflow') {
      result.inferred.platform = 'n8n'
      result.assumptions.push('Using n8n as the workflow platform (industry standard for automation)')
    }
    
    // If it's an email-related request, infer email trigger
    if (content.toLowerCase().includes('email') && !result.known.trigger) {
      result.inferred.trigger = 'Email Trigger (IMAP)'
      result.assumptions.push('Using email trigger since request mentions email')
    }
    
    // If it's a chatbot request, infer webhook trigger
    if (result.artifactType === 'chatbot' && !result.known.trigger) {
      result.inferred.trigger = 'Webhook (POST)'
      result.assumptions.push('Using webhook trigger for real-time chatbot responses')
    }
    
    // If reference file exists, infer its architecture
    if (result.referenceFile && result.referenceFile.architecture) {
      result.inferred.architecture = result.referenceFile.architecture
      result.assumptions.push(`Using architecture from reference: ${result.referenceFile.architecture}`)
    }
  }
  
  /**
   * Identify what genuinely blocks implementation
   */
  private static identifyBlockers(result: AnalysisResult, content: string): void {
    const lower = content.toLowerCase()
    
    // For email auto-responder, the key blockers are: email provider and reply scope
    if (lower.includes('auto responder') || lower.includes('auto-responder') || 
        lower.includes('auto email') || (lower.includes('email') && lower.includes('responder'))) {
      
      // Email provider blocker
      if (!lower.includes('gmail') && !lower.includes('outlook') && !lower.includes('exchange') && 
          !lower.includes('smtp') && !lower.includes('imap')) {
        result.blockers.push('Email provider - Gmail, Outlook, or another IMAP/SMTP provider?')
      }
      
      // Reply scope blocker
      if (!lower.includes('every') && !lower.includes('all') && !lower.includes('filter') && 
          !lower.includes('support') && !lower.includes('customer')) {
        result.blockers.push('Reply scope - should it reply to every email or only support/customer inquiries?')
      }
    }
    
    // For chatbot, the key blocker is: which platform?
    if (result.artifactType === 'chatbot' && !result.known.integrations) {
      result.blockers.push('Chat platform - WhatsApp, Slack, Discord, or website widget?')
    }
    
    // If user says "like this file" but we can't analyze the file, that's a blocker
    if (result.intent === 'modify_reference' && !result.referenceFile) {
      result.blockers.push('Unable to analyze the reference file - please ensure it\'s a valid workflow JSON')
    }
  }
  
  /**
   * Make recommendations for missing but inferable information
   */
  private static makeRecommendations(result: AnalysisResult): void {
    // Recommend n8n as default platform
    if (!result.known.platform && !result.inferred.platform) {
      result.recommendations.platform = 'n8n'
    }
    
    // Recommend webhook as default trigger for web-based workflows
    if (!result.known.trigger && !result.inferred.trigger && result.artifactType === 'chatbot') {
      result.recommendations.trigger = 'Webhook (POST)'
    }
    
    // Recommend OpenAI as default AI provider
    if (!result.known.integrations && result.artifactType === 'chatbot') {
      result.recommendations.integrations = 'OpenAI GPT'
    }
  }
  
  /**
   * Formulate the primary clarifying question if needed
   */
  private static formulatePrimaryQuestion(result: AnalysisResult, content: string): string {
    if (result.blockers.length === 0) return ''
    
    // If we have multiple blockers, combine them intelligently
    if (result.blockers.length > 1) {
      const hasEmailProvider = result.blockers.some(b => b.includes('Email provider'))
      const hasReplyScope = result.blockers.some(b => b.includes('Reply scope'))
      
      if (hasEmailProvider && hasReplyScope) {
        return 'I need to know two things: (1) Which email provider - Gmail, Outlook, or another IMAP/SMTP provider? (2) Should it reply to every email or only support/customer inquiries?'
      }
      
      // Generic combination for other cases
      return `I need to confirm: ${result.blockers.join(', and ')}`
    }
    
    // Single blocker - convert to question
    const blocker = result.blockers[0]
    
    if (blocker.includes('Email provider')) {
      return 'Which email provider should I use - Gmail, Outlook, or another IMAP/SMTP provider?'
    }
    
    if (blocker.includes('Reply scope')) {
      return 'Should the auto-responder reply to every incoming email, or only messages matching support/help/customer-service criteria?'
    }
    
    if (blocker.includes('Chat platform')) {
      return 'Which chat platform should SupportBot use - WhatsApp, Slack, Discord, or a website chat widget?'
    }
    
    return blocker // Return as-is if we can't convert it
  }
  
  /**
   * Get file content (placeholder - implement based on storage)
   */
  private static async getFileContent(file: AlexFile): Promise<string | null> {
    // This would fetch from Supabase Storage or wherever files are stored
    // For now, use extracted_text if available
    return file.extracted_text || null
  }
}
