import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/ai-prompts
 * Get AI prompts for the authenticated author
 */
export async function GET() {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: prompts, error } = await supabaseAdmin
      .from('ai_prompts')
      .select('*')
      .eq('author_id', userId)
      .order('prompt_type', { ascending: true })
      .order('version', { ascending: false })

    if (error) {
      console.error('[GET /api/author/ai-prompts] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompts: prompts || [] })
  } catch (error: any) {
    console.error('[GET /api/author/ai-prompts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * POST /api/author/ai-prompts
 * Create a new AI prompt for the authenticated author
 */
export async function POST(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, prompt_type, content } = body

    // Validate required fields
    if (!name || !prompt_type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the highest version for this prompt type for this author
    const { data: existingPrompts } = await supabaseAdmin
      .from('ai_prompts')
      .select('version')
      .eq('author_id', userId)
      .eq('prompt_type', prompt_type)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = (existingPrompts?.[0]?.version || 0) + 1

    // If this is set as active, deactivate other prompts of the same type for this author
    const { data: prompt, error } = await supabaseAdmin
      .from('ai_prompts')
      .insert({
        name,
        prompt_type,
        content,
        version: nextVersion,
        is_active: body.is_active !== false, // Default to true
        author_id: userId,
      })
      .select()
      .single()

    if (error) {
      console.error('[POST /api/author/ai-prompts] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Deactivate other prompts of the same type for this author
    if (prompt.is_active) {
      await supabaseAdmin
        .from('ai_prompts')
        .update({ is_active: false })
        .eq('author_id', userId)
        .eq('prompt_type', prompt_type)
        .neq('id', prompt.id)
    }

    return NextResponse.json({ prompt }, { status: 201 })
  } catch (error: any) {
    console.error('[POST /api/author/ai-prompts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
