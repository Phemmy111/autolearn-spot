import { AlexMode, AlexFile } from './types'
import { detectIntent } from './intent-detector'
import { assembleContext, AssemblyResult } from './context-assembly'
import { AIRequest, AIMessage, ImageContent } from './provider/provider-interface'
import { PlatformContext } from './context/context-types'

export interface OrchestratorRequest {
  content: string
  mode: AlexMode
  conversationHistory: Array<{ role: string; content: string }>
  platformContext?: PlatformContext
  userIntent?: string
  attachedFiles?: AlexFile[]
  userId?: string
  conversationId?: string
  enableRetrieval?: boolean
}

export interface OrchestratorResponse {
  systemPrompt: string
  context: string
  detectedIntent?: string
  suggestedMode?: AlexMode
  aiRequest: AIRequest
  imageFiles?: AlexFile[]
}

/**
 * ALEX Orchestrator - Central coordination for AI interactions
 * Refactored for provider independence - communicates through AI Engine interface
 * Phase 2B: Integrated platform context from AutoLearn Spot
 */
export class AlexOrchestrator {
  /**
   * Orchestrate an AI request
   */
  static async orchestrate(request: OrchestratorRequest): Promise<OrchestratorResponse> {
    const { content, mode, conversationHistory, platformContext, userIntent, attachedFiles, userId, conversationId, enableRetrieval } = request

    // Detect intent if in Auto mode
    let detectedIntent: string | undefined
    let suggestedMode: AlexMode | undefined

    if (mode === 'auto') {
      const intentResult = await detectIntent(content)
      detectedIntent = intentResult.intent
      suggestedMode = intentResult.suggestedMode
    }

    // Assemble context with platform context, files, and retrieval if available
    const assemblyResult = await assembleContext(mode, conversationHistory, {
      platformContext,
      userIntent: userIntent || content,
      attachedFiles,
      userId,
      conversationId,
      enableRetrieval,
    })

    const { context, imageFiles } = assemblyResult

    // Generate system prompt based on mode
    const systemPrompt = this.generateSystemPrompt(mode, detectedIntent, platformContext)

    // Build AI request for provider-agnostic interface
    const aiRequest: AIRequest = {
      messages: this.buildMessages(content, systemPrompt, conversationHistory, platformContext, context, imageFiles),
      stream: true, // Default to streaming
    }

    console.log('[DIAGNOSTIC] ORCHESTRATOR OUTPUT', {
      messagesCount: aiRequest.messages.length,
      contextLength: context.length,
      hasFileContext: context.includes('Attached Documents'),
      hasImageFiles: imageFiles.length > 0,
      imageFilesCount: imageFiles.length,
      imageFilenames: imageFiles.map(f => f.original_filename),
      contextPreview: context.substring(0, 300),
      messagesPreview: aiRequest.messages.map(m => ({
        role: m.role,
        contentLength: typeof m.content === 'string' ? m.content.length : 'multimodal',
        contentPreview: typeof m.content === 'string' ? m.content.substring(0, 100) : 'multimodal content'
      }))
    })
    console.log('[Orchestrator] AI Request messages count:', aiRequest.messages.length)
    console.log('[Orchestrator] Context length:', context.length)
    console.log('[Orchestrator] Has file context:', context.includes('Attached Documents'))
    console.log('[Orchestrator] Has image files:', imageFiles.length > 0)

    return {
      systemPrompt,
      context,
      detectedIntent,
      suggestedMode,
      aiRequest,
      imageFiles,
    }
  }

  /**
   * Build message array for AI request
   */
  private static buildMessages(
    content: string,
    systemPrompt: string,
    conversationHistory: Array<{ role: string; content: string }>,
    platformContext?: PlatformContext,
    fileContext?: string,
    imageFiles?: AlexFile[]
  ): AIMessage[] {
    const messages: AIMessage[] = [
      {
        role: 'system',
        content: systemPrompt,
      },
    ]

    // Add platform context as a system message if available
    if (platformContext && Object.keys(platformContext).length > 0) {
      const { formatPlatformContextForPrompt } = require('./context')
      const platformContextStr = formatPlatformContextForPrompt(platformContext)
      if (platformContextStr) {
        messages.push({
          role: 'system',
          content: platformContextStr,
        })
      }
    }

    // Add file context as a system message if available (Phase 3A)
    if (fileContext && fileContext.trim().length > 0) {
      messages.push({
        role: 'system',
        content: fileContext,
      })
    }

    // Add conversation history (limit to recent messages to manage context window)
    const recentHistory = conversationHistory.slice(-10)
    for (const msg of recentHistory) {
      messages.push({
        role: msg.role as 'user' | 'assistant',
        content: msg.content,
      })
    }

    // Add current user message with multimodal content if images are present
    if (imageFiles && imageFiles.length > 0) {
      // Build multimodal content: text + images
      const multimodalContent: Array<{ type: 'text'; text: string } | ImageContent> = [
        { type: 'text', text: content }
      ]

      // Add images to the content
      for (const imageFile of imageFiles) {
        // For now, we'll use a placeholder - the actual image data will be added in the chat route
        // The chat route will replace this with the actual base64 data
        multimodalContent.push({
          type: 'image_url',
          image_url: {
            url: `placeholder://${imageFile.id}`,
            detail: 'auto'
          }
        })
      }

      messages.push({
        role: 'user',
        content: multimodalContent
      })
    } else {
      // Regular text-only message
      messages.push({
        role: 'user',
        content,
      })
    }

    return messages
  }

  /**
   * Generate system prompt based on mode
   */
  private static generateSystemPrompt(mode: AlexMode, detectedIntent?: string, platformContext?: PlatformContext): string {
    const basePrompt = `You are ALEX (AutoLearn Intelligence & Execution Agent), an AI assistant for AutoLearn Spot students. You help students learn n8n automation, build AI-powered workflows, and master technical skills.

Your responses should be:
- Clear and educational
- Practical and actionable
- Encouraging and supportive
- Technical when appropriate, but accessible
- Focused on helping students succeed`

    // Add platform context awareness if platform data is available
    let platformAwareness = ''
    if (platformContext && Object.keys(platformContext).length > 0) {
      platformAwareness = `

IMPORTANT: You have been provided with AutoLearn Spot platform context above.
- Platform context contains authoritative data about the user's actual account, enrollments, progress, scholarships, and certificates.
- Use this information to answer platform-specific questions accurately.
- If the platform context does not contain information needed to answer a platform-specific question, state that the information is not available.
- Do not invent or hallucinate platform-specific facts when the platform context is available.
- Distinguish clearly between authoritative platform facts and general knowledge.
- For questions about progress, enrollment, certificates, or scholarships, rely on the provided platform context.`
    }

    const modePrompts: Record<AlexMode, string> = {
      auto: `${basePrompt}${platformAwareness}

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