"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Save, Award, Image as ImageIcon, Upload } from 'lucide-react';
import Link from 'next/link';
import { CertificatePreview } from '@/components/certificate/CertificatePreview';

export default function AdminCertificatesSettingsPage() {
  const [settings, setSettings] = useState({
    backgroundUrl: '',
    logoUrl: '',
    title: 'Certificate of Completion',
    subtitle: 'This certifies that',
    bodyText: 'has successfully completed the',
    founderName: 'AutoLearn Spot',
    signatureUrl: '',
    signatureText: 'Founder',
    qrEnabled: 'true',
    qrDestination: 'https://autolearn-spot.vercel.app/certificate/verify',
    footer: 'AutoLearn Spot - AI Automation Training',
    accentColor: '#00f0ff',
    numberFormat: 'ALS-{year}-{cohort}-{sequence}',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  // File upload states
  const [backgroundFile, setBackgroundFile] = useState<File | null>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [signatureFile, setSignatureFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const res = await fetch('/api/admin/master-settings?category=certificate');
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
    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      // Upload files first
      const formData = new FormData();
      
      if (backgroundFile) {
        formData.append('backgroundFile', backgroundFile);
      }
      if (logoFile) {
        formData.append('logoFile', logoFile);
      }
      if (signatureFile) {
        formData.append('signatureFile', signatureFile);
      }
      
      // Add existing URLs as fallbacks
      formData.append('backgroundUrl', settings.backgroundUrl);
      formData.append('logoUrl', settings.logoUrl);
      formData.append('signatureUrl', settings.signatureUrl);
      
      // Upload to certificate API
      const uploadRes = await fetch('/api/admin/certificate-assets', {
        method: 'POST',
        body: formData,
      });
      
      if (!uploadRes.ok) {
        const data = await uploadRes.json();
        throw new Error(data.error || 'Failed to upload assets');
      }
      
      const uploadData = await uploadRes.json();
      
      // Update settings with uploaded URLs
      const updatedSettings = {
        ...settings,
        backgroundUrl: uploadData.backgroundUrl || settings.backgroundUrl,
        logoUrl: uploadData.logoUrl || settings.logoUrl,
        signatureUrl: uploadData.signatureUrl || settings.signatureUrl,
      };
      
      // Save all settings
      const res = await fetch('/api/admin/master-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Clear file uploads after successful save
        setBackgroundFile(null);
        setLogoFile(null);
        setSignatureFile(null);
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
                <h1 className="text-xl font-bold text-white">Certificate Settings</h1>
                <p className="text-sm text-[#b9cacb]">Configure certificate template and design</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Settings Form */}
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

          {/* Certificate Content */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Certificate Content</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Title</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Subtitle</label>
                <input
                  type="text"
                  value={settings.subtitle}
                  onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Body Text</label>
                <input
                  type="text"
                  value={settings.bodyText}
                  onChange={(e) => setSettings({ ...settings, bodyText: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Founder Name</label>
                <input
                  type="text"
                  value={settings.founderName}
                  onChange={(e) => setSettings({ ...settings, founderName: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Signature Text</label>
                <input
                  type="text"
                  value={settings.signatureText}
                  onChange={(e) => setSettings({ ...settings, signatureText: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Footer</label>
                <input
                  type="text"
                  value={settings.footer}
                  onChange={(e) => setSettings({ ...settings, footer: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                />
              </div>
            </div>
          </div>

          {/* Media Assets */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Media Assets</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Background */}
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Certificate Background</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 px-4 py-3 bg-[#070B12] border border-[#1f2229] rounded-lg cursor-pointer hover:border-[#00f0ff] transition-colors">
                    <Upload className="h-4 w-4 text-[#b9cacb]" />
                    <span className="text-sm text-[#b9cacb]">
                      {backgroundFile ? backgroundFile.name : 'Upload Background (PNG/JPG)'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setBackgroundFile(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  {backgroundFile && (
                    <div className="flex items-center justify-between p-2 bg-[#070B12] border border-[#1f2229] rounded">
                      <span className="text-xs text-[#b9cacb] truncate">{backgroundFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setBackgroundFile(null)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {settings.backgroundUrl && !backgroundFile && (
                    <div className="p-2 bg-[#070B12] border border-[#1f2229] rounded">
                      <img src={settings.backgroundUrl} alt="Background preview" className="w-full h-24 object-cover rounded mb-2" />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, backgroundUrl: '' })}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Use different image
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Logo */}
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Certificate Logo</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 px-4 py-3 bg-[#070B12] border border-[#1f2229] rounded-lg cursor-pointer hover:border-[#00f0ff] transition-colors">
                    <Upload className="h-4 w-4 text-[#b9cacb]" />
                    <span className="text-sm text-[#b9cacb]">
                      {logoFile ? logoFile.name : 'Upload Logo (PNG/JPG)'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setLogoFile(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  {logoFile && (
                    <div className="flex items-center justify-between p-2 bg-[#070B12] border border-[#1f2229] rounded">
                      <span className="text-xs text-[#b9cacb] truncate">{logoFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setLogoFile(null)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {settings.logoUrl && !logoFile && (
                    <div className="p-2 bg-[#070B12] border border-[#1f2229] rounded">
                      <img src={settings.logoUrl} alt="Logo preview" className="w-full h-24 object-contain rounded mb-2" />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, logoUrl: '' })}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Use different image
                      </button>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Signature */}
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Signature Image</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 px-4 py-3 bg-[#070B12] border border-[#1f2229] rounded-lg cursor-pointer hover:border-[#00f0ff] transition-colors">
                    <Upload className="h-4 w-4 text-[#b9cacb]" />
                    <span className="text-sm text-[#b9cacb]">
                      {signatureFile ? signatureFile.name : 'Upload Signature (PNG/JPG)'}
                    </span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/jpg"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setSignatureFile(file);
                      }}
                      className="hidden"
                    />
                  </label>
                  {signatureFile && (
                    <div className="flex items-center justify-between p-2 bg-[#070B12] border border-[#1f2229] rounded">
                      <span className="text-xs text-[#b9cacb] truncate">{signatureFile.name}</span>
                      <button
                        type="button"
                        onClick={() => setSignatureFile(null)}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                  {settings.signatureUrl && !signatureFile && (
                    <div className="p-2 bg-[#070B12] border border-[#1f2229] rounded">
                      <img src={settings.signatureUrl} alt="Signature preview" className="w-full h-24 object-contain rounded mb-2" />
                      <button
                        type="button"
                        onClick={() => setSettings({ ...settings, signatureUrl: '' })}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Use different image
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Design Settings */}
          <div className="border border-[#1f2229] bg-[#0c0e12]/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-5 w-5 text-[#00f0ff]" />
              <h2 className="text-lg font-semibold text-white">Design Settings</h2>
            </div>
            <div className="space-y-6">
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
              <div>
                <label className="block text-sm font-medium text-[#b9cacb] mb-2">Certificate Number Format</label>
                <input
                  type="text"
                  value={settings.numberFormat}
                  onChange={(e) => setSettings({ ...settings, numberFormat: e.target.value })}
                  className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                  placeholder="ALS-{year}-{cohort}-{sequence}"
                />
                <p className="text-xs text-[#b9cacb] mt-1">Variables: {'{year}'}, {'{cohort}'}, {'{sequence}'}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="qrEnabled"
                  checked={settings.qrEnabled === 'true'}
                  onChange={(e) => setSettings({ ...settings, qrEnabled: e.target.checked ? 'true' : 'false' })}
                  className="w-4 h-4 rounded border-[#1f2229] bg-[#070B12] text-[#00f0ff] focus:ring-[#00f0ff]"
                />
                <label htmlFor="qrEnabled" className="text-sm text-[#b9cacb]">Enable QR Code</label>
              </div>
              {settings.qrEnabled === 'true' && (
                <div>
                  <label className="block text-sm font-medium text-[#b9cacb] mb-2">QR Code Destination</label>
                  <input
                    type="url"
                    value={settings.qrDestination}
                    onChange={(e) => setSettings({ ...settings, qrDestination: e.target.value })}
                    className="w-full px-4 py-2 bg-[#070B12] border border-[#1f2229] rounded-lg text-sm text-white focus:outline-none focus:border-[#00f0ff]"
                    placeholder="https://..."
                  />
                </div>
              )}
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

          {/* Live Preview */}
          <div className="lg:sticky lg:top-8 h-fit">
            <CertificatePreview
              title={settings.title}
              subtitle={settings.subtitle}
              bodyText={settings.bodyText}
              founderName={settings.founderName}
              signatureText={settings.signatureText}
              accentColor={settings.accentColor}
              backgroundUrl={settings.backgroundUrl}
              logoUrl={settings.logoUrl}
              signatureUrl={settings.signatureUrl}
              qrEnabled={settings.qrEnabled === 'true'}
              qrDestination={settings.qrDestination}
              footer={settings.footer}
            />
          </div>
        </div>
      </div>
    </div>
  );
}