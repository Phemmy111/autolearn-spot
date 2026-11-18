"use client";

import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, AlertCircle, Save, Award, Image as ImageIcon, Upload, Layers } from 'lucide-react';
import Link from 'next/link';
import { CertificatePreview } from '@/components/certificate/CertificatePreview';
import { CertificateDesigner } from '@/components/certificate/CertificateDesigner';
import { CertificateLayout, DEFAULT_CERTIFICATE_LAYOUT, validateLayout } from '@/lib/certificate-layout';

export default function AdminCertificatesSettingsPage() {
  const [settings, setSettings] = useState({
    backgroundUrl: '',
    logoUrl: '',
    title: 'Certificate of Completion',
    subtitle: 'This certifies that',
    bodyText: 'has successfully completed the',
    course: 'n8n Automation',
    founderName: 'AutoLearn Spot',
    signatureUrl: '',
    signatureText: 'Founder',
    qrEnabled: 'true',
    qrDestination: 'https://www.autolearnspot.com/certificate/verify',
    footer: 'AutoLearn Spot - AI Automation Training',
    accentColor: '#00f0ff',
    numberFormat: 'ALS-{year}-{cohort}-{sequence}',
  });
  const [layout, setLayout] = useState<CertificateLayout>(DEFAULT_CERTIFICATE_LAYOUT);
  const [showDesigner, setShowDesigner] = useState(false);
  const [fullScreenDesigner, setFullScreenDesigner] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [splitPosition, setSplitPosition] = useState(50); // Split position in percentage
  
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
          const raw = data.settings;
          const normalized = {
            ...raw,
            title: raw.title || raw.certificate_title || raw.certificateTitle || settings.title,
            subtitle: raw.subtitle || raw.certificate_subtitle || raw.certificateSubtitle || settings.subtitle,
            bodyText: raw.bodyText || raw.certificate_body_text || raw.certificateBodyText || settings.bodyText,
            founderName: raw.founderName || raw.certificate_founder_name || raw.certificateFounderName || settings.founderName,
            signatureText: raw.signatureText || raw.certificate_signature_text || raw.certificateSignatureText || settings.signatureText,
            footer: raw.footer || raw.certificate_footer || raw.certificateFooter || settings.footer,
            accentColor: raw.accentColor || raw.certificate_accent_color || raw.certificateAccentColor || settings.accentColor,
            layout: raw.layout || raw.certificate_layout || raw.certificateLayout || null,
          };
          setSettings(prev => ({ ...prev, ...normalized }));
          
          // Load layout if it exists
          const layoutSource = normalized.layout;
          if (layoutSource) {
            try {
              const parsedLayout = typeof layoutSource === 'string'
                ? JSON.parse(layoutSource)
                : layoutSource;
              const validation = validateLayout(parsedLayout);
              // Check if it's the old dark theme layout
              const hasOldDarkTheme = 
                !parsedLayout?.elements ||
                parsedLayout.elements.length < 12 ||
                !parsedLayout.elements.some((el: any) => el.id === 'seal') ||
                parsedLayout?.canvas?.backgroundColor === '#06101f' || 
                parsedLayout?.elements?.find((el: any) => el.id === 'course')?.style?.background === '#040b17' ||
                parsedLayout?.elements?.find((el: any) => el.id === 'logo')?.visible === false;
              
              if (validation.valid && !hasOldDarkTheme) {
                setLayout(parsedLayout);
              } else {
                console.log('Upgrading old layout to luxury parchment layout');
                setLayout(DEFAULT_CERTIFICATE_LAYOUT);
              }
            } catch (e) {
              console.error('Failed to parse layout:', e);
              setLayout(DEFAULT_CERTIFICATE_LAYOUT);
            }
          } else {
            setLayout(DEFAULT_CERTIFICATE_LAYOUT);
          }
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

  const handleSave = async (e?: React.FormEvent | React.MouseEvent | any) => {
    if (e && typeof e.preventDefault === 'function') {
      e.preventDefault();
    }
    setIsSaving(true);
    setIsUploading(true);
    setError(null);
    setSuccess(false);

    try {
      let uploadedBackgroundUrl = settings.backgroundUrl;
      let uploadedLogoUrl = settings.logoUrl;
      let uploadedSignatureUrl = settings.signatureUrl;

      // Upload files if any selected
      if (backgroundFile || logoFile || signatureFile) {
        const formData = new FormData();
        if (backgroundFile) formData.append('backgroundFile', backgroundFile);
        if (logoFile) formData.append('logoFile', logoFile);
        if (signatureFile) formData.append('signatureFile', signatureFile);
        formData.append('backgroundUrl', settings.backgroundUrl);
        formData.append('logoUrl', settings.logoUrl);
        formData.append('signatureUrl', settings.signatureUrl);

        const uploadRes = await fetch('/api/admin/certificate-assets', {
          method: 'POST',
          body: formData,
        });

        if (!uploadRes.ok) {
          const data = await uploadRes.json();
          console.error('Upload failed:', data);
          throw new Error(data.error || 'Failed to upload assets');
        }

        const uploadData = await uploadRes.json();
        uploadedBackgroundUrl = uploadData.backgroundUrl || uploadedBackgroundUrl;
        uploadedLogoUrl = uploadData.logoUrl || uploadedLogoUrl;
        uploadedSignatureUrl = uploadData.signatureUrl || uploadedSignatureUrl;
      }

      // Synchronize layout elements with current form settings before persisting
      const synchronizedLayout = layout && layout.elements ? {
        ...layout,
        elements: layout.elements.map(el => {
          if (el.id === 'title' || el.type === 'title') {
            return { ...el, text: settings.title };
          }
          if (el.id === 'subtitle' || el.type === 'subtitle') {
            return { ...el, text: settings.subtitle };
          }
          if (el.id === 'bodyText' || el.type === 'bodyText') {
            return { ...el, text: settings.bodyText };
          }
          if (el.id === 'founderName' || el.type === 'founderName') {
            return { ...el, text: settings.founderName };
          }
          if (el.id === 'signatureText' || el.type === 'signatureText') {
            return { ...el, text: settings.signatureText };
          }
          if (el.id === 'footer' || el.type === 'footer') {
            return { ...el, text: settings.footer };
          }
          return el;
        })
      } : layout;

      // Update settings with uploaded URLs and current layout
      const updatedSettings = {
        ...settings,
        backgroundUrl: uploadedBackgroundUrl || settings.backgroundUrl,
        logoUrl: uploadedLogoUrl || settings.logoUrl,
        signatureUrl: uploadedSignatureUrl || settings.signatureUrl,
        layout: synchronizedLayout,
        certificateTitle: settings.title,
        certificateSubtitle: settings.subtitle,
        certificateBodyText: settings.bodyText,
        certificateFounderName: settings.founderName,
        certificateSignatureText: settings.signatureText,
        certificateFooter: settings.footer,
      };

      // Only save layout if it's not null/undefined
      if (!synchronizedLayout || Object.keys(synchronizedLayout).length === 0) {
        delete updatedSettings.layout;
      }

      // Save all settings to master-settings
      const res = await fetch('/api/admin/master-settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: updatedSettings }),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Refresh settings from database
        await fetchSettings();
        setBackgroundFile(null);
        setLogoFile(null);
        setSignatureFile(null);
      } else {
        const data = await res.json();
        console.error('Failed to save settings:', data);
        setError(data.error || 'Failed to save settings');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to save settings');
    } finally {
      setIsSaving(false);
      setIsUploading(false);
    }
  };

  const handleLayoutChange = (newLayout: CertificateLayout) => {
    setLayout(newLayout);
    if (newLayout?.elements) {
      setSettings(prev => {
        let changed = false;
        const next = { ...prev };
        newLayout.elements.forEach(el => {
          if ((el.id === 'title' || el.type === 'title') && el.text && el.text !== next.title) {
            next.title = el.text;
            changed = true;
          }
          if ((el.id === 'subtitle' || el.type === 'subtitle') && el.text && el.text !== next.subtitle) {
            next.subtitle = el.text;
            changed = true;
          }
          if ((el.id === 'bodyText' || el.type === 'bodyText') && el.text && el.text !== next.bodyText) {
            next.bodyText = el.text;
            changed = true;
          }
          if ((el.id === 'founderName' || el.type === 'founderName') && el.text && el.text !== next.founderName) {
            next.founderName = el.text;
            changed = true;
          }
          if ((el.id === 'signatureText' || el.type === 'signatureText') && el.text && el.text !== next.signatureText) {
            next.signatureText = el.text;
            changed = true;
          }
          if ((el.id === 'footer' || el.type === 'footer') && el.text && el.text !== next.footer) {
            next.footer = el.text;
            changed = true;
          }
        });
        return changed ? next : prev;
      });
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-brand-bg flex items-center justify-center">
        <Loader2 className="h-8 w-8 text-[#10b981] animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-bg">
      {/* Header */}
      <div className="border-b border-brand-border bg-[var(--card)] brightness-95/50 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin/settings" className="text-brand-text/70 hover:text-brand-text transition-colors">
                <ArrowLeft className="h-5 w-5" />
              </Link>
              <div>
                <h1 className="text-xl font-bold text-brand-text">Certificate Settings</h1>
                <p className="text-sm text-brand-text/70">Configure certificate template and design</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-brand-border pb-4">
          <button
            type="button"
            onClick={() => setShowDesigner(false)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              !showDesigner 
                ? 'text-[#10b981] border-b-2 border-[#10b981]' 
                : 'text-brand-text/70 hover:text-brand-text'
            }`}
          >
            Certificate Content
          </button>
          <button
            type="button"
            onClick={() => {
              setShowDesigner(true);
              setFullScreenDesigner(true);
            }}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              showDesigner 
                ? 'text-[#10b981] border-b-2 border-[#10b981]' 
                : 'text-brand-text/70 hover:text-brand-text'
            }`}
          >
            <Layers className="h-4 w-4 inline mr-2" />
            Visual Designer
          </button>
        </div>

        {fullScreenDesigner && (
          <div className="fixed inset-0 z-50 bg-brand-bg">
            <div className="flex items-center justify-between px-4 py-2 bg-[var(--card)] brightness-95 border-b border-brand-border">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFullScreenDesigner(false)}
                  className="p-2 bg-brand-bg text-brand-text/70 rounded hover:bg-neutral-200 transition-colors"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="text-sm text-brand-text">Visual Designer</span>
              </div>
              <div className="flex items-center gap-2">
                {success && (
                  <div className="flex items-center gap-2 px-3 py-1 bg-green-500/10 border border-green-500/20 rounded">
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    <span className="text-xs text-green-400">Saved</span>
                  </div>
                )}
              </div>
            </div>
            <CertificateDesigner
              layout={layout}
              onLayoutChange={handleLayoutChange}
              settings={settings}
              onSave={handleSave}
              isSaving={isSaving}
            />
          </div>
        )}

        {!fullScreenDesigner && (
          <>
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
          <div className="border border-brand-border bg-[var(--card)] brightness-95/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-5 w-5 text-[#10b981]" />
              <h2 className="text-lg font-semibold text-brand-text">Certificate Content</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Title</label>
                <input
                  type="text"
                  value={settings.title}
                  onChange={(e) => setSettings({ ...settings, title: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Subtitle</label>
                <input
                  type="text"
                  value={settings.subtitle}
                  onChange={(e) => setSettings({ ...settings, subtitle: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Body Text</label>
                <input
                  type="text"
                  value={settings.bodyText}
                  onChange={(e) => setSettings({ ...settings, bodyText: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Course / Program</label>
                <input
                  type="text"
                  value={settings.course}
                  onChange={(e) => setSettings({ ...settings, course: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Founder Name</label>
                <input
                  type="text"
                  value={settings.founderName}
                  onChange={(e) => setSettings({ ...settings, founderName: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Signature Text</label>
                <input
                  type="text"
                  value={settings.signatureText}
                  onChange={(e) => setSettings({ ...settings, signatureText: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Footer</label>
                <input
                  type="text"
                  value={settings.footer}
                  onChange={(e) => setSettings({ ...settings, footer: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
                />
              </div>
            </div>
          </div>

          {/* Media Assets */}
          <div className="border border-brand-border bg-[var(--card)] brightness-95/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <ImageIcon className="h-5 w-5 text-[#10b981]" />
              <h2 className="text-lg font-semibold text-brand-text">Media Assets</h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Background */}
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Certificate Background</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 px-4 py-3 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg cursor-pointer hover:border-[#10b981] transition-colors">
                    <Upload className="h-4 w-4 text-brand-text/70" />
                    <span className="text-sm text-brand-text/70">
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
                    <div className="flex items-center justify-between p-2 bg-[var(--card)] brightness-95 border border-brand-border rounded">
                      <span className="text-xs text-brand-text/70 truncate">{backgroundFile.name}</span>
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
                    <div className="p-2 bg-[var(--card)] brightness-95 border border-brand-border rounded">
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
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Certificate Logo</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 px-4 py-3 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg cursor-pointer hover:border-[#10b981] transition-colors">
                    <Upload className="h-4 w-4 text-brand-text/70" />
                    <span className="text-sm text-brand-text/70">
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
                    <div className="flex items-center justify-between p-2 bg-[var(--card)] brightness-95 border border-brand-border rounded">
                      <span className="text-xs text-brand-text/70 truncate">{logoFile.name}</span>
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
                    <div className="p-2 bg-[var(--card)] brightness-95 border border-brand-border rounded">
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
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Signature Image</label>
                <div className="space-y-3">
                  <label className="flex items-center gap-2 px-4 py-3 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg cursor-pointer hover:border-[#10b981] transition-colors">
                    <Upload className="h-4 w-4 text-brand-text/70" />
                    <span className="text-sm text-brand-text/70">
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
                    <div className="flex items-center justify-between p-2 bg-[var(--card)] brightness-95 border border-brand-border rounded">
                      <span className="text-xs text-brand-text/70 truncate">{signatureFile.name}</span>
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
                    <div className="p-2 bg-[var(--card)] brightness-95 border border-brand-border rounded">
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
          <div className="border border-brand-border bg-[var(--card)] brightness-95/50 backdrop-blur-xl rounded-xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <Award className="h-5 w-5 text-[#10b981]" />
              <h2 className="text-lg font-semibold text-brand-text">Design Settings</h2>
            </div>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Accent Color</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="h-10 w-12 rounded border border-brand-border cursor-pointer"
                  />
                  <input
                    type="text"
                    value={settings.accentColor}
                    onChange={(e) => setSettings({ ...settings, accentColor: e.target.value })}
                    className="flex-1 px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-brand-text/70 mb-2">Certificate Number Format</label>
                <input
                  type="text"
                  value={settings.numberFormat}
                  onChange={(e) => setSettings({ ...settings, numberFormat: e.target.value })}
                  className="w-full px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
                  placeholder="ALS-{year}-{cohort}-{sequence}"
                />
                <p className="text-xs text-brand-text/70 mt-1">Variables: {'{year}'}, {'{cohort}'}, {'{sequence}'}</p>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="qrEnabled"
                  checked={settings.qrEnabled === 'true'}
                  onChange={(e) => setSettings({ ...settings, qrEnabled: e.target.checked ? 'true' : 'false' })}
                  className="w-4 h-4 rounded border-brand-border bg-[var(--card)] brightness-95 text-[#10b981] focus:ring-[#00f0ff]"
                />
                <label htmlFor="qrEnabled" className="text-sm text-brand-text/70">Enable QR Code</label>
              </div>
              {settings.qrEnabled === 'true' && (
                <div>
                  <label className="block text-sm font-medium text-brand-text/70 mb-2">QR Code Destination</label>
                  <input
                    type="url"
                    value={settings.qrDestination}
                    onChange={(e) => setSettings({ ...settings, qrDestination: e.target.value })}
                    className="w-full px-4 py-2 bg-[var(--card)] brightness-95 border border-brand-border rounded-lg text-sm text-brand-text focus:outline-none focus:border-[#10b981]"
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
              className="flex items-center gap-2 px-6 py-3 bg-brand-bg text-[#00363a] rounded-lg font-medium hover:bg-brand-bg/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
              course={settings.course}
              layout={layout}
            />
          </div>
        </div>
        </>
        )}
      </div>
    </div>
  );
}
