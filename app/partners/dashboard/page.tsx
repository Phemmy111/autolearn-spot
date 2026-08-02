"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Loader2, 
  Copy, 
  CheckCircle2, 
  Wallet, 
  Users, 
  MousePointerClick, 
  ArrowRightLeft, 
  DollarSign, 
  Clock, 
  LogOut,
  Bell,
  Settings,
  CreditCard,
  History,
  TrendingUp
} from "lucide-react";
import Link from "next/link";

export default function PartnerDashboard() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/partners/notifications");
      const result = await res.json();
      if (res.ok && result.success) {
        setNotifications(result.notifications);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchDashboardData = async () => {
    try {
      const res = await fetch("/api/partners/dashboard");
      const result = await res.json();
      if (res.ok && result.success) {
        setData(result);
      } else {
        router.push("/partners/login");
      }
    } catch (err) {
      router.push("/partners/login");
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    if (data?.referral?.link) {
      navigator.clipboard.writeText(data.referral.link);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!withdrawAmount || Number(withdrawAmount) < 2000) {
      alert("Minimum withdrawal amount is ₦2,000");
      return;
    }

    setIsWithdrawing(true);
    try {
      const res = await fetch("/api/partners/withdrawals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount: Number(withdrawAmount) }),
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

  const handleLogout = async () => {
    try {
      await fetch("/api/partners/logout", { method: "POST" });
      router.push("/partners/login");
    } catch (err) {
      router.push("/partners/login");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0c0e12] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00f0ff]" />
      </div>
    );
  }

  const partner = data?.partner;
  const stats = data?.stats;
  const referral = data?.referral;
  const bankProfile = data?.bankProfile;

  return (
    <div className="min-h-screen bg-[#0c0e12] text-white">
      {/* Header */}
      <header className="border-b border-white/10 bg-[#0c0e12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">Partner Dashboard</h1>
            <p className="text-sm text-[#b9cacb]">
              {partner?.type === "student" ? "Student Partner" : 
               partner?.type === "community" ? "Community Partner" : "Influencer"}
            </p>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => { fetchNotifications(); setShowNotifications(!showNotifications); }}
              className="relative p-2 hover:bg-white/10 rounded-lg transition-colors"
            >
              <Bell className="h-5 w-5" />
              {data?.unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />
              )}
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute top-20 right-6 w-96 bg-[#111317] border border-[#1f2229] rounded-2xl shadow-xl z-50">
          <div className="p-4 border-b border-[#1f2229] flex items-center justify-between">
            <h3 className="font-bold">Notifications</h3>
            <button
              onClick={async () => {
                await fetch("/api/partners/notifications", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ action: "mark_all_read" }),
                });
                fetchNotifications();
                fetchDashboardData();
              }}
              className="text-sm text-[#00f0ff] hover:underline"
            >
              Mark all as read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-[#1f2229] cursor-pointer hover:bg-white/5 transition-colors ${!notif.read ? 'bg-[#00f0ff]/5' : ''}`}
                  onClick={async () => {
                    if (!notif.read) {
                      await fetch("/api/partners/notifications", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ action: "mark_read", notificationId: notif.id }),
                      });
                      fetchNotifications();
                      fetchDashboardData();
                    }
                  }}
                >
                  <p className="font-medium text-sm">{notif.title}</p>
                  <p className="text-[#b9cacb] text-xs mt-1">{notif.message}</p>
                  <p className="text-[#b9cacb] text-xs mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-[#b9cacb]">No notifications</div>
            )}
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Welcome Section */}
        <div>
          <h2 className="text-2xl font-bold mb-2">Welcome back, {partner?.name}!</h2>
          <p className="text-[#b9cacb]">Here's your performance overview</p>
        </div>

        {/* Referral Link Card */}
        <div className="bg-gradient-to-r from-[#00f0ff]/10 to-transparent border border-[#00f0ff]/20 rounded-2xl p-6 md:p-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div>
            <h2 className="text-xl font-bold mb-2">Your Referral Link</h2>
            <p className="text-[#b9cacb] text-sm max-w-xl">
              Share this unique link with your network. When they enroll in the ₦8,000 course, you earn ₦{partner?.commissionRate || 1500} commission.
            </p>
          </div>
          <div className="flex items-center gap-2 w-full md:w-auto">
            <div className="bg-black/50 border border-white/10 rounded-lg px-4 py-3 font-mono text-sm text-white/80 truncate w-full md:w-64">
              {referral?.link || "Loading..."}
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
            <h3 className="text-2xl font-bold">{stats?.totalClicks || 0}</h3>
          </div>

          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Users className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1">Registrations</p>
            <h3 className="text-2xl font-bold">{stats?.totalRegistrations || 0}</h3>
          </div>

          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-10 h-10 rounded-full bg-yellow-500/10 flex items-center justify-center text-yellow-400">
                <Clock className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1">Pending Earnings</p>
            <h3 className="text-2xl font-bold text-yellow-400">₦{stats?.pendingEarnings?.toLocaleString() || 0}</h3>
          </div>

          <div className="bg-[#111317] border border-[#00f0ff]/30 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#00f0ff]/5 blur-3xl rounded-full" />
            <div className="flex items-center justify-between mb-4 relative z-10">
              <div className="w-10 h-10 rounded-full bg-[#00f0ff]/10 flex items-center justify-center text-[#00f0ff]">
                <Wallet className="h-5 w-5" />
              </div>
            </div>
            <p className="text-sm text-[#b9cacb] mb-1 relative z-10">Available Balance</p>
            <h3 className="text-2xl font-bold text-[#00f0ff] relative z-10">₦{stats?.availableEarnings?.toLocaleString() || 0}</h3>
          </div>
        </div>

        {/* Additional Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <TrendingUp className="h-5 w-5 text-green-400" />
              <h3 className="font-medium">Lifetime Earnings</h3>
            </div>
            <p className="text-2xl font-bold">₦{stats?.lifetimeEarnings?.toLocaleString() || 0}</p>
          </div>

          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <ArrowRightLeft className="h-5 w-5 text-blue-400" />
              <h3 className="font-medium">Total Withdrawn</h3>
            </div>
            <p className="text-2xl font-bold">₦{stats?.totalWithdrawn?.toLocaleString() || 0}</p>
          </div>

          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <DollarSign className="h-5 w-5 text-purple-400" />
              <h3 className="font-medium">Commission Rate</h3>
            </div>
            <p className="text-2xl font-bold">₦{partner?.commissionRate || 1500}</p>
          </div>
        </div>

        {/* Bank Profile & Withdrawal */}
        <div className="grid md:grid-cols-2 gap-6">
          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Bank Details</h3>
              <button
                onClick={() => setShowBankModal(true)}
                className="text-sm text-[#00f0ff] hover:underline"
              >
                {bankProfile ? "Update" : "Add"}
              </button>
            </div>
            {bankProfile ? (
              <div className="space-y-2 text-sm">
                <p><span className="text-[#b9cacb]">Bank:</span> {bankProfile.bank_name}</p>
                <p><span className="text-[#b9cacb]">Account:</span> {bankProfile.account_number}</p>
                <p><span className="text-[#b9cacb]">Name:</span> {bankProfile.account_name}</p>
              </div>
            ) : (
              <p className="text-[#b9cacb] text-sm">No bank details added yet</p>
            )}
          </div>

          <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
            <h3 className="font-bold mb-4">Request Withdrawal</h3>
            <form onSubmit={handleWithdraw} className="space-y-4">
              <div>
                <label className="text-sm text-[#b9cacb] mb-2 block">Amount (₦)</label>
                <input
                  type="number"
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  min="2000"
                  max={stats?.availableEarnings || 0}
                  className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:border-[#00f0ff]"
                  placeholder="Min: ₦2,000"
                />
                <p className="text-xs text-[#b9cacb] mt-1">Available: ₦{stats?.availableEarnings?.toLocaleString() || 0}</p>
              </div>
              <button
                type="submit"
                disabled={isWithdrawing || !bankProfile}
                className="w-full py-3 bg-[#00f0ff] text-black font-bold rounded-lg hover:bg-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isWithdrawing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-4 w-4" />
                    Request Withdrawal
                  </>
                )}
              </button>
              {!bankProfile && (
                <p className="text-xs text-red-400 text-center">Add bank details first</p>
              )}
            </form>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#111317] border border-[#1f2229] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold">Recent Commissions</h3>
            <Link href="/partners/history" className="text-sm text-[#00f0ff] hover:underline flex items-center gap-1">
              <History className="h-4 w-4" />
              View All
            </Link>
          </div>
          {data?.recentCommissions && data.recentCommissions.length > 0 ? (
            <div className="space-y-3">
              {data.recentCommissions.slice(0, 5).map((comm: any) => (
                <div key={comm.id} className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
                  <div>
                    <p className="font-medium">₦{comm.amount?.toLocaleString()}</p>
                    <p className="text-sm text-[#b9cacb]">{new Date(comm.created_at).toLocaleDateString()}</p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                    comm.status === 'available' ? 'bg-green-500/10 text-green-400' :
                    comm.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                    comm.status === 'paid' ? 'bg-blue-500/10 text-blue-400' :
                    'bg-red-500/10 text-red-400'
                  }`}>
                    {comm.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-[#b9cacb] text-center py-8">No commissions yet</p>
          )}
        </div>
      </main>

      {/* Bank Profile Modal */}
      {showBankModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-6 z-50">
          <div className="bg-[#111317] border border-white/10 rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold mb-4">Bank Details</h3>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              const res = await fetch("/api/partners/bank-profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  bank_name: formData.get("bank_name"),
                  account_number: formData.get("account_number"),
                  account_name: formData.get("account_name"),
                }),
              });
              if (res.ok) {
                setShowBankModal(false);
                fetchDashboardData();
              }
            }} className="space-y-4">
              <div>
                <label className="text-sm text-[#b9cacb] mb-2 block">Bank Name</label>
                <input required name="bank_name" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3" placeholder="Option 1: Access Bank" />
              </div>
              <div>
                <label className="text-sm text-[#b9cacb] mb-2 block">Account Number</label>
                <input required name="account_number" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3" placeholder="10-digit account number" />
              </div>
              <div>
                <label className="text-sm text-[#b9cacb] mb-2 block">Account Name</label>
                <input required name="account_name" className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3" placeholder="Account holder name" />
              </div>
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowBankModal(false)} className="flex-1 py-3 bg-white/10 rounded-lg hover:bg-white/20 transition-colors">
                  Cancel
                </button>
                <button type="submit" className="flex-1 py-3 bg-[#00f0ff] text-black font-bold rounded-lg hover:bg-white transition-colors">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}