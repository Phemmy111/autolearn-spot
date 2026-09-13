import { NextResponse } from 'next/server'
import { auth } from '@clerk/nextjs/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

/**
 * GET /api/author/students
 * Get all enrolled students for the author's products
 */
export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // 1. Get author's products
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('id')
      .eq('author_id', userId)

    const productIds = products?.map(p => p.id) || []

    if (productIds.length === 0) {
      return NextResponse.json({ success: true, students: [] })
    }

    // 2. Get order items for these products
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('order_id')
      .in('learning_product_id', productIds)

    const orderIds = orderItems?.map(oi => oi.order_id) || []

    let validUserIds: string[] = []
    if (orderIds.length > 0) {
      // 3. Get PAID orders for these order items to find the buyer IDs
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('user_id')
        .in('id', orderIds)
        .eq('status', 'PAID')

      validUserIds = orders?.map(o => o.user_id).filter(Boolean) || []
    }

    if (validUserIds.length === 0) {
      return NextResponse.json({ success: true, students: [] })
    }

    // 4. Get enrollments ONLY for these valid buyers
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select('id, email, clerk_user_id, first_name, last_name, full_name, cohort, status, profile_picture, created_at, activated_at')
      .in('clerk_user_id', validUserIds)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('[GET /api/author/students] Enrollments error:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Get quiz response counts per user for these specific users
    const { data: quizCounts } = await supabaseAdmin
      .from('quiz_responses')
      .select('user_id')
      .in('user_id', validUserIds)

    // Get submission counts per user for these specific users
    const { data: submissionCounts } = await supabaseAdmin
      .from('submissions')
      .select('user_id')
      .in('user_id', validUserIds)

    // Build count maps
    const quizCountMap: Record<string, number> = {}
    const submissionCountMap: Record<string, number> = {}

    quizCounts?.forEach((qr: any) => {
      quizCountMap[qr.user_id] = (quizCountMap[qr.user_id] || 0) + 1
    })

    submissionCounts?.forEach((s: any) => {
      submissionCountMap[s.user_id] = (submissionCountMap[s.user_id] || 0) + 1
    })

    // Deduplicate by email (keep latest enrollment per email)
    const emailMap = new Map<string, any>()
    for (const enrollment of enrollments || []) {
      const key = enrollment.email
      if (!emailMap.has(key)) {
        const clerkId = enrollment.clerk_user_id || ''
        emailMap.set(key, {
          id: enrollment.id,
          email: enrollment.email,
          name: enrollment.full_name || [enrollment.first_name, enrollment.last_name].filter(Boolean).join(' ') || null,
          cohort: enrollment.cohort,
          status: enrollment.status,
          profilePicture: enrollment.profile_picture,
          enrolledAt: enrollment.created_at,
          activatedAt: enrollment.activated_at,
          quizCount: quizCountMap[clerkId] || 0,
          submissionCount: submissionCountMap[clerkId] || 0,
        })
      }
    }

    const students = Array.from(emailMap.values())

    return NextResponse.json({ success: true, students })
  } catch (error: any) {
    console.error('[GET /api/author/students] Error:', error)
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 })
  }
}
