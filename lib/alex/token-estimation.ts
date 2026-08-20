/**
 * Token Estimation for ALEX Context Assembly
 * 
 * Provides token counting and budget management for model context limits.
 * Uses character-based estimation when actual tokenization is not available.
 */

/**
 * Estimate token count from text
 * Uses a conservative estimate: ~4 characters per token for English text
 * This is an approximation - actual tokenization depends on the specific model
 */
export function estimateTokens(text: string): number {
  if (!text) return 0
  
  // Remove extra whitespace for more accurate estimation
  const normalizedText = text.replace(/\s+/g, ' ').trim()
  
  // Conservative estimate: ~4 characters per token
  // This is generally safe for most text and models
  return Math.ceil(normalizedText.length / 4)
}

/**
 * Estimate tokens for a message array (for conversation history)
 */
export function estimateMessageTokens(messages: Array<{role: string, content: string}>): number {
  let totalTokens = 0
  
  for (const message of messages) {
    // Add tokens for role metadata
    totalTokens += estimateTokens(message.role)
    // Add tokens for content
    totalTokens += estimateTokens(message.content)
    // Add tokens for message structure overhead
    totalTokens += 4 // Small overhead per message
  }
  
  return totalTokens
}

/**
 * Token budget for context assembly
 */
export interface TokenBudget {
  modelContextLimit: number
  reservedOutputTokens: number
  inputBudget: number
  systemPromptTokens: number
  platformContextTokens: number
  conversationHistoryTokens: number
  fileContextTokens: number
  safetyMargin: number
}

/**
 * Calculate token budget based on model and content
 */
export function calculateTokenBudget(
  modelContextLimit: number,
  systemPromptTokens: number,
  platformContextTokens: number,
  conversationHistoryTokens: number,
  reservedOutputTokens: number = 2000, // Reserve space for model response
  safetyMargin: number = 0.8 // Use 80% of context limit for safety
): TokenBudget {
  const effectiveContextLimit = Math.floor(modelContextLimit * safetyMargin)
  const inputBudget = effectiveContextLimit - reservedOutputTokens
  
  const usedTokens = systemPromptTokens + platformContextTokens + conversationHistoryTokens
  const fileContextTokens = Math.max(0, inputBudget - usedTokens)
  
  return {
    modelContextLimit,
    reservedOutputTokens,
    inputBudget,
    systemPromptTokens,
    platformContextTokens,
    conversationHistoryTokens,
    fileContextTokens,
    safetyMargin
  }
}

/**
 * Get model context limit from model name
 * Returns safe defaults for known models
 */
export function getModelContextLimit(modelName: string): number {
  const modelLimits: Record<string, number> = {
    // OpenAI models
    'gpt-4': 8192,
    'gpt-4-turbo': 128000,
    'gpt-4o': 128000,
    'gpt-3.5-turbo': 16385,
    
    // Groq models
    'openai/gpt-oss-120b': 8192, // Based on error message
    'meta-llama/llama-prompt-guard-2-22m': 8192,
    'openai/gpt-oss-safeguard-20b': 8192,
    
    // OpenRouter models (conservative defaults)
    'openrouter/free': 8192,
    'openrouter/': 8192,
    
    // Gemini models
    'gemini-pro': 32768,
    'gemini-1.5-pro': 128000,
    
    // Default safe limit
    'default': 8192
  }
  
  // Check for exact match first
  if (modelLimits[modelName]) {
    return modelLimits[modelName]
  }
  
  // Check for prefix match
  for (const [prefix, limit] of Object.entries(modelLimits)) {
    if (prefix !== 'default' && modelName.startsWith(prefix)) {
      return limit
    }
  }
  
  // Return default if no match
  return modelLimits.default
}

/**
 * Context assembly diagnostics
 */
export interface ContextDiagnostics {
  modelContextLimit: number
  reservedOutputTokens: number
  inputBudget: number
  estimatedTokensBeforeCompression: number
  estimatedTokensAfterCompression: number
  chunksRetrievedPerFile: Map<string, number>
  filesRepresentedInContext: number
  totalFilesAttached: number
  systemPromptTokens: number
  platformContextTokens: number
  conversationHistoryTokens: number
  fileContextTokens: number
  compressionRatio: number
}

/**
 * Calculate compression ratio
 */
export function calculateCompressionRatio(before: number, after: number): number {
  if (before === 0) return 0
  return after / before
}