import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { AlexMode } from '@/lib/alex/types'
import { AlexOrchestrator } from '@/lib/alex/orchestrator'
import { AlexCostTracker } from '@/lib/alex/cost-tracker'
import { handleAlexError, AlexErrors } from '@/lib/alex/error-handler'
import { alexLogger } from '@/lib/alex/logger'

// POST /api/alex/chat - Stream chat completion
export async function POST(request: NextRequest) {
  try {
    alexLogger.info('CHAT', 'Starting chat request')

    const { userId } = await auth()
    if (!userId) {
      alexLogger.warn('CHAT', 'Unauthorized access attempt')
      const error = handleAlexError(AlexErrors.UNAUTHORIZED)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    // Check usage limits
    const limitCheck = await AlexCostTracker.checkLimits(userId)
    if (!limitCheck.allowed) {
      alexLogger.warn('CHAT', 'Rate limit exceeded', { userId })
      const error = handleAlexError(AlexErrors.RATE_LIMITED)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    const body = await request.json()
    const { conversationId, content, mode } = body

    alexLogger.debug('CHAT', 'Request received', { conversationId, mode })

    if (!conversationId || !content || !mode) {
      alexLogger.warn('CHAT', 'Missing required fields', { body })
      const error = handleAlexError(AlexErrors.INVALID_REQUEST)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('alex_conversations')
      .select('*')
      .eq('id', conversationId)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      alexLogger.warn('CHAT', 'Conversation not found', { conversationId, userId })
      const error = handleAlexError(AlexErrors.CONVERSATION_NOT_FOUND)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    // Save user message
    const { data: userMessage, error: userMsgError } = await supabase
      .from('alex_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content,
      })
      .select()
      .single()

    // Generate title if conversation has default title
    const isDefaultTitle = conversation.title.startsWith('New') || 
                           conversation.title.startsWith('Learning') || 
                           conversation.title.startsWith('Development') || 
                           conversation.title.startsWith('Automation') ||
                           conversation.title.startsWith('Research') || 
                           conversation.title.startsWith('Agent')
    
    if (isDefaultTitle) {
      try {
        await fetch(`/api/alex/conversations/${conversationId}/title`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ firstMessage: content, mode }),
        })
      } catch (error) {
        console.error('Failed to generate conversation title:', error)
        // Don't fail the whole request if title generation fails
      }
    }

    if (userMsgError) {
      alexLogger.error('CHAT', 'Failed to save user message', { error: userMsgError, userId })
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Update conversation timestamp
    await supabase
      .from('alex_conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Get conversation history for context
    const { data: historyMessages } = await supabase
      .from('alex_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Orchestrate the request
    const orchestratorResult = await AlexOrchestrator.orchestrate({
      content,
      mode: mode as AlexMode,
      conversationHistory: historyMessages?.map(m => ({
        role: m.role,
        content: m.content
      })) || []
    })

    // Generate AI response (placeholder for now - will integrate with provider system)
    const aiResponse = await generateAIResponse(content, mode as AlexMode, orchestratorResult)

    // Save assistant message
    const { data: assistantMessage, error: assistantMsgError } = await supabase
      .from('alex_messages')
      .insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: aiResponse.content,
        model_used: aiResponse.model,
        tokens: aiResponse.tokens,
      })
      .select()
      .single()

    if (assistantMsgError) {
      console.error('Error saving assistant message:', assistantMsgError)
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Track usage
    await AlexCostTracker.trackUsage({
      userId,
      conversationId,
      model: aiResponse.model,
      tokensUsed: aiResponse.tokens,
      mode: mode as AlexMode,
    })

    alexLogger.info('CHAT', 'Chat request completed', { 
      conversationId, 
      model: aiResponse.model, 
      tokens: aiResponse.tokens 
    })

    // Return streaming response
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          // Stream the full response at once for now (will be true streaming with provider)
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ content: aiResponse.content })}\n\n`)
          )
          controller.enqueue(encoder.encode('data: [DONE]\n\n'))
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new NextResponse(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  } catch (error) {
    alexLogger.error('CHAT', 'Chat request failed', { error })
    const handled = handleAlexError(error)
    return NextResponse.json({ error: handled.message }, { status: handled.statusCode })
  }
}

// Placeholder AI response generator (will be replaced with actual provider integration)
async function generateAIResponse(content: string, mode: AlexMode, orchestratorResult?: any) {
  // This is a placeholder - will integrate with ALEX provider system
  const modeDescriptions: Record<AlexMode, string> = {
    auto: orchestratorResult?.detectedIntent 
      ? `I detected you need help with: ${orchestratorResult.detectedIntent}. I'm using ${orchestratorResult.suggestedMode} mode to assist you.`
      : `I understand you're asking about: "${content}". As ALEX in Auto mode, I'm determining the best approach to help you.`,
    tutor: `As your tutor, I'll help you understand: "${content}". Let me break this down step by step...`,
    developer: `From a development perspective, regarding "${content}": I can help with code, debugging, and technical solutions.`,
    automation: `For automation workflow assistance with "${content}": I can help you design n8n workflows and automation solutions.`,
    research: `Researching "${content}" for you: I can help find and verify information (web search coming in Phase 3).`,
    agent_builder: `To build an AI agent for "${content}": I can help you design agent configurations and capabilities (agent deployment coming in Phase 5).`,
  }

  const baseResponse = modeDescriptions[mode] || modeDescriptions.auto
  
  // Add orchestrator context if available
  let enhancedResponse = baseResponse
  if (orchestratorResult?.systemPrompt) {
    enhancedResponse += `\n\n[System context: ${orchestratorResult.detectedIntent || 'general'} mode activated]`
  }

  return {
    content: enhancedResponse + `\n\n*This is a placeholder response. The actual AI integration will be implemented once the ALEX provider system is configured with a valid API key.*`,
    model: 'placeholder-model',
    tokens: 150,
    estimatedCost: 0.0015,
  }
}