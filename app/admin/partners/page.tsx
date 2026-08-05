"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Clock, 
  Shield, 
  Award,
  FileText,
  BarChart3,
  Settings,
  LogOut,
  Search,
  Filter,
  Download,
  Plus,
  X,
  CheckCircle,
  XCircle,
  Eye,
  Phone,
  Mail,
  MessageCircle,
  MoreHorizontal,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Upload
} from 'lucide-react';

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'applications', label: 'Applications', icon: FileText },
  { id: 'community', label: 'Community Partners', icon: Users },
  { id: 'influencer', label: 'Influencer Partners', icon: Award },
  { id: 'withdrawals', label: 'Withdrawals', icon: DollarSign },
  { id: 'marketing', label: 'Marketing Kit', icon: Shield },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function AdminPartnersPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [partners, setPartners] = useState<any[]>([]);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApp, setSelectedApp] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('pending');
  const [showAddPartnerModal, setShowAddPartnerModal] = useState(false);
  const [newPartner, setNewPartner] = useState({
    full_name: '',
    email: '',
    phone: '',
    whatsapp: '',
    partner_type: 'community',
    commission_rate: 1500,
    password: '',
    status: 'active'
  });
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [marketingFile, setMarketingFile] = useState<File | null>(null);
  const [uploadData, setUploadData] = useState({
    name: '',
    type: 'flyer',
    category: 'general',
    description: ''
  });
  const [marketingMaterials, setMarketingMaterials] = useState<any[]>([]);
  const [selectedMaterial, setSelectedMaterial] = useState<any>(null);
  const [showMaterialPreviewModal, setShowMaterialPreviewModal] = useState(false);
  const [showMaterialEditModal, setShowMaterialEditModal] = useState(false);
  const [editMaterialData, setEditMaterialData] = useState({
    name: '',
    type: 'flyer',
    category: 'general',
    description: ''
  });
  const [selectedPartner, setSelectedPartner] = useState<any>(null);
  const [showPartnerDetailModal, setShowPartnerDetailModal] = useState(false);
  const [settings, setSettings] = useState({
    studentCommission: 1500,
    communityCommission: 2000,
    influencerCommission: 3000,
    holdingPeriod: 7,
    minWithdrawal: 5000,
    adminEmailEnabled: true,
    partnerEmailEnabled: true,
    currentCohort: 'Cohort 2',
    coursePrice: 8000,
    theme: 'dark'
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('partnerSettings');
    if (savedSettings) {
      try {
        setSettings(JSON.parse(savedSettings));
      } catch (e) {
        console.error('Failed to parse saved settings:', e);
      }
    }
  }, []);

  // Apply theme to document
  useEffect(() => {
    const root = document.documentElement;
    if (settings.theme === 'light') {
      root.classList.remove('dark');
    } else {
      root.classList.add('dark');
    }
  }, [settings.theme]);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('partnerSettings', JSON.stringify(settings));
  }, [settings]);

  // Fetch marketing materials from database
  const fetchMarketingMaterials = async () => {
    try {
      console.log('[Admin Partners] Fetching marketing materials');
      const res = await fetch('/api/admin/marketing/materials');
      console.log('[Admin Partners] Materials response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Admin Partners] Materials data:', data);
        setMarketingMaterials(data.materials || []);
      } else {
        const errorData = await res.json();
        console.error('[Admin Partners] Failed to fetch materials:', errorData);
      }
    } catch (e) {
      console.error('[Admin Partners] Failed to fetch marketing materials:', e);
    }
  };

  useEffect(() => {
    fetchMarketingMaterials();
  }, []);

  const overviewCards = [
    { id: 'total', label: 'Total Partners', value: partners.length.toString(), growth: null, icon: Users, positive: true },
    { id: 'pending', label: 'Pending Applications', value: applications.filter(a => a.status === 'pending').length.toString(), growth: null, icon: Clock, positive: true },
    { id: 'community', label: 'Community Partners', value: partners.filter(p => p.partner_type === 'community').length.toString(), growth: null, icon: Users, positive: true },
    { id: 'influencer', label: 'Influencers', value: partners.filter(p => p.partner_type === 'influencer').length.toString(), growth: null, icon: Award, positive: true },
    { id: 'commission', label: 'Total Commission Paid', value: '₦0', growth: null, icon: DollarSign, positive: true },
    { id: 'withdrawals', label: 'Pending Withdrawals', value: '₦0', growth: null, icon: TrendingUp, positive: false },
  ];

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [pRes, aRes] = await Promise.all([
        fetch('/api/admin/partners'),
        fetch('/api/admin/partners/applications')
      ]);

      if (pRes.ok) {
        const pData = await pRes.json();
        setPartners(pData.partners || []);
      }
      if (aRes.ok) {
        const aData = await aRes.json();
        setApplications(aData.applications || []);
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAll();
  }, []);

  const handleAddPartner = async () => {
    try {
      console.log('[Admin Partners] Creating partner with data:', newPartner);
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });
      
      console.log('[Admin Partners] Partner creation response status:', res.status);
      
      if (res.ok) {
        const data = await res.json();
        console.log('[Admin Partners] Partner created successfully:', data);
        setShowAddPartnerModal(false);
        setNewPartner({
          full_name: '',
          email: '',
          phone: '',
          whatsapp: '',
          partner_type: 'community',
          commission_rate: 1500,
          password: '',
          status: 'active'
        });
        fetchAll();
        alert('Partner added successfully');
      } else {
        const errorData = await res.json();
        console.error('[Admin Partners] Failed to add partner:', errorData);
        alert(`Failed to add partner: ${errorData.details || errorData.error}`);
      }
    } catch (e) {
      console.error('[Admin Partners] Failed to add partner:', e);
      alert('Failed to add partner');
    }
  };

  const handleMarketingUpload = async () => {
    if (!marketingFile || !uploadData.name) {
      alert('Please select a file and enter a name');
      return;
    }

    try {
      const formData = new FormData();
      formData.append('file', marketingFile);
      formData.append('name', uploadData.name);
      formData.append('type', uploadData.type);
      formData.append('category', uploadData.category);
      formData.append('description', uploadData.description);

      const res = await fetch('/api/admin/marketing/upload', {
        method: 'POST',
        body: formData
      });

      if (res.ok) {
        setShowUploadModal(false);
        setMarketingFile(null);
        setUploadData({
          name: '',
          type: 'flyer',
          category: 'general',
          description: ''
        });
        fetchMarketingMaterials(); // Refresh the materials list
        alert('Marketing material uploaded successfully');
      } else {
        const errorData = await res.json();
        alert(`Failed to upload marketing material: ${errorData.details || errorData.error}`);
      }
    } catch (e) {
      console.error('[Admin Partners] Failed to upload marketing material:', e);
      alert('Failed to upload marketing material');
    }
  };

  const handleMaterialEdit = async () => {
    if (!selectedMaterial) return;

    try {
      const res = await fetch(`/api/admin/marketing/materials/${selectedMaterial.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editMaterialData)
      });

      if (res.ok) {
        setShowMaterialEditModal(false);
        setSelectedMaterial(null);
        fetchMarketingMaterials();
        alert('Material updated successfully');
      } else {
        alert('Failed to update material');
      }
    } catch (e) {
      console.error('[Admin Partners] Failed to update material:', e);
      alert('Failed to update material');
    }
  };

  const handleMaterialDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this material?')) return;

    try {
      const res = await fetch(`/api/admin/marketing/materials/${id}`, {
        method: 'DELETE'
      });

      if (res.ok) {
        fetchMarketingMaterials();
        alert('Material deleted successfully');
      } else {
        alert('Failed to delete material');
      }
    } catch (e) {
      console.error('[Admin Partners] Failed to delete material:', e);
      alert('Failed to delete material');
    }
  };

  const openMaterialPreview = (material: any) => {
    setSelectedMaterial(material);
    setShowMaterialPreviewModal(true);
  };

  const openMaterialEdit = (material: any) => {
    setSelectedMaterial(material);
    setEditMaterialData({
      name: material.name,
      type: material.type,
      category: material.category,
      description: material.description
    });
    setShowMaterialEditModal(true);
  };

  const handlePartnerClick = async (partner: any) => {
    setSelectedPartner(partner);
    setShowPartnerDetailModal(true);
    
    // Fetch partner bank details and recent referrals
    try {
      const [bankRes, referralsRes] = await Promise.all([
        fetch(`/api/admin/partners/${partner.id}/details`),
        fetch(`/api/admin/partners/${partner.id}/referrals`)
      ]);
      
      if (bankRes.ok) {
        const bankData = await bankRes.json();
        setSelectedPartner(prev => ({ ...prev, bankDetails: bankData.bankDetails }));
      }
      
      if (referralsRes.ok) {
        const referralsData = await referralsRes.json();
        setSelectedPartner(prev => ({ ...prev, recentReferrals: referralsData.referrals }));
      }
    } catch (error) {
      console.error('Error fetching partner details:', error);
    }
  };

  const handleProcessApplication = async (applicationId: string, action: 'approve' | 'reject') => {
    try {
      const res = await fetch('/api/admin/partners/applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId, action })
      });
      
      if (res.ok) {
        fetchAll();
        alert(`Application ${action}d successfully`);
      } else {
        alert(`Failed to ${action} application`);
      }
    } catch (e) {
      console.error(e);
      alert(`Failed to ${action} application`);
    }
  };

  const handleResendEmail = async (applicationId: string) => {
    try {
      const res = await fetch('/api/admin/partners/applications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ applicationId })
      });
      
      if (res.ok) {
        alert('Email resent successfully');
      } else {
        const error = await res.json();
        alert(`Failed to resend email: ${error.error}`);
      }
    } catch (e) {
      console.error(e);
      alert('Failed to resend email');
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = 
      app.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'rejected': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'pending': return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
      case 'under_review': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      default: return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070B12] flex items-center justify-center">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070B12] flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl p-4 flex flex-col">
        <div className="mb-8">
          <h1 className="text-lg font-bold text-[#e2e2e8]">Partner Management</h1>
          <p className="text-xs text-[#b9cacb]">AutoLearn Spot Admin</p>
        </div>
        
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  activeTab === item.id
                    ? 'bg-[#12E6F3]/10 text-[#12E6F3] border border-[#12E6F3]/20'
                    : 'text-[#b9cacb] hover:bg-[#0c0e12] hover:text-[#e2e2e8]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="pt-4 border-t border-[#1f2229]">
          <button className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-[#b9cacb] hover:bg-[#0c0e12] hover:text-[#e2e2e8] transition-colors">
            <LogOut className="h-5 w-5" />
            <span className="text-sm font-medium">Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#e2e2e8]">Dashboard</h1>
            <p className="text-sm text-[#b9cacb]">Overview of partner performance</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#b9cacb]" />
              <input
                type="text"
                placeholder="Search partners..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] placeholder-[#b9cacb] focus:outline-none focus:border-[#12E6F3] w-64"
              />
            </div>
            <button className="flex items-center gap-2 px-4 py-2 bg-[#12E6F3] text-[#070B12] rounded-lg font-medium hover:bg-[#12E6F3]/90 transition-colors"
                onClick={() => setShowAddPartnerModal(true)}
              >
                <Plus className="h-4 w-4" />
                Add Partner
              </button>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
          {overviewCards.map((card) => {
            const Icon = card.icon;
            return (
              <div key={card.id} className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex h-10 w-10 items-center justify-center border border-[#12E6F3]/30 bg-[#12E6F3]/10 rounded-lg">
                    <Icon className="h-5 w-5 text-[#12E6F3]" />
                  </div>
                  {card.growth && (
                    <div className={`flex items-center gap-1 text-xs ${card.positive ? 'text-green-400' : 'text-red-400'}`}>
                      {card.positive ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                      {card.growth}
                    </div>
                  )}
                </div>
                <div className="text-2xl font-bold text-[#e2e2e8] mb-1">{card.value}</div>
                <div className="text-xs text-[#b9cacb]">{card.label}</div>
              </div>
            );
          })}
        </div>

        {/* Tab Content */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Overview Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Users className="h-8 w-8 text-[#12E6F3]" />
                  <span className="text-xs text-[#b9cacb]">Total</span>
                </div>
                <p className="text-3xl font-bold text-[#e2e2e8]">{partners.length}</p>
                <p className="text-sm text-[#b9cacb] mt-1">Active Partners</p>
              </div>
              <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <Clock className="h-8 w-8 text-yellow-400" />
                  <span className="text-xs text-[#b9cacb]">Pending</span>
                </div>
                <p className="text-3xl font-bold text-[#e2e2e8]">{applications.filter(a => a.status === 'pending').length}</p>
                <p className="text-sm text-[#b9cacb] mt-1">Applications</p>
              </div>
              <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <DollarSign className="h-8 w-8 text-green-400" />
                  <span className="text-xs text-[#b9cacb]">Total</span>
                </div>
                <p className="text-3xl font-bold text-[#e2e2e8]">₦{(partners.reduce((sum, p) => sum + (p.available_earnings || 0), 0)).toLocaleString()}</p>
                <p className="text-sm text-[#b9cacb] mt-1">Commissions</p>
              </div>
              <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
                <div className="flex items-center justify-between mb-4">
                  <TrendingUp className="h-8 w-8 text-blue-400" />
                  <span className="text-xs text-[#b9cacb]">Total</span>
                </div>
                <p className="text-3xl font-bold text-[#e2e2e8]">{partners.reduce((sum, p) => sum + (p.total_registrations || 0), 0)}</p>
                <p className="text-sm text-[#b9cacb] mt-1">Referrals</p>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-[#e2e2e8]">Quick Actions</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <button
                  onClick={() => setShowAddPartnerModal(true)}
                  className="flex items-center gap-3 p-4 bg-[#12E6F3]/10 border border-[#12E6F3]/30 rounded-lg hover:bg-[#12E6F3]/20 transition-colors"
                >
                  <Plus className="h-5 w-5 text-[#12E6F3]" />
                  <span className="text-[#e2e2e8]">Add Partner</span>
                </button>
                <button
                  onClick={() => setActiveTab('applications')}
                  className="flex items-center gap-3 p-4 bg-[#1f2229] border border-[#1f2229] rounded-lg hover:bg-[#0c0e12] transition-colors"
                >
                  <FileText className="h-5 w-5 text-[#b9cacb]" />
                  <span className="text-[#e2e2e8]">Review Applications</span>
                </button>
                <button
                  onClick={() => setActiveTab('marketing')}
                  className="flex items-center gap-3 p-4 bg-[#1f2229] border border-[#1f2229] rounded-lg hover:bg-[#0c0e12] transition-colors"
                >
                  <Upload className="h-5 w-5 text-[#b9cacb]" />
                  <span className="text-[#e2e2e8]">Upload Marketing Kit</span>
                </button>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4 text-[#e2e2e8]">Recent Activity</h3>
              <div className="space-y-3">
                {applications.slice(0, 5).map((app) => (
                  <div key={app.id} className="flex items-center justify-between p-3 bg-[#070B12] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-full bg-[#1f2229] flex items-center justify-center text-[#b9cacb] text-xs">
                        {app.full_name?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-sm text-[#e2e2e8]">{app.full_name}</p>
                        <p className="text-xs text-[#b9cacb]">{app.email}</p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      app.status === 'pending' ? 'bg-yellow-500/10 text-yellow-400' :
                      app.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {app.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Applications Tab */}
        {activeTab === 'applications' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-[#1f2229]">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Partner Applications</h2>
              <div className="flex items-center gap-2">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>
            </div>
              
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0c0e12]">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Passport</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Name</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Email</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Phone</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Partner Type</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApplications.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#b9cacb]">No applications found</td>
                    </tr>
                  ) : (
                    filteredApplications.map((app) => (
                      <tr key={app.id} className="border-t border-[#1f2229] hover:bg-[#0c0e12]/50 transition-colors">
                        <td className="p-4">
                          <div className="h-10 w-10 rounded-full bg-[#1f2229] flex items-center justify-center text-[#b9cacb] text-xs">
                            {app.full_name?.charAt(0) || '?'}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#e2e2e8]">{app.full_name}</td>
                        <td className="p-4 text-sm text-[#b9cacb]">{app.email}</td>
                        <td className="p-4 text-sm text-[#b9cacb]">{app.phone || 'N/A'}</td>
                        <td className="p-4 text-sm text-[#e2e2e8] capitalize">{app.partner_type || 'Community'}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(app.status)}`}>
                            {app.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setSelectedApp(app)}
                              className="p-2 hover:bg-[#0c0e12] rounded-lg transition-colors text-[#b9cacb] hover:text-[#12E6F3]"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {app.status === 'pending' && (
                              <>
                                <button
                                  onClick={() => handleProcessApplication(app.id, 'approve')}
                                  className="p-2 hover:bg-green-500/10 rounded-lg transition-colors text-[#b9cacb] hover:text-green-400"
                                >
                                  <CheckCircle className="h-4 w-4" />
                                </button>
                                <button
                                  onClick={() => handleProcessApplication(app.id, 'reject')}
                                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-[#b9cacb] hover:text-red-400"
                                >
                                  <XCircle className="h-4 w-4" />
                                </button>
                              </>
                            )}
                            {app.status === 'approved' && (
                              <button
                                onClick={() => handleResendEmail(app.id)}
                                className="p-2 hover:bg-blue-500/10 rounded-lg transition-colors text-[#b9cacb] hover:text-blue-400"
                                title="Resend approval email"
                              >
                                <Mail className="h-4 w-4" />
                              </button>
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

        {/* Community Partners Tab */}
        {activeTab === 'community' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2229] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Community Partners</h2>
              <button
                onClick={() => setShowAddPartnerModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#12E6F3] text-[#070B12] rounded-lg font-medium hover:bg-[#12E6F3]/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Partner
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0c0e12]">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Passport</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Name</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Email</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Referrals</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Earnings</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.filter(p => p.partner_type === 'community').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#b9cacb]">No community partners</td>
                    </tr>
                  ) : (
                    partners.filter(p => p.partner_type === 'community').map((p) => (
                      <tr key={p.id} className="border-t border-[#1f2229] hover:bg-[#0c0e12]/50 transition-colors cursor-pointer" onClick={() => handlePartnerClick(p)}>
                        <td className="p-4">
                          <div className="h-10 w-10 rounded-full bg-[#1f2229] flex items-center justify-center text-[#b9cacb] text-xs">
                            {p.full_name?.charAt(0) || '?'}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#e2e2e8]">{p.full_name}</td>
                        <td className="p-4 text-sm text-[#b9cacb]">{p.email}</td>
                        <td className="p-4 text-sm text-[#e2e2e8]">{p.total_registrations || 0}</td>
                        <td className="p-4 text-sm text-[#12E6F3]">₦{(p.available_earnings || 0).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            p.status === 'active' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePartnerClick(p); }}
                            className="p-2 hover:bg-[#12E6F3]/10 rounded-lg transition-colors text-[#b9cacb] hover:text-[#12E6F3]"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Influencer Partners Tab */}
        {activeTab === 'influencer' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2229] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Influencer Partners</h2>
              <button
                onClick={() => setShowAddPartnerModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#12E6F3] text-[#070B12] rounded-lg font-medium hover:bg-[#12E6F3]/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Partner
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0c0e12]">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Passport</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Name</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Email</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Referrals</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Earnings</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {partners.filter(p => p.partner_type === 'influencer').length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-8 text-center text-[#b9cacb]">No influencer partners</td>
                    </tr>
                  ) : (
                    partners.filter(p => p.partner_type === 'influencer').map((p) => (
                      <tr key={p.id} className="border-t border-[#1f2229] hover:bg-[#0c0e12]/50 transition-colors cursor-pointer" onClick={() => handlePartnerClick(p)}>
                        <td className="p-4">
                          <div className="h-10 w-10 rounded-full bg-[#1f2229] flex items-center justify-center text-[#b9cacb] text-xs">
                            {p.full_name?.charAt(0) || '?'}
                          </div>
                        </td>
                        <td className="p-4 text-sm text-[#e2e2e8]">{p.full_name}</td>
                        <td className="p-4 text-sm text-[#b9cacb]">{p.email}</td>
                        <td className="p-4 text-sm text-[#e2e2e8]">{p.total_registrations || 0}</td>
                        <td className="p-4 text-sm text-[#12E6F3]">₦{(p.available_earnings || 0).toLocaleString()}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            p.status === 'active' 
                              ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                              : 'bg-red-500/10 text-red-400 border border-red-500/20'
                          }`}>
                            {p.status}
                          </span>
                        </td>
                        <td className="p-4">
                          <button
                            onClick={(e) => { e.stopPropagation(); handlePartnerClick(p); }}
                            className="p-2 hover:bg-[#12E6F3]/10 rounded-lg transition-colors text-[#b9cacb] hover:text-[#12E6F3]"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2229]">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Withdrawal Requests</h2>
            </div>
            
            <div className="p-8 text-center text-[#b9cacb]">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-[#12E6F3]" />
              <p>Withdrawal requests will appear here</p>
              <p className="text-sm mt-2">Process partner withdrawal requests with full bank details</p>
            </div>
          </div>
        )}

        {/* Marketing Kit Tab */}
        {activeTab === 'marketing' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2229] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Marketing Kit</h2>
              <button
                onClick={() => setShowUploadModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-[#12E6F3] text-[#070B12] rounded-lg font-medium hover:bg-[#12E6F3]/90 transition-colors"
              >
                <Plus className="h-4 w-4" />
                Upload Material
              </button>
            </div>
            
            <div className="p-6">
              {marketingMaterials.length === 0 ? (
                <div className="text-center text-[#b9cacb] py-12">
                  <Download className="h-12 w-12 mx-auto mb-4 text-[#12E6F3]" />
                  <p>No marketing materials uploaded yet</p>
                  <p className="text-sm mt-2">Upload your first marketing material to get started</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {marketingMaterials.map((material) => (
                    <div key={material.id} className="border border-[#1f2229] bg-[#070B12] rounded-lg p-4 hover:border-[#12E6F3]/30 transition-colors">
                      <div className="flex items-center justify-between mb-3">
                        <div className="h-12 w-12 bg-[#1f2229] rounded-lg flex items-center justify-center">
                          <Download className="h-6 w-6 text-[#12E6F3]" />
                        </div>
                        <span className="text-xs text-[#b9cacb]">{material.type.toUpperCase()}</span>
                      </div>
                      <h4 className="text-sm font-semibold text-[#e2e2e8] mb-1">{material.name}</h4>
                      <p className="text-xs text-[#b9cacb]">{material.description || 'No description'}</p>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="text-xs text-[#b9cacb]">{material.download_count || 0} downloads</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => openMaterialPreview(material)}
                            className="p-1 hover:bg-[#12E6F3]/10 rounded transition-colors text-[#b9cacb] hover:text-[#12E6F3]"
                            title="Preview"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => openMaterialEdit(material)}
                            className="p-1 hover:bg-[#12E6F3]/10 rounded transition-colors text-[#b9cacb] hover:text-[#12E6F3]"
                            title="Edit"
                          >
                            <Settings className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleMaterialDelete(material.id)}
                            className="p-1 hover:bg-red-500/10 rounded transition-colors text-[#b9cacb] hover:text-red-400"
                            title="Delete"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Marketing Upload Modal */}
        {showUploadModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#e2e2e8]">Upload Marketing Material</h2>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="p-2 hover:bg-[#070B12] rounded-lg transition-colors text-[#b9cacb] hover:text-[#e2e2e8]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Material Name</label>
                  <input
                    type="text"
                    value={uploadData.name}
                    onChange={(e) => setUploadData({...uploadData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Type</label>
                    <select
                      value={uploadData.type}
                      onChange={(e) => setUploadData({...uploadData, type: e.target.value})}
                      className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    >
                      <option value="flyer">Flyer</option>
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                      <option value="reel">Reel</option>
                      <option value="pdf">PDF</option>
                      <option value="script">Script</option>
                      <option value="caption">Caption</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Category</label>
                    <select
                      value={uploadData.category}
                      onChange={(e) => setUploadData({...uploadData, category: e.target.value})}
                      className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    >
                      <option value="general">General</option>
                      <option value="whatsapp">WhatsApp</option>
                      <option value="instagram">Instagram</option>
                      <option value="tiktok">TikTok</option>
                      <option value="facebook">Facebook</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Description</label>
                  <textarea
                    value={uploadData.description}
                    onChange={(e) => setUploadData({...uploadData, description: e.target.value})}
                    rows={3}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3] resize-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">File</label>
                  <div className="border-2 border-dashed border-[#1f2229] rounded-lg p-6 text-center">
                    <input
                      type="file"
                      onChange={(e) => setMarketingFile(e.target.files?.[0] || null)}
                      className="hidden"
                      id="marketing-file"
                    />
                    <label
                      htmlFor="marketing-file"
                      className="cursor-pointer"
                    >
                      {marketingFile ? (
                        <div className="text-[#12E6F3]">
                          <FileText className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">{marketingFile.name}</p>
                        </div>
                      ) : (
                        <div className="text-[#b9cacb]">
                          <Upload className="h-8 w-8 mx-auto mb-2" />
                          <p className="text-sm">Click to upload file</p>
                        </div>
                      )}
                    </label>
                  </div>
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t border-[#1f2229]">
                  <button
                    onClick={handleMarketingUpload}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#12E6F3] text-[#070B12] rounded-lg font-medium hover:bg-[#12E6F3]/90 transition-colors"
                  >
                    <Upload className="h-4 w-4" />
                    Upload
                  </button>
                  <button
                    onClick={() => setShowUploadModal(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#070B12] text-[#e2e2e8] border border-[#1f2229] rounded-lg font-medium hover:bg-[#0c0e12] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Material Preview Modal */}
        {showMaterialPreviewModal && selectedMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#e2e2e8]">Material Preview</h2>
                <button
                  onClick={() => setShowMaterialPreviewModal(false)}
                  className="p-2 hover:bg-[#070B12] rounded-lg transition-colors text-[#b9cacb] hover:text-[#e2e2e8]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-[#e2e2e8]">{selectedMaterial.name}</h3>
                  <span className="px-3 py-1 bg-[#12E6F3]/10 text-[#12E6F3] rounded-full text-xs font-medium">
                    {selectedMaterial.type.toUpperCase()}
                  </span>
                </div>
                
                <p className="text-sm text-[#b9cacb]">{selectedMaterial.description || 'No description'}</p>
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div className="bg-[#070B12] p-3 rounded-lg">
                    <p className="text-[#b9cacb]">Downloads</p>
                    <p className="text-lg font-semibold text-[#e2e2e8]">{selectedMaterial.download_count || 0}</p>
                  </div>
                  <div className="bg-[#070B12] p-3 rounded-lg">
                    <p className="text-[#b9cacb]">Category</p>
                    <p className="text-lg font-semibold text-[#e2e2e8]">{selectedMaterial.category || 'general'}</p>
                  </div>
                </div>
                
                {selectedMaterial.file_url && (
                  <div className="bg-[#070B12] p-4 rounded-lg">
                    <p className="text-sm text-[#b9cacb] mb-2">Preview</p>
                    {selectedMaterial.type === 'image' || selectedMaterial.type === 'flyer' ? (
                      <img 
                        src={selectedMaterial.file_url} 
                        alt={selectedMaterial.name}
                        className="w-full h-auto rounded-lg"
                      />
                    ) : (
                      <a 
                        href={selectedMaterial.file_url} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-[#12E6F3] hover:underline"
                      >
                        Open File
                      </a>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Material Edit Modal */}
        {showMaterialEditModal && selectedMaterial && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#e2e2e8]">Edit Material</h2>
                <button
                  onClick={() => setShowMaterialEditModal(false)}
                  className="p-2 hover:bg-[#070B12] rounded-lg transition-colors text-[#b9cacb] hover:text-[#e2e2e8]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Material Name</label>
                  <input
                    type="text"
                    value={editMaterialData.name}
                    onChange={(e) => setEditMaterialData({...editMaterialData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Type</label>
                    <select
                      value={editMaterialData.type}
                      onChange={(e) => setEditMaterialData({...editMaterialData, type: e.target.value})}
                      className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    >
                      <option value="flyer">Flyer</option>
                      <option value="video">Video</option>
                      <option value="image">Image</option>
                      <option value="reel">Reel</option>
                      <option value="pdf">PDF</option>
                      <option value="script">Script</option>
                      <option value="caption">Caption</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Category</label>
                    <select
                      value={editMaterialData.category}
                      onChange={(e) => setEditMaterialData({...editMaterialData, category: e.target.value})}
                      className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    >
                      <option value="general">General</option>
                      <option value="social">Social Media</option>
                      <option value="email">Email</option>
                      <option value="print">Print</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Description</label>
                  <textarea
                    value={editMaterialData.description}
                    onChange={(e) => setEditMaterialData({...editMaterialData, description: e.target.value})}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3] resize-none"
                    rows={3}
                  />
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t border-[#1f2229]">
                  <button
                    onClick={handleMaterialEdit}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#12E6F3] text-[#070B12] rounded-lg font-medium hover:bg-[#12E6F3]/90 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Save Changes
                  </button>
                  <button
                    onClick={() => setShowMaterialEditModal(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#070B12] text-[#e2e2e8] border border-[#1f2229] rounded-lg font-medium hover:bg-[#0c0e12] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2229]">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Partner Analytics</h2>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Users className="h-8 w-8 text-[#12E6F3]" />
                    <span className="text-xs text-[#b9cacb]">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-[#e2e2e8]">{partners.length}</p>
                  <p className="text-sm text-[#b9cacb] mt-1">Active Partners</p>
                </div>
                <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <DollarSign className="h-8 w-8 text-green-400" />
                    <span className="text-xs text-[#b9cacb]">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-[#e2e2e8]">₦{(partners.reduce((sum, p) => sum + (p.available_earnings || 0), 0)).toLocaleString()}</p>
                  <p className="text-sm text-[#b9cacb] mt-1">Commissions</p>
                </div>
                <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <TrendingUp className="h-8 w-8 text-blue-400" />
                    <span className="text-xs text-[#b9cacb]">Total</span>
                  </div>
                  <p className="text-3xl font-bold text-[#e2e2e8]">{partners.reduce((sum, p) => sum + (p.total_registrations || 0), 0)}</p>
                  <p className="text-sm text-[#b9cacb] mt-1">Referrals</p>
                </div>
                <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                  <div className="flex items-center justify-between mb-4">
                    <Shield className="h-8 w-8 text-purple-400" />
                    <span className="text-xs text-[#b9cacb]">Active</span>
                  </div>
                  <p className="text-3xl font-bold text-[#e2e2e8]">{partners.filter(p => p.status === 'active').length}</p>
                  <p className="text-sm text-[#b9cacb] mt-1">Active Partners</p>
                </div>
              </div>

              {/* Partner Type Distribution */}
              <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Partner Type Distribution</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-[#0c0e12] border border-[#1f2229] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#b9cacb]">Community Partners</span>
                      <span className="text-sm font-semibold text-[#12E6F3]">
                        {partners.filter(p => p.partner_type === 'community').length}
                      </span>
                    </div>
                    <div className="w-full bg-[#1f2229] rounded-full h-2">
                      <div 
                        className="bg-[#12E6F3] h-2 rounded-full transition-all"
                        style={{ width: `${partners.length > 0 ? (partners.filter(p => p.partner_type === 'community').length / partners.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#0c0e12] border border-[#1f2229] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#b9cacb]">Influencer Partners</span>
                      <span className="text-sm font-semibold text-[#12E6F3]">
                        {partners.filter(p => p.partner_type === 'influencer').length}
                      </span>
                    </div>
                    <div className="w-full bg-[#1f2229] rounded-full h-2">
                      <div 
                        className="bg-[#12E6F3] h-2 rounded-full transition-all"
                        style={{ width: `${partners.length > 0 ? (partners.filter(p => p.partner_type === 'influencer').length / partners.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                  <div className="bg-[#0c0e12] border border-[#1f2229] rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-[#b9cacb]">Student Partners</span>
                      <span className="text-sm font-semibold text-[#12E6F3]">
                        {partners.filter(p => p.partner_type === 'student').length}
                      </span>
                    </div>
                    <div className="w-full bg-[#1f2229] rounded-full h-2">
                      <div 
                        className="bg-[#12E6F3] h-2 rounded-full transition-all"
                        style={{ width: `${partners.length > 0 ? (partners.filter(p => p.partner_type === 'student').length / partners.length) * 100 : 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Top Performers */}
              <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Top Performing Partners</h3>
                <div className="space-y-3">
                  {partners
                    .sort((a, b) => (b.total_registrations || 0) - (a.total_registrations || 0))
                    .slice(0, 5)
                    .map((partner, index) => (
                      <div key={partner.id} className="flex items-center justify-between p-4 bg-[#0c0e12] rounded-lg">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-full bg-[#1f2229] flex items-center justify-center text-[#b9cacb] font-bold">
                            {index + 1}
                          </div>
                          <div>
                            <p className="text-sm font-semibold text-[#e2e2e8]">{partner.full_name}</p>
                            <p className="text-xs text-[#b9cacb] capitalize">{partner.partner_type}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#12E6F3]">{partner.total_registrations || 0} referrals</p>
                          <p className="text-xs text-[#b9cacb]">₦{(partner.available_earnings || 0).toLocaleString()}</p>
                        </div>
                      </div>
                    ))}
                </div>
              </div>

              {/* Earnings Trend */}
              <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Monthly Earnings Trend</h3>
                <div className="h-64 flex items-end justify-between gap-2">
                  {['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'].map((month, index) => {
                    const heights = [40, 65, 45, 80, 55, 90];
                    return (
                      <div key={month} className="flex-1 flex flex-col items-center gap-2">
                        <div 
                          className="w-full bg-[#12E6F3] rounded-t-lg transition-all hover:bg-[#12E6F3]/80"
                          style={{ height: `${heights[index]}%` }}
                        />
                        <span className="text-xs text-[#b9cacb]">{month}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Partner Program Settings</h2>
              <button
                onClick={() => {
                  // Save settings logic here
                  localStorage.setItem('partnerSettings', JSON.stringify(settings));
                  alert('Settings saved successfully!');
                }}
                className="flex items-center gap-2 px-4 py-2 bg-[#12E6F3] text-[#070B12] rounded-lg font-medium hover:bg-[#12E6F3]/90 transition-colors"
              >
                <CheckCircle className="h-4 w-4" />
                Save Settings
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Commission Rates</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Student Partner (₦)</label>
                    <input
                      type="number"
                      value={settings.studentCommission}
                      onChange={(e) => setSettings({...settings, studentCommission: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Community Partner (₦)</label>
                    <input
                      type="number"
                      value={settings.communityCommission}
                      onChange={(e) => setSettings({...settings, communityCommission: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Influencer Partner (₦)</label>
                    <input
                      type="number"
                      value={settings.influencerCommission}
                      onChange={(e) => setSettings({...settings, influencerCommission: parseInt(e.target.value)})}
                      className="w-full px-4 py-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Payment Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#e2e2e8]">Commission Holding Period</p>
                      <p className="text-sm text-[#b9cacb]">Days before commission becomes available</p>
                    </div>
                    <input
                      type="number"
                      value={settings.holdingPeriod}
                      onChange={(e) => setSettings({...settings, holdingPeriod: parseInt(e.target.value)})}
                      className="w-24 px-4 py-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#e2e2e8]">Minimum Withdrawal Amount (₦)</p>
                      <p className="text-sm text-[#b9cacb]">Minimum amount partners can withdraw</p>
                    </div>
                    <input
                      type="number"
                      value={settings.minWithdrawal}
                      onChange={(e) => setSettings({...settings, minWithdrawal: parseInt(e.target.value)})}
                      className="w-24 px-4 py-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Notification Settings</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#e2e2e8]">Admin Email Notifications</p>
                      <p className="text-sm text-[#b9cacb]">Receive notifications for new applications and payments</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, adminEmailEnabled: !settings.adminEmailEnabled})}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        settings.adminEmailEnabled 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {settings.adminEmailEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-[#e2e2e8]">Partner Email Notifications</p>
                      <p className="text-sm text-[#b9cacb]">Partners receive notifications for successful referrals</p>
                    </div>
                    <button
                      onClick={() => setSettings({...settings, partnerEmailEnabled: !settings.partnerEmailEnabled})}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        settings.partnerEmailEnabled 
                          ? 'bg-green-500/10 text-green-400 border border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border border-red-500/20'
                      }`}
                    >
                      {settings.partnerEmailEnabled ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>
              </div>

              <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Program Information</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-[#e2e2e8]">Current Cohort</p>
                    <p className="text-sm text-[#b9cacb]">Active cohort for student enrollments</p>
                    <input
                      type="text"
                      value={settings.currentCohort}
                      onChange={(e) => setSettings({...settings, currentCohort: e.target.value})}
                      className="mt-1 w-full px-4 py-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    />
                  </div>
                  <div>
                    <p className="font-medium text-[#e2e2e8]">Course Price (₦)</p>
                    <p className="text-sm text-[#b9cacb]">Current price for direct enrollment</p>
                    <input
                      type="number"
                      value={settings.coursePrice}
                      onChange={(e) => setSettings({...settings, coursePrice: parseInt(e.target.value)})}
                      className="mt-1 w-full px-4 py-2 bg-[#0c0e12] border border-[#1f2229] rounded-lg text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Theme Customization</h3>
                <div className="space-y-4">
                  <div>
                    <p className="font-medium text-[#e2e2e8] mb-3">Partner Dashboard Theme</p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => setSettings({...settings, theme: 'dark'})}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          settings.theme === 'dark' 
                            ? 'border-[#12E6F3] bg-[#12E6F3]/10' 
                            : 'border-[#1f2229] bg-[#0c0e12] hover:border-[#1f2229]'
                        }`}
                      >
                        <div className="h-12 w-full bg-[#070B12] rounded mb-2"></div>
                        <p className="text-sm text-[#e2e2e8]">Dark Theme</p>
                      </button>
                      <button
                        onClick={() => setSettings({...settings, theme: 'light'})}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          settings.theme === 'light' 
                            ? 'border-[#12E6F3] bg-[#12E6F3]/10' 
                            : 'border-[#1f2229] bg-[#0c0e12] hover:border-[#1f2229]'
                        }`}
                      >
                        <div className="h-12 w-full bg-white rounded mb-2"></div>
                        <p className="text-sm text-[#e2e2e8]">Light Theme</p>
                      </button>
                      <button
                        onClick={() => setSettings({...settings, theme: 'cyber'})}
                        className={`p-4 border-2 rounded-lg transition-colors ${
                          settings.theme === 'cyber' 
                            ? 'border-[#12E6F3] bg-[#12E6F3]/10' 
                            : 'border-[#1f2229] bg-[#0c0e12] hover:border-[#1f2229]'
                        }`}
                      >
                        <div className="h-12 w-full bg-gradient-to-r from-[#12E6F3] to-purple-500 rounded mb-2"></div>
                        <p className="text-sm text-[#e2e2e8]">Cyber Theme</p>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedPartner && showPartnerDetailModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#e2e2e8]">Partner Details</h2>
                <button
                  onClick={() => setShowPartnerDetailModal(false)}
                  className="p-2 hover:bg-[#070B12] rounded-lg transition-colors text-[#b9cacb] hover:text-[#e2e2e8]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Profile Section */}
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 rounded-full bg-[#1f2229] flex items-center justify-center text-[#b9cacb] text-2xl">
                    {selectedPartner.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#e2e2e8]">{selectedPartner.full_name}</h3>
                    <p className="text-sm text-[#b9cacb]">{selectedPartner.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${
                        selectedPartner.status === 'active' 
                          ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                      }`}>
                        {selectedPartner.status}
                      </span>
                      <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 capitalize">
                        {selectedPartner.partner_type}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 text-[#e2e2e8]">Contact Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-[#b9cacb] mb-1">Phone</p>
                      <p className="text-[#e2e2e8]">{selectedPartner.phone || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#b9cacb] mb-1">WhatsApp</p>
                      <p className="text-[#e2e2e8]">{selectedPartner.whatsapp || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#b9cacb] mb-1">Partner ID</p>
                      <p className="text-[#e2e2e8] font-mono">{selectedPartner.partner_id || 'N/A'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-[#b9cacb] mb-1">Referral Code</p>
                      <p className="text-[#12E6F3] font-mono">{selectedPartner.referral_code || 'N/A'}</p>
                    </div>
                  </div>
                </div>

                {/* Performance Stats */}
                <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 text-[#e2e2e8]">Performance Statistics</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#12E6F3]">{selectedPartner.total_clicks || 0}</p>
                      <p className="text-sm text-[#b9cacb]">Total Clicks</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-[#12E6F3]">{selectedPartner.total_registrations || 0}</p>
                      <p className="text-sm text-[#b9cacb]">Registrations</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-green-400">₦{(selectedPartner.available_earnings || 0).toLocaleString()}</p>
                      <p className="text-sm text-[#b9cacb]">Available</p>
                    </div>
                    <div className="text-center">
                      <p className="text-3xl font-bold text-yellow-400">₦{(selectedPartner.pending_earnings || 0).toLocaleString()}</p>
                      <p className="text-sm text-[#b9cacb]">Pending</p>
                    </div>
                  </div>
                </div>

                {/* Bank Details */}
                <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 text-[#e2e2e8]">Bank Details</h4>
                  {selectedPartner.bankDetails ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-[#b9cacb] mb-1">Bank Name</p>
                        <p className="text-[#e2e2e8]">{selectedPartner.bankDetails.bank_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#b9cacb] mb-1">Account Number</p>
                        <p className="text-[#e2e2e8] font-mono">{selectedPartner.bankDetails.account_number || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#b9cacb] mb-1">Account Name</p>
                        <p className="text-[#e2e2e8]">{selectedPartner.bankDetails.account_name || 'N/A'}</p>
                      </div>
                      <div>
                        <p className="text-sm text-[#b9cacb] mb-1">Account Type</p>
                        <p className="text-[#e2e2e8] capitalize">{selectedPartner.bankDetails.account_type || 'N/A'}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-[#b9cacb] italic">
                      No bank details provided yet
                    </div>
                  )}
                </div>

                {/* Recent Referrals */}
                <div className="bg-[#070B12] border border-[#1f2229] rounded-lg p-6">
                  <h4 className="text-lg font-semibold mb-4 text-[#e2e2e8]">Recent Referrals</h4>
                  {selectedPartner.recentReferrals && selectedPartner.recentReferrals.length > 0 ? (
                    <div className="space-y-3">
                      {selectedPartner.recentReferrals.map((referral: any) => (
                        <div key={referral.id} className="flex items-center justify-between p-3 bg-[#0c0e12] rounded-lg">
                          <div>
                            <p className="text-sm text-[#e2e2e8]">Referral: {referral.referee_id || 'Unknown'}</p>
                            <p className="text-xs text-[#b9cacb]">{new Date(referral.created_at).toLocaleDateString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold text-green-400">₦{referral.amount?.toLocaleString() || 0}</p>
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              referral.status === 'available' 
                                ? 'bg-green-500/10 text-green-400' 
                                : 'bg-yellow-500/10 text-yellow-400'
                            }`}>
                              {referral.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-sm text-[#b9cacb] italic">
                      No recent referrals found
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#e2e2e8]">Application Details</h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 hover:bg-[#070B12] rounded-lg transition-colors text-[#b9cacb] hover:text-[#e2e2e8]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Profile Section */}
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 rounded-full bg-[#1f2229] flex items-center justify-center text-[#b9cacb] text-2xl">
                    {selectedApp.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#e2e2e8]">{selectedApp.full_name}</h3>
                    <p className="text-sm text-[#b9cacb]">{selectedApp.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedApp.status)}`}>
                        {selectedApp.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4 text-[#12E6F3]" />
                      <span className="text-xs text-[#b9cacb]">Phone</span>
                    </div>
                    <p className="text-sm text-[#e2e2e8]">{selectedApp.phone || 'N/A'}</p>
                  </div>
                  <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-[#12E6F3]" />
                      <span className="text-xs text-[#b9cacb]">WhatsApp</span>
                    </div>
                    <p className="text-sm text-[#e2e2e8]">{selectedApp.whatsapp || 'N/A'}</p>
                  </div>
                </div>

                {/* Motivation */}
                <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[#e2e2e8] mb-2">Motivation</h4>
                  <p className="text-sm text-[#b9cacb]">{selectedApp.motivation || 'N/A'}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#1f2229]">
                  <button
                    onClick={() => handleProcessApplication(selectedApp.id, 'approve')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg font-medium hover:bg-green-500/20 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleProcessApplication(selectedApp.id, 'reject')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#12E6F3]/10 text-[#12E6F3] border border-[#12E6F3]/20 rounded-lg font-medium hover:bg-[#12E6F3]/20 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Withdrawals Tab */}
        {activeTab === 'withdrawals' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2229] flex items-center justify-between">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Withdrawal Requests</h2>
              <div className="flex items-center gap-2">
                <button className="flex items-center gap-2 px-3 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] hover:bg-[#0c0e12] transition-colors">
                  <Download className="h-4 w-4" />
                  Export
                </button>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-[#0c0e12]">
                  <tr>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Partner</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Amount</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Date</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Status</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Bank</th>
                    <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-[#b9cacb]">No withdrawal requests found</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
        {selectedApp && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#e2e2e8]">Application Details</h2>
                <button
                  onClick={() => setSelectedApp(null)}
                  className="p-2 hover:bg-[#070B12] rounded-lg transition-colors text-[#b9cacb] hover:text-[#e2e2e8]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-6">
                {/* Profile Section */}
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 rounded-full bg-[#1f2229] flex items-center justify-center text-[#b9cacb] text-2xl">
                    {selectedApp.full_name?.charAt(0) || '?'}
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-[#e2e2e8]">{selectedApp.full_name}</h3>
                    <p className="text-sm text-[#b9cacb]">{selectedApp.email}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getStatusColor(selectedApp.status)}`}>
                        {selectedApp.status}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Contact Information */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Phone className="h-4 w-4 text-[#12E6F3]" />
                      <span className="text-xs text-[#b9cacb]">Phone</span>
                    </div>
                    <p className="text-sm text-[#e2e2e8]">{selectedApp.phone || 'N/A'}</p>
                  </div>
                  <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <MessageCircle className="h-4 w-4 text-[#12E6F3]" />
                      <span className="text-xs text-[#b9cacb]">WhatsApp</span>
                    </div>
                    <p className="text-sm text-[#e2e2e8]">{selectedApp.whatsapp || 'N/A'}</p>
                  </div>
                </div>

                {/* Motivation */}
                <div className="border border-[#1f2229] bg-[#070B12]/50 rounded-lg p-4">
                  <h4 className="text-sm font-medium text-[#e2e2e8] mb-2">Motivation</h4>
                  <p className="text-sm text-[#b9cacb]">{selectedApp.motivation || 'N/A'}</p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-[#1f2229]">
                  <button
                    onClick={() => handleProcessApplication(selectedApp.id, 'approve')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg font-medium hover:bg-green-500/20 transition-colors"
                  >
                    <CheckCircle className="h-4 w-4" />
                    Approve
                  </button>
                  <button
                    onClick={() => handleProcessApplication(selectedApp.id, 'reject')}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-red-500/10 text-red-400 border border-red-500/20 rounded-lg font-medium hover:bg-red-500/20 transition-colors"
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </button>
                  <button className="flex items-center justify-center gap-2 px-4 py-3 bg-[#12E6F3]/10 text-[#12E6F3] border border-[#12E6F3]/20 rounded-lg font-medium hover:bg-[#12E6F3]/20 transition-colors">
                    <MessageCircle className="h-4 w-4" />
                    WhatsApp
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Add Partner Modal */}
        {showAddPartnerModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
                <h2 className="text-xl font-bold text-[#e2e2e8]">Add Partner Manually</h2>
                <button
                  onClick={() => setShowAddPartnerModal(false)}
                  className="p-2 hover:bg-[#070B12] rounded-lg transition-colors text-[#b9cacb] hover:text-[#e2e2e8]"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Full Name</label>
                  <input
                    type="text"
                    value={newPartner.full_name}
                    onChange={(e) => setNewPartner({...newPartner, full_name: e.target.value})}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Email</label>
                  <input
                    type="email"
                    value={newPartner.email}
                    onChange={(e) => setNewPartner({...newPartner, email: e.target.value})}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Phone</label>
                    <input
                      type="tel"
                      value={newPartner.phone}
                      onChange={(e) => setNewPartner({...newPartner, phone: e.target.value})}
                      className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">WhatsApp</label>
                    <input
                      type="tel"
                      value={newPartner.whatsapp}
                      onChange={(e) => setNewPartner({...newPartner, whatsapp: e.target.value})}
                      className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Partner Type</label>
                  <select
                    value={newPartner.partner_type}
                    onChange={(e) => setNewPartner({...newPartner, partner_type: e.target.value, commission_rate: e.target.value === 'influencer' ? 2500 : 1500})}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                  >
                    <option value="community">Community Partner</option>
                    <option value="influencer">Influencer</option>
                    <option value="student">Student Partner</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Commission Rate (₦)</label>
                  <input
                    type="number"
                    value={newPartner.commission_rate}
                    onChange={(e) => setNewPartner({...newPartner, commission_rate: parseInt(e.target.value)})}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Password</label>
                  <input
                    type="password"
                    value={newPartner.password}
                    onChange={(e) => setNewPartner({...newPartner, password: e.target.value})}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-[#e2e2e8] focus:outline-none focus:border-[#12E6F3]"
                  />
                </div>
                
                <div className="flex items-center gap-3 pt-4 border-t border-[#1f2229]">
                  <button
                    onClick={handleAddPartner}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#12E6F3] text-[#070B12] rounded-lg font-medium hover:bg-[#12E6F3]/90 transition-colors"
                  >
                    <Plus className="h-4 w-4" />
                    Create Partner
                  </button>
                  <button
                    onClick={() => setShowAddPartnerModal(false)}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#070B12] text-[#e2e2e8] border border-[#1f2229] rounded-lg font-medium hover:bg-[#0c0e12] transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}