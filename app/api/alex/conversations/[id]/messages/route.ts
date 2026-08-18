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
        if (message.file_ids && message.file_ids.length > 0) {
          console.log('[DIAGNOSTIC] MESSAGE FILE FETCH', {
            messageId: message.id,
            fileIds: message.file_ids,
            fileIdsCount: message.file_ids.length
          })

          const { data: files, error: filesError } = await supabase
            .from('alex_files')
            .select('*')
            .in('id', message.file_ids)

          console.log('[DIAGNOSTIC] MESSAGE FILE FETCH RESULT', {
            messageId: message.id,
            filesFound: files?.length || 0,
            fetchError: filesError?.message,
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