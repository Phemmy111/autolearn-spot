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

  // Fetch all enrollments
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select(`
      *,
      learning_product:learning_products(title)
    `)
    .order('created_at', { ascending: false });

  const safeEnrollments = enrollments || [];

  // Fetch pending enrollments
  const { data: pendingEnrollments } = await supabaseAdmin
    .from('pending_enrollments')
    .select(`
      *,
      learning_product:learning_products(title)
    `)
    .order('created_at', { ascending: false });

  const safePendingEnrollments = pendingEnrollments || [];

  // Deduplicate by email and learning_product_id
  const enrolledKeys = new Set(safeEnrollments.map(e => `${e.email}:${e.learning_product_id}`));
  const uniquePendingEnrollments = safePendingEnrollments.filter(pending => {
    const key = `${pending.email}:${pending.learning_product_id}`;
    return !enrolledKeys.has(key);
  });

  const pendingMapped = uniquePendingEnrollments.map(pending => ({
    ...pending,
    is_pending: true,
    display_status: pending.payment_status === 'pending' ? 'Payment Pending' : 
                  pending.payment_status === 'expired' ? 'Expired' :
                  pending.payment_status === 'failed' ? 'Payment Failed' : pending.payment_status
  }));

  const allRecords = [
    ...safeEnrollments.map(e => ({ ...e, is_pending: false, display_status: e.status === 'active' ? 'Enrolled' : e.status })),
    ...pendingMapped
  ];

  let paidCount = 0;
  let pendingCount = 0;
  let expiredCount = 0;
  let failedCount = 0;
  let revenue = 0;

  safeEnrollments.forEach(en => {
    if (en.status === 'active') {
      paidCount++;
      revenue += (en.amount_paid || 0);
    } else if (en.status === 'pending') {
      pendingCount++;
    }
  });

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
    revenue: revenue / 100
  };

  return (
    <div className="min-h-screen bg-brand-bg">
      <div className="container mx-auto px-4 py-12">
        <div className="mb-12">
          <Link
            href="/admin"
            className="flex items-center gap-2 text-brand-text/70 hover:text-brand-text font-mono text-sm mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Admin Dashboard
          </Link>
          <div className="flex items-center gap-3">
            <Users className="h-8 w-8 text-[#10b981]" />
            <h1 className="font-heading text-4xl font-bold text-brand-text">Enrollments</h1>
          </div>
          <p className="font-mono text-sm text-brand-text/70 max-w-2xl mt-4">
            Manage student enrollments and view payments.
          </p>
        </div>

        <EnrollmentsTable 
          initialEnrollments={allRecords} 
          summary={summary}
        />
      </div>
    </div>
  );
}
