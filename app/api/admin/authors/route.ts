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
    const skill = searchParams.get('skill');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Build query
    let query = supabaseAdmin
      .from('authors')
      .select(`
        *,
        author_earnings (
          total_gross,
          total_commission,
          total_net
        )
      `, { count: 'exact' });

    // Apply filters
    if (status) {
      query = query.eq('status', status);
    }

    if (search) {
      query = query.or(`display_name.ilike.%${search}%,email.ilike.%${search}%`);
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to).order('created_at', { ascending: false });

    const { data: authors, error, count } = await query;

    if (error) {
      console.error('Error fetching authors:', error);
      return NextResponse.json({ error: 'Failed to fetch authors' }, { status: 500 });
    }

    // Count by status for statistics
    const [{ count: total }, { count: active }, { count: pending }] = await Promise.all([
      supabaseAdmin.from('authors').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('authors').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED'),
    ]);

    return NextResponse.json({
      authors,
      pagination: {
        page,
        limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
      },
      statistics: {
        totalAuthors: total || 0,
        activeAuthors: active || 0,
        pendingApplications: pending || 0,
      },
    });
  } catch (error) {
    console.error('Error in admin authors API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
