import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

// GET /api/alex/conversations/[id]/messages - Get conversation messages
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // First verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('alex_conversations')
      .select('id')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Get messages with file IDs
    const { data: messages, error } = await supabase
      .from('alex_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    console.log('[DIAGNOSTIC] MESSAGE LOAD START', {
      conversationId: id,
      userId,
      messagesFound: messages?.length || 0,
      messagesWithFileIds: messages?.filter(m => m.file_ids && m.file_ids.length > 0).length || 0
    })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Fetch file details for messages that have file_ids
    const messagesWithFiles = await Promise.all(
      (messages || []).map(async (message) => {
        // Normalize file_ids to array regardless of how database returns it
        let fileIds = message.file_ids
        if (!fileIds) {
          fileIds = []
        } else if (!Array.isArray(fileIds)) {
          // Handle case where database returns object instead of array
          console.log('[DIAGNOSTIC] NORMALIZING FILE_IDS FROM OBJECT TO ARRAY', {
            messageId: message.id,
            originalType: typeof fileIds,
            originalValue: JSON.stringify(fileIds)
          })
          fileIds = Object.values(fileIds).filter(id => id !== null && id !== undefined)
        }

        if (fileIds.length > 0) {
          console.log('[DIAGNOSTIC] MESSAGE FILE FETCH', {
            messageId: message.id,
            fileIds: fileIds,
            fileIdsCount: fileIds.length,
            fileIdsType: typeof fileIds,
            isArray: Array.isArray(fileIds),
            fileIdsSample: fileIds.slice(0, 2)
          })

          // Try different approaches for UUID array querying
          let files = null
          let filesError = null

          // DEBUG: First check if files exist by querying all files in conversation
          const { data: allConvFiles, error: allConvError } = await supabase
            .from('alex_files')
            .select('id, original_filename')
            .eq('conversation_id', id)

          console.log('[DIAGNOSTIC] ALL CONVERSATION FILES', {
            conversationId: id,
            allFilesCount: allConvFiles?.length || 0,
            allFileIds: allConvFiles?.map(f => f.id) || [],
            allFilenames: allConvFiles?.map(f => f.original_filename) || [],
            allError: allConvError?.message
          })

          // Approach 1: Use .in() with array
          try {
            const result = await supabase
              .from('alex_files')
              .select('*')
              .in('id', fileIds)
            files = result.data
            filesError = result.error
            console.log('[DIAGNOSTIC] MESSAGE FILE FETCH APPROACH 1 (.in)', {
              messageId: message.id,
              filesFound: files?.length || 0,
              fetchError: filesError?.message,
              requestedIds: fileIds,
              foundIds: files?.map(f => f.id) || []
            })
          } catch (err) {
            console.log('[DIAGNOSTIC] MESSAGE FILE FETCH APPROACH 1 EXCEPTION', {
              messageId: message.id,
              error: err instanceof Error ? err.message : 'Unknown error'
            })
          }

          // Approach 2: Try individual queries if .in() fails
          if (!files || files.length === 0) {
            console.log('[DIAGNOSTIC] MESSAGE FILE FETCH APPROACH 2 (individual queries)')
            const filePromises = fileIds.map(async (fileId) => {
              const result = await supabase
                .from('alex_files')
                .select('*')
                .eq('id', fileId)
                .maybeSingle() // Use maybeSingle instead of single to handle no rows gracefully
              console.log('[DIAGNOSTIC] INDIVIDUAL FILE QUERY', {
                fileId,
                found: !!result.data,
                error: result.error?.message
              })
              return result.data
            })
            const individualFiles = await Promise.all(filePromises)
            files = individualFiles.filter(f => f !== null)
            console.log('[DIAGNOSTIC] MESSAGE FILE FETCH APPROACH 2 RESULT', {
              messageId: message.id,
              filesFound: files?.length || 0,
              fileIdsRequested: fileIds.length,
              individualFileIds: files?.map(f => f.id) || []
            })
          }

          console.log('[DIAGNOSTIC] MESSAGE FILE FETCH FINAL RESULT', {
            messageId: message.id,
            filesFound: files?.length || 0,
            fetchError: filesError?.message,
            requestedFileIds: fileIds,
            returnedFileIds: files?.map(f => f.id) || []
          })

          return { ...message, attached_files: files || [] }
        }
        return message
      })
    )

    console.log('[DIAGNOSTIC] MESSAGE LOAD COMPLETE', {
      conversationId: id,
      totalMessages: messagesWithFiles.length,
      messagesWithAttachments: messagesWithFiles.filter(m => m.attached_files && m.attached_files.length > 0).length,
      messageFileIds: messagesWithFiles.map(m => ({
        id: m.id,
        fileIds: m.file_ids,
        attachedFilesCount: m.attached_files?.length || 0
      }))
    })

    return NextResponse.json({ messages: messagesWithFiles })
  } catch (error) {
    console.error('Error in GET /api/alex/conversations/[id]/messages:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}