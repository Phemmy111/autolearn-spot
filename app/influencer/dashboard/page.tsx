"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Users, DollarSign, MousePointerClick, 
  Wallet, Copy, CheckCircle2, AlertCircle, Loader2, ArrowRightLeft,
  Clock, LogOut, Star
} from "lucide-react";

export default function InfluencerDashboard() {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/influencer/dashboard");
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result);
      } else {
        setError(result.error || "Failed to load dashboard");
        if (res.status === 401) router.push("/influencer");
      }
    } catch (err) {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
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
          amount: Number(withdrawAmount),
          userType: 'influencer',
          bankName: "Select Bank",
          accountNumber: "0000000000",
          accountName: data.user.full_name
        }),
      });
      const result = await res.json();
      if (res.ok && result.success) {
        alert("Withdrawal request submitted successfully!");
        setWithdrawAmount("");
        fetchDashboardData();
      } else {
        alert(result.error || "Failed to submit withdrawal");
      }
    } catch (err) {
      alert("An unexpected error occurred.");
    } finally {
      setIsWithdrawing(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center text-white">
        <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex flex-col items-center justify-center text-white">
        <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
        <p>{error}</p>
        <button onClick={() => router.push("/influencer")} className="mt-4 text-purple-400 hover:underline">
          Return to Login
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0c0e12] text-white overflow-x-hidden">
      {/* Topbar */}
      <header className="border-b border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-mono text-sm font-bold uppercase">
            <Star className="text-purple-400 h-4 w-4" />
            <span className="underline decoration-purple-500 decoration-2 underline-offset-2">Influencer Partner Portal</span>
          </div>
          <div className="flex items-center gap-4">
            <Link 
              href="/"
              className="text-xs font-mono uppercase px-3 py-1.5 border border-[#1f2229] rounded hover:bg-[#1f2229] transition-colors flex items-center gap-2 text-[#b9cacb]"
            >
              Home
            </Link>
            <div className="text-sm text-[#b9cacb] hidden md:block">
              Welcome, <span className="text-white font-medium">{data.user.full_name}</span>
            </div>
            <Link 
              href="/influencer/settings"
              className="text-xs font-mono uppercase px-3 py-1.5 border border-[#1f2229] rounded hover:bg-[#1f2229] transition-colors flex items-center gap-2 text-[#b9cacb]"
            >
              Settings
            </Link>
            <button 
              onClick={() => {
                document.cookie = "growth_session=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
                router.push("/influencer");
              }}
              className="text-xs font-mono uppercase px-3 py-1.5 border border-[#1f2229] rounded hover:bg-[#1f2229] transition-colors flex items-center gap-2 text-[#b9cacb]"
            >
              <LogOut className="h-3 w-3" /> Logout
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Referral Link Card */}
        <div className="bg-gradient-to-r from-purple-500/10 to-transparent border border-purple-500/20 rounded-2xl p-6 md:p-8 mb-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-transparent" />
          <div className="w-full md:w-auto">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 text-purple-400 text-xs font-bold mb-4">
              Premium Rate: ₦{(data.user.commission_rate || 2000).toLocaleString()}/referral
            </div>
            <h2 className="text-2xl font-bold mb-2">Your Partner Link</h2>
            <p className="text-[#b9cacb] text-sm max-w-xl">Share this unique link with your audience on {data.user.platform || 'social media'}. You earn a premium commission for every enrollment.</p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white/80 truncate flex-1 md:w-64">
              {data.shareUrl}
            </div>
            <button 
              onClick={handleCopyLink}
              className="bg-purple-500 text-white px-4 py-3 rounded-lg font-bold hover:bg-purple-400 transition-colors flex-shrink-0 flex items-center gap-2"
            >
              {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy Link"}
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-400">
                <MousePointerClick className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1">Link Clicks</p>
            <h3 className="text-3xl font-bold">{data.totalClicks}</h3>
          </div>
          
          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1">Converted Students</p>
            <h3 className="text-3xl font-bold">{data.totalRegistrations}</h3>
          </div>

          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/50 transition-colors">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1">Pending Earnings</p>
            <h3 className="text-3xl font-bold text-yellow-400">₦{data.earnings.pendingEarnings.toLocaleString()}</h3>
          </div>

          <div className="bg-[#111317] border border-purple-500/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 blur-3xl rounded-full" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-purple-400 mb-1 relative z-10">Available to Withdraw</p>
            <h3 className="text-4xl font-extrabold relative z-10 text-white">₦{data.earnings.availableEarnings.toLocaleString()}</h3>
          </div>
        </div>

        {/* Lower Section */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Recent Activity */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
              <h3 className="text-lg font-bold mb-6 flex items-center gap-2">
                <DollarSign className="text-purple-400 h-5 w-5" /> 
                Recent Conversions
              </h3>
              {data.commissions.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="text-sm text-[#b9cacb] border-b border-[#1f2229]">
                        <th className="pb-3 font-medium">Date</th>
                        <th className="pb-3 font-medium">Student Info</th>
                        <th className="pb-3 font-medium">Commission</th>
                        <th className="pb-3 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm">
                      {data.commissions.map((comm: any) => (
                        <tr key={comm.id} className="border-b border-[#1f2229] last:border-0 hover:bg-white/5 transition-colors">
                          <td className="py-4">{new Date(comm.created_at).toLocaleDateString()}</td>
                          <td className="py-4 truncate max-w-[150px] text-[#b9cacb]">{comm.referee_email}</td>
                          <td className="py-4 font-bold text-white">₦{comm.amount.toLocaleString()}</td>
                          <td className="py-4">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                              comm.status === 'available' ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' :
                              comm.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                              comm.status === 'paid' ? 'bg-green-500/10 text-green-400 border border-green-500/20' :
                              'bg-gray-500/10 text-gray-400 border border-gray-500/20'
                            }`}>
                              {comm.status.toUpperCase()}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-[#b9cacb] bg-black/20 rounded-xl border border-white/5">
                  <Star className="h-8 w-8 text-purple-500/50 mx-auto mb-3" />
                  <p>Awaiting your first conversion. Share your link to start earning!</p>
                </div>
              )}
            </div>
          </div>

          {/* Withdrawal Panel */}
          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6 flex flex-col h-fit">
            <h3 className="text-lg font-bold mb-6">Request Payout</h3>
            
            <div className="bg-[#0c0e12] rounded-xl p-5 mb-6 border border-[#1f2229]">
              <div className="flex justify-between items-center mb-3">
                <span className="text-sm text-[#b9cacb]">Available Balance</span>
                <span className="font-bold text-purple-400 text-lg">₦{data.earnings.availableEarnings.toLocaleString()}</span>
              </div>
              <div className="w-full bg-[#1f2229] h-2.5 rounded-full overflow-hidden">
                <div className="bg-gradient-to-r from-purple-500 to-blue-500 h-full" style={{ width: `${Math.min(100, (data.earnings.availableEarnings / 2000) * 100)}%` }} />
              </div>
              <p className="text-xs text-[#b9cacb] mt-3 text-right flex items-center justify-end gap-1">
                <AlertCircle className="h-3 w-3" /> Minimum payout: ₦2,000
              </p>
            </div>

            <form onSubmit={handleWithdraw} className="mt-auto space-y-5">
              <div>
                <label className="text-sm text-[#b9cacb] mb-2 block font-medium">Payout Amount</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#b9cacb] font-bold">₦</span>
                  <input
                    type="number"
                    min="2000"
                    max={data.earnings.availableEarnings}
                    value={withdrawAmount}
                    onChange={(e) => setWithdrawAmount(e.target.value)}
                    className="w-full bg-[#0c0e12] border border-[#1f2229] rounded-xl pl-10 pr-4 py-3 focus:outline-none focus:border-purple-500 transition-colors font-bold text-lg"
                    placeholder="2000"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isWithdrawing || !withdrawAmount || Number(withdrawAmount) < 2000 || Number(withdrawAmount) > data.earnings.availableEarnings}
                className="w-full py-3.5 rounded-xl bg-purple-500 text-white font-bold hover:bg-purple-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {isWithdrawing ? <Loader2 className="h-5 w-5 animate-spin" /> : <ArrowRightLeft className="h-5 w-5" />}
                Submit Payout Request
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
