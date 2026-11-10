import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { ReviewService } from '@/lib/review-service';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/reviews
 * Fetch all reviews with admin metrics
 */
export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const courseId = searchParams.get('courseId');
    const status = searchParams.get('status');

    let reviews = await ReviewService.getAllReviews();

    if (courseId) {
      reviews = reviews.filter(r => r.course_id === courseId);
    }

    if (status && status !== 'all') {
      reviews = reviews.filter(r => r.status === status);
    }

    const total = reviews.length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const pending = reviews.filter(r => r.status === 'pending').length;
    const rejected = reviews.filter(r => r.status === 'rejected').length;
    const avgRating = total > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / total).toFixed(1) : '5.0';

    return NextResponse.json({
      success: true,
      reviews,
      metrics: {
        total,
        approved,
        pending,
        rejected,
        averageRating: Number(avgRating),
      }
    });
  } catch (error) {
    console.error('Error fetching admin reviews:', error);
    return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/reviews
 * Moderate a review (change status: approved, pending, rejected, or toggle featured)
 */
export async function PATCH(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { id, status, featured } = body;

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const updates: any = {};
    if (status !== undefined) updates.status = status;
    if (featured !== undefined) updates.featured = Boolean(featured);

    const updated = await ReviewService.updateReview(id, updates);
    if (!updated) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, review: updated });
  } catch (error) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: 'Failed to update review' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/reviews
 * Delete a review
 */
export async function DELETE(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Review ID is required' }, { status: 400 });
    }

    const deleted = await ReviewService.deleteReview(id);
    if (!deleted) {
      return NextResponse.json({ error: 'Review not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, message: 'Review deleted successfully' });
  } catch (error) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: 'Failed to delete review' }, { status: 500 });
  }
}

/**
 * POST /api/admin/reviews
 * Create a review directly (Admin feature)
 */
export async function POST(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const body = await request.json();
    const { course_id, course_title, student_name, student_email, rating, title, content } = body;

    if (!course_id || !student_name || !rating || !content) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const review = await ReviewService.submitReview({
      course_id,
      course_title: course_title || 'Course',
      student_id: `admin_gen_${Date.now()}`,
      student_name,
      student_email: student_email || 'student@example.com',
      rating: Number(rating),
      title: title || '',
      content,
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('Error creating review via admin:', error);
    return NextResponse.json({ error: 'Failed to create review' }, { status: 500 });
  }
}
