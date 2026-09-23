import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuthor } from '@/lib/author';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/students
 * Get students who actually purchased author's products via orders
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[STUDENTS API] Starting students API call');
    
    const authorCheck = await requireAuthor();
    if (authorCheck instanceof NextResponse) return authorCheck;

    const { userId } = authorCheck;
    console.log('[STUDENTS API] Current user ID:', userId);

    // Get author ID
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    console.log('[STUDENTS API] Author lookup result:', author);

    if (!author) {
      console.log('[STUDENTS API] Author not found for user ID:', userId);
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    console.log('[STUDENTS API] Author ID:', author.id);

    // Get author's products
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('id, title')
      .eq('author_id', author.id);

    console.log('[STUDENTS API] Products lookup result:', products);

    if (!products || products.length === 0) {
      console.log('[STUDENTS API] No products found for author');
      return NextResponse.json({ success: true, students: [] });
    }

    const productIds = products.map(p => p.id);
    console.log('[STUDENTS API] Product IDs:', productIds);

    // Get order items for author's products
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('order_id, learning_product_id, product_title')
      .in('learning_product_id', productIds);

    console.log('[STUDENTS API] Order items lookup result:', orderItems);

    if (!orderItems || orderItems.length === 0) {
      console.log('[STUDENTS API] No order items found for products');
      return NextResponse.json({ success: true, students: [] });
    }

    // Get unique order IDs
    const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];
    console.log('[STUDENTS API] Order IDs:', orderIds);

    // Get paid orders to get actual students who purchased
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, created_at, status, customer_name, customer_email')
      .in('id', orderIds)
      .eq('status', 'PAID');

    console.log('[STUDENTS API] Orders lookup result:', orders);

    if (!orders || orders.length === 0) {
      console.log('[STUDENTS API] No paid orders found');
      return NextResponse.json({ success: true, students: [] });
    }

    console.log('[STUDENTS API] Found', orders.length, 'paid orders');

    // Get user IDs from paid orders (excluding guest users)
    const userIds = [...new Set(orders.map(o => o.user_id))].filter(id => !id.startsWith('guest_'));
    console.log('[STUDENTS API] Non-guest user IDs from orders:', userIds);

    // Create a map of user_id to customer info from orders
    const customerInfoMap = new Map();
    orders.forEach(order => {
      if (order.customer_name || order.customer_email) {
        customerInfoMap.set(order.user_id, {
          name: order.customer_name,
          email: order.customer_email,
        });
      }
    });

    console.log('[STUDENTS API] Customer info from orders:', Object.fromEntries(customerInfoMap));

    // Fetch quiz answers for these students
    const { data: quizAnswers } = await supabaseAdmin
      .from('student_quiz_answers')
      .select('student_id')
      .in('student_id', userIds);

    const quizCounts: Record<string, number> = {};
    quizAnswers?.forEach(qa => {
      quizCounts[qa.student_id] = (quizCounts[qa.student_id] || 0) + 1;
    });

    // Fetch assignment submissions for these students
    const { data: assignments } = await supabaseAdmin
      .from('student_assignments')
      .select('student_id')
      .in('student_id', userIds);

    const assignmentCounts: Record<string, number> = {};
    assignments?.forEach(sa => {
      assignmentCounts[sa.student_id] = (assignmentCounts[sa.student_id] || 0) + 1;
    });

    // Create a map of order_id to product info
    const orderToProduct = new Map();
    orderItems.forEach(oi => {
      orderToProduct.set(oi.order_id, {
        productId: oi.learning_product_id,
        productTitle: oi.product_title
      });
    });

    // Format students based on actual purchases
    const studentsByProduct = orders.map(order => {
      const productInfo = orderToProduct.get(order.id);
      const customerInfo = customerInfoMap.get(order.user_id);
      const isGuest = order.user_id.startsWith('guest_');
      
      // Use customer info from orders if available, otherwise use ID-based fallback
      const studentName = customerInfo?.name || (isGuest ? 'Guest Customer' : 'Unknown');
      const studentEmail = customerInfo?.email || (isGuest ? 'guest@example.com' : 'unknown@example.com');
      
      console.log('[STUDENTS API] Processing order:', order.id, 'User:', order.user_id, 'Customer info:', customerInfo, 'Is guest:', isGuest);
      
      return {
        // For messages page
        student_id: order.user_id,
        full_name: studentName,
        product_id: productInfo?.productId,
        product_title: productInfo?.productTitle || 'Unknown Course',
        
        // For students page
        id: order.id,
        email: studentEmail,
        name: studentName,
        cohort: productInfo?.productTitle || 'Unknown Course',
        status: 'active', // All paid orders are considered active
        profilePicture: null, // No profile picture available from orders
        enrolledAt: order.created_at || new Date().toISOString(),
        activatedAt: order.created_at || null,
        quizCount: quizCounts[order.user_id] || 0,
        submissionCount: assignmentCounts[order.user_id] || 0,
      };
    });

    console.log('[STUDENTS API] Final students list:', studentsByProduct);
    console.log('[STUDENTS API] Returning', studentsByProduct.length, 'students');

    return NextResponse.json({ success: true, students: studentsByProduct });
  } catch (error) {
    console.error('[STUDENTS API] Error in students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}