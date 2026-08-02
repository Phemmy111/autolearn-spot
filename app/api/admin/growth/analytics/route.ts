import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { data: analytics, error } = await supabaseAdmin
      .from('growth_analytics')
      .select('*')
      .order('snapshot_date', { ascending: false })
      .limit(30); // Get last 30 days

    if (error) {
      console.error('[GET /api/admin/growth/analytics] DB Error:', error);
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Since we don't have a background CRON job running right now in this implementation,
    // we'll quickly compute real-time totals if no analytics rows exist
    let currentStats = {
      total_referrals: 0,
      total_commissions: 0,
      total_commission_amount: 0,
      total_withdrawals: 0,
      total_withdrawal_amount: 0,
      active_ambassadors: 0,
    };

    const { data: refs } = await supabaseAdmin.from('referral_clicks').select('id', { count: 'exact' });
    const { data: comms } = await supabaseAdmin.from('commissions').select('amount');
    const { data: withdraws } = await supabaseAdmin.from('withdrawals').select('amount').eq('status', 'paid');
    const { data: ambs } = await supabaseAdmin.from('ambassadors').select('id', { count: 'exact' }).eq('status', 'active');

    currentStats.total_referrals = refs?.length || 0;
    if (comms) {
      currentStats.total_commissions = comms.length;
      currentStats.total_commission_amount = comms.reduce((a, b) => a + (b.amount || 0), 0);
    }
    if (withdraws) {
      currentStats.total_withdrawals = withdraws.length;
      currentStats.total_withdrawal_amount = withdraws.reduce((a, b) => a + (b.amount || 0), 0);
    }
    currentStats.active_ambassadors = ambs?.length || 0;

    return NextResponse.json({ 
      success: true, 
      analytics,
      realtimeStats: currentStats
    });
  } catch (error) {
    console.error('[GET /api/admin/growth/analytics] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
