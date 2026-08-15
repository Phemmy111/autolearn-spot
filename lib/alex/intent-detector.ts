import { AlexMode } from './types'

export interface IntentDetectionResult {
  intent: string
  suggestedMode: AlexMode
  confidence: number
}

/**
 * Intent Detection for Auto Mode
 * Phase 1: Basic keyword-based detection
 * Future phases: ML-based detection with more sophisticated analysis
 */
export async function detectIntent(content: string): Promise<IntentDetectionResult> {
  const lowerContent = content.toLowerCase()

  // Basic keyword patterns for mode detection
  const patterns: Record<AlexMode, string[]> = {
    auto: [],
    tutor: [
      'explain', 'teach', 'learn', 'understand', 'what is', 'how does', 'help me understand',
      'concept', 'theory', 'principle', 'example', 'analogy', 'study', 'lesson'
    ],
    developer: [
      'code', 'debug', 'error', 'bug', 'api', 'database', 'sql', 'function', 'class',
      'programming', 'develop', 'implement', 'syntax', 'compile', 'runtime', 'stack trace'
    ],
    automation: [
      'workflow', 'n8n', 'automation', 'webhook', 'integration', 'automate', 'workflow',
      'trigger', 'node', 'connection', 'webhook', 'api integration', 'business process'
    ],
    research: [
      'find', 'search', 'research', 'look up', 'information about', 'what is the latest',
      'compare', 'difference between', 'sources', 'verify', 'current', 'up to date'
    ],
    agent_builder: [
      'agent', 'bot', 'assistant', 'ai agent', 'create agent', 'build agent',
      'agent personality', 'agent capabilities', 'deploy agent', 'agent configuration'
    ]
  }

  // Score each mode based on keyword matches
  const scores: Record<AlexMode, number> = {
    auto: 0,
    tutor: 0,
    developer: 0,
    automation: 0,
    research: 0,
    agent_builder: 0
  }

  for (const [mode, keywords] of Object.entries(patterns)) {
    for (const keyword of keywords) {
      if (lowerContent.includes(keyword)) {
        scores[mode as AlexMode] += 1
      }
    }
  }

  // Find the mode with the highest score
  let bestMode: AlexMode = 'auto'
  let bestScore = 0

  for (const [mode, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score
      bestMode = mode as AlexMode
    }
  }

  // Calculate confidence based on score difference
  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0)
  const confidence = totalScore > 0 ? bestScore / totalScore : 0

  // Generate intent description
  const intentDescriptions: Record<AlexMode, string> = {
    auto: 'General assistance',
    tutor: 'Learning and explanation',
    developer: 'Technical development',
    automation: 'Workflow automation',
    research: 'Information research',
    agent_builder: 'AI agent creation'
  }

  return {
    intent: intentDescriptions[bestMode],
    suggestedMode: bestMode,
    confidence
  }
}