import { AlexMode } from './types'

export interface IntentDetectionResult {
  intent: string
  suggestedMode: AlexMode
  confidence: number
  isArtifactGeneration?: boolean // Phase 7: Artifact generation intent
}

/**
 * Intent Detection for Auto Mode
 * Phase 1: Basic keyword-based detection
 * Future phases: ML-based detection with more sophisticated analysis
 */
export async function detectIntent(content: string): Promise<IntentDetectionResult> {
  const lowerContent = content.toLowerCase()

  // Phase 7: Check for artifact/build generation intent first (highest priority)
  // Negative patterns - these should NOT trigger artifact generation
  const negativePatterns = [
    'explain json', 'what is json', 'how does json work', 'json meaning',
    'understand json', 'parse json', 'read json', 'json format',
    'json example', 'json syntax', 'what does this json mean',
    'help me understand', 'tell me about', 'describe json'
  ]

  const isNegativeRequest = negativePatterns.some(pattern => lowerContent.includes(pattern))
  if (isNegativeRequest) {
    // Continue to normal intent detection below
  } else {
    // Positive patterns - these SHOULD trigger artifact generation
    const buildPatterns = [
      'build me a', 'create a', 'generate a', 'build an', 'create an', 'generate an',
      'make me a', 'create the', 'generate the', 'build the',
      'create json configuration', 'generate json configuration', 'build json configuration',
      'create workflow', 'generate workflow', 'build workflow',
      'create chatbot', 'generate chatbot', 'build chatbot',
      'create agent', 'generate agent', 'build agent',
      'create website', 'generate website', 'build website',
      'create automation', 'generate automation', 'build automation',
      'create api', 'generate api', 'build api',
      'create script', 'generate script', 'build script',
      'create configuration', 'generate configuration', 'build configuration',
      'create complete', 'generate complete', 'build complete',
      'package for me', 'artifacts for me', 'files for me',
      'downloadable', 'configuration file', 'setup guide',
      'export as json', 'export this', 'generate json file',
      'create json file', 'build json file', 'make json file',
      'email responder', 'auto responder', 'email bot', 'email automation',
      'ai email', 'intelligent email', 'smart email',
      'create simple', 'create basic', 'create advanced',
      'build simple', 'build basic', 'build advanced',
      'generate simple', 'generate basic', 'generate advanced',
      'email notification system', 'notification system', 'alert system'
    ]

    // Check if it's a build request (stronger indication: starts with build/create + specific artifact)
    // More aggressive: if it starts with create/build/generate, always treat as artifact generation
    const startsWithBuildVerb = lowerContent.startsWith('create ') || lowerContent.startsWith('build ') || lowerContent.startsWith('generate ')
    const isBuildRequest = startsWithBuildVerb || buildPatterns.some(pattern => lowerContent.startsWith(pattern) ||
      (lowerContent.includes(pattern) && lowerContent.length < 50))

    console.log('[DEBUG INTENT DETECTOR] Build request check:', {
      isBuildRequest,
      contentStart: lowerContent.substring(0, 50),
      contentLength: lowerContent.length
    })

    // Secondary check: even if not at start, check for strong build indicators
    const strongBuildIndicators = [
      'generate the json', 'create the json', 'build the json',
      'generate the workflow', 'create the workflow', 'build the workflow',
      'generate the chatbot', 'create the chatbot', 'build the chatbot',
      'setup guide', 'configuration file', 'downloadable files',
      'package and deliver', 'zip file', 'source code',
      'import into', 'deploy this', 'use this file',
      'like this file', 'based on this', 'use this as reference',
      'notification system', 'email system', 'alert system',
      'data pipeline', 'scheduled task', 'cron job',
      'api integration', 'webhook receiver', 'form handler'
    ]

    const hasStrongBuildIndicator = strongBuildIndicators.some(indicator => lowerContent.includes(indicator))

    console.log('[DEBUG INTENT DETECTOR] Strong build indicator check:', {
      hasStrongBuildIndicator,
      contentPreview: lowerContent.substring(0, 100)
    })

    if (isBuildRequest || hasStrongBuildIndicator) {
      console.log('[DEBUG INTENT DETECTOR] Artifact generation detected', {
        isBuildRequest,
        hasStrongBuildIndicator,
        contentPreview: lowerContent.substring(0, 50)
      })
      return {
        intent: 'Artifact generation',
        suggestedMode: 'agent_builder',
        confidence: 0.85,
        isArtifactGeneration: true
      }
    }
  }

  // Check for current-time requests (priority over research)
  const currentTimePatterns = [
    'what time is it', 'current time', 'right now time', 'time in', 'what\'s the time'
  ]
  const isCurrentTimeRequest = currentTimePatterns.some(pattern => lowerContent.includes(pattern))

  if (isCurrentTimeRequest) {
    return {
      intent: 'Current time query',
      suggestedMode: 'auto',
      confidence: 0.9
    }
  }

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
      'compare', 'difference between', 'sources', 'verify', 'up to date',
      'search for', 'look into', 'investigate', 'find out about'
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