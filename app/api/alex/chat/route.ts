import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { AlexMode } from '@/lib/alex/types'
import { AIEngine } from '@/lib/alex/ai-engine'
import { AlexCostTracker } from '@/lib/alex/cost-tracker'
import { handleAlexError, AlexErrors } from '@/lib/alex/error-handler'
import { alexLogger } from '@/lib/alex/logger'
import { providerRegistry } from '@/lib/alex/provider/provider-registry'
import { SelfHostedProvider } from '@/lib/alex/provider/self-hosted-provider'

// Initialize providers from environment configuration
function initializeProviders() {
  // Initialize self-hosted provider if configured (supports Groq and other OpenAI-compatible APIs)
  const selfHostedEndpoint = process.env.ALEX_SELF_HOSTED_ENDPOINT || 'https://api.groq.com/openai/v1'
  const selfHostedModel = process.env.ALEX_SELF_HOSTED_MODEL || 'llama-3.3-70b-versatile'
  const apiKey = process.env.ALEX_SELF_HOSTED_API_KEY

  if (selfHostedEndpoint && selfHostedModel && apiKey) {
    const selfHostedProvider = new SelfHostedProvider({
      id: 'self-hosted-primary',
      name: 'ALEX AI Provider',
      endpoint: selfHostedEndpoint,
      model: selfHostedModel,
      apiKey: apiKey,
      priority: 1,
      enabled: true,
    })
    providerRegistry.registerProvider(selfHostedProvider)
    alexLogger.info('PROVIDER', 'ALEX AI provider initialized', { 
      endpoint: selfHostedEndpoint,
      model: selfHostedModel 
    })
  } else {
    alexLogger.warn('PROVIDER', 'ALEX AI provider not configured - missing environment variables', {
      hasEndpoint: !!selfHostedEndpoint,
      hasModel: !!selfHostedModel,
      hasApiKey: !!apiKey
    })
  }
  
  // Additional providers can be initialized here from environment variables
  // in future phases (OpenRouter, custom endpoints, etc.)
}

// POST /api/alex/chat - Stream chat completion
export async function POST(request: NextRequest) {
  try {
    alexLogger.info('CHAT', 'Starting chat request')

    // Initialize providers
    initializeProviders()

    const authResult = await auth()
    const { userId } = authResult

    // Try to get user data from Clerk
    let userEmail: string | undefined
    let userName: string | undefined

    try {
      const user = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }).then(res => res.json()).catch(() => null)

      if (user) {
        userEmail = user.email_addresses?.[0]?.email_address
        userName = user.first_name && user.last_name
          ? `${user.first_name} ${user.last_name}`
          : user.first_name || user.last_name || user.username || user.email_addresses?.[0]?.email_address?.split('@')[0]
      }
    } catch (error) {
      console.error('[Chat Route] Failed to fetch user from Clerk API:', error)
    }

    console.log('[Chat Route] Clerk auth data:', {
      userId,
      userEmail,
      userName,
    });
    
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
        const baseUrl = request.nextUrl.origin
        await fetch(`${baseUrl}/api/alex/conversations/${conversationId}/title`, {
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

    // Build conversation history for orchestrator
    const conversationHistory = historyMessages?.map(m => ({
      role: m.role,
      content: m.content
    })) || []

    // Check if any provider is available
    const activeProvider = providerRegistry.getActiveProvider()
    if (!activeProvider) {
      alexLogger.warn('CHAT', 'No active provider configured')
      const error = handleAlexError(AlexErrors.PROVIDER_NOT_CONFIGURED)
      return NextResponse.json({ error: error.message }, { status: error.statusCode })
    }

    // Stream response through AI engine
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''
          let tokensUsed = 0
          let modelUsed = activeProvider.name

          // Process through AI engine with platform context
          for await (const chunk of AIEngine.streamChat({
            content,
            mode: mode as AlexMode,
            conversationHistory,
            userId,
            userEmail,
            userName,
          })) {
            if (chunk.type === 'orchestrator') {
              // Send orchestrator metadata
              controller.enqueue(
                encoder.encode(`data: ${JSON.stringify({ 
                  type: 'metadata',
                  data: chunk.data 
                })}\n\n`)
              )
            } else if (chunk.type === 'stream') {
              const event = chunk.data
              
              if (event.type === 'start') {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ type: 'start' })}\n\n`)
                )
              } else if (event.type === 'delta') {
                const text = event.data?.text || ''
                fullContent += text
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: 'delta',
                    content: text 
                  })}\n\n`)
                )
              } else if (event.type === 'usage') {
                // Update usage info from provider
                if (event.data?.usage) {
                  tokensUsed = event.data.usage.totalTokens || 0
                }
              } else if (event.type === 'finish') {
                // Save assistant message
                const { data: assistantMessage, error: assistantMsgError } = await supabase
                  .from('alex_messages')
                  .insert({
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: fullContent,
                    model_used: modelUsed,
                    tokens: tokensUsed,
                  })
                  .select()
                  .single()

                if (assistantMsgError) {
                  console.error('Error saving assistant message:', assistantMsgError)
                }

                // Track usage
                await AlexCostTracker.trackUsage({
                  userId,
                  conversationId,
                  model: modelUsed,
                  tokensUsed,
                  mode: mode as AlexMode,
                })

                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: 'finish',
                    usage: event.data?.usage 
                  })}\n\n`)
                )
                controller.enqueue(encoder.encode('data: [DONE]\n\n'))
                controller.close()
              } else if (event.type === 'error') {
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({ 
                    type: 'error',
                    error: event.data?.error 
                  })}\n\n`)
                )
                controller.close()
              }
            }
          }
        } catch (error) {
          alexLogger.error('CHAT', 'Streaming error', { error })
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ 
              type: 'error',
              error: error instanceof Error ? error.message : 'Unknown error' 
            })}\n\n`)
          )
          controller.close()
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