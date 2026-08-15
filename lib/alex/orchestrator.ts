import { AlexMode } from './types'
import { detectIntent } from './intent-detector'
import { assembleContext } from './context-assembly'
import { AIRequest, AIMessage } from './provider/provider-interface'

export interface OrchestratorRequest {
  content: string
  mode: AlexMode
  conversationHistory: Array<{ role: string; content: string }>
}

export interface OrchestratorResponse {
  systemPrompt: string
  context: string
  detectedIntent?: string
  suggestedMode?: AlexMode
  aiRequest: AIRequest
}

/**
 * ALEX Orchestrator - Central coordination for AI interactions
 * Refactored for provider independence - communicates through AI Engine interface
 */
export class AlexOrchestrator {
  /**
   * Orchestrate an AI request
   */
  static async orchestrate(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const { content, mode, conversationHistory } = request

    // Detect intent if in Auto mode
    let detectedIntent: string | undefined
    let suggestedMode: AlexMode | undefined

    if (mode === 'auto') {
      const intentResult = await detectIntent(content)
      detectedIntent = intentResult.intent
      suggestedMode = intentResult.suggestedMode
    }

    // Assemble context based on mode
    const context = await assembleContext(mode, conversationHistory)

    // Generate system prompt based on mode
    const systemPrompt = this.generateSystemPrompt(mode, detectedIntent)

    // Build AI request for provider-agnostic interface
    const aiRequest: AIRequest = {
      messages: this.buildMessages(content, systemPrompt, conversationHistory),
      stream: true, // Default to streaming
    }

    return {
      systemPrompt,
      context,
      detectedIntent,
      suggestedMode,
      aiRequest,
    }
  }

  /**
   * Build message array for AI request
   */
  private static buildMessages(
    content: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }>
  ): AIMessage[] {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ]

    // Add conversation history (limit to recent messages to manage context window)
    const recentHistory = conversationHistory.slice(-10)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }

    // Add current user message
    messages.push({
      role: 'user',
      content,
    })

    return messages
  }

  /**
   * Generate system prompt based on mode
   */
  private static generateSystemPrompt(mode: AlexMode, detectedIntent?: string): string {
    const basePrompt = `You are ALEX (AutoLearn Intelligence & Execution Agent), an AI assistant for AutoLearn Spot students. You help students learn n8n automation, build AI-powered workflows, and master technical skills.

Your responses should be:
- Clear and educational
- Practical and actionable
- Encouraging and supportive
- Technical when appropriate, but accessible
- Focused on helping students succeed`

    const modePrompts: Record<AlexMode, string> = {
      auto: `${basePrompt}

In Auto mode, you determine the best approach based on the user's request. You can switch between tutoring, development assistance, automation guidance, research, or agent building as needed.

Current detected intent: ${detectedIntent || 'general assistance'}`,

      tutor: `${basePrompt}

In Tutor mode, your primary focus is learning and education. You should:
- Explain concepts step by step
- Provide examples and analogies
- Ask questions to check understanding
- Encourage active learning
- Reference AutoLearn course content when relevant
- Help students understand the "why" behind the "how"`,

      developer: `${basePrompt}

In Developer mode, you provide technical assistance for:
- Code generation and debugging
- API troubleshooting
- Database assistance
- Configuration issues
- Error analysis
- Best practices
- Code review

Focus on practical, working solutions with clear explanations.`,

      automation: `${basePrompt}

In Automation mode, you specialize in:
- n8n workflow design and troubleshooting
- API integrations
- Webhooks
- Automation best practices
- Business process automation
- Data processing workflows

Provide specific, actionable guidance for building automations.`,

      research: `${basePrompt}

In Research mode, you help with:
- Finding and verifying information
- Comparing sources
- Summarizing complex topics
- Identifying current vs outdated information
- Providing citations where possible

Be thorough and cite your sources when available.`,

      agent_builder: `${basePrompt}

In Agent Builder mode, you help users:
- Design AI agents
- Define agent purposes and personalities
- Configure agent capabilities
- Plan agent workflows
- Set up agent knowledge bases
- Design agent interactions

Focus on creating practical, deployable agent configurations.`
    }

    return modePrompts[mode] || modePrompts.auto
  }
}