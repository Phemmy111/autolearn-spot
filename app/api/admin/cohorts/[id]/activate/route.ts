import { NextResponse } from 'next/server'
import { requireAdmin } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * POST /api/admin/cohorts/[id]/activate
 * Activate a cohort (set is_current = true, deactivate all others)
 */
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin()

    const { id } = params

    console.log('COHORT ACTIVATION START', { cohortId: id })

    // First, deactivate all cohorts (set is_current = false)
    console.log('COHORT ACTIVATION: Step 1 - Deactivating all cohorts except target')
    const deactivateResult = await supabaseAdmin
      .from('cohorts')
      .update({ is_current: false })
      .neq('id', id)

    console.log('COHORT ACTIVATION: Step 1 Result', {
      error: deactivateResult.error,
      count: deactivateResult.count
    })

    if (deactivateResult.error) {
      console.error('COHORT ACTIVATION ERROR', {
        operation: 'deactivate_all_cohorts',
        table: 'cohorts',
        update: { is_current: false },
        filter: { neq: { id } },
        code: deactivateResult.error.code,
        message: deactivateResult.error.message,
        details: deactivateResult.error.details,
        hint: deactivateResult.error.hint,
      })
      return NextResponse.json(
        {
          error: 'Cohort activation failed during deactivation',
          details: {
            code: deactivateResult.error.code,
            message: deactivateResult.error.message,
            details: deactivateResult.error.details,
            hint: deactivateResult.error.hint,
          },
        },
        { status: 500 }
      )
    }

    // Then activate the specified cohort (set is_current = true, status = active)
    console.log('COHORT ACTIVATION: Step 2 - Activating target cohort')
    const { data, error } = await supabaseAdmin
      .from('cohorts')
      .update({ 
        is_current: true,
        status: 'active'
      })
      .eq('id', id)
      .select()
      .single()

    console.log('COHORT ACTIVATION: Step 2 Result', {
      data,
      error
    })

    if (error) {
      console.error('COHORT ACTIVATION ERROR', {
        operation: 'activate_target_cohort',
        table: 'cohorts',
        update: { is_current: true, status: 'active' },
        filter: { eq: { id } },
        code: error.code,
        message: error.message,
        details: error.details,
        hint: error.hint,
      })
      return NextResponse.json(
        {
          error: 'Cohort activation failed during activation',
          details: {
            code: error.code,
            message: error.message,
            details: error.details,
            hint: error.hint,
          },
        },
        { status: 500 }
      )
    }

    console.log('COHORT ACTIVATION SUCCESS', { cohort: data })
    return NextResponse.json({ success: true, cohort: data })
  } catch (error: any) {
    console.error('[POST /api/admin/cohorts/[id]/activate] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}