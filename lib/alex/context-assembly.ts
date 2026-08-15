import { AlexMode } from './types'
import { PlatformContext } from './context/context-types'
import { formatPlatformContextForPrompt } from './context'

export interface ConversationMessage {
  role: string
  content: string
}

export interface AssemblyOptions {
  platformContext?: PlatformContext
  userIntent?: string
}

/**
 * Context Assembly for different ALEX modes
 * Phase 2B: Integrated platform context from AutoLearn Spot
 */
export async function assembleContext(
  mode: AlexMode,
  conversationHistory: ConversationMessage[],
  options?: AssemblyOptions
): Promise<string> {
  let context = ''

  // Add platform context if available
  if (options?.platformContext) {
    const platformContextStr = formatPlatformContextForPrompt(options.platformContext)
    if (platformContextStr) {
      context += platformContextStr + '\n'
    }
  }

  // Build context from conversation history
  context += 'Conversation History:\n'
  
  if (conversationHistory.length === 0) {
    context += 'This is the beginning of the conversation.\n'
  } else {
    // Include recent messages for context (last 10 messages)
    const recentMessages = conversationHistory.slice(-10)
    
    for (const msg of recentMessages) {
      const role = msg.role === 'user' ? 'User' : 'ALEX'
      context += `${role}: ${msg.content}\n`
    }
  }

  // Add mode-specific context
  const modeContext = getModeContext(mode)
  if (modeContext) {
    context += `\n${modeContext}\n`
  }

  return context
}

/**
 * Get mode-specific context information
 */
function getModeContext(mode: AlexMode): string {
  const contexts: Record<AlexMode, string> = {
    auto: '',
    tutor: 'Tutor Mode: Focus on educational explanations and learning support.',
    developer: 'Developer Mode: Focus on technical assistance and code solutions.',
    automation: 'Automation Mode: Focus on n8n workflows and automation guidance.',
    research: 'Research Mode: Focus on information gathering and verification.',
    agent_builder: 'Agent Builder Mode: Focus on AI agent design and configuration.'
  }

  return contexts[mode] || ''
}