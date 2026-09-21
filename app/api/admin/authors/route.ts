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

    // Fetch real statistics for each author
    const authorsWithStats = await Promise.all(
      (authors || []).map(async (author) => {
        // Count products
        const { count: productCount } = await supabaseAdmin
          .from('learning_products')
          .select('*', { count: 'exact', head: true })
          .eq('author_id', author.id);

        // Count students (enrollments in author's products)
        const { data: authorProducts } = await supabaseAdmin
          .from('learning_products')
          .select('id')
          .eq('author_id', author.id);

        const productIds = authorProducts?.map(p => p.id) || [];
        let studentCount = 0;

        if (productIds.length > 0) {
          const { count: enrollmentCount } = await supabaseAdmin
            .from('enrollments')
            .select('*', { count: 'exact', head: true })
            .in('learning_product_id', productIds);
          studentCount = enrollmentCount || 0;
        }

        // Get revenue from author_earnings
        const totalRevenue = author.author_earnings?.[0]?.total_gross || 0;

        return {
          ...author,
          _stats: {
            products: productCount || 0,
            students: studentCount,
            revenue: totalRevenue,
          },
        };
      })
    );

    // Count by status for statistics
    const [{ count: total }, { count: active }, { count: pending }] = await Promise.all([
      supabaseAdmin.from('authors').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('authors').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED'),
    ]);

    // Calculate total revenue from all authors
    const { data: allEarnings } = await supabaseAdmin
      .from('author_earnings')
      .select('total_gross');

    const totalRevenue = allEarnings?.reduce((sum, e) => sum + (e.total_gross || 0), 0) || 0;

    return NextResponse.json({
      authors: authorsWithStats,
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
        totalRevenue: totalRevenue,
      },
    });
  } catch (error) {
    console.error('Error in admin authors API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
