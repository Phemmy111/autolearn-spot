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
    // Get author statistics
    const [
      { count: totalAuthors },
      { count: activeAuthors },
      { count: suspendedAuthors },
    ] = await Promise.all([
      supabaseAdmin.from('authors').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('authors').select('*', { count: 'exact', head: true }).eq('status', 'ACTIVE'),
      supabaseAdmin.from('authors').select('*', { count: 'exact', head: true }).eq('status', 'SUSPENDED'),
    ]);

    // Get application statistics
    const [
      { count: totalApplications },
      { count: submittedApplications },
      { count: underReviewApplications },
      { count: approvedApplications },
      { count: declinedApplications },
    ] = await Promise.all([
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'SUBMITTED'),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'UNDER_REVIEW'),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'APPROVED'),
      supabaseAdmin.from('author_applications').select('*', { count: 'exact', head: true }).eq('status', 'DECLINED'),
    ]);

    // Get revenue statistics
    const { data: earningsData } = await supabaseAdmin
      .from('author_earnings')
      .select('total_gross, total_net');

    const totalAuthorRevenue = earningsData?.reduce((sum, e) => sum + (parseFloat(e.total_gross) || 0), 0) || 0;
    const totalAuthorEarnings = earningsData?.reduce((sum, e) => sum + (parseFloat(e.total_net) || 0), 0) || 0;

    // Get monthly revenue trend (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const { data: monthlyRevenue } = await supabaseAdmin
      .from('author_sales')
      .select('created_at, gross_amount')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    // Group by month
    const monthlyTrend = monthlyRevenue?.reduce((acc, sale) => {
      const month = new Date(sale.created_at).toISOString().slice(0, 7); // YYYY-MM
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += parseFloat(sale.gross_amount) || 0;
      return acc;
    }, {} as Record<string, number>) || {};

    // Get author growth trend (last 6 months)
    const { data: authorGrowth } = await supabaseAdmin
      .from('authors')
      .select('created_at')
      .gte('created_at', sixMonthsAgo.toISOString())
      .order('created_at', { ascending: true });

    const authorGrowthTrend = authorGrowth?.reduce((acc, author) => {
      const month = new Date(author.created_at).toISOString().slice(0, 7);
      if (!acc[month]) {
        acc[month] = 0;
      }
      acc[month] += 1;
      return acc;
    }, {} as Record<string, number>) || {};

    return NextResponse.json({
      authors: {
        total: totalAuthors || 0,
        active: activeAuthors || 0,
        suspended: suspendedAuthors || 0,
      },
      applications: {
        total: totalApplications || 0,
        submitted: submittedApplications || 0,
        underReview: underReviewApplications || 0,
        approved: approvedApplications || 0,
        declined: declinedApplications || 0,
      },
      revenue: {
        totalAuthorRevenue,
        totalAuthorEarnings,
      },
      trends: {
        monthlyRevenue: Object.entries(monthlyTrend).map(([month, amount]) => ({ month, amount })),
        authorGrowth: Object.entries(authorGrowthTrend).map(([month, count]) => ({ month, count })),
      },
    });
  } catch (error) {
    console.error('Error in admin authors statistics API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
