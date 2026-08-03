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
      const res = await fetch('/api/admin/partners', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPartner)
      });
      
      if (res.ok) {
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
      } else {
        alert('Failed to add partner');
      }
    } catch (e) {
      console.error(e);
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
        alert('Marketing material uploaded successfully');
      } else {
        alert('Failed to upload marketing material');
      }
    } catch (e) {
      console.error(e);
      alert('Failed to upload marketing material');
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

  // Only show pending applications by default
  const displayApplications = statusFilter === 'all' 
    ? filteredApplications.filter(app => app.status === 'pending')
    : filteredApplications;

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
            {/* Pending Applications */}
            <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
              <div className="flex items-center justify-between p-4 border-b border-[#1f2229]">
                <h2 className="text-lg font-semibold text-[#e2e2e8]">Pending Applications</h2>
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

            {/* Active Partners */}
            <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
              <div className="p-4 border-b border-[#1f2229]">
                <h2 className="text-lg font-semibold text-[#e2e2e8]">Active Partners</h2>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[#0c0e12]">
                    <tr>
                      <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Passport</th>
                      <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Name</th>
                      <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Email</th>
                      <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Tier</th>
                      <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Referrals</th>
                      <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Commissions</th>
                      <th className="text-left p-4 text-xs font-medium text-[#b9cacb] uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {partners.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="p-8 text-center text-[#b9cacb]">No active partners</td>
                      </tr>
                    ) : (
                      partners.map((p) => (
                        <tr key={p.id} className="border-t border-[#1f2229] hover:bg-[#0c0e12]/50 transition-colors">
                          <td className="p-4">
                            <div className="h-10 w-10 rounded-full bg-[#1f2229] flex items-center justify-center text-[#b9cacb] text-xs">
                              {p.user_name?.charAt(0) || '?'}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-[#e2e2e8]">{p.user_name}</td>
                          <td className="p-4 text-sm text-[#b9cacb]">{p.user_email}</td>
                          <td className="p-4 text-sm text-[#e2e2e8] capitalize">{p.partner_type}</td>
                          <td className="p-4 text-sm text-[#e2e2e8]">{p.total_referrals || 0}</td>
                          <td className="p-4 text-sm text-[#12E6F3]">₦{p.total_earned || 0}</td>
                          <td className="p-4">
                            <span className="px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                              Active
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
            
            <div className="p-8 text-center text-[#b9cacb]">
              <Shield className="h-12 w-12 mx-auto mb-4 text-[#12E6F3]" />
              <p>Upload marketing materials here</p>
              <p className="text-sm mt-2">Flyers, videos, images, reels, PDF, scripts, captions</p>
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

        {/* Analytics Tab */}
        {activeTab === 'analytics' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2229]">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Analytics</h2>
            </div>
            
            <div className="p-8 text-center text-[#b9cacb]">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-[#12E6F3]" />
              <p>Analytics dashboard coming soon</p>
              <p className="text-sm mt-2">Total referrals, conversions, revenue, commission tracking</p>
            </div>
          </div>
        )}

        {/* Settings Tab */}
        {activeTab === 'settings' && (
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl overflow-hidden">
            <div className="p-4 border-b border-[#1f2229]">
              <h2 className="text-lg font-semibold text-[#e2e2e8]">Settings</h2>
            </div>
            
            <div className="p-8 text-center text-[#b9cacb]">
              <Settings className="h-12 w-12 mx-auto mb-4 text-[#12E6F3]" />
              <p>Settings configuration coming soon</p>
              <p className="text-sm mt-2">Theme customization, commission rates, notification settings</p>
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