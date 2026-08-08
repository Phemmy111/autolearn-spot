"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, RefreshCw, Loader2, CheckCircle2, XCircle, Plus, Edit, Archive, Trash2 } from 'lucide-react';

export function EnrollmentsTable({ initialEnrollments, cohorts, summary, currentCohort, studentCount }: { 
  initialEnrollments: any[], 
  cohorts: any[], 
  summary: {
    paid: number;
    pending: number;
    expired: number;
    failed: number;
    refunded: number;
    revenue: number;
  },
  currentCohort: any,
  studentCount: number
}) {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [cohortFilter, setCohortFilter] = useState('all');
  const [isResyncing, setIsResyncing] = useState<string | null>(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCohort, setEditingCohort] = useState<any>(null);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const filtered = initialEnrollments.filter((en: { display_status: string; [key: string]: any }) => {
    const matchesSearch = en.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          en.payment_ref?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || en.display_status === statusFilter;
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
        setToast({ message: 'Payment resynced successfully', type: 'success' });
        router.refresh();
      } else {
        setToast({ message: 'Resync failed. Check console.', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error', type: 'error' });
    } finally {
      setIsResyncing(null);
    }
  };

  const getCohortStudentCount = (cohortId: string) => {
    return initialEnrollments.filter((en: any) => en.cohort_id === cohortId && en.status === 'active').length;
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

  const handleCreateCohort = async (e: React.FormEvent) => {
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
        setToast({ message: 'Cohort created successfully', type: 'success' });
        setShowCreateModal(false);
        router.refresh();
      } else if (res.status === 409) {
        const error = await res.json();
        setToast({ message: error.message || 'Cohort slug already exists. Please choose another slug.', type: 'error' });
      } else {
        const error = await res.json();
        setToast({ message: error.error || 'Unable to create cohort', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const handleActivateCohort = async (cohortId: string) => {
    try {
      const res = await fetch(`/api/admin/cohorts/${cohortId}/activate`, {
        method: 'POST'
      });
      if (res.ok) {
        setToast({ message: 'Cohort activated successfully', type: 'success' });
        setShowManageModal(false);
        router.refresh();
      } else {
        setToast({ message: 'Unable to activate cohort', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const handleArchiveCohort = async (cohortId: string) => {
    try {
      const res = await fetch(`/api/admin/cohorts/${cohortId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived', is_current: false })
      });
      if (res.ok) {
        setToast({ message: 'Cohort archived successfully', type: 'success' });
        router.refresh();
      } else {
        setToast({ message: 'Unable to archive cohort', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const handleDeleteCohort = async (cohortId: string) => {
    if (!confirm('Are you sure you want to delete this cohort? This action cannot be undone.')) return;
    
    try {
      const res = await fetch(`/api/admin/cohorts/${cohortId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setToast({ message: 'Cohort deleted successfully', type: 'success' });
        router.refresh();
      } else {
        setToast({ message: 'Unable to delete cohort', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  const handleEditCohort = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData(e.target as HTMLFormElement);
    const cohortData = {
      name: formData.get('name') as string,
      slug: formData.get('slug') as string,
      price_ngn: parseFloat(formData.get('price_ngn') as string),
      start_date: formData.get('start_date') as string || null,
      end_date: formData.get('end_date') as string || null,
      status: formData.get('status') as string,
      timezone: formData.get('timezone') as string
    };
    
    try {
      const res = await fetch(`/api/admin/cohorts/${editingCohort.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cohortData)
      });
      if (res.ok) {
        setToast({ message: 'Cohort updated successfully', type: 'success' });
        setShowEditModal(false);
        router.refresh();
      } else {
        setToast({ message: 'Unable to update cohort', type: 'error' });
      }
    } catch (err) {
      console.error(err);
      setToast({ message: 'Network error', type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast notification */}
      {toast && (
        <div className={`fixed top-4 right-4 px-4 py-2 font-mono text-sm font-bold rounded ${
          toast.type === 'success' ? 'bg-[#00f0ff]/20 text-[#00f0ff] border border-[#00f0ff]' : 'bg-red-500/20 text-red-400 border border-red-500'
        }`}>
          {toast.message}
        </div>
      )}

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
              onClick={() => setShowManageModal(true)}
              className="inline-flex items-center gap-2 border border-[#3b494b] px-4 py-2 font-mono text-sm text-[#b9cacb] hover:text-white hover:border-white transition-colors"
            >
              Manage Cohorts
            </button>
          </div>
        </div>
        
        {currentCohort ? (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Current Cohort</div>
              <div className="text-white font-bold">{currentCohort.name}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Status</div>
              <div className="text-[#00f0ff] font-bold uppercase">{currentCohort.status}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Students</div>
              <div className="text-white font-bold">{studentCount}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Registration Fee</div>
              <div className="text-white font-bold">₦{currentCohort.price_ngn?.toLocaleString() || '0'}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Start Date</div>
              <div className="text-white font-bold">{currentCohort.start_date ? new Date(currentCohort.start_date).toLocaleDateString() : 'TBD'}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">End Date</div>
              <div className="text-white font-bold">{currentCohort.end_date ? new Date(currentCohort.end_date).toLocaleDateString() : 'TBD'}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Payments Received</div>
              <div className="text-white font-bold">{summary.paid}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Payment Pending</div>
              <div className="text-white font-bold text-yellow-400">{summary.pending}</div>
            </div>
            <div>
              <div className="text-[#b9cacb] font-mono text-xs uppercase mb-1">Revenue</div>
              <div className="text-white font-bold">₦{summary.revenue.toLocaleString()}</div>
            </div>
          </div>
        ) : (
          <div className="text-[#5d5f63] font-mono text-sm">No active cohort found. Please create or activate a cohort.</div>
        )}
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="bg-[#1a1d24] border border-[#3b494b] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Total Paid</div>
          <div className="text-2xl font-bold text-[#00f0ff] mt-1">{summary.paid}</div>
        </div>
        <div className="bg-[#1a1d24] border border-[#3b494b] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Payment Pending</div>
          <div className="text-2xl font-bold text-yellow-400 mt-1">{summary.pending}</div>
        </div>
        <div className="bg-[#1a1d24] border border-[#3b494b] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Expired</div>
          <div className="text-2xl font-bold text-gray-400 mt-1">{summary.expired}</div>
        </div>
        <div className="bg-[#1a1d24] border border-[#3b494b] p-4 rounded text-center">
          <div className="text-[#b9cacb] font-mono text-xs uppercase">Payment Failed</div>
          <div className="text-2xl font-bold text-red-400 mt-1">{summary.failed}</div>
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
          <option value="Enrolled">Enrolled</option>
          <option value="Payment Pending">Payment Pending</option>
          <option value="Expired">Expired</option>
          <option value="Payment Failed">Payment Failed</option>
          <option value="refunded">Refunded</option>
        </select>
        <select 
          value={cohortFilter}
          onChange={e => setCohortFilter(e.target.value)}
          className="bg-[#1a1d24] border border-[#3b494b] px-4 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]"
        >
          <option value="all">All Cohorts</option>
          {cohorts.map((c: { id: string; name: string; status: string }) => (
            <option key={c.id} value={c.id}>{c.name} ({c.status})</option>
          ))}
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto border border-[#3b494b] bg-[#1a1d24] rounded">
        <table className="w-full text-left font-mono text-sm">
          <thead className="bg-[#1f2229] border-b border-[#3b494b] text-[#b9cacb]">
            <tr>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Phone</th>
              <th className="px-4 py-3">Cohort</th>
              <th className="px-4 py-3">Reference</th>
              <th className="px-4 py-3">Amount</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((en: any) => (
              <tr key={en.id} className="border-b border-[#3b494b]/50 hover:bg-[#1f2229]/50">
                <td className="px-4 py-3 text-white">{en.full_name || (en.first_name ? `${en.first_name} ${en.last_name || ''}`.trim() : 'N/A')}</td>
                <td className="px-4 py-3 text-[#b9cacb]">{en.email}</td>
                <td className="px-4 py-3 text-[#5d5f63]">{en.phone_number || en.whatsapp_number || 'N/A'}</td>
                <td className="px-4 py-3 text-[#b9cacb]">{en.cohort?.name || en.cohort_id || 'Current Cohort'}</td>
                <td className="px-4 py-3 text-[#5d5f63]">{en.payment_ref || 'N/A'}</td>
                <td className="px-4 py-3 text-[#00f0ff]">
                  {en.amount_paid ? `₦${en.amount_paid.toLocaleString()}` : (en.payment_amount ? `₦${en.payment_amount.toLocaleString()}` : '-')}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-[10px] uppercase font-bold ${
                    en.display_status === 'Enrolled' ? 'bg-[#00f0ff]/10 text-[#00f0ff]' :
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
                        className="inline-flex items-center gap-1 border border-[#3b494b] px-2 py-1 text-xs text-[#b9cacb] hover:text-white hover:border-white transition-colors disabled:opacity-50"
                        title="Re-fetch from Paystack"
                      >
                        {isResyncing === en.payment_ref ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                        Resync
                      </button>
                    )}
                    
                    {!en.is_pending && en.display_status === 'Enrolled' && (
                      <button
                        onClick={() => handleUpdateStatus(en.id, 'inactive')}
                        disabled={isUpdatingStatus === en.id}
                        className="inline-flex items-center gap-1 border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:text-white hover:bg-red-500/30 transition-colors disabled:opacity-50"
                      >
                        {isUpdatingStatus === en.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <XCircle className="h-3 w-3" />}
                        Deactivate
                      </button>
                    )}
                    {!en.is_pending && en.display_status === 'Inactive' && (
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
            <form onSubmit={handleCreateCohort}>
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

      {/* Manage Cohorts Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1d24] border border-[#3b494b] p-6 rounded max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="font-heading text-xl font-bold text-white mb-4">Manage Cohorts</h3>
            <div className="space-y-4 mb-4">
              {cohorts.map((cohort: any) => {
                const studentCount = getCohortStudentCount(cohort.id);
                return (
                  <div key={cohort.id} className="bg-[#0a0c10] border border-[#3b494b] p-4 rounded">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="text-white font-bold text-lg">{cohort.name}</div>
                        <div className="text-[#b9cacb] font-mono text-xs">
                          Status: <span className="text-[#00f0ff] uppercase">{cohort.status}</span>
                          {cohort.is_current && <span className="ml-2 text-[#00f0ff]">• CURRENT</span>}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingCohort(cohort);
                            setShowEditModal(true);
                            setShowManageModal(false);
                          }}
                          className="inline-flex items-center gap-1 border border-[#3b494b] px-2 py-1 text-xs text-[#b9cacb] hover:text-white hover:border-white transition-colors"
                        >
                          <Edit className="h-3 w-3" />
                          Edit
                        </button>
                        {cohort.status !== 'archived' && !cohort.is_current && (
                          <button
                            onClick={() => handleActivateCohort(cohort.id)}
                            className="inline-flex items-center gap-1 border border-emerald-500/30 bg-emerald-500/10 px-2 py-1 text-xs text-emerald-400 hover:text-white hover:bg-emerald-500/30 transition-colors"
                          >
                            Activate
                          </button>
                        )}
                        {cohort.status !== 'archived' && (
                          <button
                            onClick={() => handleArchiveCohort(cohort.id)}
                            className="inline-flex items-center gap-1 border border-yellow-500/30 bg-yellow-500/10 px-2 py-1 text-xs text-yellow-400 hover:text-white hover:bg-yellow-500/30 transition-colors"
                          >
                            <Archive className="h-3 w-3" />
                            Archive
                          </button>
                        )}
                        {studentCount === 0 ? (
                          <button
                            onClick={() => handleDeleteCohort(cohort.id)}
                            className="inline-flex items-center gap-1 border border-red-500/30 bg-red-500/10 px-2 py-1 text-xs text-red-400 hover:text-white hover:bg-red-500/30 transition-colors"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        ) : (
                          <button
                            disabled
                            title="This cohort contains students and cannot be deleted"
                            className="inline-flex items-center gap-1 border border-[#3b494b] px-2 py-1 text-xs text-[#5d5f63] cursor-not-allowed"
                          >
                            <Trash2 className="h-3 w-3" />
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs font-mono text-[#b9cacb]">
                      <div>Students: <span className="text-white">{studentCount}</span></div>
                      <div>Fee: <span className="text-white">₦{cohort.price_ngn?.toLocaleString() || '0'}</span></div>
                      <div>Start: <span className="text-white">{cohort.start_date ? new Date(cohort.start_date).toLocaleDateString() : 'TBD'}</span></div>
                      <div>End: <span className="text-white">{cohort.end_date ? new Date(cohort.end_date).toLocaleDateString() : 'TBD'}</span></div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="flex gap-2 pt-4 border-t border-[#3b494b]">
              <button
                onClick={() => setShowManageModal(false)}
                className="flex-1 border border-[#3b494b] px-4 py-2 font-mono text-sm text-[#b9cacb] hover:text-white hover:border-white transition-colors"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setShowCreateModal(true);
                }}
                className="flex-1 bg-[#00f0ff] text-[#0a0c10] px-4 py-2 font-mono text-sm font-bold hover:bg-[#00f0ff]/80 transition-colors"
              >
                Create New Cohort
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Cohort Modal */}
      {showEditModal && editingCohort && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1a1d24] border border-[#3b494b] p-6 rounded max-w-md w-full mx-4">
            <h3 className="font-heading text-xl font-bold text-white mb-4">Edit Cohort</h3>
            <form onSubmit={handleEditCohort}>
              <div className="space-y-4">
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Cohort Name</label>
                  <input name="name" defaultValue={editingCohort.name} required className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Slug</label>
                  <input name="slug" defaultValue={editingCohort.slug} required className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Registration Fee (₦)</label>
                  <input name="price_ngn" type="number" defaultValue={editingCohort.price_ngn} required className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Start Date</label>
                  <input name="start_date" type="date" defaultValue={editingCohort.start_date?.split('T')[0]} className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">End Date</label>
                  <input name="end_date" type="date" defaultValue={editingCohort.end_date?.split('T')[0]} className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Status</label>
                  <select name="status" defaultValue={editingCohort.status} required className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]">
                    <option value="draft">Draft</option>
                    <option value="upcoming">Upcoming</option>
                    <option value="active">Active</option>
                    <option value="completed">Completed</option>
                    <option value="archived">Archived</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#b9cacb] font-mono text-xs uppercase mb-1">Timezone</label>
                  <input name="timezone" defaultValue={editingCohort.timezone || 'Africa/Lagos'} className="w-full bg-[#0a0c10] border border-[#3b494b] px-3 py-2 font-mono text-sm text-white focus:outline-none focus:border-[#00f0ff]" />
                </div>
                <div className="flex gap-2 pt-4">
                  <button type="button" onClick={() => setShowEditModal(false)} className="flex-1 border border-[#3b494b] px-4 py-2 font-mono text-sm text-[#b9cacb] hover:text-white hover:border-white transition-colors">
                    Cancel
                  </button>
                  <button type="submit" className="flex-1 bg-[#00f0ff] text-[#0a0c10] px-4 py-2 font-mono text-sm font-bold hover:bg-[#00f0ff]/80 transition-colors">
                    Save Changes
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}