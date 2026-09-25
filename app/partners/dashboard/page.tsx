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
  RefreshCw,
  Eye
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
  const [minWithdrawal, setMinWithdrawal] = useState(5000);
  const [isWithdrawing, setIsWithdrawing] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showMaterialDetailModal, setShowMaterialDetailModal] = useState(false);
  const [bankFormData, setBankFormData] = useState({
    bank_name: '',
    account_number: '',
    account_name: ''
  });
  const [isSavingBank, setIsSavingBank] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // Fetch partnership settings to get minimum withdrawal amount
  useEffect(() => {
    const fetchPartnershipSettings = async () => {
      try {
        const res = await fetch('/api/settings/partnership');
        const data = await res.json();
        if (res.ok && data.minWithdrawal) {
          setMinWithdrawal(data.minWithdrawal);
        }
      } catch (err) {
        console.error('Failed to fetch partnership settings:', err);
      }
    };
    fetchPartnershipSettings();
  }, []);

  // Initialize bank form data when bank profile exists
  useEffect(() => {
    if (data?.bankProfile && !showBankModal) {
      setBankFormData({
        bank_name: data.bankProfile.bank_name,
        account_number: data.bankProfile.account_number,
        account_name: data.bankProfile.account_name
      });
    }
  }, [data?.bankProfile, showBankModal]);

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

  const openMaterialDetail = (material: any) => {
    setSelectedMaterial(material);
    setShowMaterialDetailModal(true);
  };

  const copyTextToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Text copied to clipboard!');
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
    if (!withdrawAmount) {
      alert("Please enter a withdrawal amount");
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
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-brand-primary" />
      </div>
    );
  }

  const partner = data?.partner;
  const stats = data?.stats;
  const referral = data?.referral;
  const bankProfile = data?.bankProfile;

  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);

  const fetchAffiliateData = async () => {
    setLoadingMarketplace(true);
    try {
      const [mpRes, linksRes] = await Promise.all([
        fetch('/api/partners/affiliate-marketplace'),
        fetch('/api/partners/affiliate-links')
      ]);
      if (mpRes.ok) setMarketplaceProducts(await mpRes.json());
      if (linksRes.ok) setAffiliateLinks(await linksRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingMarketplace(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'promote') {
      fetchAffiliateData();
    }
  }, [activeTab]);

  const generateAffiliateLink = async (productId: string) => {
    setGeneratingLink(productId);
    try {
      const res = await fetch('/api/partners/affiliate-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ learning_product_id: productId })
      });
      if (res.ok) {
        await fetchAffiliateData(); // Refresh lists
      } else {
        alert('Failed to generate link');
      }
    } catch (e) {
      alert('Error generating link');
    } finally {
      setGeneratingLink(null);
    }
  };

  const navItems = [
    { id: "overview", label: "Overview", icon: BarChart3 },
    { id: "promote", label: "Promote Courses", icon: Globe },
    { id: "referrals", label: "Referrals", icon: Users },
    { id: "earnings", label: "Earnings", icon: DollarSign },
    { id: "withdrawals", label: "Withdrawals", icon: CreditCard },
    { id: "marketing", label: "Marketing Kit", icon: Download },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <header className="border-b border-brand-border bg-brand-bg/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2.5">
                <Image
                  src="/autolearn-brandmark.png"
                  alt="AutoLearn Spot"
                  width={32}
                  height={32}
                  className="object-contain"
                />
                <span className="font-heading text-base font-bold text-brand-text hidden sm:block">
                  AutoLearn Spot
                </span>
              </Link>
              <div className="hidden md:block h-6 w-px bg-brand-border" />
              <div>
                <h1 className="text-base sm:text-lg font-bold text-brand-text leading-tight">Affiliate Dashboard</h1>
                <p className="text-xs text-brand-text/60">
                  Affiliate Partner
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <button 
                onClick={() => { fetchNotifications(); setShowNotifications(!showNotifications); }}
                className="relative p-2 hover:bg-brand-bg/60 rounded-lg transition-colors"
              >
                <Bell className="h-5 w-5 text-brand-text/60" />
                {data?.unreadCount > 0 && (
                  <span className="absolute top-1 right-1 w-2 h-2 bg-brand-bg rounded-full" />
                )}
              </button>
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-4 py-2 border border-brand-border bg-brand-bg/60 hover:bg-brand-bg rounded-lg transition-colors text-sm text-brand-text/60"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
              <button
                className="md:hidden text-brand-text/60"
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
        <div className="absolute top-20 right-4 sm:right-6 w-96 bg-brand-bg border border-brand-border rounded-2xl shadow-xl z-50">
          <div className="p-4 border-b border-brand-border flex items-center justify-between">
            <h3 className="font-bold text-brand-text">Notifications</h3>
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
              className="text-sm text-brand-primary hover:underline"
            >
              Mark all as read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <div 
                  key={notif.id} 
                  className={`p-4 border-b border-brand-border cursor-pointer hover:bg-brand-bg/60 transition-colors ${!notif.read ? 'bg-brand-bg/5' : ''}`}
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
                  <p className="font-medium text-sm text-brand-text">{notif.title}</p>
                  <p className="text-brand-text/60 text-xs mt-1">{notif.message}</p>
                  <p className="text-brand-text/60 text-xs mt-2">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-brand-text/60">No notifications</div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-brand-border bg-brand-bg">
          <div className="px-4 py-4 space-y-3">
            {navItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-brand-bg/10 text-brand-primary'
                      : 'text-brand-text/60 hover:bg-brand-bg/60'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  {item.label}
                </button>
              );
            })}
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 w-full px-4 py-3 rounded-lg text-brand-text/60 hover:bg-brand-bg/60"
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
            <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-4 sticky top-24">
              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-3 w-full px-4 py-3 rounded-lg transition-colors ${
                        activeTab === item.id
                          ? 'bg-brand-bg/10 text-brand-primary'
                          : 'text-brand-text/60 hover:bg-brand-bg/60'
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
              <h2 className="text-2xl sm:text-3xl font-bold text-brand-text mb-2">
                Welcome back, {partner?.name || "Partner"}!
              </h2>
              <p className="text-brand-text/60">Here's your performance overview</p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Wallet className="h-4 w-4 text-brand-primary" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-text/60">Available Balance</span>
                </div>
                <div className="text-2xl font-bold text-brand-primary">₦{stats?.availableEarnings?.toLocaleString() || 0}</div>
              </div>
              <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="h-4 w-4 text-brand-text" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-text/60">Pending Earnings</span>
                </div>
                <div className="text-2xl font-bold text-brand-text">₦{stats?.pendingEarnings?.toLocaleString() || 0}</div>
              </div>
              <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-brand-text" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-text/60">Total Earned</span>
                </div>
                <div className="text-2xl font-bold text-brand-text">₦{stats?.lifetimeEarnings?.toLocaleString() || 0}</div>
              </div>
              <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-brand-text" />
                  <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-brand-text/60">Total Referrals</span>
                </div>
                <div className="text-2xl font-bold text-brand-text">{stats?.totalRegistrations || 0}</div>
              </div>
            </div>

            {/* Referral Link Card */}
            <div className="border border-brand-primary/30 bg-gradient-to-r from-brand-primary/10 to-transparent rounded-2xl p-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-lg font-bold text-brand-text mb-2">Legacy Referral Link</h3>
                  <p className="text-sm text-brand-text/60">
                    This is your old generic referral link. To earn commissions on specific courses, please use the <strong>Promote Courses</strong> tab to generate unique affiliate links.
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <div className="bg-brand-bg/60 border border-brand-border rounded-lg px-4 py-3 font-mono text-sm text-brand-text/60 truncate flex-1 sm:w-64">
                    {data?.referral?.link || "Generating referral link..."}
                  </div>
                  <button
                    onClick={handleCopyLink}
                    disabled={!data?.referral?.link}
                    className="border border-brand-primary bg-brand-bg text-white px-4 py-3 rounded-lg font-bold hover:bg-brand-bg transition-colors flex-shrink-0 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {copied ? <CheckCircle2 className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                  {!data?.referral?.link && (
                    <button
                      onClick={fetchDashboardData}
                      className="border border-brand-border bg-brand-bg text-brand-text/60 px-3 py-3 rounded-lg font-medium hover:bg-brand-bg transition-colors flex-shrink-0"
                      title="Refresh referral link"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Content based on active tab */}
            {activeTab === "promote" && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-bold text-brand-text">Affiliate Marketplace</h3>
                  <p className="text-sm text-brand-text/60">Find courses to promote and earn commissions</p>
                </div>
                
                {loadingMarketplace ? (
                  <div className="flex justify-center p-10"><Loader2 className="h-8 w-8 animate-spin text-brand-primary" /></div>
                ) : (
                  <>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {marketplaceProducts.map(product => (
                        <div key={product.id} className="border border-brand-border bg-brand-bg rounded-xl overflow-hidden flex flex-col">
                          <div className="h-40 bg-brand-bg/50 relative">
                            {product.thumbnail_url ? (
                              <Image src={product.thumbnail_url} alt={product.title} fill className="object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-brand-text/30">No Image</div>
                            )}
                            <div className="absolute top-2 right-2 bg-brand-primary/90 text-white text-xs font-bold px-2 py-1 rounded">
                              Earn {product.affiliate_commission_rate}%
                            </div>
                          </div>
                          <div className="p-4 flex flex-col flex-1">
                            <h4 className="font-bold text-brand-text mb-1 line-clamp-2">{product.title}</h4>
                            <p className="text-sm text-brand-text/60 mb-4">Price: ₦{product.price?.toLocaleString()}</p>
                            <div className="mt-auto">
                              {product.already_promoting ? (
                                <p className="text-sm text-brand-primary flex items-center gap-2 mb-2 font-medium"><CheckCircle2 className="w-4 h-4" /> Link Active</p>
                              ) : (
                                <button
                                  onClick={() => generateAffiliateLink(product.id)}
                                  disabled={generatingLink === product.id}
                                  className="w-full py-2 bg-brand-bg hover:bg-brand-primary/10 border border-brand-primary/50 text-brand-primary rounded-lg transition-colors flex justify-center items-center gap-2"
                                >
                                  {generatingLink === product.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                                  Get Affiliate Link
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    {affiliateLinks.length > 0 && (
                      <div className="mt-12">
                        <h3 className="text-xl font-bold text-brand-text mb-4">Your Active Links</h3>
                        <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                          <table className="w-full text-left text-sm">
                            <thead className="bg-brand-bg border-b border-brand-border text-brand-text/60">
                              <tr>
                                <th className="p-4 font-medium">Product</th>
                                <th className="p-4 font-medium">Comm. Rate</th>
                                <th className="p-4 font-medium">Stats</th>
                                <th className="p-4 font-medium">Earned</th>
                                <th className="p-4 font-medium">Link</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-brand-border">
                              {affiliateLinks.map(link => (
                                <tr key={link.id} className="hover:bg-brand-bg/40">
                                  <td className="p-4 font-medium text-brand-text max-w-[200px] truncate" title={link.product?.title}>
                                    {link.product?.title || 'Unknown Product'}
                                  </td>
                                  <td className="p-4 text-brand-primary">
                                    {link.product?.affiliate_commission_rate}%
                                  </td>
                                  <td className="p-4 text-brand-text/60">
                                    {link.clicks || 0} clicks / {link.conversions || 0} sales
                                  </td>
                                  <td className="p-4 font-bold text-green-400">
                                    ₦{(link.total_earned || 0).toLocaleString()}
                                  </td>
                                  <td className="p-4">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(link.affiliate_url);
                                        alert('Link copied!');
                                      }}
                                      className="px-3 py-1.5 bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary border border-brand-primary/30 rounded flex items-center gap-2"
                                    >
                                      <Copy className="w-3 h-3" /> Copy
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "overview" && (
              <>
                {/* Charts Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                    <h3 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-brand-primary" />
                      Monthly Earnings
                    </h3>
                    <div className="h-48 flex items-end gap-2">
                      {data?.recentCommissions?.slice(0, 12).map((commission: any, i: number) => {
                        const height = Math.min((commission.amount / 2000) * 100, 100);
                        return (
                          <div
                            key={i}
                            className="flex-1 bg-brand-bg/20 rounded-t transition-all hover:bg-brand-bg/40"
                            style={{ height: `${height}%` }}
                            title={`Commission ${i + 1}: ₦${commission.amount}`}
                          />
                        );
                      }) || [15, 25, 20, 35, 30, 45, 40, 55, 50, 65, 60, 75].map((height, i) => (
                        <div
                          key={i}
                          className="flex-1 bg-brand-bg/20 rounded-t transition-all hover:bg-brand-bg/40"
                          style={{ height: `${height}%` }}
                          title={`Month ${i + 1}: ₦${height * 100}`}
                        />
                      ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-brand-text/60">
                      <span>Jan</span>
                      <span>Jun</span>
                      <span>Dec</span>
                    </div>
                  </div>

                  <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                    <h3 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
                      <MousePointerClick className="h-5 w-5 text-brand-primary" />
                      Referral Performance
                    </h3>
                    <div className="space-y-4">
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-brand-text/60">Clicks</span>
                          <span className="text-brand-text">{data?.referral?.totalClicks || 0}</span>
                        </div>
                        <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                          <div className="h-full bg-brand-bg rounded-full" style={{ width: `${Math.min((data?.referral?.totalClicks || 0) / 100 * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-brand-text/60">Conversions</span>
                          <span className="text-brand-text">{data?.referral?.totalRegistrations || 0}</span>
                        </div>
                        <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 rounded-full" style={{ width: `${Math.min((data?.referral?.totalRegistrations || 0) / (data?.referral?.totalClicks || 1) * 100, 100)}%` }} />
                        </div>
                      </div>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-brand-text/60">Success Rate</span>
                          <span className="text-brand-text">{data?.referral?.totalClicks > 0 ? Math.round((data?.referral?.totalRegistrations || 0) / data?.referral?.totalClicks * 100) : 0}%</span>
                        </div>
                        <div className="h-2 bg-brand-bg rounded-full overflow-hidden">
                          <div className="h-full bg-green-500 rounded-full" style={{ width: `${data?.referral?.totalClicks > 0 ? Math.round((data?.referral?.totalRegistrations || 0) / data?.referral?.totalClicks * 100) : 0}%` }} />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                  <h3 className="font-semibold text-brand-text mb-4 flex items-center gap-2">
                    <History className="h-5 w-5 text-brand-primary" />
                    Recent Activity
                  </h3>
                  <div className="space-y-4">
                    {data?.recentCommissions && data.recentCommissions.length > 0 ? (
                      data.recentCommissions.slice(0, 5).map((commission: any) => (
                        <div key={commission.id} className="flex items-center gap-4 p-3 border border-brand-border bg-brand-bg/60 rounded-lg">
                          <div className="flex h-10 w-10 items-center justify-center border border-brand-primary/60 bg-brand-bg/10 rounded-lg">
                            <DollarSign className="h-5 w-5 text-brand-primary" />
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-brand-text">Commission earned</p>
                            <p className="text-xs text-brand-text/60">₦{commission.amount?.toLocaleString()}</p>
                          </div>
                          <p className="text-xs text-brand-text/60">{new Date(commission.created_at).toLocaleDateString()}</p>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-brand-text/60 text-center py-4">No recent activity</p>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === "referrals" && (
              <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-semibold text-brand-text mb-4">Referral History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-brand-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-brand-text/60">Name</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-brand-text/60">Status</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-brand-text/60">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-brand-text/60">Commission</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data?.recentCommissions && data.recentCommissions.length > 0 ? (
                        data.recentCommissions.map((commission: any) => (
                          <tr key={commission.id} className="border-b border-brand-border">
                            <td className="py-3 px-4 text-sm text-brand-text">{commission.referred_name || 'Unknown'}</td>
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
                            <td className="py-3 px-4 text-sm text-brand-text/60">{new Date(commission.created_at).toLocaleDateString()}</td>
                            <td className="py-3 px-4 text-sm text-brand-primary">₦{commission.amount?.toLocaleString()}</td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={4} className="py-4 text-center text-sm text-brand-text/60">No referral history yet</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {activeTab === "earnings" && (
              <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-semibold text-brand-text mb-4">Earnings Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 border border-brand-border bg-brand-bg/60 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-brand-text">Available Balance</p>
                      <p className="text-xs text-brand-text/60">Ready for withdrawal</p>
                    </div>
                    <p className="text-2xl font-bold text-brand-primary">₦{stats?.availableEarnings?.toLocaleString() || 0}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-brand-border bg-brand-bg/60 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-brand-text">Pending Earnings</p>
                      <p className="text-xs text-brand-text/60">Being processed</p>
                    </div>
                    <p className="text-2xl font-bold text-brand-text">₦{stats?.pendingEarnings?.toLocaleString() || 0}</p>
                  </div>
                  <div className="flex items-center justify-between p-4 border border-brand-border bg-brand-bg/60 rounded-lg">
                    <div>
                      <p className="text-sm font-medium text-brand-text">Total Earned</p>
                      <p className="text-xs text-brand-text/60">All time earnings</p>
                    </div>
                    <p className="text-2xl font-bold text-brand-text">₦{stats?.lifetimeEarnings?.toLocaleString() || 0}</p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "withdrawals" && (
              <div className="space-y-6">
                <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                  <h3 className="font-semibold text-brand-text mb-4">Request Withdrawal</h3>
                  <form onSubmit={handleWithdraw} className="space-y-4">
                    <div>
                      <label className="text-sm font-medium text-brand-text/60 block mb-2">Amount (₦)</label>
                      <input
                        type="number"
                        value={withdrawAmount}
                        onChange={(e) => setWithdrawAmount(e.target.value)}
                        min={minWithdrawal}
                        className="w-full bg-brand-bg/60 border border-brand-border rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary transition-colors text-brand-text"
                        placeholder={`Minimum ₦${minWithdrawal.toLocaleString()}`}
                      />
                    </div>
                    {!bankProfile && (
                      <button
                        type="button"
                        onClick={() => setShowBankModal(true)}
                        className="w-full py-3 border border-brand-primary bg-brand-bg/10 text-brand-primary rounded-xl font-semibold hover:bg-brand-bg/20 transition-colors"
                      >
                        Setup Bank Profile
                      </button>
                    )}
                    <button
                      disabled={isWithdrawing || !bankProfile}
                      type="submit"
                      className="w-full py-3 border border-brand-primary bg-brand-bg text-white rounded-xl font-bold hover:bg-brand-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

                <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                  <h3 className="font-semibold text-brand-text mb-4">Withdrawal History</h3>
                  <div className="space-y-4">
                    {data?.withdrawals && data.withdrawals.length > 0 ? (
                      data.withdrawals.map((withdrawal: any) => (
                        <div key={withdrawal.id} className="flex items-center justify-between p-4 border border-brand-border bg-brand-bg/60 rounded-lg">
                          <div>
                            <p className="text-sm font-medium text-brand-text">₦{withdrawal.amount?.toLocaleString()}</p>
                            <p className="text-xs text-brand-text/60">{new Date(withdrawal.created_at).toLocaleDateString()}</p>
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
                      <p className="text-sm text-brand-text/60 text-center py-4">No withdrawal history yet</p>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "marketing" && (
              <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-semibold text-brand-text mb-4">Marketing Kit</h3>
                <div className="grid sm:grid-cols-2 gap-4">
                  {data?.marketingResources && data.marketingResources.length > 0 ? (
                    data.marketingResources.map((item: any) => {
                      const Icon = FileText; // Default icon, can be customized based on type
                      return (
                        <div key={item.id} className="border border-brand-border bg-brand-bg/60 rounded-xl p-4 hover:border-brand-primary/50 transition-all">
                          <div className="flex items-center gap-3 mb-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-brand-primary/60 bg-brand-bg/10 rounded-lg">
                              <Icon className="h-5 w-5 text-brand-primary" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-brand-text truncate cursor-pointer hover:text-brand-primary" onClick={() => openMaterialDetail(item)} title={item.name}>{item.name}</p>
                              <div className="flex items-center gap-2 text-xs text-brand-text/60">
                                <span className="px-2 py-0.5 bg-brand-bg/10 text-brand-primary rounded-full">{item.type?.toUpperCase() || 'FLYER'}</span>
                                <span>{item.download_count || 0} downloads</span>
                              </div>
                            </div>
                          </div>
                          {item.description && (
                            <div className="mb-3 p-2 bg-brand-bg rounded-lg">
                              <p className="text-xs text-brand-text/60 whitespace-pre-wrap break-words" style={{
                                maxHeight: '60px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                display: '-webkit-box',
                                WebkitLineClamp: 3,
                                WebkitBoxOrient: 'vertical'
                              }} title={item.description}>
                                {item.description}
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2">
                            <button 
                              onClick={() => openMaterialDetail(item)}
                              className="flex-1 py-2 border border-brand-primary/60 bg-brand-bg/10 text-brand-primary rounded-lg text-sm font-medium hover:bg-brand-bg/20 transition-colors flex items-center justify-center gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View Details
                            </button>
                            <button 
                              onClick={() => window.open(`/api/partners/marketing/download/${item.id}`, '_blank')}
                              className="flex-1 py-2 border border-brand-border bg-brand-bg text-brand-text rounded-lg text-sm font-medium hover:bg-brand-bg transition-colors flex items-center justify-center gap-2"
                            >
                              <Download className="h-4 w-4" />
                              Download
                            </button>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-sm text-brand-text/60 text-center py-4 col-span-2">No marketing resources available</p>
                  )}
                </div>
              </div>
            )}

            {/* Material Detail Modal */}
            {selectedMaterial && showMaterialDetailModal && (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
                <div className="bg-brand-bg border border-brand-border rounded-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b border-brand-border flex items-center justify-between">
                    <h2 className="text-xl font-bold text-brand-text">Material Details</h2>
                    <button
                      onClick={() => setShowMaterialDetailModal(false)}
                      className="p-2 hover:bg-brand-bg rounded-lg transition-colors text-brand-text/60 hover:text-brand-text"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                  
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-brand-text">{selectedMaterial.name}</h3>
                      <span className="px-3 py-1 bg-brand-bg/10 text-brand-primary rounded-full text-xs font-medium">
                        {selectedMaterial.type?.toUpperCase() || 'FLYER'}
                      </span>
                    </div>
                    
                    {selectedMaterial.description && (
                      <div className="bg-brand-bg p-4 rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-sm font-medium text-brand-text">Description</p>
                          <button
                            onClick={() => copyTextToClipboard(selectedMaterial.description)}
                            className="p-1 hover:bg-brand-bg/10 rounded transition-colors text-brand-text/60 hover:text-brand-primary"
                            title="Copy text"
                          >
                            <Copy className="h-4 w-4" />
                          </button>
                        </div>
                        <p className="text-sm text-brand-text/60 whitespace-pre-wrap break-words bg-brand-bg p-3 rounded-lg max-h-64 overflow-y-auto">
                          {selectedMaterial.description}
                        </p>
                      </div>
                    )}
                    
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="bg-brand-bg p-3 rounded-lg">
                        <p className="text-brand-text/60">Downloads</p>
                        <p className="text-lg font-semibold text-brand-text">{selectedMaterial.download_count || 0}</p>
                      </div>
                      <div className="bg-brand-bg p-3 rounded-lg">
                        <p className="text-brand-text/60">Category</p>
                        <p className="text-lg font-semibold text-brand-text">{selectedMaterial.category || 'general'}</p>
                      </div>
                    </div>
                    
                    {/* Integrated Preview */}
                    {selectedMaterial.url && (selectedMaterial.type === 'image' || selectedMaterial.type === 'flyer' || selectedMaterial.type?.includes('image')) && (
                      <div className="bg-brand-bg p-4 rounded-lg">
                        <p className="text-sm font-medium text-brand-text mb-3">Preview</p>
                        <img 
                          src={selectedMaterial.url} 
                          alt={selectedMaterial.name}
                          className="w-full h-auto rounded-lg max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                          onClick={() => window.open(selectedMaterial.url, '_blank')}
                        />
                        <p className="text-xs text-brand-text/60 mt-2 text-center">Click image to open in new tab</p>
                      </div>
                    )}
                    
                    {/* File Preview for non-image types */}
                    {selectedMaterial.url && !(selectedMaterial.type === 'image' || selectedMaterial.type === 'flyer' || selectedMaterial.type?.includes('image')) && (
                      <div className="bg-brand-bg p-4 rounded-lg">
                        <p className="text-sm font-medium text-brand-text mb-3">File Preview</p>
                        <a 
                          href={selectedMaterial.url}
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="text-[#12E6F3] hover:underline flex items-center gap-2"
                        >
                          <FileText className="h-4 w-4" />
                          Open file in new tab
                        </a>
                      </div>
                    )}
                    
                    <div className="flex gap-3 pt-4 border-t border-brand-border">
                      <button
                        onClick={() => window.open(`/api/partners/marketing/download/${selectedMaterial.id}`, '_blank')}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-bg text-white rounded-lg font-medium hover:bg-brand-bg/90 transition-colors"
                      >
                        <Download className="h-4 w-4" />
                        Download
                      </button>
                      <button
                        onClick={() => setShowMaterialDetailModal(false)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-brand-bg text-brand-text border border-brand-border rounded-lg font-medium hover:bg-brand-bg transition-colors"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === "settings" && (
              <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-semibold text-brand-text mb-4">Profile Settings</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-brand-text/60 block mb-2">Partner ID</label>
                    <div className="p-3 border border-brand-border bg-brand-bg/60 rounded-lg font-mono text-sm text-brand-text/60">
                      {partner?.id || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brand-text/60 block mb-2">Email</label>
                    <div className="p-3 border border-brand-border bg-brand-bg/60 rounded-lg text-sm text-brand-text">
                      {partner?.email || "N/A"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brand-text/60 block mb-2">Partner Type</label>
                    <div className="p-3 border border-brand-border bg-brand-bg/60 rounded-lg text-sm text-brand-text">
                      {partner?.type === "student" ? "Student Partner" : 
                       partner?.type === "community" ? "Community Partner" : 
                       partner?.type === "influencer" ? "Influencer" : "Partner"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-brand-text/60 block mb-2">Commission Rate</label>
                    <div className="p-3 border border-brand-border bg-brand-bg/60 rounded-lg text-sm text-brand-primary">
                      ₦{partner?.commissionRate || data?.partner?.commissionRate || 1500} per referral
                    </div>
                  </div>
                  
                  {/* Bank Details Section */}
                  <div className="border-t border-brand-border pt-4 mt-4">
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-sm font-medium text-brand-text">Bank Details</h4>
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
                        className="text-xs text-brand-primary hover:text-brand-text transition-colors"
                      >
                        {bankProfile ? 'Edit' : 'Add Bank Details'}
                      </button>
                    </div>
                    
                    {bankProfile ? (
                      <div className="space-y-3">
                        <div className="p-3 border border-brand-border bg-brand-bg/60 rounded-lg">
                          <p className="text-xs text-brand-text/60 mb-1">Bank Name</p>
                          <p className="text-sm text-brand-text">{bankProfile.bank_name}</p>
                        </div>
                        <div className="p-3 border border-brand-border bg-brand-bg/60 rounded-lg">
                          <p className="text-xs text-brand-text/60 mb-1">Account Number</p>
                          <p className="text-sm text-brand-text">{bankProfile.account_number}</p>
                        </div>
                        <div className="p-3 border border-brand-border bg-brand-bg/60 rounded-lg">
                          <p className="text-xs text-brand-text/60 mb-1">Account Name</p>
                          <p className="text-sm text-brand-text">{bankProfile.account_name}</p>
                        </div>
                      </div>
                    ) : (
                      <div className="p-4 border border-dashed border-brand-border bg-brand-bg/40 rounded-lg text-center">
                        <p className="text-sm text-brand-text/60 mb-2">No bank details added yet</p>
                        <button
                          onClick={() => setShowBankModal(true)}
                          className="text-xs text-brand-primary hover:text-brand-text transition-colors"
                        >
                          Add bank details to enable withdrawals
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <button
                    onClick={handleContactSupport}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-brand-bg text-brand-text rounded-lg font-medium hover:bg-brand-bg/90 transition-colors mt-4"
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
          <div className="bg-brand-bg border border-brand-border rounded-2xl p-6 sm:p-8 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-brand-text">{bankProfile ? 'Edit Bank Profile' : 'Setup Bank Profile'}</h2>
              <button
                onClick={() => setShowBankModal(false)}
                className="text-brand-text/60 hover:text-brand-text transition-colors"
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
                <label className="text-sm font-medium text-brand-text/60 block mb-2">Bank Name</label>
                <input
                  type="text"
                  required
                  value={bankFormData.bank_name}
                  onChange={(e) => setBankFormData({...bankFormData, bank_name: e.target.value})}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-lg px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary transition-colors"
                  placeholder="Enter bank name"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-text/60 block mb-2">Account Number</label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_number}
                  onChange={(e) => setBankFormData({...bankFormData, account_number: e.target.value})}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-lg px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary transition-colors"
                  placeholder="Enter account number"
                />
              </div>
              <div>
                <label className="text-sm font-medium text-brand-text/60 block mb-2">Account Name</label>
                <input
                  type="text"
                  required
                  value={bankFormData.account_name}
                  onChange={(e) => setBankFormData({...bankFormData, account_name: e.target.value})}
                  className="w-full bg-brand-bg/60 border border-brand-border rounded-lg px-4 py-3 text-brand-text focus:outline-none focus:border-brand-primary transition-colors"
                  placeholder="Enter account name"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBankModal(false)}
                  className="flex-1 py-3 border border-brand-border text-brand-text/60 rounded-lg font-medium hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingBank}
                  className="flex-1 py-3 bg-brand-bg text-white rounded-lg font-bold hover:bg-brand-bg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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


