import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { auth } from '@clerk/nextjs/server'
import { AlexMode } from '@/lib/alex/types'

function getDefaultTitle(mode: AlexMode): string {
  const defaults: Record<AlexMode, string> = {
    auto: 'New Conversation',
    tutor: 'Learning Session',
    developer: 'Development Help',
    automation: 'Automation Project',
    research: 'Research Query',
    agent_builder: 'Agent Design'
  }
  
  return defaults[mode] || 'New Conversation'
}

// GET /api/alex/conversations - List user's conversations
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: conversations, error } = await supabase
      .from('alex_conversations')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false })

    if (error) {
      console.error('Error fetching conversations:', error)
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 })
    }

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Error in GET /api/alex/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST /api/alex/conversations - Create new conversation
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { mode = 'auto' } = body

    const { data: conversation, error } = await supabase
      .from('alex_conversations')
      .insert({
        user_id: userId,
        mode,
        title: getDefaultTitle(mode),
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating conversation:', error)
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 })
    }

    return NextResponse.json({ conversation }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/alex/conversations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}