import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

// POST - Admin only: Set prompt as active
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin()

    const { id } = await params

    // Get the prompt to find its type
    const { data: prompt } = await supabase
      .from('ai_prompts')
      .select('prompt_type')
      .eq('id', id)
      .single()

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt not found' }, { status: 404 })
    }

    // Deactivate all prompts of the same type
    await supabase
      .from('ai_prompts')
      .update({ is_active: false })
      .eq('prompt_type', prompt.prompt_type)

    // Activate the selected prompt
    const { error } = await supabase
      .from('ai_prompts')
      .update({ is_active: true })
      .eq('id', id)

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
