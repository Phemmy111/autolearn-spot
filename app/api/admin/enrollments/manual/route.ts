import { NextResponse } from 'next/server'
import { requireSuperAdmin, getAdminInfo } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    await requireSuperAdmin()
    const adminInfo = await getAdminInfo()
    const adminEmail = adminInfo?.email || 'Unknown Admin'

    const body = await req.json()
    const { email, clerkUserId, cohortId, status, reason } = body

    if (!email || !cohortId) {
      return NextResponse.json({ error: 'Email and Cohort are required' }, { status: 400 })
    }

    // 1. Check if an active enrollment already exists
    const { data: existing } = await supabaseAdmin
      .from('enrollments')
      .select('id, status')
      .eq('email', email)
      .eq('cohort_id', cohortId)
      .single()

    if (existing?.status === 'active') {
      return NextResponse.json({ error: 'User is Already Enrolled (Active)' }, { status: 409 })
    }

    // 2. Format notes field for human-readable reasons (no audit logs)
    const formattedNotes = reason ? reason.trim() : null

    // 3. Create or update the enrollment
    const enrollmentData = {
      cohort_id: cohortId,
      email: email.toLowerCase().trim(),
      status: status || 'active',
      notes: formattedNotes,
      activated_at: new Date().toISOString()
    }

    if (clerkUserId) {
      (enrollmentData as any).clerk_user_id = clerkUserId
    }

    const { error: upsertError } = await supabaseAdmin
      .from('enrollments')
      .upsert(enrollmentData, { onConflict: 'cohort_id, email' })

    if (upsertError) {
      console.error('Error creating manual enrollment:', upsertError)
      return NextResponse.json({ error: 'Failed to create enrollment in database' }, { status: 500 })
    }

    return NextResponse.json({ success: true, message: 'Enrollment created successfully' })
  } catch (error: any) {
    console.error('Manual Enrollment Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
