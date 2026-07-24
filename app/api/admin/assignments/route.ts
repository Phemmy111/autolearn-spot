import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { requireAdmin } from '@/lib/admin'

export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

// GET - Admin only: Get all assignments
export async function GET() {
  try {
    await requireAdmin()

    const { data: assignments, error } = await supabaseAdmin
      .from('assignments')
      .select('*, cohort:cohorts(id, name, slug), submissions(count)')
      .order('week_number', { ascending: true })
      .order('order_index', { ascending: true })

    if (error) {
      console.error('Error fetching assignments:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ assignments })
  } catch (error: any) {
    console.error('Error in GET /api/admin/assignments:', error)
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
    console.log('Creating assignment with body:', body)
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

    const insertData = {
      cohort_id,
      week_number,
      title,
      description,
      submission_type: 'url', // Only URL submissions for Phase 3
      instructions,
      due_date,
      max_score: max_score || 100,
      is_required: is_required !== undefined ? is_required : true,
    }
    console.log('Insert data:', insertData)

    const { data: assignment, error } = await supabaseAdmin
      .from('assignments')
      .insert(insertData)
      .select()
      .single()

    if (error) {
      console.error('Supabase error creating assignment:', error)
      return NextResponse.json({ error: error.message, details: error }, { status: 500 })
    }

    // Send Notification to Cohort
    try {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification({
        title: 'New Assignment Available',
        message: `Week ${week_number} assignment "${title}" is now available.`,
        category: 'assignment',
        priority: 'normal',
        target_type: 'cohort',
        target_id: cohort_id,
        action_url: '/dashboard/assignments',
        action_label: 'View Assignment',
        send_email: true
      });
    } catch (notifErr) {
      console.error('Failed to send assignment notification:', notifErr);
    }

    console.log('Assignment created successfully:', assignment)
    return NextResponse.json({ assignment }, { status: 201 })
  } catch (error: any) {
    console.error('Error in POST /api/admin/assignments:', error)
    if (error.message?.includes('Unauthorized')) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 403 })
    }
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
