import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuthor } from '@/lib/author';
import { extendEnrollmentAccess } from '@/lib/enrollment-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/students
 * Get students enrolled in author's courses with accurate status, days_left, and lifetime details
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
      .select('id, title, access_duration_days')
      .eq('author_id', author.id);

    if (!products || products.length === 0) {
      return NextResponse.json({ success: true, students: [] });
    }

    const productIds = products.map(p => p.id);

    // 1. Fetch real enrollments for author's products
    const { data: enrollments, error: enrollError } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        full_name,
        first_name,
        last_name,
        email,
        clerk_user_id,
        learning_product_id,
        status,
        activated_at,
        expires_at,
        enrolled_at,
        created_at,
        learning_product:learning_products (
          id,
          title,
          slug,
          access_duration_days
        )
      `)
      .in('learning_product_id', productIds)
      .order('created_at', { ascending: false });

    if (enrollError) {
      console.error('[STUDENTS API] Error fetching enrollments:', enrollError);
      return NextResponse.json({ error: 'Failed to fetch student enrollments' }, { status: 500 });
    }

    // Get all user IDs from enrollments for quizzes & assignments lookup
    const userIds = [...new Set((enrollments || []).map(e => e.clerk_user_id).filter(Boolean))] as string[];

    // Fetch quiz answers for these students
    let quizCounts: Record<string, number> = {};
    if (userIds.length > 0) {
      const { data: quizAnswers } = await supabaseAdmin
        .from('student_quiz_answers')
        .select('student_id')
        .in('student_id', userIds);

      quizAnswers?.forEach(qa => {
        quizCounts[qa.student_id] = (quizCounts[qa.student_id] || 0) + 1;
      });
    }

    // Fetch assignment submissions for these students
    let assignmentCounts: Record<string, number> = {};
    if (userIds.length > 0) {
      const { data: assignments } = await supabaseAdmin
        .from('student_assignments')
        .select('student_id')
        .in('student_id', userIds);

      assignments?.forEach(sa => {
        assignmentCounts[sa.student_id] = (assignmentCounts[sa.student_id] || 0) + 1;
      });
    }

    // Format students with full access & lifetime details
    const formattedStudents = (enrollments || []).map(e => {
      const product = Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product;
      const isCourseLifetime = product ? (product.access_duration_days === null || product.access_duration_days === undefined || product.access_duration_days === 0) : false;
      const isStudentLifetime = e.expires_at ? new Date(e.expires_at).getFullYear() >= 2099 : false;
      const isLifetime = isCourseLifetime || isStudentLifetime;

      let daysLeft: number | null = null;
      let isExpired = e.status === 'expired';

      if (isLifetime) {
        daysLeft = null;
      } else if (e.expires_at) {
        const diffMs = new Date(e.expires_at).getTime() - Date.now();
        daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        if (diffMs <= 0) isExpired = true;
      } else if (e.status === 'active' && e.activated_at && product?.access_duration_days) {
        const start = new Date(e.activated_at).getTime();
        const durationMs = product.access_duration_days * 24 * 60 * 60 * 1000;
        const diffMs = (start + durationMs) - Date.now();
        daysLeft = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
        if (diffMs <= 0) isExpired = true;
      }

      const finalStatus = e.status === 'deactivated' 
        ? 'deactivated' 
        : isExpired 
        ? 'expired' 
        : (e.status || 'not_started');

      const displayName = e.full_name || 
        (e.first_name || e.last_name ? `${e.first_name || ''} ${e.last_name || ''}`.trim() : 
        (e.email ? e.email.split('@')[0] : 'Student'));

      return {
        // For messages page
        student_id: e.clerk_user_id || e.email,
        full_name: displayName,
        product_id: e.learning_product_id,
        product_title: product?.title || 'Unknown Course',
        
        // For students page
        id: e.id,
        enrollment_id: e.id,
        email: e.email || 'N/A',
        name: displayName,
        cohort: product?.title || 'Unknown Course',
        status: finalStatus,
        profilePicture: null,
        enrolledAt: e.enrolled_at || e.created_at || new Date().toISOString(),
        activatedAt: e.activated_at || null,
        expiresAt: e.expires_at || null,
        days_left: daysLeft,
        is_lifetime: isLifetime,
        quizCount: (e.clerk_user_id ? quizCounts[e.clerk_user_id] : 0) || 0,
        submissionCount: (e.clerk_user_id ? assignmentCounts[e.clerk_user_id] : 0) || 0,
      };
    });

    return NextResponse.json({ success: true, students: formattedStudents });
  } catch (error) {
    console.error('[STUDENTS API] Error in students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/author/students
 * Author can extend access / add days to a student enrolled in their courses
 * Body: { enrollmentId: string, daysToAdd?: number, isLifetime?: boolean }
 */
export async function PATCH(request: NextRequest) {
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
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 });
    }

    const body = await request.json().catch(() => ({}));
    const { enrollmentId, id, daysToAdd, isLifetime } = body;
    const targetEnrollmentId = enrollmentId || id;

    if (!targetEnrollmentId) {
      return NextResponse.json({ error: 'Enrollment ID is required' }, { status: 400 });
    }

    // Security check: Verify that this enrollment belongs to a course owned by this author
    const { data: enrollment, error: fetchErr } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        learning_product_id,
        learning_product:learning_products (
          id,
          author_id
        )
      `)
      .eq('id', targetEnrollmentId)
      .single();

    if (fetchErr || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    const product = Array.isArray(enrollment.learning_product)
      ? enrollment.learning_product[0]
      : enrollment.learning_product;

    if (!product || product.author_id !== author.id) {
      return NextResponse.json({ 
        error: 'You are only authorized to extend access for students in your own courses' 
      }, { status: 403 });
    }

    const result = await extendEnrollmentAccess({
      enrollmentId: targetEnrollmentId,
      daysToAdd: daysToAdd !== undefined ? Number(daysToAdd) : undefined,
      isLifetime: Boolean(isLifetime),
    });

    return NextResponse.json({
      success: true,
      message: result.message,
      data: result,
    });
  } catch (error: any) {
    console.error('[STUDENTS API] Error extending access:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}