'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Download,
  Copy,
  Check,
  Trash2,
  FileText,
  Image as ImageIcon,
  Video,
  FileCode,
  Share2,
  Sparkles,
  ExternalLink,
  Eye,
  Loader2,
  X,
  UploadCloud,
  CheckCircle2,
  BookOpen,
  Pencil
} from 'lucide-react';

interface Product {
  id: string;
  title: string;
  slug: string;
  thumbnail_url?: string;
  price?: number;
  affiliate_enabled?: boolean;
  affiliate_commission_rate?: number;
}

interface MarketingResource {
  id: string;
  name: string;
  type: string;
  category: string;
  description: string;
  url: string;
  download_count: number;
  created_at: string;
}

export default function AuthorMarketingPage() {
  const { userId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [resources, setResources] = useState<MarketingResource[]>([]);
  
  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [courseFilter, setCourseFilter] = useState('ALL');
  
  // Modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [previewMaterial, setPreviewMaterial] = useState<MarketingResource | null>(null);

  // New Resource Form
  const [formData, setFormData] = useState({
    resource_name: '',
    resource_type: 'flyer',
    category: 'general',
    description: '',
    resource_url: '',
  });

  const resetForm = () => {
    setFormData({
      resource_name: '',
      resource_type: 'flyer',
      category: 'general',
      description: '',
      resource_url: '',
    });
    setEditingId(null);
  };

  useEffect(() => {
    if (userId) {
      fetchMarketingData();
    }
  }, [userId]);

  const fetchMarketingData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/author/marketing');
      const data = await res.json();
      if (data.success) {
        setProducts(data.products || []);
        setResources(data.resources || []);
      }
    } catch (err) {
      console.error('Failed to fetch marketing data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingFile(true);
      const form = new FormData();
      form.append('file', file);

      const res = await fetch('/api/author/marketing/upload', {
        method: 'POST',
        body: form,
      });

      const data = await res.json();
      if (data.success && data.url) {
        setFormData((prev) => ({
          ...prev,
          resource_url: data.url,
          resource_name: prev.resource_name || file.name.replace(/\.[^/.]+$/, ''),
        }));
      } else {
        alert(data.error || 'Failed to upload file');
      }
    } catch (err) {
      console.error('File upload error:', err);
      alert('Network error while uploading file');
    } finally {
      setUploadingFile(false);
    }
  };

  const handleEditClick = (item: MarketingResource) => {
    setEditingId(item.id);
    setFormData({
      resource_name: item.name,
      resource_type: item.type || 'flyer',
      category: item.category || 'general',
      description: item.description || '',
      resource_url: item.url || '',
    });
    setShowAddModal(true);
  };

  const handleSaveResource = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resource_name.trim()) {
      alert('Please provide a title/name for the material');
      return;
    }

    try {
      setSaving(true);
      const method = editingId ? 'PATCH' : 'POST';
      const bodyPayload = editingId ? { ...formData, id: editingId } : formData;
      
      const res = await fetch('/api/author/marketing', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload),
      });

      const data = await res.json();
      if (data.success && data.resource) {
        if (editingId) {
          setResources((prev) => prev.map(r => r.id === editingId ? data.resource : r));
        } else {
          setResources((prev) => [data.resource, ...prev]);
        }
        setShowAddModal(false);
        resetForm();
      } else {
        alert(data.error || 'Failed to save material');
      }
    } catch (err) {
      console.error('Save resource error:', err);
      alert('Network error while saving');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteResource = async (id: string) => {
    if (!confirm('Are you sure you want to delete this marketing material?')) return;

    try {
      const res = await fetch(`/api/author/marketing?id=${id}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setResources((prev) => prev.filter((r) => r.id !== id));
        if (previewMaterial?.id === id) {
          setPreviewMaterial(null);
        }
      } else {
        alert(data.error || 'Failed to delete material');
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('Network error while deleting');
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Filter logic
  const filteredResources = resources.filter((item) => {
    // Search
    const q = searchQuery.toLowerCase();
    const matchesSearch =
      item.name.toLowerCase().includes(q) ||
      item.description.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q);

    // Type
    const matchesType =
      typeFilter === 'ALL' ||
      item.type?.toLowerCase() === typeFilter.toLowerCase();

    // Course
    const matchesCourse =
      courseFilter === 'ALL' ||
      item.category.toLowerCase() === courseFilter.toLowerCase() ||
      item.category.toLowerCase() === `course:${courseFilter}`.toLowerCase();

    return matchesSearch && matchesType && matchesCourse;
  });

  const getResourceIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case 'banner':
      case 'flyer':
      case 'image':
        return <ImageIcon className="w-5 h-5 text-sky-500" />;
      case 'video':
        return <Video className="w-5 h-5 text-purple-500" />;
      case 'copy':
      case 'swipe':
        return <FileText className="w-5 h-5 text-emerald-500" />;
      case 'guide':
      case 'pdf':
        return <BookOpen className="w-5 h-5 text-amber-500" />;
      default:
        return <Megaphone className="w-5 h-5 text-sky-500" />;
    }
  };

  const totalDownloads = resources.reduce((acc, curr) => acc + (curr.download_count || 0), 0);

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border pb-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl border border-sky-500/20">
              <Megaphone className="w-6 h-6" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-brand-text">
              Affiliate Marketing Kit
            </h1>
          </div>
          <p className="text-sm sm:text-base text-brand-text/70 max-w-2xl">
            Equip your affiliates with high-converting flyers, banners, social media copy, video ads, and email swipes to accelerate course sales.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-semibold text-sm transition-all shadow-sm hover:shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add Marketing Material
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--card)] border border-brand-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-text/60">
              Total Materials
            </span>
            <div className="p-2 bg-sky-500/10 text-sky-600 rounded-lg">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-brand-text mt-2">
            {resources.length}
          </p>
          <span className="text-xs text-brand-text/50">Available for affiliates</span>
        </div>

        <div className="bg-[var(--card)] border border-brand-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-text/60">
              Affiliate Downloads
            </span>
            <div className="p-2 bg-emerald-500/10 text-emerald-600 rounded-lg">
              <Download className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-emerald-600 mt-2">
            {totalDownloads}
          </p>
          <span className="text-xs text-brand-text/50">Total times assets accessed</span>
        </div>

        <div className="bg-[var(--card)] border border-brand-border rounded-2xl p-5 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-brand-text/60">
              Promoted Courses
            </span>
            <div className="p-2 bg-purple-500/10 text-purple-600 rounded-lg">
              <Share2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-bold text-brand-text mt-2">
            {products.filter((p) => p.affiliate_enabled !== false).length}
          </p>
          <span className="text-xs text-brand-text/50">Active affiliate-enabled courses</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-[var(--card)] border border-brand-border rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search input */}
          <div className="relative md:col-span-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-text/40" />
            <input
              type="text"
              placeholder="Search materials or copy..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-brand-bg/60 border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-sky-500 transition-colors"
            />
          </div>

          {/* Course filter */}
          <div className="md:col-span-1">
            <select
              value={courseFilter}
              onChange={(e) => setCourseFilter(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-brand-bg/60 border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-sky-500 transition-colors"
            >
              <option value="ALL">All Associated Courses</option>
              <option value="general">General / Platform</option>
              {products.map((p) => (
                <option key={p.id} value={p.title}>
                  Course: {p.title}
                </option>
              ))}
            </select>
          </div>

          {/* Type filter tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 md:col-span-1">
            {[
              { id: 'ALL', label: 'All' },
              { id: 'flyer', label: 'Flyers' },
              { id: 'banner', label: 'Banners' },
              { id: 'copy', label: 'Copy' },
              { id: 'video', label: 'Video' },
              { id: 'guide', label: 'Guides' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id)}
                className={`px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                  typeFilter === tab.id
                    ? 'bg-sky-600 text-white shadow-xs'
                    : 'bg-brand-bg/40 hover:bg-brand-bg text-brand-text/70 border border-brand-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Materials List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-brand-text/50">
          <Loader2 className="w-8 h-8 animate-spin mb-3 text-sky-600" />
          <p className="text-sm">Loading marketing materials...</p>
        </div>
      ) : filteredResources.length === 0 ? (
        <div className="bg-[var(--card)] border border-brand-border rounded-3xl p-12 text-center max-w-xl mx-auto shadow-xs">
          <div className="w-16 h-16 bg-sky-500/10 text-sky-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-sky-500/20">
            <Megaphone className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-brand-text mb-2">No Marketing Materials Found</h3>
          <p className="text-sm text-brand-text/60 mb-6">
            Upload promotional banners, flyers, promotional scripts, or course demo videos to help your affiliates drive more enrollments.
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-medium text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add First Material
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredResources.map((item) => (
            <div
              key={item.id}
              className="bg-[var(--card)] border border-brand-border hover:border-sky-500/50 rounded-2xl p-5 flex flex-col justify-between transition-all duration-200 shadow-xs hover:shadow-md group"
            >
              <div>
                {/* Top badges */}
                <div className="flex items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-brand-bg/80 border border-brand-border rounded-lg">
                      {getResourceIcon(item.type)}
                    </div>
                    <div>
                      <span className="px-2 py-0.5 bg-sky-500/10 text-sky-600 text-[11px] font-bold uppercase rounded-md tracking-wider">
                        {item.type || 'MATERIAL'}
                      </span>
                    </div>
                  </div>

                  <span className="text-[11px] text-brand-text/50 font-medium truncate max-w-[130px]" title={item.category}>
                    {item.category === 'general' ? '🌐 General' : `🎓 ${item.category}`}
                  </span>
                </div>

                {/* Name */}
                <h3 className="text-base font-bold text-brand-text mb-2 group-hover:text-sky-600 transition-colors line-clamp-1" title={item.name}>
                  {item.name}
                </h3>

                {/* Media preview */}
                {item.url && (
                  <div
                    onClick={() => setPreviewMaterial(item)}
                    className="h-36 w-full rounded-xl overflow-hidden bg-brand-bg/80 border border-brand-border relative mb-3 cursor-pointer group-hover:opacity-95 flex items-center justify-center"
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
                         <BookOpen className="w-8 h-8 mb-2" />
                         <span className="text-xs font-semibold">PDF Document</span>
                       </div>
                    ) : (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                        loading="lazy"
                        onError={(e) => {
                          // Fallback if image fails to load
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement?.classList.add('bg-brand-bg');
                        }}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-semibold gap-1.5">
                      <Eye className="w-4 h-4" /> Preview
                    </div>
                  </div>
                )}

                {/* Description / Copy snippet */}
                {item.description && (
                  <div className="relative bg-brand-bg/60 border border-brand-border rounded-xl p-3 mb-4">
                    <p className="text-xs text-brand-text/70 line-clamp-3 whitespace-pre-wrap font-sans">
                      {item.description}
                    </p>
                    <button
                      onClick={() => copyToClipboard(item.description, item.id)}
                      className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-sky-600 hover:text-sky-500 transition-colors"
                    >
                      {copiedId === item.id ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-500" /> Copied to Clipboard!
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

              {/* Action buttons */}
              <div className="pt-3 border-t border-brand-border flex items-center justify-between gap-2 mt-2">
                <span className="text-xs text-brand-text/50 font-medium">
                  {item.download_count || 0} downloads
                </span>

                <div className="flex items-center gap-2">
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-600 border border-sky-500/20 transition-colors text-xs font-semibold flex items-center gap-1.5"
                      title="Open / Download Asset"
                    >
                      <Download className="w-3.5 h-3.5" /> Download
                    </a>
                  )}

                  <button
                    onClick={() => handleEditClick(item)}
                    className="p-2 rounded-lg hover:bg-sky-500/10 text-brand-text/40 hover:text-sky-600 transition-colors"
                    title="Edit Material"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>

                  <button
                    onClick={() => handleDeleteResource(item.id)}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-brand-text/40 hover:text-red-500 transition-colors"
                    title="Delete Material"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Material Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-[var(--card)] border border-brand-border rounded-3xl max-w-xl w-full p-6 sm:p-8 space-y-6 shadow-2xl relative my-8">
            <div className="flex items-center justify-between border-b border-brand-border pb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-sky-500/10 text-sky-600 rounded-xl">
                  <Megaphone className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-brand-text">
                    {editingId ? 'Edit Marketing Material' : 'Add Marketing Material'}
                  </h3>
                  <p className="text-xs text-brand-text/60">
                    {editingId ? 'Update your promotional asset' : 'Provide assets and copy for affiliates'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  resetForm();
                }}
                className="p-2 rounded-xl text-brand-text/40 hover:text-brand-text hover:bg-brand-bg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveResource} className="space-y-4">
              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-brand-text/80 mb-1.5">
                  Material Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Masterclass Promo Banner (1080x1080)"
                  value={formData.resource_name}
                  onChange={(e) => setFormData({ ...formData, resource_name: e.target.value })}
                  className="w-full px-4 py-2.5 bg-brand-bg/60 border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-sky-500"
                />
              </div>

              {/* Row: Product & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-text/80 mb-1.5">
                    Associated Product / Course
                  </label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-brand-bg/60 border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-sky-500"
                  >
                    <option value="general">General / All Courses</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.title}>
                        {p.title}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-brand-text/80 mb-1.5">
                    Material Type
                  </label>
                  <select
                    value={formData.resource_type}
                    onChange={(e) => setFormData({ ...formData, resource_type: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-brand-bg/60 border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-sky-500"
                  >
                    <option value="flyer">Flyer / Poster</option>
                    <option value="banner">Social Banner / Ad Graphic</option>
                    <option value="copy">Email Swipe / Promo Script</option>
                    <option value="video">Video Preview / Ad Clip</option>
                    <option value="guide">PDF Guide / Outline</option>
                  </select>
                </div>
              </div>

              {/* File Upload / Asset Link */}
              <div>
                <label className="block text-xs font-semibold text-brand-text/80 mb-1.5">
                  Asset File or Direct Media URL
                </label>

                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    <label className="flex-1 cursor-pointer group">
                      <div className="border-2 border-dashed border-brand-border hover:border-sky-500/60 rounded-xl p-4 text-center bg-brand-bg/40 hover:bg-brand-bg/70 transition-all flex flex-col items-center justify-center gap-1.5 min-h-[100px]">
                        {uploadingFile ? (
                          <>
                            <Loader2 className="w-5 h-5 text-sky-600 animate-spin" />
                            <span className="text-xs text-brand-text/70">Uploading asset...</span>
                          </>
                        ) : formData.resource_url ? (
                          <>
                            <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                            <span className="text-xs text-emerald-600 font-bold">Asset Attached!</span>
                            <span className="text-[10px] text-brand-text/50 truncate max-w-xs">{formData.resource_url}</span>
                            <div className="mt-2 text-[10px] font-semibold text-sky-500 bg-sky-500/10 px-3 py-1 rounded-full group-hover:bg-sky-500/20 transition-colors">
                              Click to Replace File
                            </div>
                          </>
                        ) : (
                          <>
                            <UploadCloud className="w-6 h-6 text-sky-600 mb-1" />
                            <span className="text-xs font-medium text-brand-text">Click to upload banner, flyer, or video</span>
                            <span className="text-[10px] text-brand-text/50">PNG, JPG, MP4, PDF up to 10MB</span>
                          </>
                        )}
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        onChange={handleFileUpload}
                        disabled={uploadingFile}
                        accept="image/*,video/*,application/pdf"
                      />
                    </label>
                    {formData.resource_url && !uploadingFile && (
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, resource_url: '' })}
                        className="p-3 text-red-500 bg-red-500/10 hover:bg-red-500/20 rounded-xl transition-colors shrink-0"
                        title="Remove Asset"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>

                  <input
                    type="url"
                    placeholder="Or paste direct external asset link (e.g. Google Drive, YouTube, Cloudinary)"
                    value={formData.resource_url}
                    onChange={(e) => setFormData({ ...formData, resource_url: e.target.value })}
                    className="w-full px-4 py-2 bg-brand-bg/60 border border-brand-border rounded-xl text-xs text-brand-text focus:outline-none focus:border-sky-500"
                  />
                </div>
              </div>

              {/* Promotional Copy / Description */}
              <div>
                <label className="block text-xs font-semibold text-brand-text/80 mb-1.5">
                  Promotional Copy / Captions / Instructions
                </label>
                <textarea
                  rows={4}
                  placeholder="Write the recommended social media caption, WhatsApp broadcast, or email copy for your affiliates to copy and send..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-4 py-2.5 bg-brand-bg/60 border border-brand-border rounded-xl text-sm text-brand-text focus:outline-none focus:border-sky-500 resize-none font-sans"
                />
              </div>

              {/* Submit Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-border">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    resetForm();
                  }}
                  className="px-4 py-2.5 rounded-xl border border-brand-border text-sm font-medium text-brand-text/70 hover:bg-brand-bg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving || uploadingFile}
                  className="px-6 py-2.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-sm font-semibold transition-all disabled:opacity-50 flex items-center gap-2 shadow-xs"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" /> Saving...
                    </>
                  ) : (
                    editingId ? 'Save Changes' : 'Publish for Affiliates'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Preview Modal */}
      {previewMaterial && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4">
          <div className="bg-[var(--card)] border border-brand-border rounded-3xl max-w-2xl w-full p-6 space-y-4 shadow-2xl relative">
            <div className="flex items-center justify-between border-b border-brand-border pb-3">
              <h3 className="text-base font-bold text-brand-text truncate max-w-md">
                {previewMaterial.name}
              </h3>
              <button
                onClick={() => setPreviewMaterial(null)}
                className="p-1.5 rounded-lg text-brand-text/40 hover:text-brand-text hover:bg-brand-bg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {previewMaterial.url && (
              <div className="max-h-[60vh] overflow-hidden rounded-xl bg-black/40 flex items-center justify-center">
                {previewMaterial.type === 'video' || previewMaterial.url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                  <video
                    src={previewMaterial.url}
                    controls
                    autoPlay
                    className="max-h-[55vh] w-auto object-contain rounded-lg"
                  />
                ) : previewMaterial.type === 'guide' || previewMaterial.type === 'pdf' || previewMaterial.url.match(/\.(pdf)$/i) ? (
                  <div className="flex flex-col items-center justify-center p-12 text-brand-text/50">
                    <BookOpen className="w-16 h-16 mb-4" />
                    <span className="text-sm font-semibold">PDF Document</span>
                    <a href={previewMaterial.url} target="_blank" rel="noreferrer" className="mt-4 text-sky-500 hover:underline">Open Document</a>
                  </div>
                ) : (
                  <img
                    src={previewMaterial.url}
                    alt={previewMaterial.name}
                    className="max-h-[55vh] w-auto object-contain rounded-lg"
                  />
                )}
              </div>
            )}

            {previewMaterial.description && (
              <div className="bg-brand-bg/60 border border-brand-border rounded-xl p-4">
                <p className="text-xs font-semibold text-brand-text/60 mb-1">Promotional Text:</p>
                <p className="text-sm text-brand-text/80 whitespace-pre-wrap max-h-40 overflow-y-auto">
                  {previewMaterial.description}
                </p>
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                onClick={() => setPreviewMaterial(null)}
                className="px-4 py-2 rounded-xl border border-brand-border text-xs font-semibold text-brand-text/70"
              >
                Close
              </button>
              {previewMaterial.url && (
                <a
                  href={previewMaterial.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white text-xs font-semibold flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" /> Download Full Asset
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
