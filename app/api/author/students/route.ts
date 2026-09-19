import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuthor } from '@/lib/author';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/students
 * Get students enrolled in author's products
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

    // Get cohorts for these products
    const { data: cohorts } = await supabaseAdmin
      .from('cohorts')
      .select('id, learning_product_id')
      .in('learning_product_id', productIds);

    if (!cohorts || cohorts.length === 0) {
      return NextResponse.json({ success: true, students: [] });
    }

    const cohortIds = cohorts.map(c => c.id);

    // Get enrollments for these cohorts
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('id, clerk_user_id, full_name, email, cohort_id, status, created_at')
      .in('cohort_id', cohortIds)
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: true, students: [] });
    }

    // Fetch all student IDs
    const studentIds = enrollments.map(e => e.clerk_user_id);

    // Fetch quiz answers for these students
    const { data: quizAnswers } = await supabaseAdmin
      .from('student_quiz_answers')
      .select('student_id')
      .in('student_id', studentIds);

    const quizCounts: Record<string, number> = {};
    quizAnswers?.forEach(qa => {
      quizCounts[qa.student_id] = (quizCounts[qa.student_id] || 0) + 1;
    });

    // Fetch assignment submissions for these students
    const { data: assignments } = await supabaseAdmin
      .from('student_assignments')
      .select('student_id')
      .in('student_id', studentIds);

    const assignmentCounts: Record<string, number> = {};
    assignments?.forEach(sa => {
      assignmentCounts[sa.student_id] = (assignmentCounts[sa.student_id] || 0) + 1;
    });

    // Create a map of cohort to product
    const cohortToProduct = new Map(cohorts.map(c => [c.id, c.learning_product_id]));

    // Format students for the page and for messages list
    const studentsByProduct = enrollments.map(enrollment => {
      const productId = cohortToProduct.get(enrollment.cohort_id);
      const productTitle = products.find(p => p.id === productId)?.title || 'Unknown Course';
      return {
        // For messages page
        student_id: enrollment.clerk_user_id,
        full_name: enrollment.full_name || enrollment.email?.split('@')[0] || 'Unknown',
        product_id: productId,
        product_title: productTitle,
        
        // For students page
        id: enrollment.id,
        email: enrollment.email,
        name: enrollment.full_name || enrollment.email?.split('@')[0] || 'Unknown',
        cohort: productTitle, // User requested Course name instead of cohort
        status: enrollment.status || 'active',
        profilePicture: null,
        enrolledAt: enrollment.created_at || new Date().toISOString(),
        activatedAt: enrollment.created_at || null,
        quizCount: quizCounts[enrollment.clerk_user_id] || 0,
        submissionCount: assignmentCounts[enrollment.clerk_user_id] || 0,
      };
    });

    return NextResponse.json({ success: true, students: studentsByProduct });
  } catch (error) {
    console.error('Error in students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}