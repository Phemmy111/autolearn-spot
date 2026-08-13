"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Plus, Edit, Trash2, FileText, X, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminAnnouncementsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    text: '',
    ctaText: '',
    ctaLink: '',
    startDate: '',
    endDate: '',
    enabled: true,
    displayPosition: 'top',
    displayType: 'banner',
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/content/announcements');
      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
      } else {
        setError('Failed to fetch items');
      }
    } catch (e) {
      setError('Failed to fetch items');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    try {
      const url = editingItem
        ? '/api/admin/content/announcements'
        : '/api/admin/content/announcements';
      const method = editingItem ? 'PUT' : 'POST';

      const body = editingItem
        ? { ...formData, id: editingItem.id }
        : formData;

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setShowModal(false);
        setEditingItem(null);
        setFormData({
          text: '',
          ctaText: '',
          ctaLink: '',
          startDate: '',
          endDate: '',
          enabled: true,
          displayPosition: 'top',
          displayType: 'banner',
        });
        fetchItems();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save item');
      }
    } catch (e) {
      setError('Failed to save item');
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      text: item.text,
      ctaText: item.cta_text,
      ctaLink: item.cta_link,
      startDate: item.start_date ? item.start_date.split('T')[0] : '',
      endDate: item.end_date ? item.end_date.split('T')[0] : '',
      enabled: item.enabled,
      displayPosition: item.display_position,
      displayType: item.display_type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this announcement?')) return;

    try {
      const res = await fetch(`/api/admin/content/announcements?id=${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchItems();
      } else {
        setError('Failed to delete item');
      }
    } catch (e) {
      setError('Failed to delete item');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0a0c10] flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#00f0ff] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0c10]">
      {/* Header */}
      <div className="border-b border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/content" className="text-[#b9cacb] hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Announcements</h1>
                <p className="text-sm text-[#b9cacb]">Manage website announcements</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  text: '',
                  ctaText: '',
                  ctaLink: '',
                  startDate: '',
                  endDate: '',
                  enabled: true,
                  displayPosition: 'top',
                  displayType: 'banner',
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#00f0ff] text-[#00363a] rounded-lg font-medium hover:bg-[#00f0ff]/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Announcement
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Status Messages */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg mb-6">
            <AlertCircle className="h-5 w-5 text-red-400" />
            <p className="text-sm text-red-400">{error}</p>
          </div>
        )}
        {success && (
          <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg mb-6">
            <CheckCircle className="h-5 w-5 text-green-400" />
            <p className="text-sm text-green-400">Announcement saved successfully</p>
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-[#00f0ff]" />
                  <span className={`text-xs px-2 py-1 rounded-full ${item.display_type === 'modal' ? 'bg-purple-500/10 text-purple-400' : item.display_type === 'strip' ? 'bg-blue-500/10 text-blue-400' : 'bg-green-500/10 text-green-400'}`}>
                    {item.display_type}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${item.enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {item.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <h3 className="text-lg font-semibold text-white mb-2 line-clamp-2">{item.text}</h3>
              {item.cta_text && (
                <p className="text-sm text-[#b9cacb] mb-4">CTA: {item.cta_text}</p>
              )}
              <div className="space-y-2 mb-4">
                <p className="text-xs text-[#5d5f63]">Position: {item.display_position}</p>
                {(item.start_date || item.end_date) && (
                  <p className="text-xs text-[#5d5f63]">
                    {item.start_date && `Start: ${item.start_date.split('T')[0]}`}
                    {item.start_date && item.end_date && ' | '}
                    {item.end_date && `End: ${item.end_date.split('T')[0]}`}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(item)}
                  className="p-2 hover:bg-[#00f0ff]/10 rounded-lg transition-colors text-[#b9cacb] hover:text-[#00f0ff]"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(item.id)}
                  className="p-2 hover:bg-red-500/10 rounded-lg transition-colors text-[#b9cacb] hover:text-red-400"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-[#b9cacb]">
            <FileText className="h-12 w-12 mx-auto mb-4 text-[#5d5f63]" />
            <p>No announcements yet</p>
            <p className="text-sm mt-2">Click "Add Announcement" to create your first announcement</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit Announcement' : 'Add Announcement'}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-2 hover:bg-[#070B12] rounded-lg transition-colors text-[#b9cacb] hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Announcement Text *</label>
                <textarea
                  value={formData.text}
                  onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff] resize-none"
                  required
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">CTA Text</label>
                  <input
                    type="text"
                    value={formData.ctaText}
                    onChange={(e) => setFormData({ ...formData, ctaText: e.target.value })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">CTA Link</label>
                  <input
                    type="url"
                    value={formData.ctaLink}
                    onChange={(e) => setFormData({ ...formData, ctaLink: e.target.value })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                    placeholder="https://..."
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">End Date</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Display Position</label>
                  <select
                    value={formData.displayPosition}
                    onChange={(e) => setFormData({ ...formData, displayPosition: e.target.value })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    <option value="top">Top</option>
                    <option value="bottom">Bottom</option>
                    <option value="hero">Hero</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Display Type</label>
                  <select
                    value={formData.displayType}
                    onChange={(e) => setFormData({ ...formData, displayType: e.target.value })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  >
                    <option value="banner">Banner</option>
                    <option value="modal">Modal</option>
                    <option value="strip">Strip</option>
                  </select>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.enabled}
                    onChange={(e) => setFormData({ ...formData, enabled: e.target.checked })}
                    className="w-4 h-4 rounded border-[#1f2229] bg-[#070B12] text-[#00f0ff] focus:ring-[#00f0ff]"
                  />
                  <span className="text-sm text-[#b9cacb]">Enabled</span>
                </label>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#1f2229]">
                <button
                  type="submit"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-[#00f0ff] text-[#00363a] rounded-lg font-medium hover:bg-[#00f0ff]/90 transition-colors"
                >
                  {editingItem ? 'Update' : 'Add'} Announcement
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 bg-[#070B12] text-white border border-[#1f2229] rounded-lg font-medium hover:bg-[#0c0e12] transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}