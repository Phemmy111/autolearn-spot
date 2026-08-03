"use client";

import { useState, useEffect } from "react";
import { 
  Loader2, 
  Users, 
  DollarSign, 
  AlertTriangle, 
  TrendingUp, 
  CheckCircle2, 
  XCircle, 
  Clock,
  Search,
  Filter,
  Download,
  RefreshCw,
  Wallet
} from "lucide-react";

export default function AdminGrowthCenter() {
  const [activeTab, setActiveTab] = useState<'overview' | 'applications' | 'partners' | 'withdrawals' | 'fraud' | 'referrals' | 'commissions' | 'marketing'>('overview');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [partners, setPartners] = useState<any[]>([]);
  const [withdrawals, setWithdrawals] = useState<any[]>([]);
  const [fraudAlerts, setFraudAlerts] = useState<any[]>([]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'overview') {
        const res = await fetch('/api/admin/growth-center/overview');
        const data = await res.json();
        if (data.success) setStats(data.stats);
      } else if (activeTab === 'applications') {
        const res = await fetch('/api/admin/growth-center/applications');
        const data = await res.json();
        if (data.success) setApplications(data.applications);
      } else if (activeTab === 'partners') {
        const res = await fetch('/api/admin/growth-center/partners');
        const data = await res.json();
        if (data.success) setPartners(data.partners);
      } else if (activeTab === 'withdrawals') {
        const res = await fetch('/api/admin/growth-center/withdrawals');
        const data = await res.json();
        if (data.success) setWithdrawals(data.withdrawals);
      } else if (activeTab === 'fraud') {
        const res = await fetch('/api/admin/growth-center/fraud');
        const data = await res.json();
        if (data.success) setFraudAlerts(data.alerts);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApplicationAction = async (id: string, action: 'approve' | 'reject' | 'request_info') => {
    if (!confirm(`Are you sure you want to ${action} this application?`)) return;
    
    try {
      const res = await fetch('/api/admin/growth-center/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: id, action })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  const handleWithdrawalAction = async (id: string, action: 'approve' | 'reject') => {
    if (action === 'approve') {
      const ref = prompt("Enter Payment Reference (e.g. Paystack Txn ID):");
      if (!ref) return;
      
      try {
        const res = await fetch('/api/admin/growth-center/withdrawals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ withdrawalId: id, action, paymentReference: ref })
        });
        if (res.ok) fetchData();
        else alert((await res.json()).error);
      } catch (err) {
        console.error(err);
      }
    } else {
      const reason = prompt("Enter Rejection Reason:");
      if (!reason) return;
      
      try {
        const res = await fetch('/api/admin/growth-center/withdrawals', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ withdrawalId: id, action, reason })
        });
        if (res.ok) fetchData();
        else alert((await res.json()).error);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const handleFraudAction = async (id: string, action: 'resolve' | 'dismiss') => {
    const notes = prompt("Enter resolution notes:");
    if (!notes) return;

    try {
      const res = await fetch('/api/admin/growth-center/fraud', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ alertId: id, action, notes })
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Growth Center</h1>
          <p className="text-[#b9cacb] text-sm">Manage partners, applications, and growth analytics.</p>
        </div>
        <button 
          onClick={fetchData}
          className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
        >
          <RefreshCw className="h-4 w-4" />
          Refresh
        </button>
      </div>

      <div className="flex border-b border-[#1f2229] overflow-x-auto">
        {(['overview', 'applications', 'partners', 'withdrawals', 'fraud'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-6 py-3 font-medium text-sm capitalize transition-colors border-b-2 whitespace-nowrap ${
              activeTab === tab 
                ? 'border-[#00f0ff] text-[#00f0ff]' 
                : 'border-transparent text-[#b9cacb] hover:text-white hover:border-white/20'
            }`}
          >
            {tab}
            {tab === 'applications' && stats?.applications?.pending > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {stats.applications.pending}
              </span>
            )}
            {tab === 'withdrawals' && stats?.withdrawals?.pending > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-yellow-500 text-black text-xs rounded-full">
                {stats.withdrawals.pending}
              </span>
            )}
            {tab === 'fraud' && stats?.fraud?.openAlerts > 0 && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {stats.fraud.openAlerts}
              </span>
            )}
          </button>
        ))}
      </div>

      {loading && <div className="py-12 flex justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" /></div>}

      {!loading && activeTab === 'overview' && stats && (
        <div className="space-y-6">
          {/* Partner Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
              <h3 className="text-sm text-[#b9cacb] mb-1">Student Partners</h3>
              <p className="text-3xl font-bold">{stats.partners.student}</p>
            </div>
            <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
              <h3 className="text-sm text-[#b9cacb] mb-1">Community Partners</h3>
              <p className="text-3xl font-bold">{stats.partners.community}</p>
            </div>
            <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
              <h3 className="text-sm text-[#b9cacb] mb-1">Influencer Partners</h3>
              <p className="text-3xl font-bold">{stats.partners.influencer}</p>
            </div>
            <div className="bg-[#111317] border border-[#00f0ff]/20 p-6 rounded-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/10 blur-3xl rounded-full" />
              <h3 className="text-sm text-[#00f0ff] mb-1 relative z-10">Total Partners</h3>
              <p className="text-3xl font-bold relative z-10">{stats.partners.total}</p>
            </div>
          </div>

          {/* Financial Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <DollarSign className="h-5 w-5 text-green-400" />
                <h3 className="text-sm text-[#b9cacb]">Total Commissions</h3>
              </div>
              <p className="text-2xl font-bold">₦{stats.financial.totalCommissions.toLocaleString()}</p>
            </div>
            <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="h-5 w-5 text-blue-400" />
                <h3 className="text-sm text-[#b9cacb]">Total Paid Out</h3>
              </div>
              <p className="text-2xl font-bold">₦{stats.financial.totalPaidOut.toLocaleString()}</p>
            </div>
            <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <Wallet className="h-5 w-5 text-yellow-400" />
                <h3 className="text-sm text-[#b9cacb]">Available for Payout</h3>
              </div>
              <p className="text-2xl font-bold">₦{stats.financial.availableForPayout.toLocaleString()}</p>
            </div>
          </div>

          {/* Referral Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <Users className="h-5 w-5 text-purple-400" />
                <h3 className="text-sm text-[#b9cacb]">Total Referral Clicks</h3>
              </div>
              <p className="text-2xl font-bold">{stats.referrals.totalClicks.toLocaleString()}</p>
            </div>
            <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
              <div className="flex items-center gap-3 mb-2">
                <CheckCircle2 className="h-5 w-5 text-green-400" />
                <h3 className="text-sm text-[#b9cacb]">Total Registrations</h3>
              </div>
              <p className="text-2xl font-bold">{stats.referrals.totalRegistrations.toLocaleString()}</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-[#111317] border border-[#1f2229] p-6 rounded-2xl">
            <h3 className="text-lg font-bold mb-4">Recent Activity (7 Days)</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-[#b9cacb]">New Partner Signups</p>
                <p className="text-2xl font-bold">{stats.recent.signups}</p>
              </div>
              <div>
                <p className="text-sm text-[#b9cacb]">Course Purchases</p>
                <p className="text-2xl font-bold">{stats.recent.purchases}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {!loading && activeTab === 'applications' && (
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f2229]/50 border-b border-[#1f2229]">
              <tr>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Applicant</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Contact</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">State</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Status</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {applications.map(app => (
                <tr key={app.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{app.full_name}</p>
                    <p className="text-[#b9cacb] text-xs">{app.occupation}</p>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-white">{app.email}</p>
                    <p className="text-[#b9cacb] text-xs">{app.phone}</p>
                  </td>
                  <td className="px-6 py-4 text-[#b9cacb]">{app.state}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      app.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                      app.status === 'rejected' ? 'bg-red-500/10 text-red-400' :
                      app.status === 'under_review' ? 'bg-blue-500/10 text-blue-400' :
                      app.status === 'need_more_info' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      {app.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {app.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleApplicationAction(app.id, 'approve')}
                          className="px-3 py-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleApplicationAction(app.id, 'request_info')}
                          className="px-3 py-1 bg-yellow-500/10 text-yellow-400 rounded hover:bg-yellow-500/20 transition-colors"
                        >
                          Request Info
                        </button>
                        <button
                          onClick={() => handleApplicationAction(app.id, 'reject')}
                          className="px-3 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {applications.length === 0 && (
            <div className="p-8 text-center text-[#b9cacb]">No applications found</div>
          )}
        </div>
      )}

      {!loading && activeTab === 'partners' && (
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f2229]/50 border-b border-[#1f2229]">
              <tr>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Partner</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Type</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Commission</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Earnings</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {partners.map(partner => (
                <tr key={partner.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{partner.full_name}</p>
                    <p className="text-[#b9cacb] text-xs">{partner.email}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      partner.partner_type === 'student' ? 'bg-blue-500/10 text-blue-400' :
                      partner.partner_type === 'community' ? 'bg-purple-500/10 text-purple-400' :
                      'bg-pink-500/10 text-pink-400'
                    }`}>
                      {partner.partner_type}
                    </span>
                  </td>
                  <td className="px-6 py-4 font-medium">₦{partner.commission_rate.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <p className="text-white">₦{partner.available_earnings.toLocaleString()} available</p>
                    <p className="text-[#b9cacb] text-xs">₦{partner.lifetime_earnings.toLocaleString()} lifetime</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      partner.status === 'active' ? 'bg-green-500/10 text-green-400' :
                      partner.status === 'suspended' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {partner.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {partners.length === 0 && (
            <div className="p-8 text-center text-[#b9cacb]">No partners found</div>
          )}
        </div>
      )}

      {!loading && activeTab === 'withdrawals' && (
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f2229]/50 border-b border-[#1f2229]">
              <tr>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Partner</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Amount</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Bank Details</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Status</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {withdrawals.map(withdrawal => (
                <tr key={withdrawal.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-white">{withdrawal.user_id}</p>
                    <p className="text-[#b9cacb] text-xs">{withdrawal.user_type}</p>
                  </td>
                  <td className="px-6 py-4 font-bold">₦{withdrawal.amount.toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <p className="text-white">{withdrawal.bank_name}</p>
                    <p className="text-[#b9cacb] text-xs">{withdrawal.account_number}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      withdrawal.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                      withdrawal.status === 'approved' ? 'bg-blue-500/10 text-blue-400' :
                      withdrawal.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {withdrawal.status === 'pending' && (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'approve')}
                          className="px-3 py-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleWithdrawalAction(withdrawal.id, 'reject')}
                          className="px-3 py-1 bg-red-500/10 text-red-400 rounded hover:bg-red-500/20 transition-colors"
                        >
                          Reject
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {withdrawals.length === 0 && (
            <div className="p-8 text-center text-[#b9cacb]">No withdrawals found</div>
          )}
        </div>
      )}

      {!loading && activeTab === 'fraud' && (
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#1f2229]/50 border-b border-[#1f2229]">
              <tr>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Type</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Severity</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Description</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb]">Status</th>
                <th className="px-6 py-4 font-medium text-[#b9cacb] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1f2229]">
              {fraudAlerts.map(alert => (
                <tr key={alert.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-white/5">
                      {alert.type.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.severity === 'high' ? 'bg-red-500/10 text-red-400' :
                      alert.severity === 'medium' ? 'bg-yellow-500/10 text-yellow-400' :
                      'bg-blue-500/10 text-blue-400'
                    }`}>
                      {alert.severity}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-[#b9cacb] max-w-md truncate">{alert.description}</td>
                  <td className="px-6 py-4">
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      alert.status === 'open' ? 'bg-red-500/10 text-red-400' :
                      alert.status === 'investigating' ? 'bg-yellow-500/10 text-yellow-400' :
                      alert.status === 'resolved' ? 'bg-green-500/10 text-green-400' :
                      'bg-gray-500/10 text-gray-400'
                    }`}>
                      {alert.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {alert.status === 'open' || alert.status === 'investigating' ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleFraudAction(alert.id, 'resolve')}
                          className="px-3 py-1 bg-green-500/10 text-green-400 rounded hover:bg-green-500/20 transition-colors"
                        >
                          Resolve
                        </button>
                        <button
                          onClick={() => handleFraudAction(alert.id, 'dismiss')}
                          className="px-3 py-1 bg-gray-500/10 text-gray-400 rounded hover:bg-gray-500/20 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    ) : (
                      <span className="text-[#b9cacb] text-xs">Closed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {fraudAlerts.length === 0 && (
            <div className="p-8 text-center text-[#b9cacb]">No fraud alerts found</div>
          )}
        </div>
      )}
    </div>
  );
}