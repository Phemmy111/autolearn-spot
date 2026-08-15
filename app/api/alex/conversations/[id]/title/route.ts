import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { generateConversationTitle } from '@/lib/alex/title-generator'

// PATCH /api/alex/conversations/[id]/title - Update conversation title
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params
    const body = await request.json()
    const { firstMessage, mode } = body

    if (!firstMessage || !mode) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verify user owns the conversation
    const { data: conversation, error: convError } = await supabase
      .from('alex_conversations')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single()

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 })
    }

    // Generate title
    const title = await generateConversationTitle(firstMessage, mode)

    // Update conversation title
    const { data: updatedConversation, error: updateError } = await supabase
      .from('alex_conversations')
      .update({ title })
      .eq('id', id)
      .select()
      .single()

    if (updateError) {
      console.error('Error updating conversation title:', updateError)
      return NextResponse.json({ error: 'Failed to update title' }, { status: 500 })
    }

    return NextResponse.json({ conversation: updatedConversation })
  } catch (error) {
    console.error('Error in PATCH /api/alex/conversations/[id]/title:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}