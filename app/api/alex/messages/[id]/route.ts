import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabase } from '@/lib/supabase'

// PATCH /api/alex/messages/[id] - Edit a message
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await auth()
    const { userId } = authResult

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { content } = body

    if (!content) {
      return NextResponse.json({ error: 'Content is required' }, { status: 400 })
    }

    // Verify user owns the message
    const { data: message, error: fetchError } = await supabase
      .from('alex_messages')
      .select(`
        *,
        conversation:alex_conversations!inner (
          user_id
        )
      `)
      .eq('id', params.id)
      .single()

    if (fetchError || !message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    if (message.conversation.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Update the message
    const { data: updatedMessage, error: updateError } = await supabase
      .from('alex_messages')
      .update({ content })
      .eq('id', params.id)
      .select()
      .single()

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update message' }, { status: 500 })
    }

    return NextResponse.json({ message: updatedMessage })
  } catch (error) {
    console.error('Error editing message:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
