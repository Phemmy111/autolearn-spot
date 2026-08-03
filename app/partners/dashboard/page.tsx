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
  TrendingUp,
  Download,
  FileText,
  Share2,
  Menu,
  X,
  Crown,
  Medal,
  Award,
  BarChart3,
  Activity,
  Target,
  Zap,
  Shield,
  Globe,
  Calendar,
  CheckCircle,
  MessageCircle,
  RefreshCw
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [bankFormData, setBankFormData] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

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
    if (!withdrawAmount || Number(withdrawAmount) < 5000) {
      alert("Minimum withdrawal amount is ₦5,000");
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

  const handleContactSupport = () => {
    const phoneNumber = "08120934828";
    const message = encodeURIComponent("Hello AutoLearn Spot Support. I need assistance regarding my partner account.");
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
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
      <div className="min-h-screen bg-[#070B12] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#00F5FF]" />
      </div>
    );
  }

  const partner = data?.partner;
  const stats = data?.stats;
  const referral = data?.referral;
  const bankProfile = data?.bankProfile;

  // Initialize bank form data when bank profile exists
  useEffect(() => {
    if (bankProfile && !showBankModal) {
      setBankFormData({
        bank_name: bankProfile.bank_name,
        account_number: bankProfile.account_number,
        account_name: bankProfile.account_name
      });
    }
  }, [bankProfile, showBankModal]);

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "referrals", label: "Referrals", icon: Users },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "withdrawals", label: "Withdrawals", icon: CreditCard },
    { id: "marketing", label: "Marketing Kit", icon: Download },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-[#070B12]">
      {/* Header */}
      <header className="border-b border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2">
                <Image
                  src="/icon-dark-32x32.png"
                  alt="AutoLearn Spot"
                  width={32}
                  height={32}
                />
                <span className="font-mono text-sm font-semibold tracking-[0.1em] text-[#e2e2e8] hidden sm:block">
                  AutoLearn Spot
                </span>
              </Link>
              <div className="hidden md:block h-6 w-px bg-[#1f2229]" />
              <div>
                <h1 className="text-lg font-bold text-[#e2e2e8]">Partner Dashboard</h1>
                <p className="text-xs text-[#b9cacb]">
                  {partner?.type === "student" ? "Student Partner" : 
                   partner?.type === "community" ? "Community Partner" : "Influencer"}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { fetchNotifications(); setShowNotifications(!showNotifications); }}
                className="relative p-2 hover:bg-[#070B12]/50 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5 text-[#b9cacb]" />
                {data?.unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-[#00F5FF] rounded-full" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 border border-[#1f2229] bg-[#070B12]/50 hover:bg-[#070B12] rounded-lg transition-colors text-sm text-[#b9cacb]"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
              <button
                className="md:hidden text-[#b9cacb]"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute top-20 right-4 sm:right-6 w-96 bg-[#111317] border border-[#1f2229] rounded-2xl shadow-xl z-50">
          <div className="p-4 border-b border-[#1f2229] flex items-center justify-between">
            <h3 className="font-bold text-[#e2e2e8]">Notifications</h3>
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
              className="text-sm text-[#00F5FF] hover:underline"
            >
              Mark all as read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-[#1f2229] cursor-pointer hover:bg-[#070B12]/50 transition-colors ${!notif.read ? 'bg-[#00F5FF]/5' : ''}`}
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
                  <p className="font-medium text-sm text-[#e2e2e8]">{notif.title}</p>
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

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#1f2229] bg-[#0c0e12]">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-[#00F5FF]/10 text-[#00F5FF]'
                      : 'text-[#b9cacb] hover:bg-[#070B12]/50'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-[#b9cacb] hover:bg-[#070B12]/50"
            >
              <LogOut className="h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Sidebar Navigation */}
          <div className="hidden lg:block">
            <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-4 sticky top-24">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'bg-[#00F5FF]/10 text-[#00F5FF]'
                          : 'text-[#b9cacb] hover:bg-[#070B12]/50'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      {item.label}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold text-[#e2e2e8] mb-2">
                Welcome back, {partner?.name || "Partner"}!
              </h2>
              <p className="text-[#b9cacb]">Here's your performance overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-[#00F5FF]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb]">Available Balance</span>
                </div>
                <div className="text-2xl font-bold text-[#00F5FF]">₦{stats?.availableEarnings?.toLocaleString() || 0}</div>
              </div>
              <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-[#e2e2e8]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb]">Pending Earnings</span>
                </div>
                <div className="text-2xl font-bold text-[#e2e2e8]">₦{stats?.pendingEarnings?.toLocaleString() || 0}</div>
              </div>
              <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-[#e2e2e8]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb]">Total Earned</span>
                </div>
                <div className="text-2xl font-bold text-[#e2e2e8]">₦{stats?.lifetimeEarnings?.toLocaleString() || 0}</div>
              </div>
              <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-[#e2e2e8]" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb]">Total Referrals</span>
                </div>
                <div className="text-2xl font-bold text-[#e2e2e8]">{stats?.totalRegistrations || 0}</div>
              </div>
            </div>

            {/* Referral Link Card */}
            <div className="border border-[#00F5FF]/30 bg-gradient-to-r from-[#00F5FF]/10 to-transparent rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-[#e2e2e8] mb-2">Your Referral Link</h3>
                  <p className="text-sm text-[#b9cacb]">
                    Share this unique link with your network. When they enroll in the ₦8,000 course, you earn ₦{partner?.commissionRate || data?.partner?.commissionRate || 1500} commission.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="bg-[#070B12]/50 border border-[#1f2229] rounded-lg px-4 py-3 font-mono text-sm text-[#b9cacb] truncate flex-1 sm:w-64">
                    {data?.referral?.link || "Generating referral link..."}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    disabled={!data?.referral?.link}
                    className="border border-[#00F5FF] bg-[#00F5FF] text-[#070B12] px-4 py-3 rounded-lg font-bold hover:bg-white transition-colors flex-shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  {!data?.referral?.link && (
                    <button
                      onClick={fetchDashboardData}
                      className="border border-[#1f2229] bg-[#070B12] text-[#b9cacb] px-3 py-3 rounded-lg font-medium hover:bg-[#1f2229] transition-colors flex-shrink-0"
                      title="Refresh referral link"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === "overview" && (
              <>
                {/* Charts Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
                    <h3 className="font-semibold text-[#e2e2e8] mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-[#00F5FF]" />
                      Monthly Earnings
                    </h3>
                    <div className="h-48 flex items-end gap-2">
                      {data?.recentCommissions?.slice(0, 12).map((commission: any, i: number) => {
                        const height = Math.min((commission.amount / 2000) * 100, 100);
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-[#00F5FF]/20 rounded-t transition-all hover:bg-[#00F5FF]/40"
                            style={{ height: `${height}%` }}
                            title={`Commission ${i + 1}: ₦${commission.amount}`}
                          />
                        );
                      }) || [15, 25, 20, 35, 30, 45, 40, 55, 50, 65, 60, 75].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-[#00F5FF]/20 rounded-t transition-all hover:bg-[#00F5FF]/40"
                          style={{ height: `${height}%` }}
                          title={`Month ${i + 1}: ₦${height * 100}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-[#b9cacb]">
                      <span>Jan</span>
                      <span>Jun</span>
                      <span>Dec</span>
                    </div>
                  </div>

                  <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
                    <h3 className="font-semibold text-[#e2e2e8] mb-4 flex items-center gap-2">
                      <MousePointerClick className="h-5 w-5 text-[#00F5FF]" />
                      Referral Performance
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#b9cacb]">Clicks</span>
                          <span className="text-[#e2e2e8]">{data?.referral?.totalClicks || 0}</span>
                        </div>
                        <div className="h-2 bg-[#070B12] rounded-full overflow-hidden">
                          <div className="h-full bg-[#00F5FF] rounded-full" style={{ width: `${Math.min((data?.referral?.totalClicks || 0) / 100 * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#b9cacb]">Conversions</span>
                          <span className="text-[#e2e2e8]">{data?.referral?.totalRegistrations || 0}</span>
                        </div>
                        <div className="h-2 bg-[#070B12] rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((data?.referral?.totalRegistrations || 0) / (data?.referral?.totalClicks || 1) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-[#b9cacb]">Success Rate</span>
                          <span className="text-[#e2e2e8]">{data?.referral?.totalClicks > 0 ? Math.round((data?.referral?.totalRegistrations || 0) / data?.referral?.totalClicks * 100) : 0}%</span>
                        </div>
                        <div className="h-2 bg-[#070B12] rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${data?.referral?.totalClicks > 0 ? Math.round((data?.referral?.totalRegistrations || 0) / data?.referral?.totalClicks * 100) : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
                  <h3 className="font-semibold text-[#e2e2e8] mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-[#00F5FF]" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {data?.recentCommissions && data.recentCommissions.length > 0 ? (
                      data.recentCommissions.slice(0, 5).map((commission: any) => (
                        <div key={commission.id} className="flex items-center gap-4 p-3 border border-[#1f2229] bg-[#070B12]/50 rounded-lg">
                          <div className="flex h-10 w-10 items-center justify-center border border-[#00F5FF]/60 bg-[#00F5FF]/10 rounded-lg">
                            <DollarSign className="h-5 w-5 text-[#00F5FF]" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-[#e2e2e8]">Commission earned</p>
                            <p className="text-xs text-[#b9cacb]">₦{commission.amount?.toLocaleString()}</p>
                          </div>
                          <p className="text-xs text-[#b9cacb]">{new Date(commission.created_at).toLocaleDateString()}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#b9cacb] text-center py-4">No recent activity</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "referrals" && (
              <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-semibold text-[#e2e2e8] mb-4">Referral History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-[#1f2229]">
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#b9cacb]">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#b9cacb]">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#b9cacb]">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-[#b9cacb]">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.recentCommissions && data.recentCommissions.length > 0 ? (
                        data.recentCommissions.map((commission: any) => (
                          <tr key={commission.id} className="border-b border-[#1f2229]">
                            <td className="py-3 px-4 text-sm text-[#e2e2e8]">{commission.referred_name || 'Unknown'}</td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs rounded-full ${
                                commission.status === 'paid' 
                                  ? 'bg-green-500/10 text-green-400' 
                                  : commission.status === 'pending'
                                  ? 'bg-yellow-500/10 text-yellow-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {commission.status || 'Pending'}
                              </span>
                            </td>
                            <td className="py-3 px-4 text-sm text-[#b9cacb]">{new Date(commission.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-sm text-[#00F5FF]">₦{commission.amount?.toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-sm text-[#b9cacb]">No referral history yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "earnings" && (
              <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-semibold text-[#e2e2e8] mb-4">Earnings Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-[#1f2229] bg-[#070B12]/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#e2e2e8]">Available Balance</p>
                      <p className="text-xs text-[#b9cacb]">Ready for withdrawal</p>
                    </div>
                    <p className="text-2xl font-bold text-[#00F5FF]">₦{stats?.availableEarnings?.toLocaleString() || 0}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-[#1f2229] bg-[#070B12]/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#e2e2e8]">Pending Earnings</p>
                      <p className="text-xs text-[#b9cacb]">Being processed</p>
                    </div>
                    <p className="text-2xl font-bold text-[#e2e2e8]">₦{stats?.pendingEarnings?.toLocaleString() || 0}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-[#1f2229] bg-[#070B12]/50 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-[#e2e2e8]">Total Earned</p>
                      <p className="text-xs text-[#b9cacb]">All time earnings</p>
                    </div>
                    <p className="text-2xl font-bold text-[#e2e2e8]">₦{stats?.lifetimeEarnings?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "withdrawals" && (
              <div className="space-y-6">
                <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
                  <h3 className="font-semibold text-[#e2e2e8] mb-4">Request Withdrawal</h3>
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-[#b9cacb] block mb-2">Amount (₦)</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min="5000"
                        className="w-full bg-[#070B12]/50 border border-[#1f2229] rounded-xl px-4 py-3 focus:outline-none focus:border-[#00F5FF] transition-colors text-[#e2e2e8]"
                        placeholder="Minimum ₦5,000"
                      />
                    </div>
                    {!bankProfile && (
                      <button
                        type="button"
                        onClick={() => setShowBankModal(true)}
                        className="w-full py-3 border border-[#00F5FF] bg-[#00F5FF]/10 text-[#00F5FF] rounded-xl font-semibold hover:bg-[#00F5FF]/20 transition-colors"
                      >
                        Setup Bank Profile
                      </button>
                    )}
                    <button
                      disabled={isWithdrawing || !bankProfile}
                      type="submit"
                      className="w-full py-3 border border-[#00F5FF] bg-[#00F5FF] text-[#070B12] rounded-xl font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {isWithdrawing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          Submit Withdrawal
                        </>
                      )}
                    </button>
                  </form>
                </div>

                <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
                  <h3 className="font-semibold text-[#e2e2e8] mb-4">Withdrawal History</h3>
                  <div className="space-y-4">
                    {data?.withdrawals && data.withdrawals.length > 0 ? (
                      data.withdrawals.map((withdrawal: any) => (
                        <div key={withdrawal.id} className="flex items-center justify-between p-4 border border-[#1f2229] bg-[#070B12]/50 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-[#e2e2e8]">₦{withdrawal.amount?.toLocaleString()}</p>
                            <p className="text-xs text-[#b9cacb]">{new Date(withdrawal.created_at).toLocaleDateString()}</p>
                          </div>
                          <span className={`px-3 py-1 text-xs rounded-full ${
                            withdrawal.status === "completed" 
                              ? "bg-green-500/10 text-green-400" 
                              : withdrawal.status === "pending"
                              ? "bg-yellow-500/10 text-yellow-400"
                              : "bg-red-500/10 text-red-400"
                          }`}>
                            {withdrawal.status}
                          </span>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-[#b9cacb] text-center py-4">No withdrawal history yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "marketing" && (
              <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-semibold text-[#e2e2e8] mb-4">Marketing Kit</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data?.marketingResources && data.marketingResources.length > 0 ? (
                    data.marketingResources.map((item: any) => {
                      const Icon = FileText; // Default icon, can be customized based on type
                      return (
                        <div key={item.id} className="border border-[#1f2229] bg-[#070B12]/50 rounded-xl p-4 hover:border-[#00F5FF]/50 transition-all cursor-pointer">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-[#00F5FF]/60 bg-[#00F5FF]/10 rounded-lg">
                              <Icon className="h-5 w-5 text-[#00F5FF]" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-[#e2e2e8]">{item.name}</p>
                              <p className="text-xs text-[#b9cacb]">{item.downloads || 0} downloads</p>
                            </div>
                          </div>
                          <button 
                            onClick={() => window.open(item.url, '_blank')}
                            className="w-full py-2 border border-[#00F5FF]/60 bg-[#00F5FF]/10 text-[#00F5FF] rounded-lg text-sm font-medium hover:bg-[#00F5FF]/20 transition-colors"
                          >
                            Download
                          </button>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-[#b9cacb] text-center py-4 col-span-2">No marketing resources available</p>
                  )}
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-semibold text-[#e2e2e8] mb-4">Profile Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-[#b9cacb] block mb-2">Partner ID</label>
                    <div className="p-3 border border-[#1f2229] bg-[#070B12]/50 rounded-lg font-mono text-sm text-[#b9cacb]">
                      {partner?.id || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#b9cacb] block mb-2">Email</label>
                    <div className="p-3 border border-[#1f2229] bg-[#070B12]/50 rounded-lg text-sm text-[#e2e2e8]">
                      {partner?.email || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#b9cacb] block mb-2">Partner Type</label>
                    <div className="p-3 border border-[#1f2229] bg-[#070B12]/50 rounded-lg text-sm text-[#e2e2e8]">
                      {partner?.type === "student" ? "Student Partner" : 
                       partner?.type === "community" ? "Community Partner" : 
                       partner?.type === "influencer" ? "Influencer" : "Partner"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-[#b9cacb] block mb-2">Commission Rate</label>
                    <div className="p-3 border border-[#1f2229] bg-[#070B12]/50 rounded-lg text-sm text-[#00F5FF]">
                      ₦{partner?.commissionRate || data?.partner?.commissionRate || 1500} per referral
                    </div>
                  </div>
                  
                  {/* Bank Details Section */}
                  <div className="border-t border-[#1f2229] pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-[#e2e2e8]">Bank Details</h4>
                      <button
                        onClick={() => {
                          if (bankProfile) {
                            setBankFormData({
                              bank_name: bankProfile.bank_name,
                              account_number: bankProfile.account_number,
                              account_name: bankProfile.account_name
                            });
                          }
                          setShowBankModal(true);
                        }}
                        className="text-xs text-[#00F5FF] hover:text-white transition-colors"
                      >
                        {bankProfile ? 'Edit' : 'Add Bank Details'}
                      </button>
                    </div>
                    
                    {bankProfile ? (
                      <div className="space-y-3">
                        <div className="p-3 border border-[#1f2229] bg-[#070B12]/50 rounded-lg">
                          <p className="text-xs text-[#b9cacb] mb-1">Bank Name</p>
                          <p className="text-sm text-[#e2e2e8]">{bankProfile.bank_name}</p>
                        </div>
                        <div className="p-3 border border-[#1f2229] bg-[#070B12]/50 rounded-lg">
                          <p className="text-xs text-[#b9cacb] mb-1">Account Number</p>
                          <p className="text-sm text-[#e2e2e8]">{bankProfile.account_number}</p>
                        </div>
                        <div className="p-3 border border-[#1f2229] bg-[#070B12]/50 rounded-lg">
                          <p className="text-xs text-[#b9cacb] mb-1">Account Name</p>
                          <p className="text-sm text-[#e2e2e8]">{bankProfile.account_name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-[#1f2229] bg-[#070B12]/30 rounded-lg text-center">
                        <p className="text-sm text-[#b9cacb] mb-2">No bank details added yet</p>
                        <button
                          onClick={() => setShowBankModal(true)}
                          className="text-xs text-[#00F5FF] hover:text-white transition-colors"
                        >
                          Add bank details to enable withdrawals
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleContactSupport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-[#25D366] text-white rounded-lg font-medium hover:bg-[#25D366]/90 transition-colors mt-4"
                  >
                    <MessageCircle className="h-4 w-4" />
                    Contact Support via WhatsApp
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bank Profile Modal */}
      {showBankModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl p-6 sm:p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-[#e2e2e8]">{bankProfile ? 'Edit Bank Profile' : 'Setup Bank Profile'}</h2>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-[#b9cacb] hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            
            <form onSubmit={async (e) => {
              e.preventDefault();
              setIsSavingBank(true);
              try {
                const res = await fetch('/api/partners/bank-profile', {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify(bankFormData)
                });
                if (res.ok) {
                  setShowBankModal(false);
                  fetchDashboardData();
                  alert('Bank profile saved successfully');
                } else {
                  alert('Failed to save bank profile');
                }
              } catch (error) {
                alert('Error saving bank profile');
              } finally {
                setIsSavingBank(false);
              }
            }} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-[#b9cacb] block mb-2">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankFormData.bank_name}
                  onChange={(e) => setBankFormData({...bankFormData, bank_name: e.target.value})}
                  className="w-full bg-[#070B12]/50 border border-[#1f2229] rounded-lg px-4 py-3 text-[#e2e2e8] focus:outline-none focus:border-[#00F5FF] transition-colors"
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#b9cacb] block mb-2">Account Number</label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_number}
                  onChange={(e) => setBankFormData({...bankFormData, account_number: e.target.value})}
                  className="w-full bg-[#070B12]/50 border border-[#1f2229] rounded-lg px-4 py-3 text-[#e2e2e8] focus:outline-none focus:border-[#00F5FF] transition-colors"
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-[#b9cacb] block mb-2">Account Name</label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_name}
                  onChange={(e) => setBankFormData({...bankFormData, account_name: e.target.value})}
                  className="w-full bg-[#070B12]/50 border border-[#1f2229] rounded-lg px-4 py-3 text-[#e2e2e8] focus:outline-none focus:border-[#00F5FF] transition-colors"
                  placeholder="Enter account name"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="flex-1 py-3 border border-[#1f2229] text-[#b9cacb] rounded-lg font-medium hover:bg-[#070B12] transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBank}
                  className="flex-1 py-3 bg-[#00F5FF] text-[#070B12] rounded-lg font-bold hover:bg-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSavingBank ? 'Saving...' : 'Save Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}