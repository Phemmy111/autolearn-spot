import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/student/live-classes
 * Get live classes for products the student has access to
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
      return NextResponse.json({ success: true, liveClasses: [] });
    }

    const cohortIds = enrollments.map(e => e.cohort_id);

    // Get learning products for these cohorts
    const { data: cohorts } = await supabaseAdmin
      .from('cohorts')
      .select('learning_product_id')
      .in('id', cohortIds);

    if (!cohorts || cohorts.length === 0) {
      return NextResponse.json({ success: true, liveClasses: [] });
    }

    const productIds = cohorts.map(c => c.learning_product_id).filter(Boolean);

    // Get live classes for these products
    const { data: liveClasses, error } = await supabaseAdmin
      .from('live_classes')
      .select(`
        *,
        learning_products (
          id,
          title,
          thumbnail
        )
      `)
      .in('learning_product_id', productIds)
      .in('status', ['SCHEDULED', 'LIVE'])
      .order('scheduled_start', { ascending: true });

    if (error) {
      console.error('Error fetching live classes:', error);
      return NextResponse.json({ error: 'Failed to fetch live classes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, liveClasses });
  } catch (error) {
    console.error('Error in live classes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}