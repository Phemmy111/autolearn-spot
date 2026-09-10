import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    let query = supabaseAdmin
      .from('author_applications')
      .select('*', { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`full_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('submitted_at', { ascending: false });

    const { data: applications, error, count } = await query;

    if (error) {
      console.error('Error fetching author applications:', error);
      return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
    }

    // Count by status for statistics
    const [{ count: total }, { count: submitted }, { count: underReview }, { count: approved }, { count: declined }] = await Promise.all([
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED'),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'UNDER_REVIEW'),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'DECLINED'),
    ]);

    return NextResponse.json({
      applications,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        totalApplications: total || 0,
        submitted: submitted || 0,
        underReview: underReview || 0,
        approved: approved || 0,
        declined: declined || 0,
      },
    });
  } catch (error) {
    console.error('Error in admin author applications API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
