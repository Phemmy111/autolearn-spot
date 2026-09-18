import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/students
 * Get students enrolled in author's products
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
      .select('id, clerk_user_id, full_name, email, cohort_id')
      .in('cohort_id', cohortIds)
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) {
      return NextResponse.json({ success: true, students: [] });
    }

    // Create a map of cohort to product
    const cohortToProduct = new Map(cohorts.map(c => [c.id, c.learning_product_id]));

    // Group students by product
    const studentsByProduct = enrollments.map(enrollment => ({
      student_id: enrollment.clerk_user_id,
      full_name: enrollment.full_name || enrollment.email || 'Unknown',
      email: enrollment.email,
      product_id: cohortToProduct.get(enrollment.cohort_id),
      product_title: products.find(p => p.id === cohortToProduct.get(enrollment.cohort_id))?.title || 'Unknown',
    }));

    return NextResponse.json({ success: true, students: studentsByProduct });
  } catch (error) {
    console.error('Error in students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}