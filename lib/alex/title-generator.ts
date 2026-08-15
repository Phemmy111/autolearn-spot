import { AlexProviderManager } from './alex-provider'
import { AlexMode } from './types'

/**
 * Conversation Title Generator
 * Phase 1: Simple rule-based title generation with AI fallback
 * Future phases: More sophisticated AI-powered title generation
 */

/**
 * Generate a conversation title from the first message
 */
export async function generateConversationTitle(
  firstMessage: string,
  mode: AlexMode
): Promise<string> {
  // Try simple rule-based generation first
  const ruleBasedTitle = generateRuleBasedTitle(firstMessage, mode)
  if (ruleBasedTitle) {
    return ruleBasedTitle
  }

  // Fallback to AI generation if provider is configured
  try {
    const providerConfig = await AlexProviderManager.getProviderConfig()
    if (providerConfig && providerConfig.apiKey) {
      return await generateAITitle(firstMessage, mode, providerConfig)
    }
  } catch (error) {
    console.error('AI title generation failed, using fallback:', error)
  }

  // Final fallback
  return getDefaultTitle(mode)
}

/**
 * Rule-based title generation
 */
function generateRuleBasedTitle(message: string, mode: AlexMode): string | null {
  const trimmedMessage = message.trim()
  const words = trimmedMessage.split(/\s+/).slice(0, 5) // First 5 words
  
  if (words.length === 0) {
    return null
  }

  // Create title from first few words
  let title = words.join(' ')
  
  // Clean up the title
  title = title
    .replace(/[?!.,;:]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()

  // Capitalize first letter
  title = title.charAt(0).toUpperCase() + title.slice(1)

  // Add ellipsis if truncated
  if (trimmedMessage.split(/\s+/).length > 5) {
    title += '...'
  }

  // Ensure title isn't too long
  if (title.length > 50) {
    title = title.substring(0, 47) + '...'
  }

  return title || null
}

/**
 * AI-powered title generation (when provider is available)
 */
async function generateAITitle(
  message: string,
  mode: AlexMode,
  providerConfig: any
): Promise<string> {
  try {
    // This would make an actual API call to the AI provider
    // For now, we'll use a more sophisticated rule-based approach
    // since actual AI integration requires the provider to be fully configured
    
    const keywords = extractKeywords(message)
    const modePrefix = getModePrefix(mode)
    
    if (keywords.length > 0) {
      return `${modePrefix}: ${keywords.join(', ')}`
    }
    
    return null
  } catch (error) {
    console.error('AI title generation error:', error)
    return null
  }
}

/**
 * Extract keywords from message
 */
function extractKeywords(message: string): string[] {
  const importantWords = [
    'workflow', 'automation', 'n8n', 'api', 'code', 'debug', 'error',
    'learn', 'explain', 'help', 'create', 'build', 'design', 'agent',
    'research', 'find', 'search', 'data', 'integration', 'webhook'
  ]
  
  const words = message.toLowerCase().split(/\s+/)
  const foundKeywords = words.filter(word => 
    importantWords.some(keyword => word.includes(keyword))
  )
  
  // Return unique keywords, max 3
  return [...new Set(foundKeywords)].slice(0, 3)
}

/**
 * Get mode prefix for titles
 */
function getModePrefix(mode: AlexMode): string {
  const prefixes: Record<AlexMode, string> = {
    auto: 'Auto',
    tutor: 'Learning',
    developer: 'Dev',
    automation: 'Automation',
    research: 'Research',
    agent_builder: 'Agent'
  }
  
  return prefixes[mode] || 'ALEX'
}

/**
 * Get default title based on mode
 */
function getDefaultTitle(mode: AlexMode): string {
  const defaults: Record<AlexMode, string> = {
    auto: 'New Conversation',
    tutor: 'Learning Session',
    developer: 'Development Help',
    automation: 'Automation Project',
    research: 'Research Query',
    agent_builder: 'Agent Design'
  }
  
  return defaults[mode] || 'New Conversation'
}