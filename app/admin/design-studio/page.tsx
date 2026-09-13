"use client";

import React, { useState, useEffect, useCallback } from 'react';
import {
  Loader2, Paintbrush, Type, Square, Eye, Save, Upload, RotateCcw,
  CheckCircle2, AlertCircle, Palette, Sun, Moon, Layers, Sparkles
} from 'lucide-react';

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface DesignConfig {
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  backgroundColor: string;
  textColor: string;
  linkColor: string;
  borderColor: string;
  buttonRadius: number;
  typography: string;
  headingFont: string;
  logoUrl: string;
  faviconUrl: string;
}

const DEFAULT_CONFIG: DesignConfig = {
  primaryColor: '#16a34a',
  secondaryColor: '#1e293b',
  accentColor: '#f59e0b',
  backgroundColor: '#f8f9fa',
  textColor: '#1a1a2e',
  linkColor: '#16a34a',
  borderColor: '#e2e8f0',
  buttonRadius: 8,
  typography: 'Inter',
  headingFont: 'Space Grotesk',
  logoUrl: '',
  faviconUrl: '',
};

const FONT_OPTIONS = [
  'Inter',
  'Space Grotesk',
  'Poppins',
  'DM Sans',
  'Nunito',
  'Lato',
  'Roboto',
  'Open Sans',
  'Montserrat',
  'Raleway',
  'Source Sans Pro',
  'Plus Jakarta Sans',
];

/* ------------------------------------------------------------------ */
/*  Helpers                                                            */
/* ------------------------------------------------------------------ */
function hexToHSL(hex: string) {
  let r = parseInt(hex.slice(1, 3), 16) / 255;
  let g = parseInt(hex.slice(3, 5), 16) / 255;
  let b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

/* ------------------------------------------------------------------ */
/*  Color Swatch                                                       */
/* ------------------------------------------------------------------ */
function ColorInput({ label, value, onChange, description }: {
  label: string; value: string; onChange: (v: string) => void; description?: string;
}) {
  const hsl = hexToHSL(value);
  return (
    <div className="group">
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      {description && <p className="text-xs text-brand-text/60 mb-2">{description}</p>}
      <div className="flex items-center gap-3">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className="w-12 h-12 rounded-xl border-2 border-brand-border cursor-pointer shadow-sm hover:shadow-md transition-shadow appearance-none"
            style={{ padding: 0 }}
          />
        </div>
        <div className="flex-1">
          <input
            type="text"
            value={value}
            onChange={(e) => {
              if (/^#[0-9A-Fa-f]{0,6}$/.test(e.target.value)) onChange(e.target.value);
            }}
            className="w-full px-3 py-2 border border-brand-border rounded-lg text-sm font-mono bg-[var(--card)] focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all"
            placeholder="#000000"
          />
          <p className="text-[10px] text-gray-400 mt-1">
            HSL: {hsl.h}° {hsl.s}% {hsl.l}%
          </p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Section Wrapper                                                    */
/* ------------------------------------------------------------------ */
function Section({ icon: Icon, title, children, badge }: {
  icon: React.ElementType; title: string; children: React.ReactNode; badge?: string;
}) {
  return (
    <div className="bg-[var(--card)] rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className="p-2 rounded-lg bg-green-50">
          <Icon className="h-5 w-5 text-brand-primary" />
        </div>
        <h2 className="text-lg font-bold text-brand-text">{title}</h2>
        {badge && (
          <span className="ml-auto text-xs font-medium px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
            {badge}
          </span>
        )}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */
export default function AdminDesignStudioPage() {
  const [draft, setDraft] = useState<DesignConfig>(DEFAULT_CONFIG);
  const [published, setPublished] = useState<DesignConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [activeTab, setActiveTab] = useState<'colors' | 'typography' | 'components' | 'branding'>('colors');

  /* ---- Fetch ---- */
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/design-studio');
        if (res.ok) {
          const json = await res.json();
          if (json.draft) setDraft({ ...DEFAULT_CONFIG, ...json.draft });
          if (json.published) setPublished({ ...DEFAULT_CONFIG, ...json.published });
        }
      } catch (e) {
        console.error('Failed to fetch design config:', e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  /* ---- Toast auto-dismiss ---- */
  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 4000);
      return () => clearTimeout(t);
    }
  }, [toast]);

  /* ---- Update helper ---- */
  const update = useCallback(<K extends keyof DesignConfig>(key: K, value: DesignConfig[K]) => {
    setDraft((d) => ({ ...d, [key]: value }));
    setHasChanges(true);
  }, []);

  /* ---- Save draft ---- */
  const saveDraft = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/admin/design-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'save_draft', config: draft }),
      });
      if (res.ok) {
        setToast({ type: 'success', message: 'Draft saved successfully' });
        setHasChanges(false);
      } else {
        throw new Error('Save failed');
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to save draft' });
    } finally {
      setSaving(false);
    }
  };

  /* ---- Publish ---- */
  const publish = async () => {
    setPublishing(true);
    try {
      const res = await fetch('/api/admin/design-studio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'publish', config: draft }),
      });
      if (res.ok) {
        setPublished({ ...draft });
        setToast({ type: 'success', message: 'Design published! Changes are now live.' });
        setHasChanges(false);
      } else {
        throw new Error('Publish failed');
      }
    } catch {
      setToast({ type: 'error', message: 'Failed to publish design' });
    } finally {
      setPublishing(false);
    }
  };

  /* ---- Reset ---- */
  const resetToPublished = () => {
    if (published) {
      setDraft({ ...published });
      setHasChanges(false);
      setToast({ type: 'success', message: 'Reset to published version' });
    }
  };

  const resetToDefaults = () => {
    setDraft({ ...DEFAULT_CONFIG });
    setHasChanges(true);
    setToast({ type: 'success', message: 'Reset to defaults' });
  };

  /* ---- Loading ---- */
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-10 w-10 animate-spin text-brand-primary mx-auto mb-3" />
          <p className="text-brand-text/60 text-sm">Loading Design Studio…</p>
        </div>
      </div>
    );
  }

  const isPublished = published !== null;
  const isDraftDifferent = isPublished && JSON.stringify(draft) !== JSON.stringify(published);

  /* ---- Render ---- */
  return (
    <div className="min-h-screen bg-brand-bg">
      {/* ---- Toast ---- */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-5 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all animate-in slide-in-from-right ${
          toast.type === 'success'
            ? 'bg-green-50 border-green-200 text-green-800'
            : 'bg-red-50 border-red-200 text-red-800'
        }`}>
          {toast.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          {toast.message}
        </div>
      )}

      {/* ---- Header ---- */}
      <div className="bg-[var(--card)] border-b border-gray-100 sticky top-0 z-40">
        <div className="px-8 py-5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2.5 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg shadow-green-500/20">
              <Paintbrush className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-extrabold text-brand-text">Design Studio</h1>
              <p className="text-sm text-brand-text/60 mt-0.5">Customize the look and feel of your platform</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-xs font-medium text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 animate-pulse">
                Unsaved changes
              </span>
            )}

            <button onClick={resetToDefaults} className="px-4 py-2.5 text-sm font-medium text-brand-text/70 bg-[var(--card)] border border-brand-border rounded-xl hover:bg-brand-bg transition-all flex items-center gap-2">
              <RotateCcw className="h-4 w-4" /> Defaults
            </button>

            {isPublished && (
              <button onClick={resetToPublished} className="px-4 py-2.5 text-sm font-medium text-brand-text/70 bg-[var(--card)] border border-brand-border rounded-xl hover:bg-brand-bg transition-all flex items-center gap-2">
                <RotateCcw className="h-4 w-4" /> Revert
              </button>
            )}

            <button onClick={saveDraft} disabled={saving || !hasChanges} className="px-5 py-2.5 text-sm font-semibold text-white bg-gray-800 rounded-xl hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-sm">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save Draft
            </button>

            <button onClick={publish} disabled={publishing} className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl hover:from-green-700 hover:to-emerald-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center gap-2 shadow-lg shadow-green-500/20">
              {publishing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              Publish
            </button>
          </div>
        </div>

        {/* ---- Tabs ---- */}
        <div className="px-8 flex gap-1">
          {([
            { id: 'colors', label: 'Colors', icon: Palette },
            { id: 'typography', label: 'Typography', icon: Type },
            { id: 'components', label: 'Components', icon: Layers },
            { id: 'branding', label: 'Branding', icon: Sparkles },
          ] as const).map(({ id, label, icon: TabIcon }) => (
            <button
              key={id}
              onClick={() => setActiveTab(id)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-medium border-b-2 transition-all ${
                activeTab === id
                  ? 'border-brand-primary text-green-700 bg-green-50/50'
                  : 'border-transparent text-brand-text/60 hover:text-gray-700 hover:bg-brand-bg'
              }`}
            >
              <TabIcon className="h-4 w-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ---- Body ---- */}
      <div className="p-8">
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* ---- Left: Controls ---- */}
          <div className="xl:col-span-2 space-y-6">

            {/* == Colors Tab == */}
            {activeTab === 'colors' && (
              <>
                <Section icon={Palette} title="Brand Colors" badge="Core">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorInput label="Primary Color" value={draft.primaryColor} onChange={(v) => update('primaryColor', v)} description="Main brand color for buttons, links, and CTAs" />
                    <ColorInput label="Secondary Color" value={draft.secondaryColor} onChange={(v) => update('secondaryColor', v)} description="Used for headings, navigation, and dark accents" />
                    <ColorInput label="Accent Color" value={draft.accentColor} onChange={(v) => update('accentColor', v)} description="Highlight color for badges, alerts, and emphasis" />
                    <ColorInput label="Link Color" value={draft.linkColor} onChange={(v) => update('linkColor', v)} description="Color used for hyperlinks and interactive text" />
                  </div>
                </Section>

                <Section icon={Sun} title="Surface Colors">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <ColorInput label="Background" value={draft.backgroundColor} onChange={(v) => update('backgroundColor', v)} description="Main page background" />
                    <ColorInput label="Text Color" value={draft.textColor} onChange={(v) => update('textColor', v)} description="Default body text color" />
                    <ColorInput label="Border Color" value={draft.borderColor} onChange={(v) => update('borderColor', v)} description="Default border and divider color" />
                  </div>
                </Section>

                {/* Quick Presets */}
                <Section icon={Moon} title="Quick Presets">
                  <div className="flex flex-wrap gap-3">
                    {[
                      { name: 'Default Green', primary: '#16a34a', secondary: '#1e293b', accent: '#f59e0b', bg: '#f8f9fa' },
                      { name: 'Ocean Blue', primary: '#2563eb', secondary: '#0f172a', accent: '#06b6d4', bg: '#f0f9ff' },
                      { name: 'Royal Purple', primary: '#7c3aed', secondary: '#1e1b4b', accent: '#f472b6', bg: '#faf5ff' },
                      { name: 'Sunset Orange', primary: '#ea580c', secondary: '#1c1917', accent: '#fbbf24', bg: '#fffbeb' },
                      { name: 'Rose', primary: '#e11d48', secondary: '#1f2937', accent: '#fb923c', bg: '#fff1f2' },
                    ].map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          update('primaryColor', preset.primary);
                          update('secondaryColor', preset.secondary);
                          update('accentColor', preset.accent);
                          update('backgroundColor', preset.bg);
                          setHasChanges(true);
                        }}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-brand-border hover:border-brand-border hover:shadow-md transition-all text-sm font-medium text-gray-700 bg-[var(--card)]"
                      >
                        <div className="flex -space-x-1">
                          <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: preset.primary }} />
                          <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: preset.secondary }} />
                          <span className="w-4 h-4 rounded-full border border-white shadow-sm" style={{ background: preset.accent }} />
                        </div>
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </Section>
              </>
            )}

            {/* == Typography Tab == */}
            {activeTab === 'typography' && (
              <Section icon={Type} title="Typography">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Body Font</label>
                    <p className="text-xs text-brand-text/60 mb-2">Applied to paragraphs, labels, and body text</p>
                    <select
                      value={draft.typography}
                      onChange={(e) => update('typography', e.target.value)}
                      className="w-full px-4 py-3 border border-brand-border rounded-xl bg-[var(--card)] focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <p className="mt-3 text-base" style={{ fontFamily: draft.typography }}>
                      The quick brown fox jumps over the lazy dog. 0123456789
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Heading Font</label>
                    <p className="text-xs text-brand-text/60 mb-2">Applied to H1–H6 headings</p>
                    <select
                      value={draft.headingFont}
                      onChange={(e) => update('headingFont', e.target.value)}
                      className="w-full px-4 py-3 border border-brand-border rounded-xl bg-[var(--card)] focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                    >
                      {FONT_OPTIONS.map((f) => (
                        <option key={f} value={f}>{f}</option>
                      ))}
                    </select>
                    <p className="mt-3 text-2xl font-bold" style={{ fontFamily: draft.headingFont }}>
                      Heading Preview Text
                    </p>
                  </div>
                </div>
              </Section>
            )}

            {/* == Components Tab == */}
            {activeTab === 'components' && (
              <Section icon={Layers} title="Component Styles">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Button Border Radius</label>
                    <p className="text-xs text-brand-text/60 mb-3">Controls how rounded buttons and inputs appear</p>
                    <div className="flex items-center gap-4">
                      <input
                        type="range"
                        min={0}
                        max={24}
                        step={1}
                        value={draft.buttonRadius}
                        onChange={(e) => update('buttonRadius', Number(e.target.value))}
                        className="flex-1 accent-green-600"
                      />
                      <span className="text-sm font-mono text-brand-text/70 w-12 text-right">{draft.buttonRadius}px</span>
                    </div>
                    <div className="flex items-center gap-3 mt-4">
                      {[0, 4, 8, 12, 16, 24].map((r) => (
                        <button
                          key={r}
                          onClick={() => update('buttonRadius', r)}
                          className={`px-4 py-2 text-xs font-medium border transition-all ${
                            draft.buttonRadius === r
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-brand-border bg-[var(--card)] text-brand-text/70 hover:border-brand-border'
                          }`}
                          style={{ borderRadius: `${r}px` }}
                        >
                          {r}px
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Button Preview */}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">Button Preview</label>
                    <div className="flex flex-wrap gap-3">
                      <button
                        style={{
                          backgroundColor: draft.primaryColor,
                          borderRadius: `${draft.buttonRadius}px`,
                          fontFamily: draft.typography,
                        }}
                        className="px-6 py-2.5 text-white text-sm font-semibold shadow-sm"
                      >
                        Primary Button
                      </button>
                      <button
                        style={{
                          borderColor: draft.primaryColor,
                          color: draft.primaryColor,
                          borderRadius: `${draft.buttonRadius}px`,
                          fontFamily: draft.typography,
                        }}
                        className="px-6 py-2.5 text-sm font-semibold border-2 bg-[var(--card)]"
                      >
                        Outline Button
                      </button>
                      <button
                        style={{
                          backgroundColor: draft.secondaryColor,
                          borderRadius: `${draft.buttonRadius}px`,
                          fontFamily: draft.typography,
                        }}
                        className="px-6 py-2.5 text-white text-sm font-semibold shadow-sm"
                      >
                        Secondary Button
                      </button>
                    </div>
                  </div>
                </div>
              </Section>
            )}

            {/* == Branding Tab == */}
            {activeTab === 'branding' && (
              <Section icon={Sparkles} title="Branding Assets">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Logo URL</label>
                    <p className="text-xs text-brand-text/60 mb-2">URL to your platform logo (SVG or PNG recommended)</p>
                    <input
                      type="text"
                      value={draft.logoUrl}
                      onChange={(e) => update('logoUrl', e.target.value)}
                      className="w-full px-4 py-3 border border-brand-border rounded-xl bg-[var(--card)] focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                      placeholder="https://example.com/logo.svg"
                    />
                    {draft.logoUrl && (
                      <div className="mt-3 p-4 bg-brand-bg rounded-xl border border-gray-100 flex items-center justify-center">
                        <img src={draft.logoUrl} alt="Logo preview" className="max-h-16 object-contain" />
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Favicon URL</label>
                    <p className="text-xs text-brand-text/60 mb-2">Browser tab icon (32×32 PNG or ICO)</p>
                    <input
                      type="text"
                      value={draft.faviconUrl}
                      onChange={(e) => update('faviconUrl', e.target.value)}
                      className="w-full px-4 py-3 border border-brand-border rounded-xl bg-[var(--card)] focus:ring-2 focus:ring-green-500/20 focus:border-green-500 transition-all text-sm"
                      placeholder="https://example.com/favicon.ico"
                    />
                    {draft.faviconUrl && (
                      <div className="mt-3 p-4 bg-brand-bg rounded-xl border border-gray-100 flex items-center justify-center">
                        <img src={draft.faviconUrl} alt="Favicon preview" className="max-h-8 object-contain" />
                      </div>
                    )}
                  </div>
                </div>
              </Section>
            )}
          </div>

          {/* ---- Right: Live Preview ---- */}
          <div className="xl:col-span-1">
            <div className="sticky top-44">
              <Section icon={Eye} title="Live Preview" badge={isDraftDifferent ? 'Modified' : isPublished ? 'Published' : 'New'}>
                <div
                  className="rounded-xl overflow-hidden border shadow-inner"
                  style={{
                    backgroundColor: draft.backgroundColor,
                    borderColor: draft.borderColor,
                    fontFamily: draft.typography,
                    color: draft.textColor,
                  }}
                >
                  {/* Mini Navbar */}
                  <div className="px-4 py-3 flex items-center justify-between" style={{ backgroundColor: draft.secondaryColor }}>
                    <span className="text-white font-bold text-sm" style={{ fontFamily: draft.headingFont }}>AutoLearn Spot</span>
                    <div className="flex gap-2">
                      <span className="w-2 h-2 rounded-full bg-green-400" />
                      <span className="w-2 h-2 rounded-full bg-yellow-400" />
                      <span className="w-2 h-2 rounded-full bg-red-400" />
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-5 space-y-4">
                    <h3 className="text-lg font-bold" style={{ fontFamily: draft.headingFont, color: draft.textColor }}>
                      Welcome Back!
                    </h3>
                    <p className="text-sm leading-relaxed" style={{ color: draft.textColor }}>
                      Continue your learning journey. You have <a href="#" style={{ color: draft.linkColor, textDecoration: 'underline' }}>3 courses</a> in progress.
                    </p>

                    {/* Card */}
                    <div className="p-4 rounded-lg border" style={{ borderColor: draft.borderColor, backgroundColor: 'rgba(255,255,255,0.6)' }}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold">React Masterclass</span>
                        <span className="text-xs px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: draft.accentColor }}>72%</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-gray-200">
                        <div className="h-2 rounded-full" style={{ width: '72%', backgroundColor: draft.primaryColor }} />
                      </div>
                    </div>

                    {/* Buttons */}
                    <div className="flex gap-2">
                      <button
                        className="flex-1 py-2 text-white text-xs font-semibold shadow-sm"
                        style={{ backgroundColor: draft.primaryColor, borderRadius: `${draft.buttonRadius}px` }}
                      >
                        Continue
                      </button>
                      <button
                        className="flex-1 py-2 text-xs font-semibold border"
                        style={{
                          borderColor: draft.borderColor,
                          color: draft.textColor,
                          borderRadius: `${draft.buttonRadius}px`,
                          backgroundColor: 'transparent',
                        }}
                      >
                        Browse All
                      </button>
                    </div>
                  </div>
                </div>

                {/* Status */}
                <div className="mt-4 p-3 bg-brand-bg rounded-xl text-xs text-brand-text/60 space-y-1">
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className={`font-medium ${isPublished ? 'text-brand-primary' : 'text-amber-600'}`}>
                      {isPublished ? 'Published' : 'Draft only'}
                    </span>
                  </div>
                  {isDraftDifferent && (
                    <div className="flex justify-between">
                      <span>Changes</span>
                      <span className="font-medium text-amber-600">Unpublished</span>
                    </div>
                  )}
                </div>
              </Section>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
