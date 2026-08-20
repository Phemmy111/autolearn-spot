/**
 * ALEX Phase 4 - Memory Command Detection
 * 
 * Detects and parses explicit memory commands from user messages.
 */

import { MemoryCommand, MemoryType } from '../types'

/**
 * Detect memory command in user message
 */
export function detectMemoryCommand(message: string): MemoryCommand | null {
  const trimmed = message.trim()
  const lower = trimmed.toLowerCase()
  
  // "Remember that X" or "Remember X"
  const rememberMatch = lower.match(/^remember\s+(?:that\s+)?(.+)$/i)
  if (rememberMatch) {
    return {
      type: 'remember',
      content: trimmed,
      extractedMemory: rememberMatch[1].trim()
    }
  }
  
  // "Forget X" or "Forget that X"
  const forgetMatch = lower.match(/^forget\s+(?:that\s+)?(.+)$/i)
  if (forgetMatch) {
    return {
      type: 'forget',
      content: trimmed,
      extractedMemory: forgetMatch[1].trim()
    }
  }
  
  // "What do you remember about me?" or "Show me what you remember"
  if (/^(?:what\s+do\s+you\s+)?remember\s+(?:about\s+me\??)?$/i.test(lower) ||
      /^(?:show\s+me\s+)?what\s+you\s+remember\??$/i.test(lower)) {
    return {
      type: 'list',
      content: trimmed
    }
  }
  
  // "Delete all memories" or "Clear all memories"
  if (/^(?:delete|clear)\s+(?:all\s+)?memories?$/i.test(lower)) {
    return {
      type: 'clear',
      content: trimmed
    }
  }
  
  return null
}

/**
 * Extract memory type from content
 */
export function classifyMemoryFromContent(content: string): MemoryType {
  const lower = content.toLowerCase()
  
  // Preference indicators
  if (lower.includes('prefer') || lower.includes('like') || lower.includes('want') || lower.includes('prefer to')) {
    return 'preference'
  }
  
  // Instruction indicators
  if (lower.includes('always') || lower.includes('never') || lower.includes('should') || lower.includes('must')) {
    return 'instruction'
  }
  
  // Default to fact
  return 'fact'
}

/**
 * Check if content is a sensitive information pattern
 */
export function containsSensitivePattern(content: string): boolean {
  const sensitivePatterns = [
    /password/i,
    /api[_-]?key/i,
    /secret/i,
    /token/i,
    /auth[_-]?token/i,
    /session[_-]?id/i,
    /credit[_-]?card/i,
    /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/, // Credit card format
  ]
  
  for (const pattern of sensitivePatterns) {
    if (pattern.test(content)) {
      return true
    }
  }
  
  return false
}
