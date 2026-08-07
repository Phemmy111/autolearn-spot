"use client";

import { useState } from 'react';
import { Search, RefreshCw, Loader2, CheckCircle2, XCircle } from 'lucide-react';

export function EnrollmentsTable({ initialEnrollments, cohorts, summary }: { initialEnrollments: any[], cohorts: any[], summary: any }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [isResyncing, setIsResyncing] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);

  const filtered = initialEnrollments.filter((en: { status: string; [key: string]: any }) => {
    const matchesSearch = en.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          en.payment_ref?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || en.status === statusFilter;
    const matchesCohort = cohortFilter === 'all' || en.cohort_id === cohortFilter;
    return matchesSearch && matchesStatus && matchesCohort;
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
      if (res.ok) {
        window.location.reload();
      } else {
        alert('Resync failed. Check console.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
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
        window.location.reload();
      } else {
        alert('Status update failed. Check console.');
      }
    } catch (err) {
      console.error(err);
      alert('Network error');
    } finally {
      setIsUpdatingStatus(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[var(--surface-hover)] border border-[var(--border-input)] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Total Paid</div>
          <div className="text-2xl font-bold text-[var(--primary)] mt-1">{summary.paid}</div>
        </div>
        <div className="bg-[var(--surface-hover)] border border-[var(--border-input)] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Pending</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">{summary.pending}</div>
        </div>
        <div className="bg-[var(--surface-hover)] border border-[var(--border-input)] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Refunded</div>
          <div className="text-2xl font-bold text-red-400 mt-1">{summary.refunded}</div>
        </div>
        <div className="bg-[var(--surface-hover)] border border-[var(--border-input)] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Revenue</div>
          <div className="text-2xl font-bold text-[var(--primary)] mt-1">₦{summary.revenue.toLocaleString()}</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#5d5f63]" />
          <input 
            type="text" 
            placeholder="Search email or reference..." 
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-[var(--surface-hover)] border border-[var(--border-input)] pl-10 pr-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)]"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active (Paid)</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <select 
          value={cohortFilter}
          onChange={e => setCohortFilter(e.target.value)}
          className="bg-[var(--surface-hover)] border border-[var(--border-input)] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[var(--primary)]"
        >
          <option value="all">All Cohorts</option>
          {cohorts.map((c: { id: string; name: string }) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[var(--border-input)] bg-[var(--surface-hover)] rounded">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-[var(--border-default)] border-b border-[var(--border-input)] text-[#b9cacb]">
            <tr>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Cohort</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((en: { id: string; email: string; status: string; cohort_id: string; created_at: string }) => (
              <tr key={en.id} className="border-b border-[var(--border-input)]/50 hover:bg-[var(--border-default)]/50">
                <td className="px-4 py-3 text-white">{en.email}</td>
                <td className="px-4 py-3 text-[#b9cacb]">{en.cohort?.name || en.cohort_id}</td>
                <td className="px-4 py-3 text-[#5d5f63]">{en.payment_ref || 'N/A'}</td>
                <td className="px-4 py-3 text-[var(--primary)]">
                  {en.amount_paid ? `₦${en.amount_paid.toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase font-bold ${
                    en.status === 'active' ? 'bg-[var(--primary)]/10 text-[var(--primary)]' :
                    en.status === 'pending' ? 'bg-yellow-400/10 text-yellow-400' :
                    en.status === 'inactive' ? 'bg-gray-400/10 text-gray-400' :
                    'bg-red-400/10 text-red-400'
                  }`}>
                    {en.status === 'active' && <CheckCircle2 className="h-3 w-3" />}
                    {en.status === 'pending' && <Loader2 className="h-3 w-3" />}
                    {en.status === 'inactive' && <XCircle className="h-3 w-3" />}
                    {en.status === 'refunded' && <XCircle className="h-3 w-3" />}
                    {en.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {en.payment_ref && (
                      <button 
                        onClick={() => handleResync(en.payment_ref)}
                        disabled={isResyncing === en.payment_ref}
                        className="inline-flex items-center gap-1 border border-[var(--border-input)] px-2 py-1 text-xs text-[#b9cacb] hover:text-white hover:border-white transition-colors disabled:opacity-50"
                        title="Re-fetch from Paystack"
                      >
                        {isResyncing === en.payment_ref ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Resync
                      </button>
                    )}
                    
                    {en.status === 'active' ? (
                      <button 
                        onClick={() => handleUpdateStatus(en.id, 'inactive')}
                        disabled={isUpdatingStatus === en.id}
                        className="inline-flex items-center gap-1 border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:text-white hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {isUpdatingStatus === en.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                        Deactivate
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleUpdateStatus(en.id, 'active')}
                        disabled={isUpdatingStatus === en.id}
                        className="inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400 hover:text-white hover:bg-emerald-500/30 transition-colors disabled:opacity-50"
                      >
                        {isUpdatingStatus === en.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                        Reactivate
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-[#5d5f63]">
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
