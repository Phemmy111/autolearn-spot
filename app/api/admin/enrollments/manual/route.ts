import { NextResponse } from 'next/server'
import { requireSuperAdmin, getAdminInfo } from '@/lib/admin'
import { supabaseAdmin } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    await requireSuperAdmin()
    const adminInfo = await getAdminInfo()
    const adminEmail = adminInfo?.email || 'Unknown Admin'

    const body = await req.json()
    const { email, clerkUserId, productId, status, reason, firstName, lastName, fullName } = body

    if (!email || !productId) {
      return NextResponse.json({ error: 'Email and Product are required' }, { status: 400 })
    }

    // 1. Check if product exists
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, author_id, price')
      .eq('id', productId)
      .single()

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    // 2. Check if an active enrollment already exists for this product
    const { data: existing } = await supabaseAdmin
      .from('enrollments')
      .select('id, status')
      .eq('email', email)
      .eq('learning_product_id', productId)
      .single()

    if (existing?.status === 'active') {
      return NextResponse.json({ error: 'User is Already Enrolled in this product (Active)' }, { status: 409 })
    }

    // 3. Format notes field for human-readable reasons (no audit logs)
    const formattedNotes = reason ? reason.trim() : null

    // 4. Create or update the enrollment
    const enrollmentData: any = {
      learning_product_id: productId,
      email: email.toLowerCase().trim(),
      status: status || 'active',
      notes: formattedNotes,
      activated_at: new Date().toISOString(),
      payment_amount: product.price || 0,
      amount_paid: product.price || 0,
    }

    if (clerkUserId) {
      enrollmentData.clerk_user_id = clerkUserId
    }

    // Add name fields if provided
    if (firstName) enrollmentData.first_name = firstName
    if (lastName) enrollmentData.last_name = lastName
    if (fullName) enrollmentData.full_name = fullName

    const { error: upsertError } = await supabaseAdmin
      .from('enrollments')
      .upsert(enrollmentData, { onConflict: 'learning_product_id, email' })

    if (upsertError) {
      console.error('Error creating manual enrollment:', upsertError)
      console.error('Error details:', JSON.stringify(upsertError, null, 2))
      return NextResponse.json({ error: `Failed to create enrollment: ${upsertError.message}` }, { status: 500 })
    }

    // Send Enrollment Notification
    try {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification({
        title: 'Welcome to AutoLearn Spot!',
        message: `You have been manually enrolled in "${product.title}" by an administrator.`,
        category: 'enrollment',
        priority: 'important',
        target_type: 'student',
        target_id: clerkUserId || email,
        action_url: '/dashboard',
        action_label: 'Go to Dashboard',
        send_email: true,
        event_id: `enrollment_${email}_${productId}`,
      });
    } catch (notifErr) {
      console.error('Failed to send manual enrollment notification:', notifErr);
    }

    return NextResponse.json({ success: true, message: 'Enrollment created successfully' })
  } catch (error: any) {
    console.error('Manual Enrollment Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
