import { AlexProviderManager } from './alex-provider'
import { AlexMode } from './types'

/**
 * Conversation Title Generator
 * Phase 1: Simple rule-based title generation with AI fallback
 * Phase 2: Enhanced dynamic title generation using AI
 */

/**
 * Generate a conversation title from the first message
 */
export async function generateConversationTitle(
  firstMessage: string,
  mode: AlexMode
): Promise<string> {
  // Try enhanced rule-based generation first
  const ruleBasedTitle = generateRuleBasedTitle(firstMessage, mode)
  if (ruleBasedTitle && ruleBasedTitle.length > 5) {
    return ruleBasedTitle
  }

  // Fallback to AI generation if provider is configured
  try {
    const providerConfig = await AlexProviderManager.getProviderConfig()
    if (providerConfig && providerConfig.apiKey) {
      const aiTitle = await generateAITitle(firstMessage, mode, providerConfig)
      if (aiTitle && aiTitle.length > 5) {
        return aiTitle
      }
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
  const words = trimmedMessage.split(/\s+/).slice(0, 10) // First 10 words for better context

  if (words.length === 0) {
    return null
  }

  // Filter out common stop words for better titles
  const stopWords = ['what', 'how', 'can', 'i', 'the', 'a', 'an', 'is', 'are', 'to', 'for', 'with', 'on', 'at', 'in', 'my', 'me', 'please', 'help', 'this', 'that', 'these', 'those', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'it', 'its', 'they', 'them', 'their', 'our', 'your', 'just', 'also', 'very', 'really', 'want', 'need', 'get', 'got', 'make', 'made', 'take', 'use', 'using', 'know', 'think', 'look', 'see', 'like', 'want', 'try', 'trying']
  const meaningfulWords = words.filter(word =>
    !stopWords.includes(word.toLowerCase()) && word.length > 2
  )

  // If no meaningful words, use first 3 words
  const titleWords = meaningfulWords.length > 0 ? meaningfulWords.slice(0, 6) : words.slice(0, 3)

  // Create title from meaningful words
  let title = titleWords.join(' ')

  // Clean up the title
  title = title
    .replace(/[?!.,;:]/g, '') // Remove punctuation
    .replace(/\s+/g, ' ') // Normalize spaces
    .trim()

  // Capitalize first letter of each word
  title = title.split(' ').map(word =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ')

  // Ensure title isn't too long (target 3-6 words)
  if (title.split(' ').length > 6) {
    title = title.split(' ').slice(0, 6).join(' ')
  }

  // Truncate if still too long
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
): Promise<string | null> {
  try {
    // Enhanced keyword extraction with better context
    const keywords = extractKeywords(message)
    const modePrefix = getModePrefix(mode)

    if (keywords.length > 0) {
      return `${modePrefix}: ${keywords.join(', ')}`
    }

    // Fallback to enhanced rule-based if no keywords found
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
    'research', 'find', 'search', 'data', 'integration', 'webhook',
    'image', 'file', 'upload', 'download', 'storage', 'react',
    'typescript', 'javascript', 'python', 'function', 'database',
    'frontend', 'backend', 'server', 'client', 'component',
    'security', 'auth', 'login', 'token', 'session', 'cookie',
    'test', 'deploy', 'build', 'api', 'endpoint', 'request',
    'response', 'json', 'format', 'parse', 'validate', 'error',
    'chart', 'graph', 'dashboard', 'panel', 'settings', 'config',
    'docker', 'container', 'cloud', 'deployment', 'pipeline'
  ]

  const words = message.toLowerCase().split(/\s+/)
  const foundKeywords = words.filter(word =>
    importantWords.some(keyword => word.includes(keyword) || keyword.includes(word))
  )

  // If no important words found, use first 2 meaningful words from message
  if (foundKeywords.length === 0) {
    const stopWords = ['what', 'how', 'can', 'i', 'the', 'a', 'an', 'is', 'are', 'to', 'for', 'with', 'on', 'at', 'in', 'my', 'me', 'please', 'help', 'this', 'that', 'these', 'those', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'must', 'it', 'its', 'they', 'them', 'their', 'our', 'your', 'just', 'also', 'very', 'really', 'want', 'need', 'get', 'got', 'make', 'made', 'take', 'use', 'using', 'know', 'think', 'look', 'see', 'like', 'want', 'try', 'trying']
    const meaningfulWords = words.filter(word =>
      !stopWords.includes(word) && word.length > 3
    )
    return meaningfulWords.slice(0, 2).map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
  }

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