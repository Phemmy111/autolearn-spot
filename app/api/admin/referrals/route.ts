import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { ReferralService } from '@/lib/growth-engine/ReferralService';
import { logAuditEvent } from '@/lib/audit-logging';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const adminUser = await requireAdmin();
    if (!adminUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const cohortId = searchParams.get('cohortId') || undefined;
    const ownerId = searchParams.get('ownerId') || undefined;
    const code = searchParams.get('code') || undefined;
    const status = searchParams.get('status') || undefined;
    const startDateStr = searchParams.get('startDate');
    const endDateStr = searchParams.get('endDate');

    const startDate = startDateStr ? new Date(startDateStr) : undefined;
    const endDate = endDateStr ? new Date(endDateStr) : undefined;

    const codes = await ReferralService.listAllReferralCodes({
      ownerId,
      code,
      status,
      startDate,
      endDate
    });

    let resultCodes = codes;

    // Filter by cohort if requested (requires joining enrollments)
    if (cohortId && codes.length > 0) {
      const { data: enrollments } = await supabaseAdmin
        .from('enrollments')
        .select('user_id')
        .eq('cohort_id', cohortId);
      
      const enrolledUserIds = new Set(enrollments?.map(e => e.user_id) || []);
      resultCodes = resultCodes.filter(c => enrolledUserIds.has(c.owner_id));
    }

    // Resolve owner emails and names for the admin dashboard
    // Note: We are mocking names/emails for now or joining via another table if needed.
    // In AutoLearn Spot, user profile data might be in enrollments or clerk.
    // We will do a basic merge if we have their data in enrollments.
    const ownerIds = [...new Set(resultCodes.map(c => c.owner_id))];
    const { data: profiles } = await supabaseAdmin
      .from('enrollments')
      .select('user_id, email, first_name, last_name')
      .in('user_id', ownerIds);
      
    const profileMap = new Map();
    if (profiles) {
      profiles.forEach(p => {
        // Keep the latest or first enrollment's data
        if (!profileMap.has(p.user_id)) {
          profileMap.set(p.user_id, {
            email: p.email,
            name: `${p.first_name || ''} ${p.last_name || ''}`.trim() || 'Unknown'
          });
        }
      });
    }

    const formattedCodes = resultCodes.map(c => ({
      id: c.id,
      code: c.code,
      ownerId: c.owner_id,
      ownerEmail: profileMap.get(c.owner_id)?.email || 'Unknown',
      ownerName: profileMap.get(c.owner_id)?.name || 'Unknown',
      status: c.status,
      totalClicks: c.total_clicks || 0,
      totalRegistrations: c.total_registrations || 0,
      createdAt: c.created_at
    }));

    // Log the action
    await logAuditEvent({
      event_type: 'admin_activity',
      event_category: 'status_change', // Fallback, could be something else
      event_action: 'admin_referral_list_viewed',
      user_id: adminUser.id,
      user_email: adminUser.emailAddresses[0]?.emailAddress,
      resource_type: 'referral',
      description: 'Admin viewed referral list',
      metadata: { filters: Object.fromEntries(searchParams.entries()) }
    });

    return NextResponse.json({
      success: true,
      total: formattedCodes.length,
      referralCodes: formattedCodes
    });

  } catch (error) {
    console.error('[GET /api/admin/referrals] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
