"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function EnrollmentsTable({ initialEnrollments, summary }: { 
  initialEnrollments: any[], 
  summary: {
    paid: number;
    pending: number;
    expired: number;
    failed: number;
    revenue: number;
  }
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isResyncing, setIsResyncing] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const filtered = initialEnrollments.filter((en: any) => {
    const matchesSearch = en.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          en.payment_ref?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          en.full_name?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || en.display_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleResync = async (reference: string) => {
    if (!reference) return;
    setIsResyncing(reference);
    try {
      const res = await fetch('/api/admin/payments/resync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reference })
      });
      const data = await res.json();
      if (res.ok) {
        setToast({ message: 'Payment resynced successfully', type: 'success' });
        router.refresh();
      } else {
        setToast({ message: data.error || 'Resync failed. Check console.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setIsResyncing(null);
    }
  };

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    setIsUpdatingStatus(id);
    try {
      const res = await fetch(`/api/admin/enrollments/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        setToast({ message: 'Status updated successfully', type: 'success' });
        router.refresh();
      } else {
        setToast({ message: 'Status update failed. Check console.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 font-mono text-sm font-bold rounded z-50 ${
          toast.type === 'success' ? 'bg-brand-bg/20 text-[#10b981] border border-[#10b981]' : 'bg-red-500/20 text-red-400 border border-red-500'
        }`}>
          {toast.message}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-brand-bg border border-[#3b494b] p-4 rounded text-center">
          <div className="text-brand-text/70 font-mono text-xs uppercase">Total Paid</div>
          <div className="text-2xl font-bold text-[#10b981] mt-1">{summary.paid}</div>
        </div>
        <div className="bg-brand-bg border border-[#3b494b] p-4 rounded text-center">
          <div className="text-brand-text/70 font-mono text-xs uppercase">Payment Pending</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">{summary.pending}</div>
        </div>
        <div className="bg-brand-bg border border-[#3b494b] p-4 rounded text-center">
          <div className="text-brand-text/70 font-mono text-xs uppercase">Expired</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{summary.expired}</div>
        </div>
        <div className="bg-brand-bg border border-[#3b494b] p-4 rounded text-center">
          <div className="text-brand-text/70 font-mono text-xs uppercase">Payment Failed</div>
          <div className="text-2xl font-bold text-red-400 mt-1">{summary.failed}</div>
        </div>
        <div className="bg-brand-bg border border-[#3b494b] p-4 rounded text-center">
          <div className="text-brand-text/70 font-mono text-xs uppercase">Revenue</div>
          <div className="text-2xl font-bold text-[#10b981] mt-1">₦{summary.revenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-text/60" />
          <input 
            type="text" 
            placeholder="Search email, name or reference..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-brand-bg border border-[#3b494b] pl-10 pr-4 py-2 font-mono text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-brand-bg border border-[#3b494b] px-4 py-2 font-mono text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
        >
          <option value="all">All Statuses</option>
          <option value="Enrolled">Enrolled</option>
          <option value="Payment Pending">Payment Pending</option>
          <option value="Expired">Expired</option>
          <option value="Payment Failed">Payment Failed</option>
          <option value="refunded">Refunded</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#3b494b] bg-brand-bg rounded">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-brand-bg border-b border-[#3b494b] text-brand-text/70">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Course</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((en: any) => {
              const courseTitle = en.learning_product?.title || 
                (Array.isArray(en.learning_product) ? en.learning_product[0]?.title : 'Unknown Course');
              const amount = en.amount_paid || en.payment_amount || 0;
              const date = en.activated_at || en.enrolled_at || en.created_at;
              return (
                <tr key={en.id} className="border-b border-[#3b494b]/50 hover:bg-brand-bg/50">
                  <td className="px-4 py-3 text-brand-text">{en.full_name || (en.first_name ? `${en.first_name} ${en.last_name || ''}`.trim() : 'N/A')}</td>
                  <td className="px-4 py-3 text-brand-text/70">{en.email}</td>
                  <td className="px-4 py-3 text-brand-text/60">{courseTitle}</td>
                  <td className="px-4 py-3 text-[#10b981]">₦{amount.toLocaleString()}</td>
                  <td className="px-4 py-3 text-brand-text/60">{date ? new Date(date).toLocaleDateString() : 'N/A'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase font-bold ${
                      en.display_status === 'Enrolled' ? 'bg-brand-bg/10 text-[#10b981]' :
                      en.display_status === 'Payment Pending' ? 'bg-yellow-400/10 text-yellow-400' :
                      en.display_status === 'Expired' ? 'bg-gray-400/10 text-gray-400' :
                      en.display_status === 'Payment Failed' ? 'bg-red-400/10 text-red-400' :
                      'bg-red-400/10 text-red-400'
                    }`}>
                      {en.display_status === 'Enrolled' && <CheckCircle2 className="h-3 w-3" />}
                      {en.display_status === 'Payment Pending' && <Loader2 className="h-3 w-3" />}
                      {en.display_status === 'Expired' && <XCircle className="h-3 w-3" />}
                      {en.display_status === 'Payment Failed' && <XCircle className="h-3 w-3" />}
                      {en.display_status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {en.payment_ref && !en.is_pending && (
                        <button 
                          onClick={() => handleResync(en.payment_ref)}
                          disabled={isResyncing === en.payment_ref}
                          className="inline-flex items-center gap-1 border border-[#3b494b] px-2 py-1 text-xs text-brand-text/70 hover:text-brand-text hover:border-white transition-colors disabled:opacity-50"
                          title="Re-fetch from Paystack"
                        >
                          {isResyncing === en.payment_ref ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          Resync
                        </button>
                      )}
                      
                      {!en.is_pending && en.status === 'active' && (
                        <button
                          onClick={() => handleUpdateStatus(en.id, 'inactive')}
                          disabled={isUpdatingStatus === en.id}
                          className="inline-flex items-center gap-1 border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:text-brand-text hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {isUpdatingStatus === en.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                          Deactivate
                        </button>
                      )}
                      {!en.is_pending && en.status === 'inactive' && (
                        <button
                          onClick={() => handleUpdateStatus(en.id, 'active')}
                          disabled={isUpdatingStatus === en.id}
                          className="inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400 hover:text-brand-text hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                        >
                          {isUpdatingStatus === en.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                          Reactivate
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-brand-text/60">
                  No enrollments found matching filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
