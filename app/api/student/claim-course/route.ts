import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Please sign in to claim a course' }, { status: 401 });
    }

    const body = await request.json();
    const rawIdentifier = body.identifier?.trim();

    if (!rawIdentifier) {
      return NextResponse.json({ error: 'Please provide the email or payment reference used during checkout' }, { status: 400 });
    }

    const isEmail = rawIdentifier.includes('@');
    const cleanId = rawIdentifier.toLowerCase();

    // 1. Search enrollments
    let enrollmentsQuery = supabaseAdmin
      .from('enrollments')
      .select('id, email, learning_product_id, status, clerk_user_id');

    if (isEmail) {
      enrollmentsQuery = enrollmentsQuery.ilike('email', cleanId);
    } else {
      enrollmentsQuery = enrollmentsQuery.or(`payment_ref.ilike.%${rawIdentifier}%,id.eq.${rawIdentifier}`);
    }

    const { data: matchedEnrollments, error: enrError } = await enrollmentsQuery;

    // 2. Search orders
    let ordersQuery = supabaseAdmin
      .from('orders')
      .select('id, customer_email, provider_ref, order_ref, status')
      .eq('status', 'PAID');

    if (isEmail) {
      ordersQuery = ordersQuery.ilike('customer_email', cleanId);
    } else {
      ordersQuery = ordersQuery.or(`provider_ref.ilike.%${rawIdentifier}%,order_ref.ilike.%${rawIdentifier}%`);
    }

    const { data: matchedOrders } = await ordersQuery;

    const totalMatches = (matchedEnrollments?.length || 0) + (matchedOrders?.length || 0);

    if (totalMatches === 0) {
      return NextResponse.json({
        error: `No completed purchase found matching "${rawIdentifier}". Please check the email address or payment reference on your receipt.`
      }, { status: 404 });
    }

    // 3. Link enrollments to current Clerk user
    if (matchedEnrollments && matchedEnrollments.length > 0) {
      const enrollmentIds = matchedEnrollments.map(e => e.id);
      await supabaseAdmin
        .from('enrollments')
        .update({ clerk_user_id: userId })
        .in('id', enrollmentIds);
    }

    // 4. Link orders to current Clerk user
    if (matchedOrders && matchedOrders.length > 0) {
      const orderIds = matchedOrders.map(o => o.id);
      await supabaseAdmin
        .from('orders')
        .update({ user_id: userId })
        .in('id', orderIds);
    }

    // 5. Link author conversations if any were created under the payment email
    if (isEmail) {
      await supabaseAdmin
        .from('author_conversations')
        .update({ student_id: userId })
        .ilike('student_id', cleanId);
    }

    return NextResponse.json({
      success: true,
      message: `Successfully linked ${matchedEnrollments?.length || matchedOrders?.length || 1} course enrollment(s) to your account!`,
      linkedCount: matchedEnrollments?.length || matchedOrders?.length || 1,
    });
  } catch (error: any) {
    console.error('Error claiming course:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
