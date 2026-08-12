"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Plus, Edit, Trash2, MessageSquare, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminTestimonialsPage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    studentName: '',
    cohort: '',
    course: '',
    screenshotUrl: '',
    caption: '',
    featured: false,
    enabled: true,
    displayOrder: 0,
  });

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/content/testimonials');
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
        ? '/api/admin/content/testimonials'
        : '/api/admin/content/testimonials';
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
          studentName: '',
          cohort: '',
          course: '',
          screenshotUrl: '',
          caption: '',
          featured: false,
          enabled: true,
          displayOrder: 0,
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
      studentName: item.student_name,
      cohort: item.cohort,
      course: item.course,
      screenshotUrl: item.screenshot_url,
      caption: item.caption,
      featured: item.featured,
      enabled: item.enabled,
      displayOrder: item.display_order,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this testimonial?')) return;

    try {
      const res = await fetch(`/api/admin/content/testimonials?id=${id}`, {
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
                <h1 className="text-xl font-bold text-white">Testimonials</h1>
                <p className="text-sm text-[#b9cacb]">Manage student testimonials (WhatsApp screenshots)</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  studentName: '',
                  cohort: '',
                  course: '',
                  screenshotUrl: '',
                  caption: '',
                  featured: false,
                  enabled: true,
                  displayOrder: 0,
                });
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#00f0ff] text-[#00363a] rounded-lg font-medium hover:bg-[#00f0ff]/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Testimonial
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
            <p className="text-sm text-green-400">Testimonial saved successfully</p>
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-[#00f0ff]" />
                  <span className={`text-xs px-2 py-1 rounded-full ${item.featured ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
                    {item.featured ? 'Featured' : 'Standard'}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${item.enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {item.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              {item.student_name && (
                <h3 className="text-lg font-semibold text-white mb-1">{item.student_name}</h3>
              )}
              {(item.cohort || item.course) && (
                <p className="text-xs text-[#b9cacb] mb-2">
                  {item.cohort && `${item.cohort} `}
                  {item.course && `• ${item.course}`}
                </p>
              )}
              {item.caption && (
                <p className="text-sm text-[#b9cacb] mb-4 line-clamp-2">{item.caption}</p>
              )}
              {item.screenshot_url && (
                <div className="mb-4">
                  <img
                    src={item.screenshot_url}
                    alt="Testimonial screenshot"
                    className="w-full h-32 object-cover rounded-lg"
                  />
                </div>
              )}
              <div className="flex items-center justify-between">
                <span className="text-xs text-[#5d5f63]">Order: {item.display_order}</span>
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
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12 text-[#b9cacb]">
            <MessageSquare className="h-12 w-12 mx-auto mb-4 text-[#5d5f63]" />
            <p>No testimonials yet</p>
            <p className="text-sm mt-2">Click "Add Testimonial" to add your first student testimonial</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit Testimonial' : 'Add Testimonial'}
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
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Student Name (Optional)</label>
                <input
                  type="text"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Cohort (Optional)</label>
                  <input
                    type="text"
                    value={formData.cohort}
                    onChange={(e) => setFormData({ ...formData, cohort: e.target.value })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Course (Optional)</label>
                  <input
                    type="text"
                    value={formData.course}
                    onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Screenshot URL *</label>
                <input
                  type="url"
                  value={formData.screenshotUrl}
                  onChange={(e) => setFormData({ ...formData, screenshotUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="https://..."
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Caption (Optional)</label>
                <textarea
                  value={formData.caption}
                  onChange={(e) => setFormData({ ...formData, caption: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Display Order</label>
                <input
                  type="number"
                  value={formData.displayOrder}
                  onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => setFormData({ ...formData, featured: e.target.checked })}
                    className="w-4 h-4 rounded border-[#1f2229] bg-[#070B12] text-[#00f0ff] focus:ring-[#00f0ff]"
                  />
                  <span className="text-sm text-[#b9cacb]">Featured</span>
                </label>
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
                  {editingItem ? 'Update' : 'Add'} Testimonial
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