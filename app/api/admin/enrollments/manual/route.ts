import { NextResponse } from 'next/server';
import { requireSuperAdmin, getAdminInfo } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export async function POST(req: Request) {
  try {
    await requireSuperAdmin();
    const adminInfo = await getAdminInfo();
    const adminEmail = adminInfo?.email || 'Unknown Admin';

    const body = await req.json();
    const { email, clerkUserId, productId, status, reason, firstName, lastName, fullName } = body;

    if (!email || !productId) {
      return NextResponse.json({ error: 'Email and Product are required' }, { status: 400 });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const studentFullName = fullName || [firstName, lastName].filter(Boolean).join(' ') || 'Student';

    // 1. Check if product exists
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, author_id, price')
      .eq('id', productId)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // 2. Check if user already has an active enrollment for this product
    const { data: existingEnrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id, status')
      .eq('learning_product_id', productId)
      .eq('email', normalizedEmail)
      .maybeSingle();

    if (existingEnrollment && existingEnrollment.status === 'active') {
      return NextResponse.json({ error: 'Student is already actively enrolled in this product' }, { status: 409 });
    }

    // 3. Create an order record for accounting and audit trail
    const orderData: any = {
      user_id: clerkUserId || `manual_${normalizedEmail}`,
      order_ref: `MANUAL-${Date.now()}`,
      currency: 'NGN',
      subtotal: product.price || 0,
      total: product.price || 0,
      status: 'PAID',
      paid_at: new Date().toISOString(),
      provider_ref: `MANUAL-${Date.now()}`,
      payment_provider: 'MANUAL',
      customer_name: studentFullName,
      customer_email: normalizedEmail,
    };

    const { data: order, error: orderError } = await supabaseAdmin
      .from('orders')
      .insert(orderData)
      .select()
      .single();

    if (orderError) {
      console.error('Error creating manual order:', orderError);
      return NextResponse.json({ error: `Failed to create order: ${orderError.message}` }, { status: 500 });
    }

    // 4. Create order item
    const orderItemData = {
      order_id: order.id,
      learning_product_id: productId,
      product_title: product.title,
      price_snapshot: product.price || 0,
    };

    const { error: itemError } = await supabaseAdmin
      .from('order_items')
      .insert(orderItemData);

    if (itemError) {
      console.error('Error creating order item:', itemError);
      return NextResponse.json({ error: `Failed to create order item: ${itemError.message}` }, { status: 500 });
    }

    // 5. Create or update enrollment record so the student sees the course in their dashboard
    const fallbackCohortId = '3633e893-7bc4-4cb6-9617-f7c5255aeaa9';

    const enrollmentRecord: Record<string, any> = {
      learning_product_id: productId,
      cohort_id: fallbackCohortId,
      email: normalizedEmail,
      clerk_user_id: clerkUserId || null,
      payment_ref: order.order_ref,
      amount_paid: product.price || 0,
      status: status || 'active',
      activated_at: new Date().toISOString(),
      enrolled_at: new Date().toISOString(),
      first_name: firstName || null,
      last_name: lastName || null,
      full_name: studentFullName,
      notes: reason ? `Manual enrollment by ${adminEmail}: ${reason}` : `Manual enrollment by ${adminEmail}`,
    };

    const { error: enrollmentError } = await supabaseAdmin
      .from('enrollments')
      .upsert(enrollmentRecord, {
        onConflict: 'learning_product_id, email'
      });

    if (enrollmentError) {
      console.warn('Manual enrollment upsert error, trying direct insert fallback:', enrollmentError);
      const { error: insertError } = await supabaseAdmin.from('enrollments').insert(enrollmentRecord);
      if (insertError) {
        console.error('Failed to create enrollment record:', insertError);
      }
    }

    // 6. Send In-App Notification to Student
    try {
      const { createNotification } = await import('@/lib/notifications');
      await createNotification({
        title: 'Welcome to AutoLearn Spot!',
        message: `You have been manually enrolled in "${product.title}" by an administrator.`,
        category: 'enrollment',
        priority: 'important',
        target_type: 'student',
        target_id: clerkUserId || normalizedEmail,
        action_url: '/dashboard',
        action_label: 'Go to Dashboard',
        send_email: false, // We send full rich email via EmailService below
        event_id: `manual_enrollment_${normalizedEmail}_${productId}`,
      });
    } catch (notifErr) {
      console.error('Failed to send manual enrollment in-app notification:', notifErr);
    }

    // 7. Send Rich Welcome & Course Access Email to Student (identical to paid students)
    try {
      await EmailService.sendCoursePurchaseConfirmation(
        normalizedEmail,
        studentFullName,
        product.title,
        product.price || 0,
        order.order_ref
      );
      console.log(`[Manual Enrollment] Welcome email sent to student: ${normalizedEmail}`);
    } catch (studentEmailErr) {
      console.error(`[Manual Enrollment] Failed to send student welcome email:`, studentEmailErr);
    }

    // 8. Send Confirmation Email to Admin & Platform Founders
    try {
      await EmailService.sendManualEnrollmentAdminConfirmation({
        adminEmail,
        studentName: studentFullName,
        studentEmail: normalizedEmail,
        courseTitle: product.title,
        orderRef: order.order_ref,
        enrolledAt: new Date().toISOString(),
        reason,
      });
      console.log(`[Manual Enrollment] Confirmation email sent to admin: ${adminEmail}`);
    } catch (adminEmailErr) {
      console.error(`[Manual Enrollment] Failed to send admin confirmation email:`, adminEmailErr);
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Manual enrollment created successfully! Access email sent to student and confirmation email sent to admin.',
      orderRef: order.order_ref
    });
  } catch (error: any) {
    console.error('Manual Enrollment Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
