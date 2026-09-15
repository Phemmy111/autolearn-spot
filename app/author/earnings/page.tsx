import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { Wallet, ArrowUpRight, DollarSign, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function AuthorEarningsPage() {
  const { userId } = await auth();
  
  if (!userId) {
    return null;
  }

  // 1. Fetch Author DB profile
  const { data: author } = await supabaseAdmin
    .from('authors')
    .select('id')
    .eq('clerk_user_id', userId)
    .single();

  if (!author) {
    return (
      <div className="p-8 text-center text-brand-text/60">
        Author profile not found.
      </div>
    );
  }

  // 2. Fetch Earnings totals from financial summary API
  const earningsRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/author/financial-summary`, {
    cache: 'no-store'
  });
  const earningsData = await earningsRes.json();

  const totalGross = earningsData.total_sales || 0;
  const totalCommission = totalGross > 0 && earningsData.total_earnings > 0 ? totalGross - earningsData.total_earnings : 0;
  const totalNet = earningsData.total_earnings || 0;
  const availableBalance = earningsData.available_balance || 0;
  
  // Calculate pending balance (available balance + pending withdrawals)
  const pendingBalance = 0; // This would need to be calculated from pending withdrawals
  
  // Fetch withdrawals history for total withdrawn amount
  const { data: paidWithdrawals } = await supabaseAdmin
    .from('author_withdrawals')
    .select('amount, status')
    .eq('author_id', author.id)
    .eq('status', 'PAID');
  
  const totalWithdrawn = paidWithdrawals?.reduce((sum, w) => sum + w.amount, 0) || 0;

  // 4. Fetch Withdrawals History
  const { data: withdrawals } = await supabaseAdmin
    .from('author_withdrawals')
    .select('*')
    .eq('author_id', author.id)
    .order('created_at', { ascending: false });

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'COMPLETED': return <CheckCircle className="w-4 h-4 text-emerald-500" />;
      case 'PENDING': return <Clock className="w-4 h-4 text-amber-500" />;
      case 'FAILED': return <AlertCircle className="w-4 h-4 text-red-500" />;
      default: return <Clock className="w-4 h-4 text-neutral-500" />;
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-text mb-2">Earnings & Payouts</h1>
          <p className="text-brand-text/70">
            Track your revenue and manage your withdrawals.
          </p>
        </div>
        <div className="flex gap-3">
          <Link
            href="/author/bank"
            className="flex items-center gap-2 px-4 py-2 bg-sky-600 text-white rounded-lg hover:bg-sky-700 transition-colors shadow-sm font-medium text-sm"
          >
            <Wallet className="w-4 h-4" />
            Manage Bank
          </Link>
          <Link
            href="/author/transactions"
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors shadow-sm font-medium text-sm"
          >
            <ArrowUpRight className="w-4 h-4" />
            View Transactions
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="p-6 bg-gradient-to-br from-emerald-900/40 to-emerald-800/20 border border-emerald-900/50 rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Wallet className="w-5 h-5 text-emerald-400" />
            <span className="text-sm font-medium text-emerald-100">Available Balance</span>
          </div>
          <p className="text-4xl font-bold text-emerald-50">
            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(availableBalance)}
          </p>
        </div>
        
        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <DollarSign className="w-5 h-5 text-sky-600" />
            <span className="text-sm font-medium text-brand-text/70">Total Earned (Net)</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">
            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalNet)}
          </p>
        </div>
        
        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <ArrowUpRight className="w-5 h-5 text-neutral-400" />
            <span className="text-sm font-medium text-brand-text/70">Total Withdrawn</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">
            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalWithdrawn)}
          </p>
        </div>

        <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
          <div className="flex items-center gap-3 mb-2">
            <Clock className="w-5 h-5 text-amber-500" />
            <span className="text-sm font-medium text-brand-text/70">Pending Balance</span>
          </div>
          <p className="text-3xl font-bold text-brand-text">
            {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(pendingBalance)}
          </p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
        <h2 className="text-lg font-semibold text-brand-text mb-6">Revenue Breakdown</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="space-y-2">
            <p className="text-sm text-brand-text/70">Total Sales (Gross)</p>
            <p className="text-2xl font-bold text-brand-text">
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalGross)}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-brand-text/70">Platform Commission</p>
            <p className="text-2xl font-bold text-red-600">
              -{new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalCommission)}
            </p>
          </div>
          
          <div className="space-y-2">
            <p className="text-sm text-brand-text/70">Your Earnings (Net)</p>
            <p className="text-2xl font-bold text-emerald-600">
              {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(totalNet)}
            </p>
          </div>
        </div>

        {totalGross > 0 && (
          <div className="mt-6 pt-6 border-t border-brand-border">
            <div className="flex items-center justify-between text-sm">
              <span className="text-brand-text/70">Commission Rate</span>
              <span className="font-semibold text-brand-text">
                {totalGross > 0 ? ((totalCommission / totalGross) * 100).toFixed(1) : 0}%
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Withdrawals History */}
      <div className="p-6 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg">
        <h2 className="text-lg font-semibold text-brand-text mb-6">Withdrawal History</h2>
        
        {withdrawals && withdrawals.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-brand-border text-sm text-brand-text/60">
                  <th className="pb-3 font-medium">Date</th>
                  <th className="pb-3 font-medium">Amount</th>
                  <th className="pb-3 font-medium">Reference</th>
                  <th className="pb-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border text-sm">
                {withdrawals.map((w) => (
                  <tr key={w.id} className="hover:bg-brand-bg/50 transition-colors">
                    <td className="py-4 text-brand-text">
                      {new Date(w.created_at).toLocaleDateString('en-NG', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>
                    <td className="py-4 font-medium text-brand-text">
                      {new Intl.NumberFormat('en-NG', { style: 'currency', currency: 'NGN', maximumFractionDigits: 0 }).format(w.amount)}
                    </td>
                    <td className="py-4 text-brand-text/60 font-mono text-xs">{w.request_ref || w.id.split('-')[0]}</td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {getStatusIcon(w.status)}
                        <span className="font-medium text-brand-text text-xs uppercase">{w.status}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-brand-text/60">No withdrawals yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}
