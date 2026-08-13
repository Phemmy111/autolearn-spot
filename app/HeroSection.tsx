"use client";

import Link from 'next/link'
import { Star, Play } from 'lucide-react'
import { useDirectEnrollmentFee } from '@/hooks/useDirectEnrollmentFee'
import { N8nWorkflowPanel } from '@/components/N8nWorkflowPanel'
import { CohortCard } from '@/components/CohortCard'
import { useState, useEffect } from 'react'
import { getPublicSettings } from '@/lib/public-settings'

export function HeroSection() {
  const { fee, isLoading: feeLoading } = useDirectEnrollmentFee();
  const [settings, setSettings] = useState({
    heroHeadline: 'BUILD REAL AI AUTOMATIONS. GET CERTIFIED.',
    heroSubheadline: 'Master n8n automation and build powerful AI-powered workflows without coding.',
    heroBadge: '4 WEEK HANDS-ON TRAINING',
    heroPrimaryCtaText: 'Enroll Now',
    heroPrimaryCtaLink: '/enroll',
    heroSecondaryCtaText: 'Watch Preview',
    heroSecondaryCtaLink: '#',
    heroVideoUrl: '',
    heroImageUrl: '',
    heroMediaType: 'video',
  });

  const [workflowShowcase, setWorkflowShowcase] = useState<any[]>([]);

  useEffect(() => {
    async function loadSettings() {
      try {
        const loadedSettings = await getPublicSettings([
          'hero_headline',
          'hero_subheadline',
          'hero_badge',
          'hero_primary_cta_text',
          'hero_primary_cta_link',
          'hero_secondary_cta_text',
          'hero_secondary_cta_link',
          'hero_video_url',
          'hero_image_url',
          'hero_media_type'
        ]);
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    loadSettings();
  }, []);

  useEffect(() => {
    async function fetchWorkflowShowcase() {
      try {
        const res = await fetch('/api/content/workflow-showcase?enabled=true');
        if (res.ok) {
          const data = await res.json();
          setWorkflowShowcase(data.items || []);
        }
      } catch (error) {
        console.error('Failed to fetch workflow showcase:', error);
      }
    }
    fetchWorkflowShowcase();
  }, []);

  return (
    <section className="relative min-h-screen flex items-center bg-[#050505] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#0c0e12] to-[#111317]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.1)_0%,transparent_50%)]" />

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 pt-24 md:pt-20 lg:pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 lg:space-y-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 border border-[var(--brand-primary)]/60 bg-[var(--brand-primary)]/10 px-3 py-1.5 sm:px-4 sm:py-2 animate-fade-in animate-stagger-1">
              <Star className="h-4 w-4 text-[var(--brand-primary)]" />
              <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--brand-primary)]">
                {settings.heroBadge}
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#e2e2e8] leading-tight animate-slide-up animate-stagger-2">
              {settings.heroHeadline}
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#b9cacb] leading-relaxed animate-slide-up animate-stagger-3">
              {settings.heroSubheadline}
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 animate-slide-up animate-stagger-4">
              <Link
                href={settings.heroPrimaryCtaLink}
                className="flex items-center justify-center gap-2 border border-[var(--brand-primary)] bg-[var(--brand-primary)] px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#00363a] transition duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_0_1px_var(--brand-primary-hover)] w-full sm:w-auto btn-enhanced"
              >
                {feeLoading ? 'Loading...' : `${settings.heroPrimaryCtaText} — ₦${fee.toLocaleString()}`}
              </Link>
              <Link
                href={settings.heroSecondaryCtaLink}
                className="flex items-center justify-center gap-2 border border-[var(--brand-primary)] bg-transparent px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[var(--brand-primary)] transition duration-150 hover:bg-[var(--brand-primary)]/10 w-full sm:w-auto btn-enhanced"
              >
                <Play className="h-4 w-4" />
                {settings.heroSecondaryCtaText}
              </Link>
            </div>
          </div>

          <div className="relative order-2 md:order-2 mt-8 md:mt-0 space-y-6">
            <div className="animate-scale-in animate-stagger-5">
              <CohortCard />
            </div>
            <div className="animate-scale-in animate-stagger-6">
              {workflowShowcase.length > 0 && workflowShowcase[0].video_url ? (
                <div className="relative">
                  {workflowShowcase[0].media_type === 'video' ? (
                    <video
                      src={workflowShowcase[0].video_url}
                      poster={workflowShowcase[0].poster_url}
                      controls
                      muted
                      playsInline
                      className="w-full h-auto rounded-xl border border-[#1f2229] shadow-[0_0_40px_rgba(0,240,255,0.1)]"
                    />
                  ) : (
                    <img
                      src={workflowShowcase[0].video_url}
                      alt="Workflow showcase"
                      className="w-full h-auto rounded-xl border border-[#1f2229] shadow-[0_0_40px_var(--brand-primary-soft)]"
                    />
                  )}
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-[var(--brand-primary)]/20 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
                </div>
              ) : (
                <>
                  <N8nWorkflowPanel />
                  <div className="absolute -top-4 -right-4 w-20 h-20 bg-[var(--brand-primary)]/20 rounded-full blur-2xl" />
                  <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}