"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Save, Layout, Video, Image, PanelsTopLeft } from 'lucide-react';
import Link from 'next/link';

export default function AdminLandingSettingsPage() {
  const [settings, setSettings] = useState({
    headline: 'BUILD REAL AI AUTOMATIONS. GET CERTIFIED.',
    subheadline: 'Master n8n automation and build powerful AI-powered workflows without coding.',
    badge: '4 WEEK HANDS-ON TRAINING',
    primaryCtaText: 'Enroll Now',
    primaryCtaLink: '/enroll',
    secondaryCtaText: 'Watch Preview',
    secondaryCtaLink: '#',
    videoUrl: '',
    imageUrl: '',
    mediaType: 'workflow_panel',
    previewVideoUrl: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewVideoFile, setPreviewVideoFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/master-settings?category=hero');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ 
            ...prev, 
            ...data.settings,
            previewVideoUrl: data.settings.previewVideoUrl || ''
          }));
        }
      } else {
        setError('Failed to fetch settings');
      }
    } catch (e) {
      setError('Failed to fetch settings');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload files first if provided
      let uploadedVideoUrl = settings.videoUrl;
      let uploadedImageUrl = settings.imageUrl;

      if (videoFile) {
        const formData = new FormData();
        formData.append('videoFile', videoFile);
        
        const uploadRes = await fetch('/api/admin/landing-media', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedVideoUrl = uploadData.videoUrl;
        } else {
          throw new Error('Failed to upload video');
        }
      }

      if (imageFile) {
        const formData = new FormData();
        formData.append('imageFile', imageFile);
        
        const uploadRes = await fetch('/api/admin/landing-media', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          uploadedImageUrl = uploadData.imageUrl;
        } else {
          throw new Error('Failed to upload image');
        }
      }

      if (previewVideoFile) {
        const formData = new FormData();
        formData.append('previewVideoFile', previewVideoFile);
        
        const uploadRes = await fetch('/api/admin/landing-media', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          settings.previewVideoUrl = uploadData.previewVideoUrl;
        } else {
          throw new Error('Failed to upload preview video');
        }
      }

      // Update settings with uploaded URLs
      const updatedSettings = {
        ...settings,
        videoUrl: uploadedVideoUrl,
        imageUrl: uploadedImageUrl,
        previewVideoUrl: settings.previewVideoUrl,
      };

      const res = await fetch('/api/admin/master-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Clear file uploads after successful save
        setVideoFile(null);
        setImageFile(null);
        setPreviewVideoFile(null);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
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
              <Link href="/admin/settings" className="text-[#b9cacb] hover:text-white transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-white">Landing Page Settings</h1>
                <p className="text-sm text-[#b9cacb]">Configure hero section and landing page content</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSave} className="space-y-8">
          {/* Status Messages */}
          {error && (
            <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <p className="text-sm text-red-400">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <CheckCircle className="h-5 w-5 text-green-400" />
              <p className="text-sm text-green-400">Settings saved successfully</p>
            </div>
          )}

          {/* Hero Content */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Layout className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Hero Content</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Headline</label>
                <input
                  type="text"
                  value={settings.headline}
                  onChange={(e) => setSettings({ ...settings, headline: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Subheadline</label>
                <textarea
                  value={settings.subheadline}
                  onChange={(e) => setSettings({ ...settings, subheadline: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Badge Text</label>
                <input
                  type="text"
                  value={settings.badge}
                  onChange={(e) => setSettings({ ...settings, badge: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Layout className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Call-to-Action Buttons</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Primary CTA Text</label>
                <input
                  type="text"
                  value={settings.primaryCtaText}
                  onChange={(e) => setSettings({ ...settings, primaryCtaText: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Primary CTA Link</label>
                <input
                  type="text"
                  value={settings.primaryCtaLink}
                  onChange={(e) => setSettings({ ...settings, primaryCtaLink: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Secondary CTA Text</label>
                <input
                  type="text"
                  value={settings.secondaryCtaText}
                  onChange={(e) => setSettings({ ...settings, secondaryCtaText: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Secondary CTA Link</label>
                <input
                  type="text"
                  value={settings.secondaryCtaLink}
                  onChange={(e) => setSettings({ ...settings, secondaryCtaLink: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>
          </div>

          {/* Hero Media */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <PanelsTopLeft className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Hero Media</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Media Type</label>
                <select
                  value={settings.mediaType}
                  onChange={(e) => setSettings({ ...settings, mediaType: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                >
                  <option value="workflow_panel">N8n Workflow Panel</option>
                  <option value="video">Video</option>
                  <option value="image">Image</option>
                </select>
              </div>
              {settings.mediaType === 'video' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Video URL</label>
                    <input
                      type="url"
                      value={settings.videoUrl}
                      onChange={(e) => setSettings({ ...settings, videoUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Or Upload Video</label>
                    <label className="flex items-center gap-3 p-4 bg-[#070B12] border border-[#1f2229] rounded-lg cursor-pointer hover:border-[#00f0ff] transition-colors">
                      <Video className="h-5 w-5 text-[#00f0ff]" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{videoFile ? videoFile.name : 'Choose video file...'}</p>
                        <p className="text-xs text-[#b9cacb]">MP4, WebM, MOV (max 50MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>
              )}
              {settings.mediaType === 'image' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Image URL</label>
                    <input
                      type="url"
                      value={settings.imageUrl}
                      onChange={(e) => setSettings({ ...settings, imageUrl: e.target.value })}
                      className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                      placeholder="https://..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#b9cacb] mb-2">Or Upload Image</label>
                    <label className="flex items-center gap-3 p-4 bg-[#070B12] border border-[#1f2229] rounded-lg cursor-pointer hover:border-[#00f0ff] transition-colors">
                      <Image className="h-5 w-5 text-[#00f0ff]" />
                      <div className="flex-1">
                        <p className="text-sm text-white">{imageFile ? imageFile.name : 'Choose image file...'}</p>
                        <p className="text-xs text-[#b9cacb]">PNG, JPG, WebP (max 5MB)</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                        className="hidden"
                        disabled={isUploading}
                      />
                    </label>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Preview Video for Watch Preview Button */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Video className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Preview Video</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Preview Video URL</label>
                <input
                  type="url"
                  value={settings.previewVideoUrl}
                  onChange={(e) => setSettings({ ...settings, previewVideoUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="https://..."
                />
                <p className="text-xs text-[#b9cacb] mt-1">This video will play when users click "Watch Preview" on the landing page</p>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Or Upload Preview Video</label>
                <label className="flex items-center gap-3 p-4 bg-[#070B12] border border-[#1f2229] rounded-lg cursor-pointer hover:border-[#00f0ff] transition-colors">
                  <Video className="h-5 w-5 text-[#00f0ff]" />
                  <div className="flex-1">
                    <p className="text-sm text-white">{previewVideoFile ? previewVideoFile.name : 'Choose preview video file...'}</p>
                    <p className="text-xs text-[#b9cacb]">MP4, WebM, MOV (max 50MB)</p>
                  </div>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setPreviewVideoFile(e.target.files?.[0] || null)}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
              </div>
            </div>
            </div>
          </div>

          {/* Save Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-[#00f0ff] text-[#00363a] rounded-lg font-medium hover:bg-[#00f0ff]/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSaving ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}