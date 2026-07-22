import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Users } from 'lucide-react';
import { EnrollmentsTable } from '@/components/admin/EnrollmentsTable';

export const dynamic = 'force-dynamic';

export default async function AdminEnrollmentsPage() {
  try {
    await requireAdmin();
  } catch (error) {
    redirect('/');
  }

  // Fetch all cohorts for the filter
  const { data: cohorts } = await supabaseAdmin
    .from('cohorts')
    .select('id, name, is_current')
    .order('created_at', { ascending: false });

  // Fetch all enrollments with cohort data
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      cohort:cohorts (id, name, slug)
    `)
    .order('created_at', { ascending: false });

  const safeEnrollments = enrollments || [];

  // Calculate Summary Statistics
  let paidCount = 0;
  let pendingCount = 0;
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

  const summary = {
    paid: paidCount,
    pending: pendingCount,
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
          initialEnrollments={safeEnrollments} 
          cohorts={cohorts || []} 
          summary={summary}
        />
      </div>
    </div>
  );
}
