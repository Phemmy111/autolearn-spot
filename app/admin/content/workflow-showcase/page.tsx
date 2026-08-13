"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, Plus, Edit, Trash2, Video, Upload, X, CheckCircle, AlertCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminWorkflowShowcasePage() {
  const [items, setItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    videoUrl: '',
    thumbnailUrl: '',
    posterUrl: '',
    featured: false,
    enabled: true,
    displayOrder: 0,
    mediaType: 'video',
  });
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [posterFile, setPosterFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const res = await fetch('/api/admin/content/workflow-showcase');
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
    setIsUploading(true);

    try {
      const formDataAPI = new FormData();
      formDataAPI.append('title', formData.title);
      formDataAPI.append('description', formData.description);
      formDataAPI.append('featured', String(formData.featured));
      formDataAPI.append('enabled', String(formData.enabled));
      formDataAPI.append('displayOrder', String(formData.displayOrder));
      formDataAPI.append('mediaType', formData.mediaType);
      
      if (mediaFile) {
        formDataAPI.append('mediaFile', mediaFile);
      } else if (formData.videoUrl) {
        formDataAPI.append('videoUrl', formData.videoUrl);
      }

      if (thumbnailFile) {
        formDataAPI.append('thumbnailFile', thumbnailFile);
      } else if (formData.thumbnailUrl) {
        formDataAPI.append('thumbnailUrl', formData.thumbnailUrl);
      }

      if (posterFile) {
        formDataAPI.append('posterFile', posterFile);
      } else if (formData.posterUrl) {
        formDataAPI.append('posterUrl', formData.posterUrl);
      }

      if (editingItem) {
        formDataAPI.append('id', editingItem.id);
      }

      const url = editingItem
        ? '/api/admin/content/workflow-showcase'
        : '/api/admin/content/workflow-showcase';
      const method = editingItem ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        body: formDataAPI,
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        setShowModal(false);
        setEditingItem(null);
        setFormData({
          title: '',
          description: '',
          videoUrl: '',
          thumbnailUrl: '',
          posterUrl: '',
          featured: false,
          enabled: true,
          displayOrder: 0,
          mediaType: 'video',
        });
        setMediaFile(null);
        setThumbnailFile(null);
        setPosterFile(null);
        fetchItems();
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save item');
      }
    } catch (e) {
      setError('Failed to save item');
    } finally {
      setIsUploading(false);
    }
  };

  const handleEdit = (item: any) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      description: item.description,
      videoUrl: item.video_url,
      thumbnailUrl: item.thumbnail_url,
      posterUrl: item.poster_url,
      featured: item.featured,
      enabled: item.enabled,
      displayOrder: item.display_order,
      mediaType: item.media_type || 'video',
    });
    setMediaFile(null);
    setThumbnailFile(null);
    setPosterFile(null);
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;

    try {
      const res = await fetch(`/api/admin/content/workflow-showcase?id=${id}`, {
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
                <h1 className="text-xl font-bold text-white">Workflow Showcase</h1>
                <p className="text-sm text-[#b9cacb]">Manage workflow showcase items</p>
              </div>
            </div>
            <button
              onClick={() => {
                setEditingItem(null);
                setFormData({
                  title: '',
                  description: '',
                  videoUrl: '',
                  thumbnailUrl: '',
                  posterUrl: '',
                  featured: false,
                  enabled: true,
                  displayOrder: 0,
                  mediaType: 'video',
                });
                setMediaFile(null);
                setThumbnailFile(null);
                setPosterFile(null);
                setShowModal(true);
              }}
              className="flex items-center gap-2 px-4 py-2 bg-[#00f0ff] text-[#00363a] rounded-lg font-medium hover:bg-[#00f0ff]/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Add Item
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
            <p className="text-sm text-green-400">Item saved successfully</p>
          </div>
        )}

        {/* Items Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <div key={item.id} className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-1 rounded-full ${item.media_type === 'video' ? 'bg-purple-500/10 text-purple-400' : 'bg-blue-500/10 text-blue-400'}`}>
                    {item.media_type === 'video' ? 'Video' : 'Image'}
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${item.featured ? 'bg-yellow-500/10 text-yellow-400' : 'bg-gray-500/10 text-gray-400'}`}>
                    {item.featured ? 'Featured' : 'Standard'}
                  </span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${item.enabled ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {item.enabled ? 'Active' : 'Inactive'}
                </span>
              </div>
              <div className="mb-4">
                {item.media_type === 'video' ? (
                  <video
                    src={item.video_url}
                    poster={item.poster_url}
                    className="w-full h-32 object-cover rounded-lg"
                    muted
                    controls
                  />
                ) : (
                  <img
                    src={item.video_url}
                    alt={item.title}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                )}
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">{item.title}</h3>
              <p className="text-sm text-[#b9cacb] mb-4 line-clamp-2">{item.description}</p>
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
            <Video className="h-12 w-12 mx-auto mb-4 text-[#5d5f63]" />
            <p>No workflow showcase items yet</p>
            <p className="text-sm mt-2">Click "Add Item" to create your first workflow showcase</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="bg-[#0c0e12] border border-[#1f2229] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[#1f2229] flex items-center justify-between">
              <h2 className="text-xl font-bold text-white">
                {editingItem ? 'Edit Item' : 'Add Workflow Item'}
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
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Media Type</label>
                <select
                  value={formData.mediaType}
                  onChange={(e) => setFormData({ ...formData, mediaType: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">
                  {formData.mediaType === 'video' ? 'Video File or URL' : 'Image File or URL'}
                </label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 px-4 py-3 bg-[#070B12] border border-[#1f2229] rounded-lg cursor-pointer hover:border-[#00f0ff] transition-colors">
                    <Upload className="h-4 w-4 text-[#b9cacb]" />
                    <span className="text-sm text-[#b9cacb]">
                      {mediaFile ? mediaFile.name : `Upload ${formData.mediaType === 'video' ? 'Video (MP4)' : 'Image (PNG/JPG)'}`}
                    </span>
                    <input
                      type="file"
                      accept={formData.mediaType === 'video' ? 'video/mp4,video/webm' : 'image/png,image/jpeg,image/jpg'}
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setMediaFile(file);
                          setFormData({ ...formData, videoUrl: '' });
                        }
                      }}
                      className="hidden"
                    />
                  </label>
                  {mediaFile && (
                    <div className="flex items-center justify-between p-2 bg-[#070B12] border border-[#1f2229] rounded">
                      <span className="text-xs text-[#b9cacb] truncate">{mediaFile.name}</span>
                      <button
                        type="button"
                        onClick={() => {
                          setMediaFile(null);
                          setFormData({ ...formData, videoUrl: '' });
                        }}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {!mediaFile && (
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => setFormData({ ...formData, videoUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                      placeholder="https://..."
                    />
                  )}
                </div>
              </div>
              {formData.mediaType === 'video' && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Thumbnail (Optional)</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 px-4 py-3 bg-[#070B12] border border-[#1f2229] rounded-lg cursor-pointer hover:border-[#00f0ff] transition-colors">
                        <Upload className="h-4 w-4 text-[#b9cacb]" />
                        <span className="text-sm text-[#b9cacb]">
                          {thumbnailFile ? thumbnailFile.name : 'Upload Thumbnail (PNG/JPG)'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setThumbnailFile(file);
                              setFormData({ ...formData, thumbnailUrl: '' });
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {thumbnailFile && (
                        <div className="flex items-center justify-between p-2 bg-[#070B12] border border-[#1f2229] rounded">
                          <span className="text-xs text-[#b9cacb] truncate">{thumbnailFile.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setThumbnailFile(null);
                              setFormData({ ...formData, thumbnailUrl: '' });
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {!thumbnailFile && (
                        <input
                          type="url"
                          value={formData.thumbnailUrl}
                          onChange={(e) => setFormData({ ...formData, thumbnailUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                          placeholder="https://..."
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Poster (Optional)</label>
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 px-4 py-3 bg-[#070B12] border border-[#1f2229] rounded-lg cursor-pointer hover:border-[#00f0ff] transition-colors">
                        <Upload className="h-4 w-4 text-[#b9cacb]" />
                        <span className="text-sm text-[#b9cacb]">
                          {posterFile ? posterFile.name : 'Upload Poster (PNG/JPG)'}
                        </span>
                        <input
                          type="file"
                          accept="image/png,image/jpeg,image/jpg,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              setPosterFile(file);
                              setFormData({ ...formData, posterUrl: '' });
                            }
                          }}
                          className="hidden"
                        />
                      </label>
                      {posterFile && (
                        <div className="flex items-center justify-between p-2 bg-[#070B12] border border-[#1f2229] rounded">
                          <span className="text-xs text-[#b9cacb] truncate">{posterFile.name}</span>
                          <button
                            type="button"
                            onClick={() => {
                              setPosterFile(null);
                              setFormData({ ...formData, posterUrl: '' });
                            }}
                            className="text-xs text-red-400 hover:text-red-300"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      {!posterFile && (
                        <input
                          type="url"
                          value={formData.posterUrl}
                          onChange={(e) => setFormData({ ...formData, posterUrl: e.target.value })}
                          className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                          placeholder="https://..."
                        />
                      )}
                    </div>
                  </div>
                </>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">Display Order</label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => setFormData({ ...formData, displayOrder: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
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
                  {editingItem ? 'Update' : 'Add'} Item
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