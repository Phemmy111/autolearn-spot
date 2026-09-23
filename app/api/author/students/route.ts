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
    const authorCheck = await requireAuthor();
    if (authorCheck instanceof NextResponse) return authorCheck;

    const { userId } = authorCheck;
    console.log('Current user ID:', userId);

    // Get author ID
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    console.log('Author lookup result:', author);

    if (!author) {
      console.log('Author not found for user ID:', userId);
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    console.log('Author ID:', author.id);

    // Get author's products
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('id, title')
      .eq('author_id', author.id);

    console.log('Products lookup result:', products);

    if (!products || products.length === 0) {
      console.log('No products found for author');
      return NextResponse.json({ success: true, students: [] });
    }

    const productIds = products.map(p => p.id);
    console.log('Product IDs:', productIds);

    // Try orders approach first
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('order_id, learning_product_id, product_title')
      .in('learning_product_id', productIds);

    console.log('Order items lookup result:', orderItems);

    if (orderItems && orderItems.length > 0) {
      // Get unique order IDs
      const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];
      console.log('Order IDs:', orderIds);

      // Get paid orders to get actual students who purchased
      const { data: orders } = await supabaseAdmin
        .from('orders')
        .select('id, user_id, created_at, status, customer_email, customer_name')
        .in('id', orderIds)
        .eq('status', 'PAID');

      console.log('Orders lookup result:', orders);

      if (orders && orders.length > 0) {
        console.log('Fetched orders:', orders);

        // Get user IDs from paid orders
        const userIds = [...new Set(orders.map(o => o.user_id))];

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
          
          return {
            // For messages page
            student_id: order.user_id,
            full_name: order.customer_name || order.customer_email?.split('@')[0] || 'Unknown',
            product_id: productInfo?.productId,
            product_title: productInfo?.productTitle || 'Unknown Course',
            
            // For students page
            id: order.id,
            email: order.customer_email || 'unknown@example.com',
            name: order.customer_name || order.customer_email?.split('@')[0] || 'Unknown',
            cohort: productInfo?.productTitle || 'Unknown Course',
            status: 'active', // All paid orders are considered active
            profilePicture: null,
            enrolledAt: order.created_at || new Date().toISOString(),
            activatedAt: order.created_at || null,
            quizCount: quizCounts[order.user_id] || 0,
            submissionCount: assignmentCounts[order.user_id] || 0,
          };
        });

        console.log('Formatted students:', studentsByProduct);
        return NextResponse.json({ success: true, students: studentsByProduct });
      }
    }

    // Fallback: Try enrollment/cohort approach if orders don't work
    console.log('Orders approach failed, trying enrollment/cohort approach');
    
    const { data: cohorts } = await supabaseAdmin
      .from('cohorts')
      .select('id, learning_product_id')
      .in('learning_product_id', productIds);

    if (!cohorts || cohorts.length === 0) {
      console.log('No cohorts found for products');
      return NextResponse.json({ success: true, students: [] });
    }

    const cohortIds = cohorts.map(c => c.id);

    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('id, clerk_user_id, full_name, email, cohort_id, status, created_at')
      .in('cohort_id', cohortIds)
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) {
      console.log('No enrollments found for cohorts');
      return NextResponse.json({ success: true, students: [] });
    }

    console.log('Fetched enrollments:', enrollments);

    const studentIds = enrollments.map(e => e.clerk_user_id);

    const { data: quizAnswers } = await supabaseAdmin
      .from('student_quiz_answers')
      .select('student_id')
      .in('student_id', studentIds);

    const quizCounts: Record<string, number> = {};
    quizAnswers?.forEach(qa => {
      quizCounts[qa.student_id] = (quizCounts[qa.student_id] || 0) + 1;
    });

    const { data: assignments } = await supabaseAdmin
      .from('student_assignments')
      .select('student_id')
      .in('student_id', studentIds);

    const assignmentCounts: Record<string, number> = {};
    assignments?.forEach(sa => {
      assignmentCounts[sa.student_id] = (assignmentCounts[sa.student_id] || 0) + 1;
    });

    const cohortToProduct = new Map(cohorts.map(c => [c.id, c.learning_product_id]));

    const studentsByProduct = enrollments.map(enrollment => {
      const productId = cohortToProduct.get(enrollment.cohort_id);
      const productTitle = products.find(p => p.id === productId)?.title || 'Unknown Course';
      return {
        student_id: enrollment.clerk_user_id,
        full_name: enrollment.full_name || enrollment.email?.split('@')[0] || 'Unknown',
        product_id: productId,
        product_title: productTitle,
        id: enrollment.id,
        email: enrollment.email,
        name: enrollment.full_name || enrollment.email?.split('@')[0] || 'Unknown',
        cohort: productTitle,
        status: enrollment.status || 'active',
        profilePicture: null,
        enrolledAt: enrollment.created_at || new Date().toISOString(),
        activatedAt: enrollment.created_at || null,
        quizCount: quizCounts[enrollment.clerk_user_id] || 0,
        submissionCount: assignmentCounts[enrollment.clerk_user_id] || 0,
      };
    });

    console.log('Formatted students from enrollments:', studentsByProduct);
    return NextResponse.json({ success: true, students: studentsByProduct });

  } catch (error) {
    console.error('Error in students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}