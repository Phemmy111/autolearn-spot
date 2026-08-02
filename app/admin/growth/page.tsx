"use client";

import { useState, useEffect } from "react";
import { Loader2, TrendingUp, Users, DollarSign, Settings, CheckCircle2, XCircle, Search, AlertCircle } from "lucide-react";

export default function AdminGrowthCenter() {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'partners' | 'withdrawals'>('overview');
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // New Influencer Form
  const [newInfluencer, setNewInfluencer] = useState({ full_name: '', email: '', phone: '', commission_rate: '2000', platform: 'Instagram' });
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch('/api/admin/growth/stats');
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } else if (activeTab === 'applications') {
        const res = await fetch('/api/admin/growth/applications');
        const data = await res.json();
        if (data.success) setApplications(data.applications);
      } else if (activeTab === 'partners') {
        const res = await fetch('/api/admin/growth/partners?type=influencer');
        const data = await res.json();
        if (data.success) setPartners(data.partners);
      } else if (activeTab === 'withdrawals') {
        const res = await fetch('/api/admin/growth/withdrawals');
        const data = await res.json();
        if (data.success) setWithdrawals(data.withdrawals);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (id: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action} this application?`)) return;
    try {
      const res = await fetch('/api/admin/growth/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCreateInfluencer = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch('/api/admin/growth/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newInfluencer,
          commission_rate: Number(newInfluencer.commission_rate)
        })
      });
      if (res.ok) {
        alert("Influencer created successfully. Check server logs for temporary password.");
        setNewInfluencer({ full_name: '', email: '', phone: '', commission_rate: '2000', platform: 'Instagram' });
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleProcessWithdrawal = async (id: string, action: 'approve' | 'reject') => {
    let payload: any = { id, action };
    
    if (action === 'approve') {
      const ref = prompt("Enter Payment Reference (e.g. Paystack Txn ID):");
      if (!ref) return;
      payload.paymentReference = ref;
    } else {
      const reason = prompt("Enter Rejection Reason:");
      if (!reason) return;
      payload.reason = reason;
    }

    try {
      const res = await fetch('/api/admin/growth/withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) fetchData();
      else alert((await res.json()).error);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Growth Center</h1>
          <p className="text-[#b9cacb] text-sm">Manage ambassadors, partners, and payouts.</p>
        </div>
      </div>

      <div className="flex border-b border-[#1f2229]">
        {(['overview', 'applications', 'partners', 'withdrawals'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm capitalize transition-colors border-b-2 ${
              activeTab === tab 
                ? 'border-[#00f0ff] text-[#00f0ff]' 
                : 'border-transparent text-[#b9cacb] hover:text-white hover:border-white/20'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {loading && <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" /></div>}

      {!loading && activeTab === 'overview' && stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
            <h3 className="text-sm text-[#b9cacb] mb-1">Student Ambassadors</h3>
            <p className="text-3xl font-bold">{stats.studentAmbassadors}</p>
          </div>
          <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
            <h3 className="text-sm text-[#b9cacb] mb-1">Community Ambassadors</h3>
            <p className="text-3xl font-bold">{stats.communityAmbassadors}</p>
          </div>
          <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
            <h3 className="text-sm text-[#b9cacb] mb-1">Influencer Partners</h3>
            <p className="text-3xl font-bold">{stats.influencerPartners}</p>
          </div>
          <div className="bg-[#111317] border border-[#00f0ff]/20 p-6 rounded-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 blur-3xl rounded-full" />
            <h3 className="text-sm text-[#00f0ff] mb-1 relative z-10">Total Payouts</h3>
            <p className="text-3xl font-bold relative z-10">₦{stats.totalPayouts.toLocaleString()}</p>
          </div>
        </div>
      )}

      {!loading && activeTab === 'applications' && (
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f2229]/50 border-b border-[#1f2229]">
              <tr>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Applicant</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Type</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Promotion Method</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Status</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{app.full_name}</p>
                    <p className="text-[#b9cacb] text-xs">{app.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded bg-white/5 text-xs">{app.is_student ? 'Student' : 'Community'}</span>
                  </td>
                  <td className="px-6 py-4 text-[#b9cacb] truncate max-w-[200px]" title={app.promotion_method}>
                    {app.promotion_method}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      app.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                      app.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {app.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleApplicationAction(app.id, 'approve')} className="p-2 hover:bg-green-500/20 text-green-400 rounded transition-colors" title="Approve">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleApplicationAction(app.id, 'reject')} className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors" title="Reject">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {applications.length === 0 && (
                <tr><td colSpan={5} className="px-6 py-12 text-center text-[#b9cacb]">No applications found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {!loading && activeTab === 'partners' && (
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-[#111317] border border-[#1f2229] rounded-2xl overflow-hidden">
            <div className="p-6 border-b border-[#1f2229]">
              <h3 className="font-bold">Influencer Partners</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-[#1f2229]/50 border-b border-[#1f2229]">
                <tr>
                  <th className="px-6 py-4 font-medium text-[#b9cacb]">Partner</th>
                  <th className="px-6 py-4 font-medium text-[#b9cacb]">Platform</th>
                  <th className="px-6 py-4 font-medium text-[#b9cacb]">Rate</th>
                  <th className="px-6 py-4 font-medium text-[#b9cacb]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#1f2229]">
                {partners.map(p => (
                  <tr key={p.id}>
                    <td className="px-6 py-4">
                      <p className="font-medium text-white">{p.full_name}</p>
                      <p className="text-[#b9cacb] text-xs">{p.email}</p>
                    </td>
                    <td className="px-6 py-4 text-[#b9cacb]">{p.platform}</td>
                    <td className="px-6 py-4 font-medium">₦{p.commission_rate?.toLocaleString() || '2,000'}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-green-500/10 text-green-400 text-xs">{p.status.toUpperCase()}</span>
                    </td>
                  </tr>
                ))}
                {partners.length === 0 && (
                  <tr><td colSpan={4} className="px-6 py-8 text-center text-[#b9cacb]">No influencer partners found.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6 h-fit">
            <h3 className="font-bold mb-6">Invite Influencer</h3>
            <form onSubmit={handleCreateInfluencer} className="space-y-4 text-sm">
              <input required value={newInfluencer.full_name} onChange={e => setNewInfluencer({...newInfluencer, full_name: e.target.value})} className="w-full bg-[#0c0e12] border border-[#1f2229] rounded-lg px-4 py-2 focus:border-[#00f0ff] outline-none" placeholder="Full Name" />
              <input required type="email" value={newInfluencer.email} onChange={e => setNewInfluencer({...newInfluencer, email: e.target.value})} className="w-full bg-[#0c0e12] border border-[#1f2229] rounded-lg px-4 py-2 focus:border-[#00f0ff] outline-none" placeholder="Email Address" />
              <input value={newInfluencer.phone} onChange={e => setNewInfluencer({...newInfluencer, phone: e.target.value})} className="w-full bg-[#0c0e12] border border-[#1f2229] rounded-lg px-4 py-2 focus:border-[#00f0ff] outline-none" placeholder="Phone Number" />
              <input required value={newInfluencer.platform} onChange={e => setNewInfluencer({...newInfluencer, platform: e.target.value})} className="w-full bg-[#0c0e12] border border-[#1f2229] rounded-lg px-4 py-2 focus:border-[#00f0ff] outline-none" placeholder="Platform (e.g. YouTube)" />
              <input required type="number" value={newInfluencer.commission_rate} onChange={e => setNewInfluencer({...newInfluencer, commission_rate: e.target.value})} className="w-full bg-[#0c0e12] border border-[#1f2229] rounded-lg px-4 py-2 focus:border-[#00f0ff] outline-none" placeholder="Commission Rate (e.g. 2000)" />
              <button disabled={isSubmitting} type="submit" className="w-full py-2.5 rounded-lg bg-[#00f0ff] text-black font-bold hover:bg-white transition-colors disabled:opacity-50">
                {isSubmitting ? "Inviting..." : "Create Partner"}
              </button>
            </form>
          </div>
        </div>
      )}

      {!loading && activeTab === 'withdrawals' && (
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f2229]/50 border-b border-[#1f2229]">
              <tr>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Date</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Type</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Bank Details</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Amount</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Status</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {withdrawals.map(w => (
                <tr key={w.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4 text-[#b9cacb]">{new Date(w.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 capitalize">{w.user_type}</td>
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{w.bank_name}</p>
                    <p className="text-[#b9cacb] text-xs">{w.account_number} ({w.account_name})</p>
                  </td>
                  <td className="px-6 py-4 font-medium text-white">₦{w.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      w.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                      w.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      'bg-yellow-500/10 text-yellow-400'
                    }`}>
                      {w.status.toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {w.status === 'pending' && (
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => handleProcessWithdrawal(w.id, 'approve')} className="p-2 hover:bg-green-500/20 text-green-400 rounded transition-colors" title="Mark Paid">
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleProcessWithdrawal(w.id, 'reject')} className="p-2 hover:bg-red-500/20 text-red-400 rounded transition-colors" title="Reject">
                          <XCircle className="h-4 w-4" />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {withdrawals.length === 0 && (
                <tr><td colSpan={6} className="px-6 py-12 text-center text-[#b9cacb]">No withdrawals found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
