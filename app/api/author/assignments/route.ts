import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/assignments
 * Get all assignments for the authenticated author
 */
export async function GET(request: Request) {
  try {
    const { userId } = await auth()
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get internal author_id from clerk userId
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single()

    if (!author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 403 })
    }

    // Get all assignments for the author's lessons
    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select(`
        *,
        lesson:lessons!inner (
          uuid_id,
          title,
          product:learning_products!inner (
            id,
            title,
            author_id
          )
        )
      `)
      .eq('lesson.product.author_id', author.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/author/assignments] Error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, assignments })
  } catch (error: any) {
    console.error('[GET /api/author/assignments] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
