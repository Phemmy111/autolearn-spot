import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - Admin only: Get all assignments
export async function GET() {
  try {
    await requireAdmin()

    const { data: assignments, error } = await supabase
      .from('assignments')
      .select('*, cohort:cohorts(id, name, slug), submissions(count)')
      .order('week_number', { ascending: true })
      .order('order_index', { ascending: true })

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignments })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Admin only: Create new assignment
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { 
      cohort_id, 
      week_number, 
      title, 
      description, 
      instructions, 
      due_date, 
      max_score,
      is_required 
    } = body

    // Validate required fields
    if (!cohort_id || !week_number || !title) {
      return NextResponse.json({ error: 'Missing required fields: cohort_id, week_number, title' }, { status: 400 })
    }

    const { data: assignment, error } = await supabase
      .from('assignments')
      .insert({
        cohort_id,
        week_number,
        title,
        description,
        submission_type: 'url', // Only URL submissions for Phase 3
        instructions,
        due_date,
        max_score: max_score || 100,
        is_required: is_required !== undefined ? is_required : true,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error: any) {
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
