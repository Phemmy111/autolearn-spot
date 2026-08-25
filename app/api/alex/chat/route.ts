import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { auth } from '@clerk/nextjs/server'
import { AlexMode } from '@/lib/alex/types'
import { AIEngine } from '@/lib/alex/ai-engine'
import { AlexCostTracker } from '@/lib/alex/cost-tracker'
import { handleAlexError, AlexErrors } from '@/lib/alex/error-handler'
import { alexLogger } from '@/lib/alex/logger'
import { detectMemoryCommand, memoryService } from '@/lib/alex/memory'

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
    const { conversationId, content, mode, fileIds, enableAgent } = body

    console.log('[DIAGNOSTIC] CHAT REQUEST START', {
      conversationId,
      mode,
      fileIdsPresent: !!fileIds,
      fileIdsCount: fileIds?.length || 0,
      fileIds: fileIds || [],
      contentPreview: content.substring(0, 100)
    })

    alexLogger.debug('CHAT', 'Request received', { conversationId, mode, fileIds })

    // Resolve effective file IDs: current message + conversation files
    const currentMessageFileIds = fileIds || []
    let persistedConversationFileIds: string[] = []
    let effectiveFileIds: string[] = []

    try {
      // Fetch all files associated with this conversation
      const { data: conversationFiles, error: convFilesError } = await supabase
        .from('alex_files')
        .select('id')
        .eq('conversation_id', conversationId)
        .eq('user_id', userId)

      if (!convFilesError && conversationFiles) {
        persistedConversationFileIds = conversationFiles.map(f => f.id)
      }

      // If current message has file IDs, use only those (new files for this message)
      // Otherwise, use persisted conversation files (continuing from previous messages)
      if (currentMessageFileIds.length > 0) {
        effectiveFileIds = currentMessageFileIds
      } else {
        effectiveFileIds = persistedConversationFileIds
      }

      console.log('[FILE RESOLUTION DIAGNOSTICS]', {
        currentMessageFileIds,
        currentMessageFileCount: currentMessageFileIds.length,
        persistedConversationFileIds,
        persistedFileCount: persistedConversationFileIds.length,
        effectiveFileIds,
        using: currentMessageFileIds.length > 0 ? 'current message files' : 'persisted conversation files',
        effectiveFileCount: effectiveFileIds.length
      })
    } catch (error) {
      console.error('[FILE RESOLUTION ERROR]', error)
      // Fall back to current message file IDs only on error
      effectiveFileIds = currentMessageFileIds
    }

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
    console.log('[P1 MESSAGE] Persisting natural user message', {
      conversationId,
      userId,
      contentLength: content.length,
      contentPreview: content.substring(0, 100),
      syntheticField: 'none', // P1: No field dependency
      syntheticValue: 'none' // P1: No value dependency
    })

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

    console.log('[P1 MESSAGE] Message persistence result', {
      insertSuccess: !userMsgError,
      insertError: userMsgError?.message,
      messageId: userMessage?.id,
      persistedFileIds: userMessage?.file_ids,
      persistedFileIdsCount: userMessage?.file_ids?.length || 0
    })

    if (userMsgError) {
      alexLogger.error('CHAT', 'Failed to save user message', { error: userMsgError, userId })
      return NextResponse.json({ error: 'Failed to save message' }, { status: 500 })
    }

    // Generate title if conversation has default title
    console.log('[DIAGNOSTIC] STARTING TITLE GENERATION LOGIC', {
      conversationId,
      conversationTitle: conversation.title
    })

    const isDefaultTitle = conversation.title.startsWith('New') ||
                           conversation.title.startsWith('Learning') ||
                           conversation.title.startsWith('Development') ||
                           conversation.title.startsWith('Automation') ||
                           conversation.title.startsWith('Research') ||
                           conversation.title.startsWith('Agent')

    console.log('[DIAGNOSTIC] TITLE GENERATION CHECK', {
      conversationId,
      currentTitle: conversation.title,
      isDefaultTitle,
      firstMessage: content,
      mode
    })

    if (isDefaultTitle) {
      try {
        // Import and call title generation directly to avoid authentication issues
        const { generateConversationTitle } = await import('@/lib/alex/title-generator')
        const newTitle = await generateConversationTitle(content, mode)

        console.log('[DIAGNOSTIC] TITLE GENERATED', {
          newTitle,
          oldTitle: conversation.title
        })

        // Update conversation title directly
        const { data: updatedConversation, error: updateError } = await supabase
          .from('alex_conversations')
          .update({ title: newTitle })
          .eq('id', conversationId)
          .select()
          .single()

        if (updateError) {
          console.error('Failed to update conversation title:', updateError)
        } else {
          console.log('[DIAGNOSTIC] TITLE UPDATED SUCCESSFULLY', {
            conversationId,
            newTitle: updatedConversation.title
          })
        }
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

    // Phase 4: Handle memory commands
    const memoryCommand = detectMemoryCommand(content)
    if (memoryCommand) {
      console.log('[Memory Command] Detected:', memoryCommand.type, memoryCommand.content.substring(0, 100))
      
      try {
        if (memoryCommand.type === 'remember' && memoryCommand.extractedMemory) {
          await memoryService.createMemory(userId, {
            content: memoryCommand.extractedMemory,
            source: 'explicit',
            source_conversation_id: conversationId
          })
          console.log('[Memory Command] Memory created successfully')
        } else if (memoryCommand.type === 'forget' && memoryCommand.extractedMemory) {
          // Search for matching memories
          const matchingMemories = await memoryService.searchMemories(userId, memoryCommand.extractedMemory, { limit: 10 })
          
          // Delete all matching memories
          for (const memory of matchingMemories) {
            await memoryService.deleteMemory(memory.id, userId)
          }
          
          console.log('[Memory Command] Deleted memories:', matchingMemories.length)
        } else if (memoryCommand.type === 'clear') {
          const deletedCount = await memoryService.deleteAllMemories(userId)
          console.log('[Memory Command] Cleared all memories:', deletedCount)
        }
        // For 'list' command, we'll let the normal chat flow handle it
        // The memory context will be injected automatically
      } catch (error) {
        console.error('[Memory Command] Failed:', error)
        // Don't fail the chat if memory command fails
      }
    }

    // Get conversation history for context
    const { data: historyMessages } = await supabase
      .from('alex_messages')
      .select('role, content')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(20)

    // Get attached files for context (Phase 3A + conversation-level persistence)
    let attachedFiles: any[] = []
    if (effectiveFileIds.length > 0) {
      console.log('[MULTI-FILE] Chat request with file attachments', {
        fileIdsReceived: effectiveFileIds.length,
        fileIds: effectiveFileIds,
        userId,
        conversationId,
        source: 'conversation-level persistence'
      })

      // Fetch files with user ownership check using effective file IDs
      const { data: files, error: filesError } = await supabase
        .from('alex_files')
        .select('*')
        .in('id', effectiveFileIds)
        .eq('user_id', userId)

      console.log('[MULTI-FILE] Database fetch result', {
        fileIdsRequested: effectiveFileIds.length,
        filesFound: files?.length || 0,
        fetchSuccess: !filesError,
        fetchError: filesError?.message,
        filesReturned: files?.map(f => ({
          id: f.id,
          filename: f.original_filename,
          mime_type: f.mime_type,
          extraction_status: f.extraction_status,
          status: f.status
        }))
      })

      if (filesError) {
        console.error('[MULTI-FILE] Error fetching files:', filesError)
        return NextResponse.json({ error: 'Failed to fetch attached files' }, { status: 500 })
      }

      if (!files || files.length === 0) {
        console.log('[MULTI-FILE] No files found in database')
        return NextResponse.json({ error: 'Attached files not found or access denied' }, { status: 404 })
      }

      // Validate that all files are ready and have extracted text (for text files)
      // Images are ready immediately and don't need text extraction
      const notReadyFiles = files.filter(f =>
        !f.mime_type.startsWith('image/') && (
          f.extraction_status !== 'completed' ||
          !f.extracted_text ||
          f.extracted_text.trim().length === 0
        )
      )

      console.log('[MULTI-FILE] File validation', {
        totalFiles: files.length,
        notReadyFiles: notReadyFiles.length,
        imageFiles: files.filter(f => f.mime_type.startsWith('image/')).length,
        textFiles: files.filter(f => !f.mime_type.startsWith('image/')).length,
        validationDetails: files.map(f => ({
          id: f.id,
          filename: f.original_filename,
          mime_type: f.mime_type,
          extraction_status: f.extraction_status,
          has_text: !!f.extracted_text,
          text_length: f.extracted_text?.length,
          ready: f.mime_type.startsWith('image/') || (f.extraction_status === 'completed' && f.extracted_text && f.extracted_text.trim().length > 0)
        }))
      })

      if (notReadyFiles.length > 0) {
        const failedFiles = notReadyFiles.filter(f => f.extraction_status === 'failed')
        const processingFiles = notReadyFiles.filter(f => f.extraction_status !== 'failed')

        console.log('[MULTI-FILE] Files not ready', {
          failed: failedFiles.map(f => f.original_filename),
          processing: processingFiles.map(f => f.original_filename)
        })

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
      console.log('[MULTI-FILE] All files validated and ready for context', {
        attachedFilesCount: attachedFiles.length,
        fileIds: attachedFiles.map(f => f.id),
        filenames: attachedFiles.map(f => f.original_filename),
        totalTextLength: attachedFiles.reduce((sum, f) => sum + (f.extracted_text?.length || 0), 0),
        availableFileCount: attachedFiles.length,
        unavailableFileCount: effectiveFileIds.length - attachedFiles.length
      })
      alexLogger.debug('CHAT', 'Attached files validated', { effectiveFileIds, attachedFiles: attachedFiles.length, files: attachedFiles.map(f => ({ id: f.id, status: f.status, extraction_status: f.extraction_status, has_text: !!f.extracted_text })) })

      // For image files, fetch the actual image data and convert to base64 BEFORE orchestrator
      // This ensures TPM gate evaluates the actual request size with real image data
      const imageFiles = attachedFiles.filter(f => f.mime_type.startsWith('image/'))
      if (imageFiles.length > 0) {
        console.log('[DIAGNOSTIC] FETCHING IMAGE DATA FOR TPM ACCURACY', {
          imageCount: imageFiles.length,
          imageFilenames: imageFiles.map(f => f.original_filename)
        })

        for (const imageFile of imageFiles) {
          try {
            // Download the image from Supabase Storage
            const { data: fileData, error: downloadError } = await supabase.storage
              .from('alex-files')
              .download(imageFile.storage_path)

            if (downloadError) {
              console.error('[CHAT] Failed to download image:', downloadError)
              continue
            }

            // Convert to base64
            const arrayBuffer = await fileData.arrayBuffer()
            const base64 = Buffer.from(arrayBuffer).toString('base64')
            const mimeType = imageFile.mime_type
            const dataUrl = `data:${mimeType};base64,${base64}`

            // Store the data URL in the file object so orchestrator can use it
            imageFile.imageDataUrl = dataUrl

            console.log('[DIAGNOSTIC] IMAGE DATA FETCHED FOR TPM ACCURACY', {
              fileId: imageFile.id,
              filename: imageFile.original_filename,
              dataSize: base64.length,
              mimeType
            })
          } catch (error) {
            console.error('[CHAT] Error processing image:', error)
          }
        }
      }
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
          let imageFiles: any[] = []
          let aiRequest: any = null

          for await (const chunk of AIEngine.streamChat({
            content,
            mode: mode as AlexMode,
            conversationHistory,
            userId,
            userEmail,
            userName,
            attachedFiles: attachedFiles || [],
            enableRetrieval: true, // Enable Phase 3B retrieval
            enableWebResearch: true, // Enable Phase 3C web research
            enableMemory: true, // Phase 4: Enable memory retrieval
            enableTools: true, // Phase 5: Enable tool calling
            enableAgent: enableAgent || false, // Phase 6: Enable agent mode
            conversationId,
            enableTokenAwareAssembly: (attachedFiles || []).length > 0, // Enable token-aware assembly when files are attached
          })) {
            if (chunk.type === 'orchestrator') {
              // Phase 7: Check for artifact workflow response
              if (chunk.data?.artifactWorkflow) {
                // Don't handle here - let the AI engine's artifact_workflow event handle it
                console.log('[Chat Route] Artifact workflow detected in orchestrator, will be handled by AI engine event')
              } else {
                // Store image files and AI request for later processing
                imageFiles = chunk.imageFiles || []
                aiRequest = chunk.data?.aiRequest

                // Send orchestrator metadata
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'metadata',
                    data: chunk.data
                  })}\n\n`)
                )
              }
            } else if (chunk.type === 'orchestration') {
              // P0: Handle native orchestration event from AI engine
              console.log('[P0] Native orchestration event received from AI engine')
              console.log('[P0] AI action type:', chunk.data.action?.type)

              const message = chunk.data.message || ''
              const action = chunk.data.action
              const artifacts = chunk.data.artifacts || []
              const architectureProposal = chunk.data.architectureProposal || null
              const plan = chunk.data.plan || null

              console.log('[P0] Orchestration data:', {
                actionType: action?.type,
                hasMessage: !!message,
                hasArchitecture: !!architectureProposal,
                hasArtifacts: artifacts.length > 0,
                hasPlan: !!plan
              })

              // Store orchestration data for persistence
              const orchestrationData = {
                action,
                message,
                architectureProposal,
                plan,
                artifacts: artifacts.length > 0 ? artifacts : undefined
              }

              // Send single native orchestration event with all data included
              // Do NOT send separate delta to prevent duplicate messages
              // The frontend will create a single message from the orchestration event
              const orchestrationPayload: any = { action }
              if (message) orchestrationPayload.message = message
              if (architectureProposal) orchestrationPayload.architectureProposal = architectureProposal
              if (plan) orchestrationPayload.plan = plan
              if (artifacts.length > 0) orchestrationPayload.artifacts = artifacts

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'orchestration', data: orchestrationPayload })}\n\n`))

              // Send artifacts separately if present (for generate action - keeps artifact handling separate)
              if (artifacts.length > 0) {
                const responseWithArtifacts = {
                  artifacts: artifacts.map((a: any) => ({
                    id: a.id,
                    filename: a.filename,
                    file_type: a.file_type,
                    mime_type: a.mime_type,
                    download_url: `/api/alex/artifacts/${a.id}/download`
                  }))
                }
                controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'artifacts', data: responseWithArtifacts.artifacts })}\n\n`))
              }

              controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'finish' })}\n\n`))
              controller.enqueue(encoder.encode('data: [DONE]\n\n'))
              controller.close()

              // P0.1: Persist orchestration data to database
              try {
                const { data: assistantMessage, error: assistantMsgError } = await supabase
                  .from('alex_messages')
                  .insert({
                    conversation_id: conversationId,
                    role: 'assistant',
                    content: message || fullContent,
                    model_used: modelUsed,
                    tokens: tokensUsed,
                    orchestration_data: orchestrationData, // P0.1: Persist orchestration data
                  })
                  .select()
                  .single()

                if (assistantMsgError) {
                  console.error('[P0.1] Error saving assistant message with orchestration data:', assistantMsgError)
                }

                // Track usage
                await AlexCostTracker.trackUsage({
                  userId,
                  conversationId,
                  model: modelUsed,
                  tokensUsed,
                  mode: mode as AlexMode,
                })
              } catch (persistError) {
                console.error('[P0.1] Failed to persist orchestration data:', persistError)
              }

              return

              return
            } else if (chunk.type === 'orchestrator') {
              // Store image files and AI request for later processing
              imageFiles = chunk.imageFiles || []
              aiRequest = chunk.data?.aiRequest

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