import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AIProviderManager } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

// POST - Author only: Test AI provider connection
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const { data: provider } = await supabaseAdmin
      .from('ai_providers')
      .select('*')
      .eq('id', id)
      .eq('author_id', userId)
      .single()

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found or unauthorized' }, { status: 404 })
    }

    const result = await AIProviderManager.testProvider(id)

    return NextResponse.json(result)
  } catch (error: any) {
    console.error('[POST /api/author/ai-providers/[id]/test] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
