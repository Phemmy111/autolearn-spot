"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Save, Palette, Globe, Mail, Phone, MessageCircle } from 'lucide-react';
import Link from 'next/link';

export default function AdminGeneralSettingsPage() {
  const [settings, setSettings] = useState({
    siteName: 'AutoLearn Spot',
    siteTagline: 'Master AI agents and build autonomous systems that work for you',
    primaryColor: '#00f0ff',
    secondaryColor: '#8b5cf6',
    accentColor: '#00f0ff',
    supportEmail: 'support@autolearnspot.com',
    supportPhone: '+234',
    supportWhatsApp: '+234',
    whatsappDirectLink: 'https://wa.me/',
    whatsappCommunityLink: 'https://chat.whatsapp.com/',
    instagramUrl: 'https://instagram.com/',
    tiktokUrl: 'https://tiktok.com/',
    youtubeUrl: 'https://youtube.com/',
    facebookUrl: 'https://facebook.com/',
    twitterUrl: 'https://twitter.com/',
    linkedinUrl: 'https://linkedin.com/',
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
      const res = await fetch('/api/admin/master-settings?category=brand');
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
                <h1 className="text-xl font-bold text-white">General & Brand Settings</h1>
                <p className="text-sm text-[#b9cacb]">Configure website name, colors, and contact information</p>
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

          {/* Website Identity */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Globe className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Website Identity</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Site Name</label>
                <input
                  type="text"
                  value={settings.siteName}
                  onChange={(e) => setSettings({ ...settings, siteName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Tagline</label>
                <input
                  type="text"
                  value={settings.siteTagline}
                  onChange={(e) => setSettings({ ...settings, siteTagline: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>
          </div>

          {/* Brand Colors */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Palette className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Brand Colors</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Primary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="h-10 w-12 rounded border border-[#1f2229] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.primaryColor}
                    onChange={(e) => setSettings({ ...settings, primaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Secondary Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="h-10 w-12 rounded border border-[#1f2229] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.secondaryColor}
                    onChange={(e) => setSettings({ ...settings, secondaryColor: e.target.value })}
                    className="flex-1 px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="h-10 w-12 rounded border border-[#1f2229] cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="flex-1 px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Mail className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Contact Information</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Support Email</label>
                <input
                  type="email"
                  value={settings.supportEmail}
                  onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Support Phone</label>
                <input
                  type="tel"
                  value={settings.supportPhone}
                  onChange={(e) => setSettings({ ...settings, supportPhone: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Support WhatsApp</label>
                <input
                  type="tel"
                  value={settings.supportWhatsApp}
                  onChange={(e) => setSettings({ ...settings, supportWhatsApp: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">WhatsApp Direct Link</label>
                <input
                  type="url"
                  value={settings.whatsappDirectLink}
                  onChange={(e) => setSettings({ ...settings, whatsappDirectLink: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>
          </div>

          {/* Social Links */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <MessageCircle className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Social Links</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">WhatsApp Community</label>
                <input
                  type="url"
                  value={settings.whatsappCommunityLink}
                  onChange={(e) => setSettings({ ...settings, whatsappCommunityLink: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Instagram</label>
                <input
                  type="url"
                  value={settings.instagramUrl}
                  onChange={(e) => setSettings({ ...settings, instagramUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">TikTok</label>
                <input
                  type="url"
                  value={settings.tiktokUrl}
                  onChange={(e) => setSettings({ ...settings, tiktokUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">YouTube</label>
                <input
                  type="url"
                  value={settings.youtubeUrl}
                  onChange={(e) => setSettings({ ...settings, youtubeUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Facebook</label>
                <input
                  type="url"
                  value={settings.facebookUrl}
                  onChange={(e) => setSettings({ ...settings, facebookUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Twitter/X</label>
                <input
                  type="url"
                  value={settings.twitterUrl}
                  onChange={(e) => setSettings({ ...settings, twitterUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">LinkedIn</label>
                <input
                  type="url"
                  value={settings.linkedinUrl}
                  onChange={(e) => setSettings({ ...settings, linkedinUrl: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
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