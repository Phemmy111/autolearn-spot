"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Save, Globe } from 'lucide-react';
import Link from 'next/link';

export default function AdminSeoSettingsPage() {
  const [settings, setSettings] = useState({
    siteTitle: 'AutoLearn Spot - AI Automation Training',
    metaDescription: 'Master n8n automation and build powerful AI-powered workflows without coding. Join our hands-on training program.',
    ogTitle: 'AutoLearn Spot - AI Automation Training',
    ogDescription: 'Master n8n automation and build powerful AI-powered workflows without coding.',
    ogImage: '/og-image.jpg',
    twitterCardType: 'summary_large_image',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/master-settings?category=seo');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) {
          setSettings(prev => ({ ...prev, ...data.settings }));
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
    setError(null);
    setSuccess(false);

    try {
      const res = await fetch('/api/admin/master-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      } else {
        const data = await res.json();
        setError(data.error || 'Failed to save settings');
      }
    } catch (e) {
      setError('Failed to save settings');
    } finally {
      setIsSaving(false);
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
                <h1 className="text-xl font-bold text-white">SEO & Metadata Settings</h1>
                <p className="text-sm text-[#b9cacb]">Configure website SEO and social sharing metadata</p>
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

          {/* Basic SEO */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Basic SEO</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Site Title</label>
                <input
                  type="text"
                  value={settings.siteTitle}
                  onChange={(e) => setSettings({ ...settings, siteTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Meta Description</label>
                <textarea
                  value={settings.metaDescription}
                  onChange={(e) => setSettings({ ...settings, metaDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff] resize-none"
                />
              </div>
            </div>
          </div>

          {/* Open Graph */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Open Graph (Social Sharing)</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">OG Title</label>
                <input
                  type="text"
                  value={settings.ogTitle}
                  onChange={(e) => setSettings({ ...settings, ogTitle: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">OG Description</label>
                <textarea
                  value={settings.ogDescription}
                  onChange={(e) => setSettings({ ...settings, ogDescription: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff] resize-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">OG Image URL</label>
                <input
                  type="url"
                  value={settings.ogImage}
                  onChange={(e) => setSettings({ ...settings, ogImage: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="https://..."
                />
              </div>
            </div>
          </div>

          {/* Twitter Card */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Twitter Card</h2>
            </div>
            <div>
              <label className="block text-sm font-medium text-[#b9cacb] mb-2">Card Type</label>
              <select
                value={settings.twitterCardType}
                onChange={(e) => setSettings({ ...settings, twitterCardType: e.target.value })}
                className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
              >
                <option value="summary_large_image">Summary Large Image</option>
                <option value="summary">Summary</option>
              </select>
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