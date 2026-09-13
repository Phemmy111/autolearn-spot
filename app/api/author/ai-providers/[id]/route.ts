import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'
import { AIProviderManager, ProviderConfig } from '@/lib/ai-provider'

export const dynamic = 'force-dynamic'

// DELETE - Author only: Delete own AI provider
export async function DELETE(
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
      .select('id')
      .eq('id', id)
      .eq('author_id', userId)
      .single()

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found or unauthorized' }, { status: 404 })
    }

    const success = await AIProviderManager.deleteProvider(id)

    if (!success) {
      return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/author/ai-providers/[id]] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
