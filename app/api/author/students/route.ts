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

    // Get author ID
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Get author's products
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('id, title')
      .eq('author_id', author.id);

    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, students: [] });
    }

    const productIds = products.map(p => p.id);

    // Get order items for author's products
    const { data: orderItems } = await supabaseAdmin
      .from('order_items')
      .select('order_id, learning_product_id, product_title')
      .in('learning_product_id', productIds);

    if (!orderItems || orderItems.length === 0) {
      return NextResponse.json({ success: true, students: [] });
    }

    // Get unique order IDs
    const orderIds = [...new Set(orderItems.map(oi => oi.order_id))];

    // Get paid orders to get actual students who purchased
    const { data: orders } = await supabaseAdmin
      .from('orders')
      .select('id, user_id, created_at, status')
      .in('id', orderIds)
      .eq('status', 'PAID');

    if (!orders || orders.length === 0) {
      return NextResponse.json({ success: true, students: [] });
    }

    // Get user IDs from paid orders
    const userIds = [...new Set(orders.map(o => o.user_id))];

    // Fetch user information from Clerk or user profiles
    const { data: userProfiles } = await supabaseAdmin
      .from('users')
      .select('id, email, full_name, profile_picture')
      .in('id', userIds);

    // Create a map of user_id to profile
    const userProfileMap = new Map();
    userProfiles?.forEach(profile => {
      userProfileMap.set(profile.id, profile);
    });

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
      const userProfile = userProfileMap.get(order.user_id);
      
      return {
        // For messages page
        student_id: order.user_id,
        full_name: userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Unknown',
        product_id: productInfo?.productId,
        product_title: productInfo?.productTitle || 'Unknown Course',
        
        // For students page
        id: order.id,
        email: userProfile?.email || 'unknown@example.com',
        name: userProfile?.full_name || userProfile?.email?.split('@')[0] || 'Unknown',
        cohort: productInfo?.productTitle || 'Unknown Course',
        status: 'active', // All paid orders are considered active
        profilePicture: userProfile?.profile_picture || null,
        enrolledAt: order.created_at || new Date().toISOString(),
        activatedAt: order.created_at || null,
        quizCount: quizCounts[order.user_id] || 0,
        submissionCount: assignmentCounts[order.user_id] || 0,
      };
    });

    return NextResponse.json({ success: true, students: studentsByProduct });
  } catch (error) {
    console.error('Error in students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}