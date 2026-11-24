"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser, useClerk } from "@clerk/nextjs";
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
  Building,
  AlertTriangle,
  ShieldCheck,
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
  Eye,
  Check,
  Search,
  ExternalLink,
  ArrowUpRight,
  Sparkles,
  BookOpen,
  Video,
  Image as ImageIcon
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

export default function PartnerDashboard() {
  const router = useRouter();
  const { user: clerkUser, isLoaded: clerkLoaded } = useUser();
  const { signOut } = useClerk();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [copied, setCopied] = useState(false);
  const [showBankModal, setShowBankModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [minWithdrawal, setMinWithdrawal] = useState(1000);
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
  const [marketplaceProducts, setMarketplaceProducts] = useState<any[]>([]);
  const [affiliateLinks, setAffiliateLinks] = useState<any[]>([]);
  const [loadingMarketplace, setLoadingMarketplace] = useState(false);
  const [generatingLink, setGeneratingLink] = useState<string | null>(null);
  const [mktSearch, setMktSearch] = useState('');
  const [mktTypeFilter, setMktTypeFilter] = useState('ALL');
  const [mktCategoryFilter, setMktCategoryFilter] = useState('ALL');
  const [copiedMktId, setCopiedMktId] = useState<string | null>(null);
  const [copiedOverviewCode, setCopiedOverviewCode] = useState<string | null>(null);

  const handleCopyOverviewLink = (code: string, url: string) => {
    navigator.clipboard.writeText(url);
    setCopiedOverviewCode(code);
    setTimeout(() => setCopiedOverviewCode(null), 2500);
  };

  useEffect(() => {
    if (clerkLoaded) {
      fetchDashboardData();
    }
  }, [clerkLoaded]);

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
        if (clerkLoaded && !clerkUser) {
          router.push("/partners/login");
        } else {
          console.warn('[PartnerDashboard] Warning loading dashboard data:', result?.error);
        }
      }
    } catch (err) {
      if (clerkLoaded && !clerkUser) {
        router.push("/partners/login");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = () => {
    const link = data?.referral?.link || (typeof window !== 'undefined' ? `${window.location.origin}/enroll?ref=${data?.referral?.code || data?.partner?.partner_id || 'ALS0002'}` : '');
    if (link) {
      navigator.clipboard.writeText(link);
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

  const fetchAffiliateData = async () => {
    setLoadingMarketplace(true);
    try {
      const [mpRes, linksRes] = await Promise.all([
        fetch('/api/partners/affiliate-marketplace'),
        fetch('/api/partners/affiliate-links')
      ]);
      if (mpRes.ok) {
        const mpData = await mpRes.json();
        if (Array.isArray(mpData)) setMarketplaceProducts(mpData);
      }
      if (linksRes.ok) {
        const linksData = await linksRes.json();
        if (Array.isArray(linksData)) setAffiliateLinks(linksData);
      }
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
      const result = await res.json();
      if (res.ok) {
        await fetchAffiliateData(); // Refresh lists
      } else {
        alert(result.error || 'Failed to generate link');
      }
    } catch (e: any) {
      alert(e?.message || 'Error generating link');
    } finally {
      setGeneratingLink(null);
    }
  };

  const handleLogout = async () => {
    try {
      await fetch("/api/partners/logout", { method: "POST" });
      if (clerkUser) {
        await signOut();
      }
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
  const partnerInitials = partner?.name 
    ? partner.name.split(' ').map((n: string) => n[0]).slice(0, 2).join('').toUpperCase()
    : 'AP';

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
    <div className="min-h-screen bg-brand-bg w-full max-w-full overflow-x-hidden">
      {/* Header */}
      <header className="border-b border-brand-border bg-[var(--card)]/90 backdrop-blur-xl sticky top-0 z-50 shadow-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            
            {/* Left: Brand & Portal Badge */}
            <div className="flex items-center gap-3 sm:gap-4">
              <Link href="/" className="flex items-center gap-2.5 group">
                <Image
                  src="/autolearn-brandmark.png"
                  alt="AutoLearn Spot"
                  width={34}
                  height={34}
                  className="object-contain group-hover:scale-105 transition-transform"
                />
                <span className="font-heading text-base sm:text-lg font-bold text-brand-text hidden sm:block">
                  AutoLearn<span className="text-emerald-600">Spot</span>
                </span>
              </Link>
              
              <div className="hidden sm:block h-5 w-px bg-brand-border" />
              
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold tracking-wide uppercase">Affiliate Portal</span>
              </div>

              <Link
                href="/dashboard"
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-brand-border bg-brand-bg/60 hover:bg-brand-bg hover:border-emerald-500/40 text-xs font-semibold text-brand-text transition-colors"
                title="Return to Student Dashboard"
              >
                <BookOpen className="h-3.5 w-3.5 text-emerald-600" />
                <span>Student Dashboard</span>
              </Link>
            </div>
            
            {/* Right: User Pill, Notifications, Logout & Mobile Toggle */}
            <div className="flex items-center gap-2 sm:gap-3">
              {/* Partner User Capsule (Desktop) */}
              <div className="hidden md:flex items-center gap-2.5 py-1 px-2.5 rounded-full bg-brand-bg/60 border border-brand-border/60">
                <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  {partnerInitials}
                </div>
                <div className="text-left pr-1">
                  <p className="text-xs font-semibold text-brand-text leading-none">{partner?.name || "Partner"}</p>
                  <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium leading-tight">Verified Affiliate</p>
                </div>
              </div>

              {/* Notification Bell */}
              <button 
                onClick={() => { fetchNotifications(); setShowNotifications(!showNotifications); }}
                className="relative p-2 rounded-xl hover:bg-brand-bg/80 border border-transparent hover:border-brand-border transition-colors text-brand-text/70 hover:text-brand-text"
                title="Notifications"
              >
                <Bell className="h-5 w-5" />
                {data?.unreadCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                  </span>
                )}
              </button>

              {/* Logout Button (Desktop) */}
              <button
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 px-3.5 py-1.5 rounded-xl border border-brand-border bg-brand-bg/60 hover:bg-brand-bg hover:border-red-500/30 hover:text-red-500 transition-colors text-xs font-medium text-brand-text/70"
              >
                <LogOut className="h-3.5 w-3.5" />
                Logout
              </button>

              {/* Mobile Menu Toggle Button */}
              <button
                className="md:hidden p-2 rounded-xl text-brand-text/80 hover:bg-brand-bg/80 border border-brand-border/50"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="h-5 w-5 text-emerald-500" /> : <Menu className="h-5 w-5" />}
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile/Tablet Horizontal Quick-Tab Navigation Bar */}
      <div className="lg:hidden border-b border-brand-border bg-[var(--card)]/95 backdrop-blur-md sticky top-16 z-40 shadow-xs">
        <div className="px-4 py-2.5 overflow-x-auto flex items-center gap-2 scrollbar-none">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm font-semibold'
                    : 'bg-brand-bg/60 text-brand-text/70 hover:text-brand-text border border-brand-border/50 hover:bg-brand-bg'
                }`}
              >
                <Icon className="h-3.5 w-3.5" />
                {item.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Notification Dropdown */}
      {showNotifications && (
        <div className="absolute top-20 right-3 sm:right-6 w-[calc(100vw-1.5rem)] sm:w-96 max-w-md bg-[var(--card)] border border-brand-border rounded-2xl shadow-2xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
          <div className="p-4 border-b border-brand-border flex items-center justify-between bg-brand-bg/40">
            <h3 className="font-bold text-brand-text text-sm flex items-center gap-2">
              <Bell className="w-4 h-4 text-emerald-500" /> Notifications
            </h3>
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
              className="text-xs text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
            >
              Mark all read
            </button>
          </div>
          <div className="max-h-96 overflow-y-auto divide-y divide-brand-border/60">
            {notifications.length > 0 ? (
              notifications.map((notif: any) => (
                <div 
                  key={notif.id} 
                  className={`p-4 cursor-pointer hover:bg-brand-bg/60 transition-colors ${!notif.read ? 'bg-emerald-500/5' : ''}`}
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
                  <p className="font-semibold text-xs text-brand-text">{notif.title}</p>
                  <p className="text-brand-text/70 text-xs mt-1 leading-relaxed">{notif.message}</p>
                  <p className="text-brand-text/40 text-[10px] mt-2 font-mono">{new Date(notif.created_at).toLocaleString()}</p>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-xs text-brand-text/50">No notifications yet</div>
            )}
          </div>
        </div>
      )}

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-brand-border bg-[var(--card)] shadow-xl animate-in slide-in-from-top-2 duration-200">
          {/* Mobile Partner Profile Header */}
          <div className="p-4 border-b border-brand-border bg-brand-bg/50 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shadow-xs">
              {partnerInitials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-brand-text truncate">{partner?.name || "Partner"}</p>
              <p className="text-xs text-brand-text/60 truncate">{partner?.email}</p>
            </div>
          </div>

          <div className="px-4 py-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => { setActiveTab(item.id); setMobileMenuOpen(false); }}
                  className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold'
                      : 'text-brand-text/70 hover:bg-brand-bg hover:text-brand-text'
                  }`}
                >
                  <Icon className="h-4 w-4 text-emerald-500" />
                  {item.label}
                </button>
              );
            })}
            
            <div className="pt-2 border-t border-brand-border mt-2 space-y-1">
              <Link
                href="/dashboard"
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 transition-colors"
              >
                <BookOpen className="h-4 w-4 text-emerald-500" />
                Return to Student Dashboard
              </Link>
              <button
                onClick={handleContactSupport}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5 transition-colors"
              >
                <MessageCircle className="h-4 w-4" />
                Contact Support
              </button>
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-500/10 transition-colors mt-1"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-6 sm:py-8 w-full max-w-full overflow-x-hidden">
        <div className="grid lg:grid-cols-4 gap-8">
          {/* Desktop Sidebar Navigation */}
          <div className="hidden lg:block">
            <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-5 sticky top-24 shadow-xs space-y-6">
              
              {/* Sidebar Profile Card */}
              <div className="flex items-center gap-3 pb-4 border-b border-brand-border">
                <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
                  {partnerInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="font-bold text-brand-text text-sm truncate">{partner?.name || "Partner"}</h3>
                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                    <CheckCircle2 className="w-3 h-3 inline" /> Affiliate Partner
                  </span>
                </div>
              </div>

              {/* Navigation Links */}
              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`flex items-center gap-3 w-full px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold border-l-3 border-emerald-500 pl-3'
                          : 'text-brand-text/70 hover:bg-brand-bg/80 hover:text-brand-text'
                      }`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-brand-text/60'}`} />
                      {item.label}
                    </button>
                  );
                })}
              </nav>

              {/* Support Quick CTA */}
              <div className="pt-4 border-t border-brand-border">
                <button
                  onClick={handleContactSupport}
                  className="w-full py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
                >
                  <MessageCircle className="w-4 h-4" />
                  Partner Support
                </button>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-5">
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <h2 className="text-2xl sm:text-3xl font-black text-brand-text tracking-tight">
                    Welcome back, {partner?.name ? partner.name.split(' ')[0] : 'Partner'}! 👋
                  </h2>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                    {partner?.partner_id || 'ALS0002'}
                  </span>
                </div>
                <p className="text-xs sm:text-sm text-brand-text/60 mt-1">
                  Track course affiliate sales, conversion metrics, and payout status.
                </p>
              </div>

              <div className="flex items-center gap-2.5 shrink-0 flex-wrap sm:flex-nowrap">
                <button
                  onClick={() => setActiveTab('promote')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm rounded-xl transition-all shadow-xs flex items-center gap-2"
                >
                  <Globe className="h-4 w-4" />
                  Promote Courses
                </button>
                <button
                  onClick={() => setActiveTab('withdrawals')}
                  className="px-4 py-2 border border-brand-border hover:bg-brand-bg/80 text-brand-text font-semibold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2"
                >
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  Request Payout
                </button>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-brand-text/60 font-semibold">Available Balance</span>
                    <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600">
                      <Wallet className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-emerald-600">
                    ₦{stats?.availableEarnings?.toLocaleString() || 0}
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('withdrawals')}
                  className="text-xs font-bold text-emerald-600 hover:text-emerald-700 mt-2 flex items-center gap-1 self-start transition-colors"
                >
                  Withdraw Funds <ArrowUpRight className="h-3 w-3" />
                </button>
              </div>

              <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-brand-text/60 font-semibold">Pending Earnings</span>
                    <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600">
                      <Clock className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-brand-text">
                    ₦{stats?.pendingEarnings?.toLocaleString() || 0}
                  </div>
                </div>
                <p className="text-[11px] text-brand-text/50 mt-2">
                  Cleared after 7-day holding
                </p>
              </div>

              <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-brand-text/60 font-semibold">Total Earned</span>
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-600">
                      <TrendingUp className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-brand-text">
                    ₦{stats?.lifetimeEarnings?.toLocaleString() || 0}
                  </div>
                </div>
                <p className="text-[11px] text-brand-text/50 mt-2">
                  All-time commissions
                </p>
              </div>

              <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-brand-text/60 font-semibold">Total Referrals</span>
                    <div className="p-1.5 rounded-lg bg-purple-500/10 text-purple-600">
                      <Users className="h-4 w-4" />
                    </div>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-brand-text">
                    {stats?.totalRegistrations || 0} <span className="text-xs font-semibold text-brand-text/60">sales</span>
                  </div>
                </div>
                <p className="text-[11px] text-brand-text/50 mt-2">
                  {stats?.totalClicks || 0} clicks ({stats?.conversionRate || 0}%)
                </p>
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
                    {marketplaceProducts.length === 0 ? (
                      <div className="border border-brand-border bg-brand-bg/60 rounded-2xl p-10 text-center">
                        <Globe className="w-12 h-12 text-brand-primary/60 mx-auto mb-3" />
                        <h4 className="font-bold text-brand-text text-lg mb-1">No Courses Currently Available</h4>
                        <p className="text-sm text-brand-text/60 max-w-md mx-auto">
                          Courses published by authors will appear here for you to generate unique promotion links and earn commissions.
                        </p>
                      </div>
                    ) : (
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
                    )}

                    {affiliateLinks.length > 0 && (
                      <div className="mt-12">
                        <h3 className="text-xl font-bold text-brand-text mb-4">Your Active Links</h3>
                        <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl overflow-hidden">
                          <div className="w-full overflow-x-auto">
                            <table className="w-full min-w-[550px] text-left text-sm">
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
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "overview" && (
              <div className="space-y-6">
                {/* DUAL ROLE AFFILIATE & STUDENT REFERRAL HUB */}
                <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-5 sm:p-6 shadow-xs space-y-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-emerald-600" />
                        <h3 className="font-bold text-brand-text text-base sm:text-lg">Your Partner & Referral Links</h3>
                      </div>
                      <p className="text-xs text-brand-text/60 mt-0.5">
                        Whether you are an enrolled student, community creator, or affiliate marketer, choose the right link for your audience.
                      </p>
                    </div>
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 self-start sm:self-auto">
                      Dual Earnings Active
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* CARD 1: Student Refer & Earn */}
                    <div className="rounded-xl border-2 border-emerald-500/30 bg-emerald-500/5 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">🎓</span>
                            <span className="font-bold text-sm sm:text-base text-brand-text">Student Refer & Earn</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-emerald-600 text-white">
                            Fixed Cash Reward
                          </span>
                        </div>
                        <p className="text-xs text-brand-text/70 leading-relaxed">
                          Best for sharing with peers, friends, and study groups. When anyone registers via your student referral link, you receive a direct <strong>cash reward (₦1,500 – ₦3,000)</strong> credited straight to your available balance.
                        </p>
                        <div className="pt-2">
                          <label className="text-[11px] font-bold uppercase tracking-wider text-brand-text/60 block mb-1">
                            Your Direct Referral Link (Code: <span className="text-emerald-600 font-mono font-bold">{referral?.code || partner?.partner_id || 'ACTIVE'}</span>)
                          </label>
                          <div className="flex items-center gap-2 bg-brand-bg border border-brand-border rounded-lg p-2">
                            <input
                              type="text"
                              readOnly
                              value={referral?.link || (typeof window !== 'undefined' ? `${window.location.origin}/enroll?ref=${referral?.code || partner?.partner_id || 'ALS0002'}` : '')}
                              className="bg-transparent text-xs font-mono text-brand-text w-full truncate focus:outline-none"
                            />
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={handleCopyLink}
                          className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          {copied ? <><Check className="w-3.5 h-3.5" /> Copied!</> : <><Copy className="w-3.5 h-3.5" /> Copy Student Link</>}
                        </button>
                        <a
                          href={`https://wa.me/?text=${encodeURIComponent(`Hey! I'm learning on AutoLearn Spot. Enroll with my link to join the next cohort: ${referral?.link || (typeof window !== 'undefined' ? `${window.location.origin}/enroll?ref=${referral?.code || partner?.partner_id}` : '')}`)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="py-2 px-3 border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shrink-0"
                          title="Share on WhatsApp"
                        >
                          <Share2 className="w-3.5 h-3.5" /> WhatsApp
                        </a>
                      </div>
                    </div>

                    {/* CARD 2: Course Affiliate Marketing */}
                    <div className="rounded-xl border-2 border-brand-border bg-brand-bg/50 p-4 sm:p-5 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xl">💼</span>
                            <span className="font-bold text-sm sm:text-base text-brand-text">Course Affiliate Partner</span>
                          </div>
                          <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-600 border border-blue-500/20">
                            % Revenue Share
                          </span>
                        </div>
                        <p className="text-xs text-brand-text/70 leading-relaxed">
                          Best for marketers, content creators, and social advertising. Choose specific courses from our marketplace and earn <strong>up to 50% commission</strong> on every verified sale.
                        </p>
                        <div className="pt-2">
                          <div className="p-3 rounded-lg bg-brand-bg border border-brand-border text-xs text-brand-text/70 flex items-center justify-between">
                            <span>Active Marketplace Links:</span>
                            <span className="font-bold text-brand-text font-mono">{data?.activeCourseLinks?.length || 0} courses</span>
                          </div>
                        </div>
                      </div>

                      <div className="pt-1">
                        <button
                          onClick={() => setActiveTab('promote')}
                          className="w-full py-2 px-3 bg-brand-primary text-white hover:bg-brand-primary-hover rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
                        >
                          <Globe className="w-3.5 h-3.5" /> Browse Marketplace & Get Course Links
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Active Course Affiliate Links Spotlight */}
                {data?.activeCourseLinks && data.activeCourseLinks.length > 0 ? (
                  <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-6 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-border pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-5 h-5 text-emerald-600" />
                          <h3 className="font-bold text-brand-text text-base sm:text-lg">Your Active Course Affiliate Links</h3>
                        </div>
                        <p className="text-xs text-brand-text/60 mt-0.5">
                          Share these direct product links in your paid adverts, social media, or WhatsApp. Commissions are automatically credited to your balance.
                        </p>
                      </div>
                      <button
                        onClick={() => setActiveTab('promote')}
                        className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 self-start sm:self-center transition-colors"
                      >
                        Promote More Courses <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="grid gap-3">
                      {data.activeCourseLinks.map((link: any) => (
                        <div
                          key={link.id}
                          className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 rounded-xl border border-brand-border bg-brand-bg/60 hover:border-emerald-500/40 transition-all"
                        >
                          <div className="flex items-start gap-3.5 min-w-0">
                            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 flex items-center justify-center shrink-0">
                              <BookOpen className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <h4 className="font-bold text-brand-text text-sm sm:text-base truncate">
                                  {link.courseTitle}
                                </h4>
                                <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                                  {link.commissionRate}% comm (₦{link.commissionAmount?.toLocaleString()}/sale)
                                </span>
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs text-brand-text/50">Course Price: ₦{link.coursePrice?.toLocaleString()}</span>
                                <span className="text-xs text-brand-text/30">•</span>
                                <span className="font-mono text-xs text-emerald-600 font-medium">Ref Code: {link.code}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 w-full md:w-auto">
                            <div className="w-full md:w-64 font-mono text-xs text-brand-text/70 bg-brand-bg border border-brand-border px-3 py-2 rounded-lg truncate">
                              {link.url}
                            </div>
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                              <button
                                onClick={() => handleCopyOverviewLink(link.code, link.url)}
                                className={`flex-1 sm:flex-initial px-3 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all shrink-0 ${
                                  copiedOverviewCode === link.code
                                    ? 'bg-emerald-600 text-white shadow-xs'
                                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 border border-emerald-500/30'
                                }`}
                              >
                                {copiedOverviewCode === link.code ? (
                                  <>
                                    <Check className="w-3.5 h-3.5" /> Copied!
                                  </>
                                ) : (
                                  <>
                                    <Copy className="w-3.5 h-3.5" /> Copy Link
                                  </>
                                )}
                              </button>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 border border-brand-border text-brand-text/60 hover:text-brand-text hover:bg-brand-bg rounded-lg transition-colors shrink-0 flex items-center justify-center"
                                title="Preview Live Course Page"
                              >
                                <ExternalLink className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-6 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600">
                        <Sparkles className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-brand-text text-sm sm:text-base">Start Earning with Course Links</h4>
                        <p className="text-xs text-brand-text/60 mt-0.5">
                          Generate product-specific affiliate links for published courses and earn up to 30% per student enrollment.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => setActiveTab('promote')}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shrink-0 shadow-xs"
                    >
                      Browse Marketplace →
                    </button>
                  </div>
                )}

                {/* Charts & Funnel Section */}
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Monthly Earnings Bar Chart */}
                  <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-brand-text text-base flex items-center gap-2">
                          <Activity className="h-5 w-5 text-emerald-600" />
                          Monthly Earnings Trend
                        </h3>
                        <span className="text-xs font-semibold text-emerald-600 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                          2026 Season
                        </span>
                      </div>

                      {/* Visual Bar Chart */}
                      <div className="h-44 flex items-end gap-2 pt-4 px-1">
                        {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'].map((month, idx) => {
                          const isCurrent = idx === 10;
                          const heightPct = isCurrent ? 85 : [10, 15, 12, 25, 20, 30, 28, 40, 35, 50, 85, 20][idx];
                          return (
                            <div key={month} className="flex-1 flex flex-col items-center h-full justify-end group">
                              <div
                                className={`w-full rounded-t-md transition-all ${
                                  isCurrent
                                    ? 'bg-gradient-to-t from-emerald-600 to-teal-400 group-hover:from-emerald-500 group-hover:to-teal-300 shadow-xs'
                                    : 'bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700'
                                }`}
                                style={{ height: `${heightPct}%` }}
                                title={`${month}: ${isCurrent ? '₦' + (stats?.lifetimeEarnings || 4000).toLocaleString() : '₦0'}`}
                              />
                            </div>
                          );
                        })}
                      </div>

                      <div className="flex justify-between mt-3 text-[11px] font-semibold text-brand-text/50 px-1 border-t border-brand-border/40 pt-2">
                        <span>Jan</span>
                        <span>Apr</span>
                        <span>Jul</span>
                        <span>Nov (Active)</span>
                        <span>Dec</span>
                      </div>
                    </div>

                    <p className="text-xs text-brand-text/50 mt-4 flex items-center justify-between">
                      <span>Total Earned: <strong>₦{(stats?.lifetimeEarnings || 0).toLocaleString()}</strong></span>
                      <span className="text-emerald-600 font-semibold">100% On-Time Payouts</span>
                    </p>
                  </div>

                  {/* Referral Performance & Funnel */}
                  <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-6 shadow-xs flex flex-col justify-between">
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-brand-text text-base flex items-center gap-2">
                          <MousePointerClick className="h-5 w-5 text-blue-600" />
                          Referral Conversion Funnel
                        </h3>
                        <span className="text-xs font-semibold text-blue-600 bg-blue-500/10 px-2.5 py-0.5 rounded-full border border-blue-500/20">
                          Live Tracking
                        </span>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1.5">
                            <span className="text-brand-text/70">Ad & Link Clicks</span>
                            <span className="text-brand-text font-mono font-bold">{data?.referral?.totalClicks || stats?.totalClicks || 0}</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-blue-500 rounded-full transition-all"
                              style={{ width: `${Math.min(((data?.referral?.totalClicks || stats?.totalClicks || 0) / 50) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1.5">
                            <span className="text-brand-text/70">Completed Course Enrollments</span>
                            <span className="text-brand-text font-mono font-bold">{data?.referral?.totalRegistrations || stats?.totalRegistrations || 0}</span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-emerald-500 rounded-full transition-all"
                              style={{ width: `${Math.min(((data?.referral?.totalRegistrations || stats?.totalRegistrations || 0) / 10) * 100, 100)}%` }}
                            />
                          </div>
                        </div>

                        <div>
                          <div className="flex justify-between text-xs font-semibold mb-1.5">
                            <span className="text-brand-text/70">Conversion Rate</span>
                            <span className="text-purple-600 font-mono font-bold">
                              {stats?.conversionRate || 0}%
                            </span>
                          </div>
                          <div className="h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-purple-500 rounded-full transition-all"
                              style={{ width: `${Math.min(stats?.conversionRate || 0, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-emerald-500/5 border border-emerald-500/20 rounded-xl text-xs text-brand-text/70 mt-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-emerald-600 shrink-0" />
                      <span>Product links convert <strong>3.5× higher</strong> than generic links when shared in relevant communities.</span>
                    </div>
                  </div>
                </div>

                {/* Recent Activity */}
                <div className="border border-brand-border bg-[var(--card)]/90 backdrop-blur-xl rounded-2xl p-6 shadow-xs">
                  <div className="flex items-center justify-between mb-4 border-b border-brand-border pb-3">
                    <h3 className="font-bold text-brand-text text-base flex items-center gap-2">
                      <History className="h-5 w-5 text-emerald-600" />
                      Recent Commission Activity
                    </h3>
                    <button
                      onClick={() => setActiveTab('referrals')}
                      className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors"
                    >
                      View All Referrals →
                    </button>
                  </div>

                  <div className="space-y-2.5">
                    {data?.recentCommissions && data.recentCommissions.length > 0 ? (
                      data.recentCommissions.slice(0, 5).map((commission: any) => (
                        <div key={commission.id} className="flex items-center justify-between p-3.5 border border-brand-border bg-brand-bg/60 rounded-xl hover:border-emerald-500/30 transition-all">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 rounded-xl font-bold">
                              <DollarSign className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-brand-text">
                                {commission.referred_name || commission.referee_email || 'Course Sale Referral'}
                              </p>
                              <p className="text-xs text-brand-text/60">
                                {new Date(commission.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-black text-emerald-600">
                              +₦{Number(commission.amount || 0).toLocaleString()}
                            </p>
                            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                              {commission.status || 'Available'}
                            </span>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-brand-text/50">
                        <History className="h-8 w-8 mx-auto text-brand-text/30 mb-2" />
                        <p className="text-sm font-semibold">No recent commission activity</p>
                        <p className="text-xs text-brand-text/40 mt-0.5">When students enroll using your affiliate links, commissions will appear here.</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "referrals" && (
              <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6">
                <h3 className="font-semibold text-brand-text mb-4">Referral History</h3>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[500px]">
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
                            <td className="py-3 px-4 text-sm text-brand-text font-medium">
                              {commission.referred_name || commission.referee_email || 'Student Referral'}
                            </td>
                            <td className="py-3 px-4">
                              <span className={`px-2 py-1 text-xs rounded-full font-medium ${
                                commission.status === 'paid' || commission.status === 'available'
                                  ? 'bg-green-500/10 text-green-400' 
                                  : commission.status === 'pending'
                                  ? 'bg-yellow-500/10 text-yellow-400'
                                  : 'bg-red-500/10 text-red-400'
                              }`}>
                                {commission.status || 'available'}
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
                {/* Available Balance & Payout SLA Header Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-emerald-600">
                      <Wallet className="h-4 w-4" />
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">Available for Payout</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-600">
                      ₦{stats?.availableEarnings?.toLocaleString() || 0}
                    </p>
                    <p className="text-xs text-brand-text/60 mt-1">
                      Ready to transfer to your bank
                    </p>
                  </div>

                  <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-slate-500">
                      <Clock className="h-4 w-4 text-amber-500" />
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">Minimum Threshold</span>
                    </div>
                    <p className="text-2xl font-black text-brand-text">
                      ₦{minWithdrawal.toLocaleString()}
                    </p>
                    <p className="text-xs text-brand-text/60 mt-1">
                      Minimum required per request
                    </p>
                  </div>

                  <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-5 shadow-xs">
                    <div className="flex items-center gap-2 mb-2 text-blue-600">
                      <ShieldCheck className="h-4 w-4" />
                      <span className="font-mono text-xs uppercase tracking-wider font-semibold">Processing Window</span>
                    </div>
                    <p className="text-2xl font-black text-brand-text">24–48 hrs</p>
                    <p className="text-xs text-brand-text/60 mt-1">
                      Direct Nigerian bank deposit
                    </p>
                  </div>
                </div>

                {/* Main Withdrawal Request Card */}
                <div className="border border-brand-border bg-brand-bg/90 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-xs space-y-6">
                  <div className="border-b border-brand-border pb-4">
                    <h3 className="text-lg font-bold text-brand-text">Request Payout to Bank</h3>
                    <p className="text-xs text-brand-text/60 mt-0.5">
                      Enter the amount you wish to withdraw to your verified bank account.
                    </p>
                  </div>

                  {/* Bank Destination Profile Card */}
                  {bankProfile ? (
                    <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-emerald-500/20 text-emerald-600 flex items-center justify-center font-bold shrink-0">
                          <Building className="h-5 w-5" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-brand-text text-sm">{bankProfile.bank_name}</span>
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-600 font-bold uppercase tracking-wide">
                              Verified Bank
                            </span>
                          </div>
                          <p className="text-xs text-brand-text/70 mt-0.5 font-mono">
                            {bankProfile.account_number} • {bankProfile.account_name}
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBankModal(true)}
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 underline px-2 py-1 self-start sm:self-auto"
                      >
                        Change Bank Details
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                        <div>
                          <p className="font-bold text-amber-700 dark:text-amber-400 text-sm">Payout Bank Account Missing</p>
                          <p className="text-xs text-brand-text/70 mt-0.5">
                            You must add your bank account details before submitting a withdrawal request.
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => setShowBankModal(true)}
                        className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors whitespace-nowrap shadow-xs cursor-pointer"
                      >
                        Set Up Bank Account
                      </button>
                    </div>
                  )}

                  {/* Form */}
                  <form onSubmit={handleWithdraw} className="space-y-5">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold uppercase tracking-wider text-brand-text/70">
                          Withdrawal Amount (₦)
                        </label>
                        <span className="text-xs text-brand-text/60">
                          Available: <strong className="text-emerald-600">₦{(stats?.availableEarnings || 0).toLocaleString()}</strong>
                        </span>
                      </div>

                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-text/50 font-bold text-base">
                          ₦
                        </span>
                        <input
                          type="number"
                          value={withdrawAmount}
                          onChange={(e) => setWithdrawAmount(e.target.value)}
                          min={minWithdrawal}
                          max={stats?.availableEarnings || 0}
                          className="w-full bg-brand-bg/60 border border-brand-border rounded-xl pl-9 pr-24 py-3.5 focus:outline-none focus:border-emerald-500 text-brand-text text-lg font-bold transition-colors placeholder:text-brand-text/30"
                          placeholder={`Min. ${minWithdrawal.toLocaleString()}`}
                        />
                        {(stats?.availableEarnings || 0) > 0 && (
                          <button
                            type="button"
                            onClick={() => setWithdrawAmount(String(stats?.availableEarnings || 0))}
                            className="absolute right-3 top-1/2 -translate-y-1/2 px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 font-bold text-xs transition-colors"
                          >
                            Withdraw All
                          </button>
                        )}
                      </div>

                      {/* Quick Presets */}
                      <div className="flex items-center gap-2 mt-2.5 flex-wrap">
                        <span className="text-[11px] text-brand-text/50 font-medium">Quick amounts:</span>
                        {[1000, 2000, 4000].map((amt) => {
                          if (amt > (stats?.availableEarnings || 0) && amt !== minWithdrawal) return null;
                          return (
                            <button
                              key={amt}
                              type="button"
                              onClick={() => setWithdrawAmount(String(amt))}
                              className="px-2.5 py-1 rounded-md text-xs font-semibold bg-brand-bg/60 hover:bg-brand-bg border border-brand-border text-brand-text/80 transition-colors"
                            >
                              ₦{amt.toLocaleString()}
                            </button>
                          );
                        })}
                      </div>

                      {/* Validation hints */}
                      {withdrawAmount && Number(withdrawAmount) > (stats?.availableEarnings || 0) && (
                        <p className="text-xs text-rose-500 font-semibold mt-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Amount exceeds your available balance of ₦{(stats?.availableEarnings || 0).toLocaleString()}
                        </p>
                      )}
                      {withdrawAmount && Number(withdrawAmount) < minWithdrawal && (
                        <p className="text-xs text-amber-500 font-semibold mt-2 flex items-center gap-1">
                          <AlertTriangle className="h-3.5 w-3.5" /> Minimum withdrawal amount is ₦{minWithdrawal.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <button
                      disabled={
                        isWithdrawing || 
                        !bankProfile || 
                        !withdrawAmount || 
                        Number(withdrawAmount) < minWithdrawal || 
                        Number(withdrawAmount) > (stats?.availableEarnings || 0)
                      }
                      type="submit"
                      className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-xl font-bold transition-all shadow-md hover:shadow-lg disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-base cursor-pointer"
                    >
                      {isWithdrawing ? (
                        <>
                          <Loader2 className="h-5 w-5 animate-spin" />
                          <span>Processing Payout Request...</span>
                        </>
                      ) : (
                        <>
                          <CreditCard className="h-5 w-5" />
                          <span>
                            {withdrawAmount && Number(withdrawAmount) > 0 
                              ? `Submit Withdrawal Request (₦${Number(withdrawAmount).toLocaleString()})` 
                              : "Submit Withdrawal Request"}
                          </span>
                        </>
                      )}
                    </button>
                  </form>
                </div>

                {/* Withdrawal History Card */}
                <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-6 shadow-xs space-y-4">
                  <div className="flex items-center justify-between border-b border-brand-border pb-3">
                    <h3 className="font-bold text-brand-text text-base">Withdrawal History</h3>
                    <span className="text-xs text-brand-text/50">
                      {data?.withdrawals?.length || 0} total requests
                    </span>
                  </div>

                  <div className="space-y-3">
                    {data?.withdrawals && data.withdrawals.length > 0 ? (
                      data.withdrawals.map((withdrawal: any) => {
                        const status = (withdrawal.status || 'pending').toLowerCase();
                        const isCompleted = status === 'completed' || status === 'paid' || status === 'approved';
                        const isPending = status === 'pending';
                        
                        return (
                          <div 
                            key={withdrawal.id} 
                            className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border border-brand-border bg-brand-bg/60 rounded-xl gap-2 hover:bg-brand-bg/80 transition-colors"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <span className="text-base font-extrabold text-brand-text">
                                  ₦{Number(withdrawal.amount || 0).toLocaleString()}
                                </span>
                                <span className="font-mono text-[11px] text-brand-text/50 px-2 py-0.5 rounded bg-brand-bg border border-brand-border">
                                  {withdrawal.reference || (withdrawal.id ? withdrawal.id.slice(0, 8) : 'WD-REF')}
                                </span>
                              </div>
                              <p className="text-xs text-brand-text/60">
                                Requested on {new Date(withdrawal.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                              </p>
                            </div>

                            <div className="flex items-center gap-2">
                              <span className={`px-3 py-1 text-xs rounded-full font-bold uppercase tracking-wider ${
                                isCompleted
                                  ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                  : isPending
                                  ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                  : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                              }`}>
                                {withdrawal.status || 'pending'}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="py-10 text-center text-brand-text/50 space-y-2">
                        <CreditCard className="h-8 w-8 mx-auto text-brand-text/30" />
                        <p className="text-sm font-semibold">No withdrawal requests yet</p>
                        <p className="text-xs text-brand-text/40 max-w-xs mx-auto">
                          When you request a payout from your available balance, your transaction history will appear here.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}

            {activeTab === "marketing" && (
              <div className="space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h3 className="text-xl font-bold text-brand-text">Marketing Kit & Promotional Assets</h3>
                    <p className="text-sm text-brand-text/60">Download promotional creatives and copy pre-written marketing scripts</p>
                  </div>
                </div>

                {/* Filter and Search Bar */}
                <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-4 space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Search */}
                    <div className="relative">
                      <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
                      <input
                        type="text"
                        placeholder="Search creatives or copy..."
                        value={mktSearch}
                        onChange={(e) => setMktSearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-brand-bg/60 border border-brand-border rounded-xl text-xs sm:text-sm text-brand-text focus:outline-none focus:border-emerald-500 transition-colors"
                      />
                    </div>

                    {/* Course Filter */}
                    <div>
                      <select
                        value={mktCategoryFilter}
                        onChange={(e) => setMktCategoryFilter(e.target.value)}
                        className="w-full px-3.5 py-2 bg-brand-bg/60 border border-brand-border rounded-xl text-xs sm:text-sm text-brand-text focus:outline-none focus:border-emerald-500 transition-colors"
                      >
                        <option value="ALL">All Categories & Courses</option>
                        <option value="general">General Platform</option>
                        {Array.from(new Set((data?.marketingResources || []).map((r: any) => r.category).filter(Boolean))).map((cat: any) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0">
                      {[
                        { id: 'ALL', label: 'All' },
                        { id: 'flyer', label: 'Flyers' },
                        { id: 'banner', label: 'Banners' },
                        { id: 'copy', label: 'Copy' },
                        { id: 'video', label: 'Video' },
                      ].map((tab) => (
                        <button
                          key={tab.id}
                          onClick={() => setMktTypeFilter(tab.id)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                            mktTypeFilter === tab.id
                              ? 'bg-emerald-600 text-white'
                              : 'bg-brand-bg/40 text-brand-text/70 border border-brand-border hover:bg-brand-bg'
                          }`}
                        >
                          {tab.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Filtered Grid */}
                {(() => {
                  const filtered = (data?.marketingResources || []).filter((item: any) => {
                    const q = mktSearch.toLowerCase();
                    const matchesSearch =
                      !mktSearch ||
                      item.name?.toLowerCase().includes(q) ||
                      item.description?.toLowerCase().includes(q) ||
                      item.category?.toLowerCase().includes(q);

                    const matchesType =
                      mktTypeFilter === 'ALL' ||
                      item.type?.toLowerCase() === mktTypeFilter.toLowerCase();

                    const matchesCategory =
                      mktCategoryFilter === 'ALL' ||
                      item.category?.toLowerCase() === mktCategoryFilter.toLowerCase();

                    return matchesSearch && matchesType && matchesCategory;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-12 text-center">
                        <FileText className="w-10 h-10 text-brand-text/30 mx-auto mb-3" />
                        <h4 className="text-base font-bold text-brand-text mb-1">No Materials Found</h4>
                        <p className="text-xs text-brand-text/60">Try adjusting your search or category filter</p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                      {filtered.map((item: any) => {
                        const Icon = item.type === 'video' ? Video : item.type === 'copy' ? FileText : ImageIcon;
                        return (
                          <div
                            key={item.id}
                            className="border border-brand-border bg-brand-bg/80 backdrop-blur-xl rounded-2xl p-5 hover:border-emerald-500/40 transition-all flex flex-col justify-between group shadow-xs"
                          >
                            <div>
                              {/* Top badges */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <div className="p-1.5 bg-emerald-500/10 text-emerald-600 rounded-lg">
                                    <Icon className="h-4 w-4" />
                                  </div>
                                  <span className="px-2 py-0.5 bg-brand-bg text-[10px] font-bold text-emerald-600 uppercase rounded-md border border-emerald-500/20">
                                    {item.type?.toUpperCase() || 'FLYER'}
                                  </span>
                                </div>
                                <span className="text-[11px] text-brand-text/50 font-medium truncate max-w-[120px]" title={item.category}>
                                  {item.category || 'General'}
                                </span>
                              </div>

                              {/* Title */}
                              <h4
                                className="font-bold text-sm text-brand-text mb-2 line-clamp-1 cursor-pointer hover:text-emerald-500 transition-colors"
                                onClick={() => openMaterialDetail(item)}
                                title={item.name}
                              >
                                {item.name}
                              </h4>

                              {/* Media Preview if applicable */}
                              {item.url && (
                                <div
                                  onClick={() => openMaterialDetail(item)}
                                  className="h-36 w-full rounded-xl overflow-hidden bg-brand-bg/60 border border-brand-border relative mb-3 cursor-pointer group-hover:opacity-95 flex items-center justify-center"
                                >
                                  {item.type === 'video' || item.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                                    <video
                                      src={item.url}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      preload="metadata"
                                      muted
                                    />
                                  ) : item.type === 'guide' || item.type === 'pdf' || item.url.match(/\.(pdf)$/i) ? (
                                    <div className="flex flex-col items-center justify-center text-brand-text/50">
                                      <FileText className="w-8 h-8 mb-2" />
                                      <span className="text-xs font-semibold">PDF Document</span>
                                    </div>
                                  ) : (
                                    <img
                                      src={item.url}
                                      alt={item.name}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      loading="lazy"
                                      onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.parentElement?.classList.add('bg-brand-bg');
                                      }}
                                    />
                                  )}
                                </div>
                              )}

                              {/* Description / Copy */}
                              {item.description && (
                                <div className="mb-3 p-3 bg-brand-bg/60 border border-brand-border rounded-xl">
                                  <p
                                    className="text-xs text-brand-text/70 whitespace-pre-wrap break-words line-clamp-3 font-sans"
                                    title={item.description}
                                  >
                                    {item.description}
                                  </p>
                                  <button
                                    onClick={() => {
                                      navigator.clipboard.writeText(item.description);
                                      setCopiedMktId(item.id);
                                      setTimeout(() => setCopiedMktId(null), 2000);
                                    }}
                                    className="mt-2 text-xs font-semibold text-emerald-600 hover:text-emerald-500 flex items-center gap-1.5 transition-colors"
                                  >
                                    {copiedMktId === item.id ? (
                                      <>
                                        <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied!
                                      </>
                                    ) : (
                                      <>
                                        <Copy className="w-3.5 h-3.5" /> Copy Promotional Text
                                      </>
                                    )}
                                  </button>
                                </div>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="pt-3 border-t border-brand-border flex items-center justify-between gap-2 mt-2">
                              <span className="text-[11px] text-brand-text/50">
                                {item.download_count || 0} downloads
                              </span>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => openMaterialDetail(item)}
                                  className="py-1.5 px-3 border border-emerald-500/30 bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                >
                                  <Eye className="h-3.5 w-3.5" /> View
                                </button>
                                {item.url && (
                                  <a
                                    href={item.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="py-1.5 px-3 border border-brand-border bg-brand-bg text-brand-text hover:bg-brand-bg/80 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                  >
                                    <Download className="h-3.5 w-3.5" /> Get Asset
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  );
                })()}
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
                    {selectedMaterial.url && (
                      <div className="bg-brand-bg p-4 rounded-lg">
                        <p className="text-sm font-medium text-brand-text mb-3">Preview</p>
                        {selectedMaterial.type === 'video' || selectedMaterial.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                          <video
                            src={selectedMaterial.url}
                            controls
                            autoPlay
                            className="w-full h-auto rounded-lg max-h-96 object-contain"
                          />
                        ) : selectedMaterial.type === 'guide' || selectedMaterial.type === 'pdf' || selectedMaterial.url.match(/\.(pdf)$/i) ? (
                          <div className="flex flex-col items-center justify-center py-6 bg-brand-bg/60 rounded-lg">
                            <FileText className="h-10 w-10 text-brand-text/40 mb-3" />
                            <a
                              href={selectedMaterial.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-500 hover:underline flex items-center gap-2 font-medium"
                            >
                              <FileText className="h-4 w-4" /> Open PDF Document
                            </a>
                          </div>
                        ) : (
                          <>
                            <img 
                              src={selectedMaterial.url} 
                              alt={selectedMaterial.name}
                              className="w-full h-auto rounded-lg max-h-96 object-contain cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => window.open(selectedMaterial.url, '_blank')}
                              onError={(e) => {
                                e.currentTarget.style.display = 'none';
                              }}
                            />
                            <p className="text-xs text-brand-text/60 mt-2 text-center">Click image to open in new tab</p>
                          </>
                        )}
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
                const data = await res.json().catch(() => ({}));
                if (res.ok) {
                  setShowBankModal(false);
                  fetchDashboardData();
                  alert('Bank profile saved successfully!');
                } else {
                  alert(`Failed to save bank profile: ${data.error || 'Server error'}`);
                }
              } catch (error) {
                alert('Error saving bank profile. Please try again.');
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
                  className="flex-1 py-3 bg-emerald-600 text-white rounded-lg font-bold hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
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


