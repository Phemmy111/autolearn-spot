import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/student/enrolled-courses
 * Get courses the student is enrolled in with author info
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get student's enrollments
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('cohort_id')
      .eq('clerk_user_id', userId)
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    const cohortIds = enrollments.map(e => e.cohort_id);

    // Get learning products for these cohorts
    const { data: cohorts } = await supabaseAdmin
      .from('cohorts')
      .select('learning_product_id')
      .in('id', cohortIds);

    if (!cohorts || cohorts.length === 0) {
      return NextResponse.json({ success: true, courses: [] });
    }

    const productIds = cohorts.map(c => c.learning_product_id).filter(Boolean);

    // Get products with author info
    const { data: products } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, author_id')
      .in('id', productIds);

    // Get author names separately since author_id is TEXT in learning_products
    const authorIds = products?.map(p => p.author_id).filter(Boolean) || [];
    const { data: authors } = authorIds.length > 0
      ? await supabaseAdmin
          .from('authors')
          .select('id, display_name')
          .in('id', authorIds)
      : { data: [] };

    const authorMap = new Map(authors?.map(a => [a.id, a.display_name]) || []);

    const courses = products?.map(product => ({
      id: product.id,
      title: product.title,
      author_id: product.author_id,
      author_name: authorMap.get(product.author_id) || 'Unknown Author',
    })) || [];

    return NextResponse.json({ success: true, courses });
  } catch (error) {
    console.error('Error in enrolled courses API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}