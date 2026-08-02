"use client";

import { useState, useEffect } from "react";
import { useUser } from "@clerk/nextjs";
import { Loader2, AlertCircle, Copy, CheckCircle2, Wallet, Users, MousePointerClick, ArrowRightLeft, DollarSign, Clock } from "lucide-react";
import Link from "next/link";

export default function StudentAmbassadorPage() {
  const { user, isLoaded } = useUser();
  const [status, setStatus] = useState<'loading' | 'not_applied' | 'pending' | 'approved'>('loading');
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    if (isLoaded && user) {
      fetchStatus();
    }
  }, [isLoaded, user]);

  const fetchStatus = async () => {
    try {
      const res = await fetch(`/api/student/ambassador/status?userId=${user?.id}`);
      const result = await res.json();
      
      if (res.ok && result.success) {
        setStatus(result.status);
        if (result.status === 'approved') {
          setData(result.data);
        }
      } else {
        setStatus('not_applied');
      }
    } catch (err) {
      console.error(err);
      setStatus('not_applied');
    }
  };

  const handleApply = async () => {
    try {
      const res = await fetch("/api/ambassador/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          is_student: true,
          userId: user?.id,
          full_name: user?.fullName || "Student",
          email: user?.primaryEmailAddress?.emailAddress,
          phone: "0000000000",
          whatsapp: "0000000000",
          state: "N/A",
          promotion_method: "Student Network",
          reason: "I am an active student and want to share this platform.",
        }),
      });
      if (res.ok) {
        setStatus('pending');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopyLink = () => {
    if (data?.shareUrl) {
      navigator.clipboard.writeText(data.shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 2000) return;
    
    setIsWithdrawing(true);
    try {
      const res = await fetch("/api/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          userId: user?.id,
          amount: Number(withdrawAmount),
          userType: 'student',
          bankName: "Select Bank",
          accountNumber: "0000000000",
          accountName: user?.fullName
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert("Withdrawal request submitted successfully!");
        setWithdrawAmount("");
        fetchStatus();
      } else {
        alert(result.error || "Failed to submit withdrawal");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (!isLoaded || status === 'loading') {
    return <div className="flex h-[60vh] items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" /></div>;
  }

  if (status === 'not_applied') {
    return (
      <div className="max-w-4xl mx-auto py-12">
        <div className="bg-[#111317] border border-[#1f2229] rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-[#00f0ff]/10 blur-3xl rounded-full" />
          <div className="w-16 h-16 rounded-full bg-[#00f0ff]/10 flex items-center justify-center text-[#00f0ff] mx-auto mb-6 relative z-10">
            <DollarSign className="h-8 w-8" />
          </div>
          <h1 className="text-3xl font-bold mb-4 relative z-10">Become a Student Partner</h1>
          <p className="text-[#b9cacb] mb-8 max-w-lg mx-auto relative z-10">
            Earn ₦1,000 for every student you refer who completes their enrollment. Turn your network into an income stream while helping others learn.
          </p>
          <button 
            onClick={handleApply}
            className="px-8 py-4 bg-[#00f0ff] text-black font-bold rounded-xl hover:bg-white transition-colors relative z-10"
          >
            Apply Now with 1-Click
          </button>
        </div>
      </div>
    );
  }

  if (status === 'pending') {
    return (
      <div className="max-w-2xl mx-auto py-12">
        <div className="bg-[#111317] border border-[#1f2229] rounded-3xl p-8 text-center">
          <Clock className="h-16 w-16 text-yellow-500 mx-auto mb-6" />
          <h1 className="text-2xl font-bold mb-4">Application Under Review</h1>
          <p className="text-[#b9cacb]">
            Your application to become a Student Partner is currently being reviewed by our team. You will be notified once it is approved.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-bold mb-2">Partner Dashboard</h1>
        <p className="text-[#b9cacb]">Manage your referrals and withdrawals.</p>
      </div>

      {/* Referral Link Card */}
      <div className="bg-gradient-to-r from-[#00f0ff]/10 to-transparent border border-[#00f0ff]/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <h2 className="text-xl font-bold mb-2">Your Referral Link</h2>
          <p className="text-[#b9cacb] text-sm max-w-xl">Share this unique link with your network. When they enroll through it, you earn ₦1,000 commission.</p>
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <div className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white/80 truncate w-full md:w-64">
            {data?.shareUrl}
          </div>
          <button 
            onClick={handleCopyLink}
            className="bg-[#00f0ff] text-black px-4 py-3 rounded-lg font-bold hover:bg-white transition-colors flex-shrink-0 flex items-center gap-2"
          >
            {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied" : "Copy"}
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
              <MousePointerClick className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm text-[#b9cacb] mb-1">Total Clicks</p>
          <h3 className="text-2xl font-bold">{data?.totalClicks || 0}</h3>
        </div>
        
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
              <Users className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm text-[#b9cacb] mb-1">Registrations</p>
          <h3 className="text-2xl font-bold">{data?.totalRegistrations || 0}</h3>
        </div>

        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm text-[#b9cacb] mb-1">Pending Earnings</p>
          <h3 className="text-2xl font-bold text-yellow-400">₦{data?.earnings?.pendingEarnings?.toLocaleString() || 0}</h3>
        </div>

        <div className="bg-[#111317] border border-[#00f0ff]/30 rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/5 blur-3xl rounded-full" />
          <div className="flex items-center justify-between mb-4 relative z-10">
            <div className="w-10 h-10 rounded-full bg-[#00f0ff]/10 flex items-center justify-center text-[#00f0ff]">
              <Wallet className="h-5 w-5" />
            </div>
          </div>
          <p className="text-sm text-[#00f0ff] mb-1 relative z-10">Available Balance</p>
          <h3 className="text-3xl font-bold relative z-10">₦{data?.earnings?.availableEarnings?.toLocaleString() || 0}</h3>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Recent Activity */}
        <div className="lg:col-span-2 space-y-8">
          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6">Recent Commissions</h3>
            {data?.commissions?.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="text-sm text-[#b9cacb] border-b border-[#1f2229]">
                      <th className="pb-3 font-medium">Date</th>
                      <th className="pb-3 font-medium">Amount</th>
                      <th className="pb-3 font-medium">Status</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {data.commissions.map((comm: any) => (
                      <tr key={comm.id} className="border-b border-[#1f2229] last:border-0">
                        <td className="py-4">{new Date(comm.created_at).toLocaleDateString()}</td>
                        <td className="py-4 font-medium text-white">₦{comm.amount.toLocaleString()}</td>
                        <td className="py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            comm.status === 'available' ? 'bg-[#00f0ff]/10 text-[#00f0ff]' :
                            comm.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                            comm.status === 'paid' ? 'bg-green-500/10 text-green-400' :
                            'bg-gray-500/10 text-gray-400'
                          }`}>
                            {comm.status.charAt(0).toUpperCase() + comm.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-[#b9cacb]">
                <p>No commissions yet. Start sharing your link!</p>
              </div>
            )}
          </div>
        </div>

        {/* Withdrawal Panel */}
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6 flex flex-col h-fit">
          <h3 className="text-lg font-bold mb-6">Withdraw Funds</h3>
          
          <div className="bg-[#0c0e12] rounded-xl p-4 mb-6 border border-[#1f2229]">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-[#b9cacb]">Available</span>
              <span className="font-bold text-[#00f0ff]">₦{data?.earnings?.availableEarnings?.toLocaleString() || 0}</span>
            </div>
            <div className="w-full bg-[#1f2229] h-2 rounded-full overflow-hidden">
              <div className="bg-[#00f0ff] h-full" style={{ width: `${Math.min(100, ((data?.earnings?.availableEarnings || 0) / 2000) * 100)}%` }} />
            </div>
            <p className="text-xs text-[#b9cacb] mt-2 text-right">Min. ₦2,000</p>
          </div>

          <form onSubmit={handleWithdraw} className="mt-auto space-y-4">
            <div>
              <label className="text-sm text-[#b9cacb] mb-1.5 block">Amount to withdraw</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#b9cacb]">₦</span>
                <input
                  type="number"
                  min="2000"
                  max={data?.earnings?.availableEarnings || 0}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  className="w-full bg-[#0c0e12] border border-[#1f2229] rounded-xl pl-8 pr-4 py-2.5 focus:outline-none focus:border-[#00f0ff] transition-colors"
                  placeholder="2000"
                />
              </div>
            </div>
            <button
              type="submit"
              disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) < 2000 || Number(withdrawAmount) > (data?.earnings?.availableEarnings || 0)}
              className="w-full py-3 rounded-xl bg-[#00f0ff] text-black font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isWithdrawing ? <Loader2 className="h-4 w-4 animate-spin" /> : <ArrowRightLeft className="h-4 w-4" />}
              Withdraw
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
