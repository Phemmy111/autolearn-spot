import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

// GET - Admin only: Get all AI prompts
export async function GET() {
  try {
    await requireAdmin()

    const { data: prompts, error } = await supabase
      .from('ai_prompts')
      .select('*')
      .order('prompt_type', { ascending: true })
      .order('version', { ascending: false })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ prompts })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Admin only: Create new AI prompt
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, prompt_type, content } = body

    // Validate required fields
    if (!name || !prompt_type || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Get the highest version for this prompt type
    const { data: existingPrompts } = await supabase
      .from('ai_prompts')
      .select('version')
      .eq('prompt_type', prompt_type)
      .order('version', { ascending: false })
      .limit(1)

    const nextVersion = (existingPrompts?.[0]?.version || 0) + 1

    // If this is set as active, deactivate other prompts of the same type
    const { data: prompt, error } = await supabase
      .from('ai_prompts')
      .insert({
        name,
        prompt_type,
        content,
        version: nextVersion,
        is_active: true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Deactivate other prompts of the same type
    await supabase
      .from('ai_prompts')
      .update({ is_active: false })
      .eq('prompt_type', prompt_type)
      .neq('id', prompt.id)

    return NextResponse.json({ prompt }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
