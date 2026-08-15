import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'

// GET /api/alex/conversations/[id]/export - Export conversation
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
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'text'

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

    // Get messages
    const { data: messages, error } = await supabase
      .from('alex_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true })

    if (error) {
      console.error('Error fetching messages:', error)
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 })
    }

    // Format the export
    let content = ''
    let contentType = 'text/plain'
    let filename = `alex-conversation-${id}`

    if (format === 'markdown') {
      contentType = 'text/markdown'
      filename += '.md'
      content = formatAsMarkdown(conversation, messages || [])
    } else {
      contentType = 'text/plain'
      filename += '.txt'
      content = formatAsText(conversation, messages || [])
    }

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('Error in GET /api/alex/conversations/[id]/export:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

function formatAsMarkdown(conversation: any, messages: any[]): string {
  let md = `# ALEX Conversation Export\n\n`
  md += `**Title:** ${conversation.title}\n`
  md += `**Mode:** ${conversation.mode}\n`
  md += `**Date:** ${new Date(conversation.created_at).toLocaleString()}\n`
  md += `**Last Updated:** ${new Date(conversation.updated_at).toLocaleString()}\n\n`
  md += `---\n\n`

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? '👤 User' : '🤖 ALEX'
    md += `### ${role}\n\n`
    md += `${msg.content}\n\n`
    if (msg.model_used) {
      md += `*Model: ${msg.model_used} | Tokens: ${msg.tokens || 'N/A'}*\n\n`
    }
    md += `---\n\n`
  })

  return md
}

function formatAsText(conversation: any, messages: any[]): string {
  let text = `ALEX Conversation Export\n`
  text += `Title: ${conversation.title}\n`
  text += `Mode: ${conversation.mode}\n`
  text += `Date: ${new Date(conversation.created_at).toLocaleString()}\n`
  text += `Last Updated: ${new Date(conversation.updated_at).toLocaleString()}\n\n`
  text += `${'='.repeat(50)}\n\n`

  messages.forEach((msg) => {
    const role = msg.role === 'user' ? 'USER' : 'ALEX'
    text += `[${role} - ${new Date(msg.created_at).toLocaleString()}]\n`
    text += `${msg.content}\n\n`
    if (msg.model_used) {
      text += `(Model: ${msg.model_used} | Tokens: ${msg.tokens || 'N/A'})\n\n`
    }
    text += `${'='.repeat(50)}\n\n`
  })

  return text
}