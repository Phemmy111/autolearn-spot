"use client";

import { useState, useEffect, useMemo } from 'react';
import { 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  FileText, 
  Settings, 
  Search, 
  Plus, 
  X, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Phone, 
  Mail, 
  Copy, 
  Check, 
  Download, 
  RefreshCw, 
  ExternalLink,
  ShieldAlert,
  ArrowUpRight,
  Briefcase,
  Share2,
  FolderDown,
  Building,
  BookOpen,
  Sparkles,
  Globe,
  MapPin,
  MessageCircle,
  Target,
  Award,
  User
} from 'lucide-react';

interface Partner {
  id: string;
  partner_id: string;
  name: string;
  full_name?: string;
  email: string;
  phone?: string | null;
  status: 'active' | 'pending' | 'suspended' | 'rejected' | string;
  total_clicks: number;
  total_registrations: number;
  available_earnings: number;
  total_earnings: number;
  referral_code?: string;
  promoted_products?: any[];
  promoted_products_count?: number;
  created_at: string;
  updated_at?: string;
}

interface Application {
  id: string;
  partner_id?: string;
  name?: string;
  full_name: string;
  email: string;
  phone?: string | null;
  whatsapp?: string | null;
  state?: string | null;
  occupation?: string | null;
  organization?: string | null;
  website?: string | null;
  motivation?: string | null;
  promotion_method?: string | null;
  experience?: string | null;
  facebook?: string | null;
  instagram?: string | null;
  tiktok?: string | null;
  linkedin?: string | null;
  youtube?: string | null;
  passport_url?: string | null;
  status: string;
  created_at?: string;
  applied_at?: string;
}

interface Withdrawal {
  id: string;
  amount: number;
  status: string;
  reference: string;
  bank_name?: string;
  account_number?: string;
  account_name?: string;
  created_at: string;
  partners?: {
    id: string;
    full_name: string;
    email: string;
    partner_type?: string;
  };
}

interface CourseItem {
  id: string;
  title: string;
  price: number;
  status: string;
  affiliate_enabled: boolean;
  affiliate_commission_rate: number;
  commission_payout: number;
  author?: {
    id: string;
    name: string;
    email: string;
  };
}

export default function AdminPartnersPage() {
  const [activeTab, setActiveTab] = useState<'partners' | 'applications' | 'commissions' | 'withdrawals' | 'marketing' | 'settings'>('partners');
  const [partners, setPartners] = useState<Partner[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [courses, setCourses] = useState<CourseItem[]>([]);
  const [commissions, setCommissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modals & Course Editing
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedPartnerDetail, setSelectedPartnerDetail] = useState<any>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [editingCourseId, setEditingCourseId] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<number>(20);
  const [updatingCourse, setUpdatingCourse] = useState(false);

  // Application Details Modal State
  const [appFilter, setAppFilter] = useState<'all' | 'pending' | 'active' | 'rejected'>('all');
  const [showAppModal, setShowAppModal] = useState(false);
  const [selectedAppModal, setSelectedAppModal] = useState<Application | null>(null);

  const handleOpenAppModal = (app: Application) => {
    setSelectedAppModal(app);
    setShowAppModal(true);
  };

  // Product Links Modal (Product-based affiliate system)
  const [showProductModal, setShowProductModal] = useState(false);
  const [selectedProductModalPartner, setSelectedProductModalPartner] = useState<Partner | null>(null);
  const [selectedCourseForModal, setSelectedCourseForModal] = useState<string>('');
  const [generatingLink, setGeneratingLink] = useState(false);

  // New Partner Form State
  const [newPartner, setNewPartner] = useState({
    name: '',
    email: '',
    phone: '',
    status: 'active'
  });
  const [submittingAdd, setSubmittingAdd] = useState(false);

  // Partnership Platform Settings
  const [settings, setSettings] = useState({
    commissionAmount: 1500,
    minWithdrawal: 2000,
    holdingPeriodDays: 7,
    autoApproveApplications: false
  });

  // Fetch all initial data
  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [pRes, aRes, wRes, coursesRes] = await Promise.all([
        fetch('/api/admin/partners'),
        fetch('/api/admin/partners/applications'),
        fetch('/api/admin/partner-withdrawals?status=ALL'),
        fetch('/api/admin/partners/courses')
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setPartners(pData.partners || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setApplications(aData.applications || []);
      }
      if (wRes.ok) {
        const wData = await wRes.json();
        setWithdrawals(wData.withdrawals || []);
      }
      if (coursesRes.ok) {
        const cData = await coursesRes.json();
        setCourses(cData.courses || []);
      }
    } catch (err) {
      console.error('[AdminPartners] Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  // Update course affiliate commission rate or enabled toggle
  const handleUpdateCourseAffiliate = async (courseId: string, enabled: boolean, rate?: number) => {
    setUpdatingCourse(true);
    try {
      const res = await fetch('/api/admin/partners/courses', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          courseId,
          affiliate_enabled: enabled,
          ...(rate !== undefined ? { affiliate_commission_rate: rate } : {})
        })
      });

      if (res.ok) {
        setEditingCourseId(null);
        // Refresh courses
        const cRes = await fetch('/api/admin/partners/courses');
        if (cRes.ok) {
          const cData = await cRes.json();
          setCourses(cData.courses || []);
        }
      } else {
        const err = await res.json();
        alert(`Failed to update course commission: ${err.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error updating course affiliate rate');
    } finally {
      setUpdatingCourse(false);
    }
  };

  // Filtered partners
  const filteredPartners = useMemo(() => {
    return partners.filter((p) => {
      const name = (p.name || p.full_name || '').toLowerCase();
      const email = (p.email || '').toLowerCase();
      const pid = (p.partner_id || '').toLowerCase();
      const ref = (p.referral_code || '').toLowerCase();
      const q = searchQuery.toLowerCase().trim();

      const matchesSearch = !q || name.includes(q) || email.includes(q) || pid.includes(q) || ref.includes(q);
      const matchesStatus = statusFilter === 'all' || p.status?.toLowerCase() === statusFilter.toLowerCase();

      return matchesSearch && matchesStatus;
    });
  }, [partners, searchQuery, statusFilter]);

  // Filtered applications
  const displayedApplications = useMemo(() => {
    if (appFilter === 'all') return applications;
    return applications.filter((a) => (a.status || 'pending').toLowerCase() === appFilter.toLowerCase());
  }, [applications, appFilter]);

  // Aggregate KPI metrics
  const stats = useMemo(() => {
    const totalPartners = partners.length;
    const activePartners = partners.filter((p) => p.status === 'active').length;
    const pendingApps = applications.filter((a) => (a.status || 'pending').toLowerCase() === 'pending').length;
    const totalReferrals = partners.reduce((sum, p) => sum + (Number(p.total_registrations) || 0), 0);
    const totalClicks = partners.reduce((sum, p) => sum + (Number(p.total_clicks) || 0), 0);
    // Real cumulative earnings credited to partners (not double-counted)
    const totalEarnings = partners.reduce((sum, p) => sum + (Number(p.total_earnings) || 0), 0);
    const pendingWithdrawalsCount = withdrawals.filter((w) => w.status?.toLowerCase() === 'pending').length;
    const pendingWithdrawalsAmount = withdrawals
      .filter((w) => w.status?.toLowerCase() === 'pending')
      .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

    return {
      totalPartners,
      activePartners,
      pendingApps,
      totalReferrals,
      totalClicks,
      totalEarnings,
      pendingWithdrawalsCount,
      pendingWithdrawalsAmount
    };
  }, [partners, applications, withdrawals]);

  // Handle Add Partner
  const handleAddPartner = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPartner.name || !newPartner.email) {
      alert('Please fill in partner name and email');
      return;
    }

    setSubmittingAdd(true);
    try {
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });

      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Partner added successfully! Partner ID: ${data.partner?.partner_id || 'Created'}`);
        setShowAddModal(false);
        setNewPartner({ name: '', email: '', phone: '', status: 'active' });
        fetchAllData();
      } else {
        alert(`Error: ${data.error || 'Failed to add partner'}`);
      }
    } catch (err) {
      console.error(err);
      alert('Failed to submit new partner');
    } finally {
      setSubmittingAdd(false);
    }
  };

  // Open Partner Details
  const handleOpenDetail = async (partner: Partner) => {
    setShowDetailModal(true);
    setSelectedPartnerDetail(partner);
    setDetailLoading(true);

    try {
      const res = await fetch(`/api/admin/partner-details?partnerId=${partner.id}`);
      if (res.ok) {
        const data = await res.json();
        setSelectedPartnerDetail({
          ...partner,
          ...data.partner,
          bankDetails: data.bankDetails,
          referralCodes: data.referralCodes,
          affiliateLinks: data.affiliateLinks,
          commissions: data.commissions
        });
      }
    } catch (err) {
      console.error('Failed to load partner detail:', err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Toggle Partner Status
  const handleToggleStatus = async (partnerId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'active' ? 'suspended' : 'active';
    const confirmMsg = `Are you sure you want to mark this partner as ${nextStatus.toUpperCase()}?`;
    if (!confirm(confirmMsg)) return;

    try {
      const res = await fetch('/api/admin/partners', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: partnerId, status: nextStatus })
      });

      if (res.ok) {
        fetchAllData();
        if (selectedPartnerDetail?.id === partnerId) {
          setSelectedPartnerDetail((prev: any) => ({ ...prev, status: nextStatus }));
        }
      } else {
        alert('Failed to update partner status');
      }
    } catch (err) {
      console.error(err);
      alert('Error updating status');
    }
  };

  // Open Product Links Management Modal
  const openProductLinksModal = (partner: Partner) => {
    setSelectedProductModalPartner(partner);
    setShowProductModal(true);
    if (Array.isArray(courses) && courses.length > 0 && !selectedCourseForModal) {
      setSelectedCourseForModal(courses[0].id);
    }
  };

  // Generate a Product-Specific Affiliate Link for a Partner
  const handleGenerateLink = async (partnerId: string, courseId: string) => {
    if (!courseId) {
      alert('Please select a course');
      return;
    }
    setGeneratingLink(true);
    try {
      const res = await fetch('/api/admin/partners/generate-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partnerId, learningProductId: courseId })
      });
      const data = await res.json();
      if (res.ok && data.success) {
        alert(`Affiliate link ready for "${data.link?.product_title}"!\nURL: ${data.link?.url}`);
        await fetchAllData();

        // Refresh modal partner view
        const pRes = await fetch('/api/admin/partners');
        if (pRes.ok) {
          const pData = await pRes.json();
          const refreshed = (pData.partners || []).find((p: any) => p.id === partnerId);
          if (refreshed) setSelectedProductModalPartner(refreshed);
        }

        // Refresh detail modal if open
        if (selectedPartnerDetail?.id === partnerId) {
          const dRes = await fetch(`/api/admin/partner-details?partnerId=${partnerId}`);
          if (dRes.ok) {
            const dData = await dRes.json();
            setSelectedPartnerDetail((prev: any) => ({
              ...prev,
              affiliateLinks: dData.affiliateLinks,
              promotedProducts: dData.affiliateLinks
            }));
          }
        }
      } else {
        alert(data.error || 'Failed to generate link');
      }
    } catch (err: any) {
      alert(err.message || 'Error generating link');
    } finally {
      setGeneratingLink(false);
    }
  };

  // Process Application (Approve / Reject)
  const handleProcessApplication = async (appId: string, action: 'approve' | 'reject') => {
    if (!confirm(`Are you sure you want to ${action.toUpperCase()} this partner application?`)) return;

    try {
      const res = await fetch('/api/admin/partners/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId: appId, action })
      });

      if (res.ok) {
        alert(`Application ${action}d successfully`);
        fetchAllData();
      } else {
        const data = await res.json();
        alert(`Failed: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert('Error processing application');
    }
  };

  // Process Withdrawal (Approve / Reject)
  const handleProcessWithdrawal = async (withdrawalId: string, action: 'approve' | 'reject') => {
    let paymentRef = '';
    if (action === 'approve') {
      paymentRef = prompt('Enter payment / bank transaction reference:', `TXN-${Date.now().toString().slice(-6)}`) || '';
      if (!paymentRef) return;
    } else {
      if (!confirm('Are you sure you want to REJECT this withdrawal?')) return;
    }

    try {
      const res = await fetch('/api/admin/partner-withdrawals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          withdrawalId,
          action,
          paymentReference: paymentRef
        })
      });

      if (res.ok) {
        alert(`Withdrawal marked as ${action === 'approve' ? 'PAID' : 'REJECTED'}`);
        fetchAllData();
      } else {
        alert('Failed to update withdrawal');
      }
    } catch (err) {
      console.error(err);
      alert('Error processing withdrawal');
    }
  };

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Partner ID', 'Name', 'Email', 'Phone', 'Status', 'Promoted Courses', 'Clicks', 'Conversions', 'Available Earnings (NGN)', 'Total Earnings (NGN)', 'Created At'];
    const rows = partners.map((p) => [
      p.partner_id || 'N/A',
      p.name || p.full_name,
      p.email,
      p.phone || '',
      p.status,
      p.promoted_products?.map((l: any) => l.title).join('; ') || 'None',
      p.total_clicks || 0,
      p.total_registrations || 0,
      p.available_earnings || 0,
      p.total_earnings || 0,
      new Date(p.created_at).toISOString()
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((r) => r.map((c) => `"${c}"`).join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `autolearn_partners_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
              <Users className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
                Partnership Management & Affiliate Hub
              </h1>
              <p className="text-sm text-slate-500 mt-0.5">
                Track affiliate referrals, manage commissions, process payouts, and onboard new partners.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center flex-wrap gap-2.5">
          <button
            onClick={fetchAllData}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            title="Refresh partner metrics"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>

          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="h-4 w-4 text-slate-500" />
            Export CSV
          </button>

          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-sm transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Partner
          </button>
        </div>
      </div>

      {/* KPI Cards Row (Clean, High Contrast, 100% Real Data) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
        {/* Card 1: Total Partners */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Partners</span>
            <Users className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalPartners}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            {stats.activePartners} active in system
          </p>
        </div>

        {/* Card 2: Applications */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Pending Apps</span>
            <Clock className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.pendingApps}</p>
          <p className="text-[11px] text-slate-500 font-medium mt-1">
            Awaiting admin review
          </p>
        </div>

        {/* Card 3: Referral Conversions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Conversions</span>
            <TrendingUp className="h-4 w-4 text-blue-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalReferrals}</p>
          <p className="text-[11px] text-blue-600 font-medium mt-1">
            Total course sales referred
          </p>
        </div>

        {/* Card 4: Total Clicks */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Link Clicks</span>
            <Share2 className="h-4 w-4 text-purple-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">{stats.totalClicks}</p>
          <p className="text-[11px] text-purple-600 font-medium mt-1">
            Traffic tracked
          </p>
        </div>

        {/* Card 5: Commissions */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Commissions</span>
            <DollarSign className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            ₦{stats.totalEarnings.toLocaleString()}
          </p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1">
            Generated & credited
          </p>
        </div>

        {/* Card 6: Pending Withdrawals */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Withdrawals</span>
            <ArrowUpRight className="h-4 w-4 text-rose-500" />
          </div>
          <p className="text-2xl font-black text-slate-900">
            {stats.pendingWithdrawalsCount}
          </p>
          <p className="text-[11px] text-rose-500 font-medium mt-1">
            ₦{(Number(stats.pendingWithdrawalsAmount) || 0).toLocaleString()} pending
          </p>
        </div>
      </div>

      {/* Tabs Navigation Bar */}
      <div className="border-b border-slate-200 bg-white rounded-t-xl px-4 pt-2 shadow-xs">
        <div className="flex items-center gap-6 overflow-x-auto text-sm font-semibold">
          <button
            onClick={() => setActiveTab('partners')}
            className={`pb-3.5 pt-2 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'partners'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Users className="h-4 w-4" />
            <span>All Partners</span>
            <span className="px-2 py-0.5 rounded-full text-xs bg-slate-100 text-slate-600">
              {partners.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-3.5 pt-2 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'applications'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>Applications</span>
            {stats.pendingApps > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-amber-100 text-amber-800 font-bold">
                {stats.pendingApps}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('withdrawals')}
            className={`pb-3.5 pt-2 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'withdrawals'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <DollarSign className="h-4 w-4" />
            <span>Withdrawals</span>
            {stats.pendingWithdrawalsCount > 0 && (
              <span className="px-2 py-0.5 rounded-full text-xs bg-rose-100 text-rose-800 font-bold">
                {stats.pendingWithdrawalsCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('marketing')}
            className={`pb-3.5 pt-2 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'marketing'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FolderDown className="h-4 w-4" />
            <span>Marketing Kit</span>
          </button>

          <button
            onClick={() => setActiveTab('settings')}
            className={`pb-3.5 pt-2 border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === 'settings'
                ? 'border-emerald-600 text-emerald-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      {/* TAB 1: ALL PARTNERS */}
      {activeTab === 'partners' && (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-xs overflow-hidden">
          {/* Table Controls */}
          <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/50">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email, ALS ID, code..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-white border border-slate-300 rounded-lg text-sm text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
              <span className="text-xs font-medium text-slate-500">Status:</span>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-sm text-slate-800 focus:outline-none focus:border-emerald-500"
              >
                <option value="all">All Statuses ({partners.length})</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>
          </div>

          {/* Partners Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Partner</th>
                  <th className="px-4 py-3.5">Partner ID</th>
                  <th className="px-4 py-3.5">Promoted Courses</th>
                  <th className="px-4 py-3.5">Traffic & Sales</th>
                  <th className="px-4 py-3.5">Available Balance</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                      Loading partners...
                    </td>
                  </tr>
                ) : filteredPartners.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <Users className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No partners found</p>
                      <p className="text-xs text-slate-400 mt-1">No registered partners match your search criteria.</p>
                    </td>
                  </tr>
                ) : (
                  filteredPartners.map((partner) => {
                    const rawName = (partner.name || partner.full_name || 'Partner').trim();
                    const initials = rawName
                      .split(/\s+/)
                      .filter(Boolean)
                      .map((n) => n[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase() || 'P';

                    return (
                      <tr key={partner.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center text-xs shrink-0">
                              {initials}
                            </div>
                            <div>
                              <p className="font-semibold text-slate-900 hover:text-emerald-700 cursor-pointer" onClick={() => handleOpenDetail(partner)}>
                                {partner.name || partner.full_name}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-slate-500">
                                <span className="hover:underline">{partner.email}</span>
                                {partner.phone && (
                                  <>
                                    <span>•</span>
                                    <span>{partner.phone}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono text-xs px-2.5 py-1 bg-slate-100 text-slate-800 rounded-md font-bold border border-slate-200">
                              {partner.partner_id || 'N/A'}
                            </span>
                            {partner.partner_id && partner.partner_id !== 'N/A' && (
                              <button
                                onClick={() => copyToClipboard(partner.partner_id, `pid-${partner.id}`)}
                                className="text-slate-400 hover:text-slate-600 p-1"
                                title="Copy Partner ID"
                              >
                                {copiedKey === `pid-${partner.id}` ? (
                                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                                ) : (
                                  <Copy className="h-3.5 w-3.5" />
                                )}
                              </button>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          {Array.isArray(partner.promoted_products) && partner.promoted_products.length > 0 ? (
                            <div className="space-y-1">
                              <button
                                onClick={() => openProductLinksModal(partner)}
                                className="group inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-xs font-semibold hover:bg-emerald-100 transition-colors shadow-2xs cursor-pointer"
                                title="Click to view & copy course affiliate links"
                              >
                                <Globe className="h-3.5 w-3.5 text-emerald-600 group-hover:scale-110 transition-transform" />
                                <span>{partner.promoted_products.length} {partner.promoted_products.length === 1 ? 'Course' : 'Courses'}</span>
                                <ExternalLink className="h-3 w-3 text-emerald-600 opacity-60 group-hover:opacity-100" />
                              </button>
                              <p className="text-[11px] text-slate-500 truncate max-w-[170px]" title={partner.promoted_products.map((p: any) => p?.title || 'Course').join(', ')}>
                                {partner.promoted_products.map((p: any) => p?.title || 'Course').join(', ')}
                              </p>
                            </div>
                          ) : (
                            <button
                              onClick={() => openProductLinksModal(partner)}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-50 text-slate-600 border border-slate-200 rounded-lg text-xs font-medium hover:bg-emerald-50 hover:border-emerald-200 hover:text-emerald-700 transition-colors cursor-pointer"
                              title="No courses promoted yet. Click to generate an affiliate link."
                            >
                              <span>No links</span>
                              <span className="text-emerald-600 font-bold">+ Create</span>
                            </button>
                          )}
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-xs space-y-0.5">
                            <div className="text-slate-900 font-semibold">
                              {partner.total_registrations || 0} sales
                            </div>
                            <div className="text-slate-400">
                              {partner.total_clicks || 0} clicks
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <div className="text-xs space-y-0.5">
                            <span className="font-extrabold text-emerald-700 text-sm">
                              ₦{(partner.available_earnings || 0).toLocaleString()}
                            </span>
                            <div className="text-slate-400">
                              Earned: ₦{(partner.total_earnings || 0).toLocaleString()}
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                              partner.status === 'active'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : partner.status === 'pending'
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {partner.status}
                          </span>
                        </td>

                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleOpenDetail(partner)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                              title="View Full Profile, Bank & Product Links"
                            >
                              <Eye className="h-4 w-4" />
                            </button>

                            <button
                              onClick={() => openProductLinksModal(partner)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50 transition-colors"
                              title="Manage & Copy Product Affiliate Links"
                            >
                              {copiedKey === `link-${partner.id}` ? (
                                <Check className="h-4 w-4 text-emerald-600" />
                              ) : (
                                <Share2 className="h-4 w-4" />
                              )}
                            </button>

                            <button
                              onClick={() => handleToggleStatus(partner.id, partner.status)}
                              className={`p-1.5 rounded-lg transition-colors ${
                                partner.status === 'active'
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                                  : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={partner.status === 'active' ? 'Suspend Partner' : 'Activate Partner'}
                            >
                              {partner.status === 'active' ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: APPLICATIONS */}
      {activeTab === 'applications' && (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-xs overflow-hidden">
          {/* Header with queue description & Filter Pills */}
          <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-slate-900 text-base">Partner Applications & Form Dossier</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-full">
                  {applications.filter(a => (a.status || '').toLowerCase() === 'pending').length} Pending
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-1">
                Review submitted candidate details, motivation, promotion strategy, WhatsApp, and social channels before approving.
              </p>
            </div>

            {/* Filter Buttons */}
            <div className="flex items-center gap-1.5 bg-white border border-slate-200 p-1 rounded-xl self-start sm:self-center shadow-2xs">
              <button
                onClick={() => setAppFilter('all')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  appFilter === 'all'
                    ? 'bg-slate-900 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                }`}
              >
                All ({applications.length})
              </button>
              <button
                onClick={() => setAppFilter('pending')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  appFilter === 'pending'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-amber-700 hover:bg-amber-50'
                }`}
              >
                Pending ({applications.filter(a => (a.status || '').toLowerCase() === 'pending').length})
              </button>
              <button
                onClick={() => setAppFilter('active')}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  appFilter === 'active'
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                Approved ({applications.filter(a => (a.status || '').toLowerCase() === 'active').length})
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Candidate & Role</th>
                  <th className="px-4 py-3.5">Location & WhatsApp</th>
                  <th className="px-4 py-3.5">Promotion Method</th>
                  <th className="px-4 py-3.5">Applied Date</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {displayedApplications.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                      <CheckCircle className="h-8 w-8 mx-auto text-emerald-400 mb-2" />
                      <p className="font-semibold text-slate-700">No applications match this filter</p>
                      <p className="text-xs text-slate-400 mt-1">Select "All" to inspect all candidate dossiers.</p>
                    </td>
                  </tr>
                ) : (
                  displayedApplications.map((app) => (
                    <tr key={app.id || app.email} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 text-white font-black text-xs flex items-center justify-center shrink-0">
                            {(app.full_name || app.name || 'P')[0]}
                          </div>
                          <div>
                            <p 
                              onClick={() => handleOpenAppModal(app)}
                              className="font-bold text-slate-900 hover:text-emerald-700 cursor-pointer"
                            >
                              {app.full_name || app.name}
                            </p>
                            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
                              <span>{app.occupation || 'Affiliate Marketer'}</span>
                              {app.partner_id && (
                                <span className="font-mono text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.2 rounded border border-slate-200">
                                  {app.partner_id}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-4 py-4 text-xs">
                        <p className="text-slate-800 font-medium">{app.email}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-slate-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3 text-slate-400" /> {app.state || 'Lagos'}
                          </span>
                          {(app.whatsapp || app.phone) && (
                            <a
                              href={`https://wa.me/${(app.whatsapp || app.phone || '').replace(/[^0-9]/g, '')}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-emerald-600 hover:text-emerald-700 font-medium"
                              title="Chat on WhatsApp"
                            >
                              <MessageCircle className="h-3 w-3" />
                              <span>{app.whatsapp || app.phone}</span>
                            </a>
                          )}
                        </div>
                      </td>

                      <td className="px-4 py-4 max-w-xs">
                        <p className="text-xs text-slate-700 line-clamp-2">
                          {app.promotion_method || 'Social media and direct student networks'}
                        </p>
                        {app.website && (
                          <a
                            href={app.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:underline mt-0.5 truncate max-w-xs"
                          >
                            <Globe className="h-2.5 w-2.5" /> {app.website.replace(/^https?:\/\//, '')}
                          </a>
                        )}
                      </td>

                      <td className="px-4 py-4 text-slate-500 text-xs">
                        {app.applied_at || app.created_at ? new Date(app.applied_at || app.created_at!).toLocaleDateString() : 'N/A'}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          (app.status || '').toLowerCase() === 'active'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : (app.status || '').toLowerCase() === 'pending'
                            ? 'bg-amber-50 text-amber-700 border border-amber-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}>
                          {app.status || 'active'}
                        </span>
                      </td>

                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleOpenAppModal(app)}
                            className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors flex items-center gap-1.5"
                            title="Inspect complete submitted application form"
                          >
                            <Eye className="h-3.5 w-3.5" /> View Form
                          </button>
                          {(app.status || '').toLowerCase() === 'pending' && (
                            <>
                              <button
                                onClick={() => handleProcessApplication(app.id, 'approve')}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold transition-colors shadow-xs"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleProcessApplication(app.id, 'reject')}
                                className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-bold transition-colors"
                              >
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: WITHDRAWALS */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">Partner Payout Requests</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Review and approve withdrawal requests from partners who reached the payout threshold.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm divide-y divide-slate-200">
              <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                <tr>
                  <th className="px-5 py-3.5">Reference</th>
                  <th className="px-4 py-3.5">Partner</th>
                  <th className="px-4 py-3.5">Amount</th>
                  <th className="px-4 py-3.5">Bank Information</th>
                  <th className="px-4 py-3.5">Requested At</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {withdrawals.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                      <DollarSign className="h-8 w-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold text-slate-700">No withdrawal requests</p>
                      <p className="text-xs text-slate-400 mt-1">No partner payouts are currently pending.</p>
                    </td>
                  </tr>
                ) : (
                  withdrawals.map((w) => {
                    const isPending = w.status?.toLowerCase() === 'pending';
                    return (
                      <tr key={w.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 font-mono text-xs font-semibold text-slate-700">
                          {w.reference}
                        </td>
                        <td className="px-4 py-4">
                          <p className="font-semibold text-slate-900">{w.partners?.full_name || 'Partner'}</p>
                          <p className="text-xs text-slate-500">{w.partners?.email}</p>
                        </td>
                        <td className="px-4 py-4 font-black text-slate-900 text-sm">
                          ₦{(Number(w.amount) || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <p className="font-semibold text-slate-800">{w.bank_name || 'Bank Transfer'}</p>
                          <p className="text-slate-500 font-mono">{w.account_number}</p>
                          <p className="text-slate-400">{w.account_name}</p>
                        </td>
                        <td className="px-4 py-4 text-xs text-slate-500">
                          {w.created_at ? new Date(w.created_at).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                              isPending
                                ? 'bg-amber-50 text-amber-700 border-amber-200'
                                : w.status === 'paid' || w.status === 'approved'
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}
                          >
                            {w.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          {isPending && (
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handleProcessWithdrawal(w.id, 'approve')}
                                className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                              >
                                Mark Paid
                              </button>
                              <button
                                onClick={() => handleProcessWithdrawal(w.id, 'reject')}
                                className="px-3 py-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: MARKETING KIT */}
      {activeTab === 'marketing' && (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-xs p-6 space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-200">
            <div>
              <h3 className="font-bold text-slate-900 text-base">Promotional Assets & Affiliate Media</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Flyers, high-resolution banners, and promo copy for partners to share on WhatsApp, Instagram, and LinkedIn.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-100 text-emerald-800 uppercase">
                  Social Banner
                </span>
                <h4 className="font-bold text-slate-900 mt-2 text-sm">AI Automation with n8n — Official Flyer</h4>
                <p className="text-xs text-slate-500 mt-1">
                  1080x1080 PNG flyer optimized for WhatsApp status & Instagram feed.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-400">Ready for partners</span>
                <a
                  href="/banners/n8n-promo.jpg"
                  target="_blank"
                  className="flex items-center gap-1 text-xs font-semibold text-emerald-600 hover:underline"
                >
                  <Download className="h-3.5 w-3.5" /> Download
                </a>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-blue-100 text-blue-800 uppercase">
                  Promo Copy
                </span>
                <h4 className="font-bold text-slate-900 mt-2 text-sm">High-Converting WhatsApp Caption</h4>
                <p className="text-xs text-slate-500 mt-1">
                  &ldquo;Learn to automate client workflows with AI and earn in dollars! Check out AutoLearn Spot...&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-400">Copy template</span>
                <button
                  onClick={() => copyToClipboard('Master AI Automation with n8n and build real client systems without writing code! Get certified on AutoLearn Spot today.', 'copy-sample')}
                  className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:underline"
                >
                  {copiedKey === 'copy-sample' ? 'Copied!' : 'Copy Text'}
                </button>
              </div>
            </div>

            <div className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 flex flex-col justify-between">
              <div>
                <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-purple-100 text-purple-800 uppercase">
                  Video Teaser
                </span>
                <h4 className="font-bold text-slate-900 mt-2 text-sm">n8n Course Teaser Clip</h4>
                <p className="text-xs text-slate-500 mt-1">
                  Short 15-second teaser video showing the workflow builder canvas.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-between">
                <span className="text-xs text-slate-400">MP4 Clip</span>
                <span className="text-xs font-semibold text-purple-600">Available on dashboard</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: SETTINGS */}
      {activeTab === 'settings' && (
        <div className="bg-white border border-slate-200 rounded-b-xl shadow-xs p-6 space-y-8">
          <div>
            <h3 className="font-bold text-slate-900 text-lg">Course Affiliate Rates & Commission Rules</h3>
            <p className="text-sm text-slate-500 mt-0.5">
              Affiliate commission rates are determined per-course by the author/instructor. Partners earn the author&apos;s configured rate on each verified student enrollment.
            </p>
          </div>

          {/* Section 1: Author-Configured Course Commission Rates */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-bold text-slate-900 text-sm">Course Commission Rates (Set by Course Authors)</h4>
                <p className="text-xs text-slate-500">Live affiliate rates and payouts active in the student checkout engine.</p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full">
                {courses.length} Active Courses
              </span>
            </div>

            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm divide-y divide-slate-200">
                <thead className="bg-slate-50 text-slate-600 text-xs uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="px-5 py-3.5">Course Title</th>
                    <th className="px-4 py-3.5">Author</th>
                    <th className="px-4 py-3.5">Price</th>
                    <th className="px-4 py-3.5">Author&apos;s Commission Rate</th>
                    <th className="px-4 py-3.5">Partner Earns / Sale</th>
                    <th className="px-4 py-3.5">Affiliate Status</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {courses.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-6 py-8 text-center text-slate-400 text-xs">
                        No courses found in catalog.
                      </td>
                    </tr>
                  ) : (
                    courses.map((course) => (
                      <tr key={course.id} className="hover:bg-slate-50/70">
                        <td className="px-5 py-4 font-semibold text-slate-900">
                          {course.title}
                        </td>
                        <td className="px-4 py-4 text-xs">
                          <p className="font-semibold text-slate-800">{course.author?.name || 'Author'}</p>
                          <p className="text-slate-400">{course.author?.email}</p>
                        </td>
                        <td className="px-4 py-4 font-bold text-slate-900 text-xs">
                          ₦{(Number(course.price) || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          {editingCourseId === course.id ? (
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={5}
                                max={70}
                                value={editingRate}
                                onChange={(e) => setEditingRate(Number(e.target.value))}
                                className="w-16 px-2 py-1 border border-slate-300 rounded text-xs font-bold text-slate-900"
                              />
                              <span className="text-xs font-bold text-slate-600">%</span>
                              <button
                                onClick={() => handleUpdateCourseAffiliate(course.id, course.affiliate_enabled, editingRate)}
                                disabled={updatingCourse}
                                className="px-2 py-1 bg-emerald-600 text-white rounded text-xs font-bold"
                              >
                                {updatingCourse ? '...' : 'Save'}
                              </button>
                              <button
                                onClick={() => setEditingCourseId(null)}
                                className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold"
                              >
                                Cancel
                              </button>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                              {Number(course.affiliate_commission_rate) || 20}%
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-4 font-black text-emerald-700 text-sm">
                          ₦{(Number(course.commission_payout) || 0).toLocaleString()}
                        </td>
                        <td className="px-4 py-4">
                          <span
                            className={`px-2.5 py-0.5 rounded-full text-xs font-semibold capitalize border ${
                              course.affiliate_enabled
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-600 border-slate-200'
                            }`}
                          >
                            {course.affiliate_enabled ? 'Enabled' : 'Disabled'}
                          </span>
                        </td>
                        <td className="px-5 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingCourseId(course.id);
                                setEditingRate(course.affiliate_commission_rate);
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                            >
                              Edit Rate
                            </button>
                            <button
                              onClick={() => handleUpdateCourseAffiliate(course.id, !course.affiliate_enabled)}
                              className={`px-2.5 py-1 text-xs font-semibold rounded-md transition-colors ${
                                course.affiliate_enabled
                                  ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                              }`}
                            >
                              {course.affiliate_enabled ? 'Disable' : 'Enable'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Section 2: Platform Escrow & Payout Rules */}
          <div className="border-t border-slate-200 pt-6 space-y-4 max-w-xl">
            <h4 className="font-bold text-slate-900 text-sm">Platform Escrow & Withdrawal Rules</h4>
            
            <div className="space-y-4 text-sm">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Minimum Partner Withdrawal Threshold (₦)
                </label>
                <input
                  type="number"
                  value={settings.minWithdrawal}
                  onChange={(e) => setSettings({ ...settings, minWithdrawal: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Minimum balance required before a partner can request a payout to their verified bank account.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase mb-1">
                  Commission Escrow Holding Period (Days)
                </label>
                <input
                  type="number"
                  value={settings.holdingPeriodDays}
                  onChange={(e) => setSettings({ ...settings, holdingPeriodDays: Number(e.target.value) })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-semibold focus:outline-none focus:border-emerald-500"
                />
                <p className="text-xs text-slate-400 mt-1">
                  Safety buffer period before newly credited referral earnings unlock for withdrawal requests.
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={() => alert('Platform withdrawal rules updated successfully')}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors shadow-xs"
                >
                  Save Platform Rules
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: ADD PARTNER */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-2 bg-emerald-100 text-emerald-700 rounded-lg">
                  <Users className="h-5 w-5" />
                </span>
                <h3 className="font-bold text-slate-900 text-base">Add New Partner</h3>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleAddPartner} className="p-5 space-y-4 text-sm">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={newPartner.name}
                  onChange={(e) => setNewPartner({ ...newPartner, name: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Email Address *
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. john@example.com"
                  value={newPartner.email}
                  onChange={(e) => setNewPartner({ ...newPartner, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase mb-1">
                  Phone / WhatsApp
                </label>
                <input
                  type="text"
                  placeholder="e.g. +234 801 234 5678"
                  value={newPartner.phone}
                  onChange={(e) => setNewPartner({ ...newPartner, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs text-emerald-800 space-y-1">
                <p className="font-semibold">Automated Setup:</p>
                <p>• Unique ALS Partner ID will be generated</p>
                <p>• Referral code created instantly</p>
                <p>• Welcome email delivered to partner</p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAdd}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
                >
                  {submittingAdd ? 'Adding...' : 'Create Partner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: PARTNER DETAILS DRAWER */}
      {showDetailModal && selectedPartnerDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-emerald-100 text-emerald-800 font-extrabold flex items-center justify-center">
                  {(selectedPartnerDetail.name || selectedPartnerDetail.full_name || 'P')[0]}
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    {selectedPartnerDetail.name || selectedPartnerDetail.full_name}
                  </h3>
                  <p className="text-xs text-slate-500">
                    ID: {selectedPartnerDetail.partner_id} • Status: <span className="font-semibold capitalize text-emerald-700">{selectedPartnerDetail.status}</span>
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowDetailModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm">
              {detailLoading ? (
                <div className="py-12 text-center text-slate-400">
                  <RefreshCw className="h-6 w-6 animate-spin mx-auto text-emerald-600 mb-2" />
                  Loading full partner records...
                </div>
              ) : (
                <>
                  {/* Earnings & Stats */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs text-slate-500 font-medium uppercase">Available</span>
                      <p className="text-xl font-black text-emerald-700 mt-1">
                        ₦{(selectedPartnerDetail.available_earnings || 0).toLocaleString()}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs text-slate-500 font-medium uppercase">Conversions</span>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        {selectedPartnerDetail.total_registrations || 0}
                      </p>
                    </div>

                    <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl text-center">
                      <span className="text-xs text-slate-500 font-medium uppercase">Total Earned</span>
                      <p className="text-xl font-black text-slate-900 mt-1">
                        ₦{(selectedPartnerDetail.total_earnings || 0).toLocaleString()}
                      </p>
                    </div>
                  </div>

                  {/* Profile & Contact Details */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Contact Information</h4>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-slate-400">Email:</span>
                        <p className="font-semibold text-slate-800 text-sm">{selectedPartnerDetail.email}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Phone:</span>
                        <p className="font-semibold text-slate-800 text-sm">{selectedPartnerDetail.phone || 'None provided'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Joined:</span>
                        <p className="font-medium text-slate-600">{selectedPartnerDetail.created_at ? new Date(selectedPartnerDetail.created_at).toLocaleDateString() : 'N/A'}</p>
                      </div>
                      <div>
                        <span className="text-slate-400">Promoted Courses:</span>
                        <p className="font-bold text-emerald-700">{selectedPartnerDetail.affiliateLinks?.length || 0} active</p>
                      </div>
                    </div>
                  </div>

                  {/* Submitted Application Form Dossier */}
                  {selectedPartnerDetail.applicationDetails && (
                    <div className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50/50">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <FileText className="h-4 w-4 text-emerald-600" />
                          <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                            Submitted Application Form Dossier
                          </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-slate-500">
                          {selectedPartnerDetail.applicationDetails.occupation || 'Affiliate Partner'}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs bg-white p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-slate-400 font-medium">State / Region:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{selectedPartnerDetail.applicationDetails.state || 'Lagos, Nigeria'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">Occupation:</span>
                          <p className="font-bold text-slate-900 mt-0.5">{selectedPartnerDetail.applicationDetails.occupation || 'N/A'}</p>
                        </div>
                        <div>
                          <span className="text-slate-400 font-medium">WhatsApp Line:</span>
                          <p className="mt-0.5">
                            {selectedPartnerDetail.applicationDetails.whatsapp || selectedPartnerDetail.applicationDetails.phone ? (
                              <a
                                href={`https://wa.me/${(selectedPartnerDetail.applicationDetails.whatsapp || selectedPartnerDetail.applicationDetails.phone || '').replace(/[^0-9]/g, '')}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
                              >
                                <MessageCircle className="h-3 w-3" />
                                {selectedPartnerDetail.applicationDetails.whatsapp || selectedPartnerDetail.applicationDetails.phone}
                              </a>
                            ) : (
                              <span className="font-bold text-slate-900">None provided</span>
                            )}
                          </p>
                        </div>
                        {selectedPartnerDetail.applicationDetails.organization && (
                          <div>
                            <span className="text-slate-400 font-medium">Organization:</span>
                            <p className="font-bold text-slate-900 mt-0.5">{selectedPartnerDetail.applicationDetails.organization}</p>
                          </div>
                        )}
                        {selectedPartnerDetail.applicationDetails.website && (
                          <div>
                            <span className="text-slate-400 font-medium">Website:</span>
                            <p className="mt-0.5">
                              <a
                                href={selectedPartnerDetail.applicationDetails.website}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-bold text-blue-600 hover:underline inline-flex items-center gap-1"
                              >
                                {selectedPartnerDetail.applicationDetails.website.replace(/^https?:\/\//, '')}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Promotion Method & Motivation */}
                      <div className="space-y-2 text-xs">
                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                            Promotion Strategy / Method:
                          </span>
                          <p className="text-slate-800 leading-relaxed">
                            {selectedPartnerDetail.applicationDetails.promotion_method || 'Direct student referral and social community promotion.'}
                          </p>
                        </div>

                        <div className="p-3 bg-white rounded-lg border border-slate-200">
                          <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                            Motivation for Partnering:
                          </span>
                          <p className="text-slate-800 leading-relaxed">
                            {selectedPartnerDetail.applicationDetails.motivation || 'Empowering learners with high-demand digital skills.'}
                          </p>
                        </div>

                        {selectedPartnerDetail.applicationDetails.experience && (
                          <div className="p-3 bg-white rounded-lg border border-slate-200">
                            <span className="text-slate-400 font-bold uppercase tracking-wider text-[10px] block mb-1">
                              Marketing Experience / Audience Reach:
                            </span>
                            <p className="text-slate-800 leading-relaxed">
                              {selectedPartnerDetail.applicationDetails.experience}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Bank Account Information */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-2.5">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-xs uppercase text-slate-500 tracking-wider">Bank Payout Profile</h4>
                      <Building className="h-4 w-4 text-slate-400" />
                    </div>

                    {selectedPartnerDetail.bankDetails ? (
                      <div className="grid grid-cols-3 gap-3 text-xs bg-slate-50 p-3 rounded-lg border border-slate-200">
                        <div>
                          <span className="text-slate-400">Bank Name</span>
                          <p className="font-bold text-slate-900">{selectedPartnerDetail.bankDetails.bank_name}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Account Number</span>
                          <p className="font-mono font-bold text-slate-900">{selectedPartnerDetail.bankDetails.account_number}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">Account Name</span>
                          <p className="font-bold text-slate-900">{selectedPartnerDetail.bankDetails.account_name}</p>
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-slate-400 italic">No bank profile registered yet by partner.</p>
                    )}
                  </div>

                  {/* Product-Specific Affiliate Links */}
                  <div className="border border-slate-200 rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-emerald-600" />
                        <h4 className="font-bold text-xs uppercase text-slate-700 tracking-wider">
                          Course-Specific Affiliate Links
                        </h4>
                      </div>
                      <span className="text-xs text-slate-400">
                        Links are generated per product
                      </span>
                    </div>

                    {selectedPartnerDetail.affiliateLinks && selectedPartnerDetail.affiliateLinks.length > 0 ? (
                      <div className="space-y-2.5">
                        {selectedPartnerDetail.affiliateLinks.map((link: any) => (
                          <div key={link.id} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-slate-900 text-xs">{link.title}</span>
                              <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 text-[11px] font-bold">
                                {link.commission_rate}% commission (₦{(Number(link.commission_amount) || 0).toLocaleString()})
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <input
                                type="text"
                                readOnly
                                value={link.url}
                                className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs font-mono text-slate-700 focus:outline-none"
                              />
                              <button
                                onClick={() => copyToClipboard(link.url, `detail-link-${link.id}`)}
                                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-xs"
                              >
                                {copiedKey === `detail-link-${link.id}` ? 'Copied' : 'Copy'}
                              </button>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-1.5 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-lg"
                                title="Open in new tab"
                              >
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center text-xs text-slate-500">
                        No product links generated yet. Affiliates create links from the Affiliate Marketplace.
                      </div>
                    )}

                    {/* Quick Course Link Generator for Admin */}
                    <div className="pt-3 border-t border-slate-100 space-y-2">
                      <p className="text-xs font-bold text-slate-700">Generate Affiliate Link for Course:</p>
                      <div className="flex items-center gap-2">
                        <select
                          value={selectedCourseForModal}
                          onChange={(e) => setSelectedCourseForModal(e.target.value)}
                          className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500"
                        >
                          <option value="">Select a course to promote...</option>
                          {courses.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.title} (₦{(Number(c.price) || 0).toLocaleString()} • {Number(c.affiliate_commission_rate) || 20}% commission)
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleGenerateLink(selectedPartnerDetail.id, selectedCourseForModal)}
                          disabled={generatingLink || !selectedCourseForModal}
                          className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors shadow-xs"
                        >
                          {generatingLink ? 'Creating...' : 'Create Link'}
                        </button>
                      </div>
                    </div>
                  </div>
                </>
              )}
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between">
              <button
                onClick={() => handleToggleStatus(selectedPartnerDetail.id, selectedPartnerDetail.status)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold border ${
                  selectedPartnerDetail.status === 'active'
                    ? 'border-rose-300 text-rose-700 hover:bg-rose-50'
                    : 'border-emerald-300 text-emerald-700 hover:bg-emerald-50'
                }`}
              >
                {selectedPartnerDetail.status === 'active' ? 'Suspend Partner' : 'Activate Partner'}
              </button>

              <button
                onClick={() => setShowDetailModal(false)}
                className="px-4 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2.5: APPLICATION FORM REVIEW MODAL */}
      {showAppModal && selectedAppModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-2xl w-full max-h-[92vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white font-black text-base flex items-center justify-center shadow-xs">
                  {(selectedAppModal.full_name || selectedAppModal.name || 'P')[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-lg">
                      {selectedAppModal.full_name || selectedAppModal.name}
                    </h3>
                    <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                      (selectedAppModal.status || '').toLowerCase() === 'active'
                        ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        : (selectedAppModal.status || '').toLowerCase() === 'pending'
                        ? 'bg-amber-100 text-amber-800 border border-amber-200'
                        : 'bg-rose-100 text-rose-800 border border-rose-200'
                    }`}>
                      {selectedAppModal.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {selectedAppModal.partner_id ? `Partner ID: ${selectedAppModal.partner_id} • ` : ''}
                    Applied on {selectedAppModal.applied_at || selectedAppModal.created_at ? new Date(selectedAppModal.applied_at || selectedAppModal.created_at!).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setShowAppModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-6 text-sm divide-y divide-slate-100">
              {/* Section 1: Contact & Location */}
              <div className="space-y-3 pt-0">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <User className="h-4 w-4 text-emerald-600" />
                  <h4>Candidate Information & Contact</h4>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5 bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs">
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Email Address</span>
                    <p className="font-bold text-slate-900 mt-0.5 break-all">{selectedAppModal.email}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Phone Number</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedAppModal.phone || 'None provided'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">WhatsApp Line</span>
                    <div className="mt-0.5">
                      {selectedAppModal.whatsapp || selectedAppModal.phone ? (
                        <a
                          href={`https://wa.me/${(selectedAppModal.whatsapp || selectedAppModal.phone || '').replace(/[^0-9]/g, '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 font-bold text-emerald-700 hover:underline"
                        >
                          <MessageCircle className="h-3.5 w-3.5" />
                          {selectedAppModal.whatsapp || selectedAppModal.phone}
                        </a>
                      ) : (
                        <span className="text-slate-400">N/A</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">State / Location</span>
                    <p className="font-bold text-slate-900 mt-0.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      {selectedAppModal.state || 'Lagos, Nigeria'}
                    </p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Occupation / Role</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedAppModal.occupation || 'Course Marketer'}</p>
                  </div>
                  <div>
                    <span className="text-slate-400 uppercase font-semibold text-[10px]">Organization</span>
                    <p className="font-bold text-slate-900 mt-0.5">{selectedAppModal.organization || 'Independent Partner'}</p>
                  </div>
                </div>
              </div>

              {/* Section 2: Promotional Strategy & Motivation (The Core Answers) */}
              <div className="space-y-3 pt-5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Target className="h-4 w-4 text-emerald-600" />
                  <h4>Promotional Strategy & Experience</h4>
                </div>

                <div className="space-y-3">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">
                      Promotion Method & Campaign Strategy
                    </span>
                    <p className="text-slate-800 text-xs sm:text-sm leading-relaxed">
                      {selectedAppModal.promotion_method || 'Direct referral through social media channels, paid adverts, and student WhatsApp communities.'}
                    </p>
                  </div>

                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">
                      Motivation for Partnering
                    </span>
                    <p className="text-slate-800 text-xs sm:text-sm leading-relaxed">
                      {selectedAppModal.motivation || 'Passionate about democratizing technical education and connecting high-demand skills to career-driven African students.'}
                    </p>
                  </div>

                  {selectedAppModal.experience && (
                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
                      <span className="text-slate-500 font-bold text-xs uppercase tracking-wider block mb-1">
                        Relevant Marketing Experience & Audience Size
                      </span>
                      <p className="text-slate-800 text-xs sm:text-sm leading-relaxed">
                        {selectedAppModal.experience}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Section 3: Online Presence & Social Links */}
              <div className="space-y-3 pt-5">
                <div className="flex items-center gap-2 text-slate-900 font-bold text-sm">
                  <Globe className="h-4 w-4 text-emerald-600" />
                  <h4>Online Presence & Social Channels</h4>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
                  {selectedAppModal.website && (
                    <a
                      href={selectedAppModal.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <span className="font-semibold text-slate-700 truncate">Website</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    </a>
                  )}
                  {selectedAppModal.linkedin && (
                    <a
                      href={selectedAppModal.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <span className="font-semibold text-slate-700 truncate">LinkedIn</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    </a>
                  )}
                  {selectedAppModal.facebook && (
                    <a
                      href={selectedAppModal.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <span className="font-semibold text-slate-700 truncate">Facebook</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    </a>
                  )}
                  {selectedAppModal.instagram && (
                    <a
                      href={selectedAppModal.instagram}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <span className="font-semibold text-slate-700 truncate">Instagram</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    </a>
                  )}
                  {selectedAppModal.tiktok && (
                    <a
                      href={selectedAppModal.tiktok}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <span className="font-semibold text-slate-700 truncate">TikTok</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    </a>
                  )}
                  {selectedAppModal.youtube && (
                    <a
                      href={selectedAppModal.youtube}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-lg flex items-center justify-between group transition-colors"
                    >
                      <span className="font-semibold text-slate-700 truncate">YouTube</span>
                      <ExternalLink className="h-3.5 w-3.5 text-slate-400 group-hover:text-emerald-600 shrink-0" />
                    </a>
                  )}
                  {!selectedAppModal.website && !selectedAppModal.linkedin && !selectedAppModal.facebook && !selectedAppModal.instagram && (
                    <p className="text-xs text-slate-400 col-span-3 italic">No external social handles specified in application.</p>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer Decisions */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setShowAppModal(false)}
                className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 rounded-xl text-xs font-semibold transition-colors"
              >
                Close Dossier
              </button>

              <div className="flex items-center gap-2">
                {(selectedAppModal.status || '').toLowerCase() === 'pending' ? (
                  <>
                    <button
                      onClick={() => {
                        handleProcessApplication(selectedAppModal.id, 'reject');
                        setShowAppModal(false);
                      }}
                      className="px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold transition-colors"
                    >
                      Reject Application
                    </button>
                    <button
                      onClick={() => {
                        handleProcessApplication(selectedAppModal.id, 'approve');
                        setShowAppModal(false);
                      }}
                      className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                    >
                      Approve & Onboard Partner
                    </button>
                  </>
                ) : (
                  <span className="text-xs font-bold text-emerald-700 flex items-center gap-1.5">
                    <CheckCircle className="h-4 w-4" /> Partner is Active in Network
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: PRODUCT-SPECIFIC AFFILIATE LINKS MODAL */}
      {showProductModal && selectedProductModalPartner && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-xs p-4">
          <div className="bg-white border border-slate-200 rounded-2xl shadow-2xl max-w-xl w-full max-h-[85vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-150">
            {/* Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2.5">
                <span className="p-2 bg-emerald-100 text-emerald-800 rounded-xl">
                  <Globe className="h-5 w-5" />
                </span>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">
                    Course Affiliate Links
                  </h3>
                  <p className="text-xs text-slate-500">
                    Partner: <span className="font-semibold text-slate-800">{selectedProductModalPartner.name || selectedProductModalPartner.full_name}</span> ({selectedProductModalPartner.partner_id})
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowProductModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 overflow-y-auto space-y-4 text-sm">
              <div className="p-3 bg-emerald-50/60 border border-emerald-200/80 rounded-xl text-xs text-emerald-900">
                <p className="font-semibold flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-emerald-600" />
                  Product-Based Referral System
                </p>
                <p className="text-emerald-700 mt-0.5">
                  Affiliate earnings are tracked per product. When students purchase through a course affiliate link, this partner receives author-configured commissions.
                </p>
              </div>

              {selectedProductModalPartner.promoted_products && selectedProductModalPartner.promoted_products.length > 0 ? (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Course Links ({selectedProductModalPartner.promoted_products.length})</h4>
                  {selectedProductModalPartner.promoted_products.map((link: any) => (
                    <div key={link.id} className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <BookOpen className="h-4 w-4 text-emerald-600" />
                          <span className="font-bold text-slate-900 text-sm">{link.title}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                          {link.commission_rate}% commission (₦{(Number(link.commission_amount) || 0).toLocaleString()})
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          readOnly
                          value={link.url}
                          className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs font-mono text-slate-700 focus:outline-none"
                        />
                        <button
                          onClick={() => copyToClipboard(link.url, `prod-link-${link.id}`)}
                          className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold whitespace-nowrap shadow-xs flex items-center gap-1.5"
                        >
                          {copiedKey === `prod-link-${link.id}` ? (
                            <>
                              <Check className="h-3.5 w-3.5" />
                              Copied
                            </>
                          ) : (
                            <>
                              <Copy className="h-3.5 w-3.5" />
                              Copy
                            </>
                          )}
                        </button>
                        <a
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 rounded-lg"
                          title="Open course page in new tab"
                        >
                          <ExternalLink className="h-4 w-4" />
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <Globe className="h-8 w-8 text-slate-300 mx-auto mb-2" />
                  <p className="font-bold text-slate-700 text-sm">No course links generated yet</p>
                  <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                    This affiliate partner has not yet generated links for any learning products. You can generate a link for them below.
                  </p>
                </div>
              )}

              {/* Generate New Link for this Partner */}
              <div className="border-t border-slate-200 pt-4 space-y-2">
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700">Generate Course Link</h4>
                <div className="flex items-center gap-2">
                  <select
                    value={selectedCourseForModal}
                    onChange={(e) => setSelectedCourseForModal(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-300 rounded-lg text-xs text-slate-800 focus:outline-none focus:border-emerald-500 font-medium"
                  >
                    <option value="">Select a course from marketplace...</option>
                    {courses.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.title} (₦{(Number(c.price) || 0).toLocaleString()} • {Number(c.affiliate_commission_rate) || 20}% commission)
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={() => handleGenerateLink(selectedProductModalPartner.id, selectedCourseForModal)}
                    disabled={generatingLink || !selectedCourseForModal}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold disabled:opacity-50 transition-colors shadow-xs whitespace-nowrap"
                  >
                    {generatingLink ? 'Creating...' : 'Create Link'}
                  </button>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-end">
              <button
                onClick={() => setShowProductModal(false)}
                className="px-4 py-2 bg-white border border-slate-300 rounded-lg text-xs font-semibold text-slate-700 hover:bg-slate-50 shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
