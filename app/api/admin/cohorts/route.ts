import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/cohorts
 * Create a new cohort
 */
export async function POST(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { name, slug, price_ngn, start_date, end_date, status, timezone } = body

    // Check if slug already exists
    const { data: existingCohort } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('slug', slug)
      .single()

    if (existingCohort) {
      return NextResponse.json(
        {
          success: false,
          message: "A cohort with this slug already exists."
        },
        { status: 409 }
      )
    }

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .insert({
        name,
        slug,
        price_ngn,
        start_date,
        end_date,
        status,
        timezone,
        is_current: false,
        settings: {}
      })
      .select()
      .single()

    console.error("SUPABASE INSERT ERROR", error)

    if (error) {
      console.error('Error creating cohort:', error)
      return NextResponse.json(
        {
          success: false,
          error
        },
        {
          status: 500
        }
      )
    }

    return NextResponse.json({ success: true, cohort: data })
  } catch (error: any) {
    console.error('[POST /api/admin/cohorts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * GET /api/admin/cohorts
 * Get all cohorts
 */
export async function GET() {
  try {
    await requireAdmin()

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching cohorts:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, cohorts: data || [] })
  } catch (error: any) {
    console.error('[GET /api/admin/cohorts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * PATCH /api/admin/cohorts
 * Update a cohort
 */
export async function PATCH(request: Request) {
  try {
    await requireAdmin()

    const body = await request.json()
    const { id, ...updates } = body

    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Error updating cohort:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, cohort: data })
  } catch (error: any) {
    console.error('[PATCH /api/admin/cohorts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}

/**
 * DELETE /api/admin/cohorts
 * Delete a cohort
 */
export async function DELETE(request: Request) {
  try {
    await requireAdmin()

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'Cohort ID is required' }, { status: 400 })
    }

    const { error } = await supabaseAdmin
      .from('cohorts')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Error deleting cohort:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('[DELETE /api/admin/cohorts] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}