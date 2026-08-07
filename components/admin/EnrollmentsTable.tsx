"use client";

import { useState } from 'react';
import { Search, RefreshCw, Loader2, CheckCircle2, XCircle, Plus, ChevronDown } from 'lucide-react';

export function EnrollmentsTable({ initialEnrollments, cohorts, summary, currentCohort, studentCount }: { 
  initialEnrollments: any[], 
  cohorts: any[], 
  summary: any,
  currentCohort: any,
  studentCount: number
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [isResyncing, setIsResyncing] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showActivateModal, setShowActivateModal] = useState(false);

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
      {/* Current Enrollment Cohort Section */}
      <div className="bg-[#1a1d24] border border-[#3b494b] p-6 rounded">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-lg font-bold text-white">Current Enrollment Cohort</h2>
          <div className="flex gap-2">
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 bg-[#00f0ff] text-[#0a0c10] px-4 py-2 font-mono text-sm font-bold hover:bg-[#00f0ff]/80 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Cohort
            </button>
            <button
              onClick={() => setShowActivateModal(true)}
              className="inline-flex items-center gap-2 border border-[#3b494b] px-4 py-2 font-mono text-sm text-[#b9cacb] hover:text-white hover:border-white transition-colors"
            >
              Activate Another Cohort
            </button>
          </div>
        </div>
        
        {currentCohort ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Current Cohort</div>
              <div className="text-white font-bold">{currentCohort.name}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Status</div>
              <div className="text-[#00f0ff] font-bold uppercase">{currentCohort.status}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Registration Fee</div>
              <div className="text-white font-bold">₦{currentCohort.price_ngn?.toLocaleString() || '0'}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Students</div>
              <div className="text-white font-bold">{studentCount}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Start Date</div>
              <div className="text-white font-bold">{currentCohort.start_date ? new Date(currentCohort.start_date).toLocaleDateString() : 'TBD'}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">End Date</div>
              <div className="text-white font-bold">{currentCohort.end_date ? new Date(currentCohort.end_date).toLocaleDateString() : 'TBD'}</div>
            </div>
          </div>
        ) : (
          <div className="text-[#5d5f63] font-mono text-sm">No active cohort found. Please create or activate a cohort.</div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-[#1a1d24] border border-[#3b494b] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Total Paid</div>
          <div className="text-2xl font-bold text-[#00f0ff] mt-1">{summary.paid}</div>
        </div>
        <div className="bg-[#1a1d24] border border-[#3b494b] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Pending</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">{summary.pending}</div>
        </div>
        <div className="bg-[#1a1d24] border border-[#3b494b] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Refunded</div>
          <div className="text-2xl font-bold text-red-400 mt-1">{summary.refunded}</div>
        </div>
        <div className="bg-[#1a1d24] border border-[#3b494b] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Revenue</div>
          <div className="text-2xl font-bold text-[#00f0ff] mt-1">₦{summary.revenue.toLocaleString()}</div>
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
            className="w-full bg-[#1a1d24] border border-[#3b494b] pl-10 pr-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
          />
        </div>
        <select 
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="bg-[#1a1d24] border border-[#3b494b] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
        >
          <option value="all">All Statuses</option>
          <option value="active">Active (Paid)</option>
          <option value="pending">Pending</option>
          <option value="refunded">Refunded</option>
        </select>
        <select 
          value={cohortFilter}
          onChange={e => setCohortFilter(e.target.value)}
          className="bg-[#1a1d24] border border-[#3b494b] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
        >
          <option value="all">All Cohorts</option>
          {cohorts.map((c: { id: string; name: string }) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#3b494b] bg-[#1a1d24] rounded">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-[#1f2229] border-b border-[#3b494b] text-[#b9cacb]">
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
              <tr key={en.id} className="border-b border-[#3b494b]/50 hover:bg-[#1f2229]/50">
                <td className="px-4 py-3 text-white">{en.email}</td>
                <td className="px-4 py-3 text-[#b9cacb]">{en.cohort?.name || en.cohort_id}</td>
                <td className="px-4 py-3 text-[#5d5f63]">{en.payment_ref || 'N/A'}</td>
                <td className="px-4 py-3 text-[#00f0ff]">
                  {en.amount_paid ? `₦${en.amount_paid.toLocaleString()}` : '-'}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase font-bold ${
                    en.status === 'active' ? 'bg-[#00f0ff]/10 text-[#00f0ff]' :
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
                        className="inline-flex items-center gap-1 border border-[#3b494b] px-2 py-1 text-xs text-[#b9cacb] hover:text-white hover:border-white transition-colors disabled:opacity-50"
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

      {/* Create Cohort Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1d24] border border-[#3b494b] p-6 rounded max-w-md w-full mx-4">
            <h3 className="font-heading text-xl font-bold text-white mb-4">Create New Cohort</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              const cohortData = {
                name: formData.get('name') as string,
                slug: formData.get('slug') as string,
                price_ngn: parseFloat(formData.get('price_ngn') as string),
                start_date: formData.get('start_date') as string || null,
                end_date: formData.get('end_date') as string || null,
                status: formData.get('status') as string,
                timezone: formData.get('timezone') as string,
                is_current: false
              };
              
              try {
                const res = await fetch('/api/admin/cohorts', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(cohortData)
                });
                if (res.ok) {
                  window.location.reload();
                } else {
                  alert('Failed to create cohort');
                }
              } catch (err) {
                console.error(err);
                alert('Network error');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Cohort Name</label>
                  <input name="name" required className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Slug</label>
                  <input name="slug" required className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Registration Fee (₦)</label>
                  <input name="price_ngn" type="number" required className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Start Date</label>
                  <input name="start_date" type="date" className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">End Date</label>
                  <input name="end_date" type="date" className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Status</label>
                  <select name="status" required className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]">
                    <option value="draft">Draft</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Timezone</label>
                  <input name="timezone" defaultValue="Africa/Lagos" className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setShowCreateModal(false)} className="flex-1 border border-[#3b494b] px-4 py-2 font-mono text-sm text-[#b9cacb] hover:text-white hover:border-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 bg-[#00f0ff] text-[#0a0c10] px-4 py-2 font-mono text-sm font-bold hover:bg-[#00f0ff]/80 transition-colors">
                    Create Cohort
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Activate Cohort Modal */}
      {showActivateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1d24] border border-[#3b494b] p-6 rounded max-w-md w-full mx-4">
            <h3 className="font-heading text-xl font-bold text-white mb-4">Activate Cohort</h3>
            <p className="text-[#b9cacb] font-mono text-sm mb-4">Select a cohort to make it the current active cohort:</p>
            <div className="space-y-2 mb-4">
              {cohorts.filter((c: any) => !c.is_current).map((cohort: any) => (
                <button
                  key={cohort.id}
                  onClick={async () => {
                    try {
                      const res = await fetch(`/api/admin/cohorts/${cohort.id}/activate`, {
                        method: 'POST'
                      });
                      if (res.ok) {
                        window.location.reload();
                      } else {
                        alert('Failed to activate cohort');
                      }
                    } catch (err) {
                      console.error(err);
                      alert('Network error');
                    }
                  }}
                  className="w-full text-left bg-[#0a0c10] border border-[#3b494b] px-4 py-3 font-mono text-sm text-white hover:border-[#00f0ff] transition-colors"
                >
                  <div className="font-bold">{cohort.name}</div>
                  <div className="text-[#b9cacb] text-xs">{cohort.status}</div>
                </button>
              ))}
              {cohorts.filter((c: any) => !c.is_current).length === 0 && (
                <div className="text-[#5d5f63] font-mono text-sm">No other cohorts available to activate.</div>
              )}
            </div>
            <button
              onClick={() => setShowActivateModal(false)}
              className="w-full border border-[#3b494b] px-4 py-2 font-mono text-sm text-[#b9cacb] hover:text-white hover:border-white transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
