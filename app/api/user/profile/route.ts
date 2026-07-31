import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/user/profile
 * Returns the user's profile information including their first name from the database
 */
export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Try to get name from enrollments table
    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('first_name, last_name, full_name')
      .eq('clerk_user_id', userId)
      .single()

    if (enrollment) {
      return NextResponse.json({ 
        firstName: enrollment.first_name,
        lastName: enrollment.last_name,
        fullName: enrollment.full_name || (enrollment.first_name && enrollment.last_name ? `${enrollment.first_name} ${enrollment.last_name}` : null)
      })
    }

    // If not found in enrollments, return empty
    return NextResponse.json({ firstName: null, lastName: null, fullName: null })
  } catch (error) {
    console.error('[GET /api/user/profile] Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}