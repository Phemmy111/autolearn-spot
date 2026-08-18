import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { AlexMode } from '@/lib/alex/types'
import { AIEngine } from '@/lib/alex/ai-engine'
import { AlexCostTracker } from '@/lib/alex/cost-tracker'
import { handleAlexError, AlexErrors } from '@/lib/alex/error-handler'
import { alexLogger } from '@/lib/alex/logger'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error('Missing Supabase environment variables')
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// POST /api/alex/chat - Stream chat completion
export async function POST(request: NextRequest) {
  try {
    alexLogger.info('CHAT', 'Starting chat request')

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
    const { conversationId, content, mode, fileIds } = body

    alexLogger.debug('CHAT', 'Request received', { conversationId, mode, fileIds })

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

    // Save user message with file IDs (Phase 3A)
    console.log('[CHAT] Saving user message with file_ids:', fileIds)
    const { data: userMessage, error: userMsgError } = await supabase
      .from('alex_messages')
      .insert({
        conversation_id: conversationId,
        role: 'user',
        content,
        file_ids: fileIds || [], // Store file IDs with the message
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

    // Get attached files for context (Phase 3A)
    let attachedFiles: any[] = []
    if (fileIds && fileIds.length > 0) {
      console.log('[CHAT] Fetching files with IDs:', fileIds)

      // Fetch files with user ownership check
      const { data: files, error: filesError } = await supabase
        .from('alex_files')
        .select('*')
        .in('id', fileIds)
        .eq('user_id', userId)

      if (filesError) {
        console.error('[CHAT] Error fetching files:', filesError)
        return NextResponse.json({ error: 'Failed to fetch attached files' }, { status: 500 })
      }

      if (!files || files.length === 0) {
        return NextResponse.json({ error: 'Attached files not found or access denied' }, { status: 404 })
      }

      // Validate that all files are ready and have extracted text
      const notReadyFiles = files.filter(f =>
        f.extraction_status !== 'completed' ||
        !f.extracted_text ||
        f.extracted_text.trim().length === 0
      )

      if (notReadyFiles.length > 0) {
        const failedFiles = notReadyFiles.filter(f => f.extraction_status === 'failed')
        const processingFiles = notReadyFiles.filter(f => f.extraction_status !== 'failed')

        if (failedFiles.length > 0) {
          return NextResponse.json({
            error: 'Some attached files failed to process',
            failedFiles: failedFiles.map(f => f.original_filename)
          }, { status: 400 })
        }

        if (processingFiles.length > 0) {
          return NextResponse.json({
            error: 'Some attached files are still processing',
            processingFiles: processingFiles.map(f => f.original_filename)
          }, { status: 400 })
        }
      }

      attachedFiles = files
      console.log('[CHAT] All files validated and ready for context')
      console.log('[CHAT] File details:', attachedFiles.map(f => ({ id: f.id, original_filename: f.original_filename, status: f.status, extraction_status: f.extraction_status, has_text: !!f.extracted_text, text_length: f.extracted_text?.length })))
      alexLogger.debug('CHAT', 'Attached files validated', { fileIds, attachedFiles: attachedFiles.length, files: attachedFiles.map(f => ({ id: f.id, status: f.status, extraction_status: f.extraction_status, has_text: !!f.extracted_text })) })
    }

    // Build conversation history for orchestrator
    const conversationHistory = historyMessages?.map(m => ({
      role: m.role,
      content: m.content
    })) || []

    // Stream response through AI engine
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          let fullContent = ''
          let tokensUsed = 0
          let modelUsed = 'unknown'

          // Process through AI engine with platform context
          for await (const chunk of AIEngine.streamChat({
            content,
            mode: mode as AlexMode,
            conversationHistory,
            userId,
            userEmail,
            userName,
            attachedFiles: attachedFiles || [],
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
                const text = event.data?.content || event.data?.text || ''
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