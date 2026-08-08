import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { EnrollmentsTable } from '@/components/admin/EnrollmentsTable';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function AdminEnrollmentsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  // Fetch current active cohort
  const { data: currentCohort } = await supabaseAdmin
    .from('cohorts')
    .select('*')
    .eq('is_current', true)
    .eq('status', 'active')
    .single();

  // Fetch all cohorts for the filter
  const { data: cohorts } = await supabaseAdmin
    .from('cohorts')
    .select('id, name, is_current, price_ngn, start_date, end_date, status')
    .order('created_at', { ascending: false });

  // Fetch student count for current cohort
  const { count: studentCount } = await supabaseAdmin
    .from('enrollments')
    .select('id', { count: 'exact', head: true })
    .eq('cohort_id', currentCohort?.id)
    .eq('status', 'active');

  // Fetch all enrollments with cohort data
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      cohort:cohorts (id, name, slug)
    `)
    .order('created_at', { ascending: false });

  const safeEnrollments = enrollments || [];

  // Fetch pending enrollments
  const { data: pendingEnrollments } = await supabaseAdmin
    .from('pending_enrollments')
    .select('*')
    .order('created_at', { ascending: false });

  const safePendingEnrollments = pendingEnrollments || [];

  // Merge enrollments and pending enrollments, deduplicating by email AND cohort
  // If email+cohort exists in both enrollments and pending_enrollments, show as Enrolled (not Payment Pending)
  // This allows students enrolled in Cohort 1 to register for Cohort 2
  const enrolledKeys = new Set(safeEnrollments.map(e => `${e.email}:${e.cohort_id}`));
  const uniquePendingEnrollments = safePendingEnrollments.filter(pending => {
    const pendingCohortId = currentCohort?.id;
    const key = `${pending.email}:${pendingCohortId}`;
    return !enrolledKeys.has(key);
  });

  // Attach current cohort info to pending enrollments for display
  const pendingWithCohort = uniquePendingEnrollments.map(pending => ({
    ...pending,
    cohort: currentCohort,
    cohort_id: currentCohort?.id,
    is_pending: true,
    display_status: pending.payment_status === 'pending' ? 'Payment Pending' : 
                  pending.payment_status === 'expired' ? 'Expired' :
                  pending.payment_status === 'failed' ? 'Payment Failed' : pending.payment_status
  }));

  // Combine all records for display
  const allRecords = [
    ...safeEnrollments.map(e => ({ ...e, is_pending: false, display_status: e.status === 'active' ? 'Enrolled' : e.status })),
    ...pendingWithCohort
  ];

  // Calculate Summary Statistics
  let paidCount = 0;
  let pendingCount = 0;
  let expiredCount = 0;
  let failedCount = 0;
  let refundedCount = 0;
  let revenue = 0;

  safeEnrollments.forEach(en => {
    if (en.status === 'active') {
      paidCount++;
      revenue += (en.amount_paid || 0);
    } else if (en.status === 'pending') {
      pendingCount++;
    } else if (en.status === 'refunded') {
      refundedCount++;
    }
  });

  // Count pending enrollments from pending_enrollments table
  uniquePendingEnrollments.forEach(pending => {
    if (pending.payment_status === 'pending') {
      pendingCount++;
    } else if (pending.payment_status === 'expired') {
      expiredCount++;
    } else if (pending.payment_status === 'failed') {
      failedCount++;
    }
  });

  const summary = {
    paid: paidCount,
    pending: pendingCount,
    expired: expiredCount,
    failed: failedCount,
    refunded: refundedCount,
    revenue: revenue / 100 // assuming amount is stored in kobo/cents. If raw NGN, remove / 100
  };

  // Adjust if amount is stored in whole Naira in the DB 
  // Looking at our webhook, Paystack sends in kobo, so / 100 is correct for NGN display.
  
  return (
    <div className="min-h-screen bg-[#0a0c10]">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-[#b9cacb] hover:text-white font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-[#00f0ff]" />
            <h1 className="font-heading text-4xl font-bold text-white">Enrollments</h1>
          </div>
          <p className="font-mono text-sm text-[#b9cacb] max-w-2xl mt-4">
            Manage student enrollments, view payments, and resync webhook data.
          </p>
        </div>

        <EnrollmentsTable 
          initialEnrollments={allRecords} 
          cohorts={cohorts || []} 
          summary={summary}
          currentCohort={currentCohort}
          studentCount={studentCount || 0}
        />
      </div>
    </div>
  );
}