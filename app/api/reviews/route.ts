import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { ReviewService } from '@/lib/review-service';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/reviews?courseId=...
 * Fetch approved reviews for a course, or check if current student has reviewed
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const checkOnly = searchParams.get('check') === 'true';

    const { userId } = await auth();

    if (checkOnly && courseId && userId) {
      const user = await currentUser();
      const email = user?.primaryEmailAddress?.emailAddress;
      const existing = await ReviewService.getStudentReviewForCourse(courseId, userId, email);
      return NextResponse.json({
        success: true,
        hasReviewed: !!existing,
        review: existing,
      });
    }

    if (!courseId) {
      const all = await ReviewService.getAllReviews();
      const approved = all.filter(r => r.status === 'approved');
      return NextResponse.json({ success: true, reviews: approved });
    }

    const reviews = await ReviewService.getCourseReviews(courseId, true);
    return NextResponse.json({ success: true, reviews });
  } catch (error) {
    console.error('Error in GET /api/reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

/**
 * POST /api/reviews
 * Submit a student review for a course
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return NextResponse.json({ error: 'Please sign in to submit a review' }, { status: 401 });
    }

    const body = await request.json();
    const { course_id, course_title, rating, title, content, lesson_id, lesson_title } = body;

    if (!course_id) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const numericRating = Number(rating);
    if (!numericRating || numericRating < 1 || numericRating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5 stars' }, { status: 400 });
    }

    if (!content || typeof content !== 'string' || content.trim().length < 3) {
      return NextResponse.json({ error: 'Please write a brief review of at least a few words' }, { status: 400 });
    }

    // Verify student enrollment or order access
    const userEmail = user.primaryEmailAddress?.emailAddress || '';
    const emails = user.emailAddresses?.map(e => e.emailAddress.toLowerCase()) || [];
    if (userEmail && !emails.includes(userEmail.toLowerCase())) {
      emails.push(userEmail.toLowerCase());
    }

    const { data: enrollment } = await supabaseAdmin
      .from('enrollments')
      .select('id')
      .eq('learning_product_id', course_id)
      .or(`clerk_user_id.eq.${userId}${emails.length > 0 ? `,email.in.(${emails.map(e => `"${e}"`).join(',')})` : ''}`)
      .limit(1)
      .maybeSingle();

    // If not found in enrollments, check paid orders
    let hasAccess = !!enrollment;
    if (!hasAccess) {
      const { data: orderItem } = await supabaseAdmin
        .from('order_items')
        .select('id, orders!inner(user_id, customer_email, status)')
        .eq('product_id', course_id)
        .eq('orders.status', 'PAID')
        .or(`orders.user_id.eq.${userId}${emails.length > 0 ? `,orders.customer_email.in.(${emails.map(e => `"${e}"`).join(',')})` : ''}`)
        .limit(1)
        .maybeSingle();
      if (orderItem) hasAccess = true;
    }

    // If still not verified, verify if user has watched any lesson in this course
    if (!hasAccess && lesson_id) {
      const { data: prog } = await supabaseAdmin
        .from('lesson_progress')
        .select('id')
        .eq('user_id', userId)
        .eq('lesson_uuid_id', lesson_id)
        .limit(1)
        .maybeSingle();
      if (prog) hasAccess = true;
    }

    const studentName = user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Verified Student';
    const studentAvatar = user.imageUrl || undefined;

    const review = await ReviewService.submitReview({
      course_id,
      course_title: course_title || 'Course',
      student_id: userId,
      student_name: studentName,
      student_email: userEmail,
      student_avatar: studentAvatar,
      rating: numericRating,
      title: title?.trim() || '',
      content: content.trim(),
      lesson_id: lesson_id || undefined,
      lesson_title: lesson_title || undefined,
    });

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your review has been submitted successfully.',
      review,
    });
  } catch (error) {
    console.error('Error in POST /api/reviews:', error);
    return NextResponse.json({ error: 'Failed to submit review' }, { status: 500 });
  }
}
