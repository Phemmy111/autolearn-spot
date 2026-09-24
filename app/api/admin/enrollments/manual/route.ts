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

    // 2. Check if user already has a paid order for this product
    const { data: existingOrder } = await supabaseAdmin
      .from('orders')
      .select('id, status')
      .eq('user_id', clerkUserId || email)
      .eq('status', 'PAID')
      .single()

    if (existingOrder) {
      return NextResponse.json({ error: 'User already has a paid order for this product' }, { status: 409 })
    }

    // 3. Create an order instead of enrollment (since we're focusing on products)
    const orderData: any = {
      user_id: clerkUserId || `manual_${email}`,
      order_ref: `MANUAL-${Date.now()}`,
      currency: 'NGN',
      subtotal: product.price || 0,
      total: product.price || 0,
      status: 'PAID',
      paid_at: new Date().toISOString(),
      customer_name: fullName || firstName || null,
      customer_email: email.toLowerCase().trim(),
    }

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single()

    if (orderError) {
      console.error('Error creating manual order:', orderError)
      return NextResponse.json({ error: `Failed to create order: ${orderError.message}` }, { status: 500 })
    }

    // 4. Create order item
    const orderItemData = {
      order_id: order.id,
      learning_product_id: productId,
      product_title: product.title,
      price_snapshot: product.price || 0,
      quantity: 1,
    }

    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemData)

    if (itemError) {
      console.error('Error creating order item:', itemError)
      return NextResponse.json({ error: `Failed to create order item: ${itemError.message}` }, { status: 500 })
    }

    // 5. Send Notification
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
        event_id: `manual_enrollment_${email}_${productId}`,
      });
    } catch (notifErr) {
      console.error('Failed to send manual enrollment notification:', notifErr);
    }

    return NextResponse.json({ success: true, message: 'Manual enrollment created successfully' })
  } catch (error: any) {
    console.error('Manual Enrollment Error:', error)
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 })
  }
}
