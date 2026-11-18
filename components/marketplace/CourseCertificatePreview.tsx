"use client";

import React, { useState, useEffect, useRef } from "react";
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Download,
  Share2,
  Sparkles,
  UserCheck
} from "lucide-react";
import { CertificateTemplate } from "@/components/certificate/CertificateTemplate";
import { CertificateLayout, DEFAULT_CERTIFICATE_LAYOUT } from "@/lib/certificate-layout";

interface CourseCertificatePreviewProps {
  courseTitle: string;
  authorName?: string;
  category?: string;
  initialLayout?: CertificateLayout;
}

export function CourseCertificatePreview({
  courseTitle,
  authorName = "Femi Adeleke",
  category = "Professional Certification",
  initialLayout,
}: CourseCertificatePreviewProps) {
  const [studentName, setStudentName] = useState("Femi Adeleke");
  const [layout, setLayout] = useState<CertificateLayout>(initialLayout || DEFAULT_CERTIFICATE_LAYOUT);
  const containerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);

  // If initial layout not provided, fetch current saved master certificate layout from DB
  useEffect(() => {
    if (initialLayout && initialLayout.elements && initialLayout.elements.length > 0) {
      setLayout(initialLayout);
    } else {
      fetch('/api/settings/public?keys=certificate_layout')
        .then((res) => res.json())
        .then((data) => {
          if (data.settings?.certificate_layout) {
            try {
              const parsed =
                typeof data.settings.certificate_layout === 'string'
                  ? JSON.parse(data.settings.certificate_layout)
                  : data.settings.certificate_layout;
              if (parsed && Array.isArray(parsed.elements) && parsed.elements.length > 0) {
                setLayout(parsed);
              }
            } catch (err) {
              console.warn('Failed to parse certificate layout', err);
            }
          }
        })
        .catch((err) => console.warn('Failed to fetch certificate layout', err));
    }
  }, [initialLayout]);

  // Responsive scale calculator for 1200x800 template
  useEffect(() => {
    const updateScale = () => {
      if (containerRef.current) {
        const containerWidth = containerRef.current.clientWidth;
        const newScale = containerWidth / 1200;
        setScale(newScale);
      }
    };

    updateScale();
    window.addEventListener('resize', updateScale);
    return () => window.removeEventListener('resize', updateScale);
  }, []);

  // Format current date in executive certificate style (e.g. November 18, 2026)
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const certId = "CERT-07D13D81";

  return (
    <div className="bg-[var(--card)]/90 backdrop-blur-xl border border-brand-border rounded-3xl p-3.5 sm:p-6 lg:p-8 shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      
      {/* Header & Value Proposition */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 sm:mb-8 gap-4 px-1 sm:px-2">
        <div>
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold mb-3 border border-emerald-500/20">
            <Award className="w-4 h-4 text-emerald-600" />
            <span>Guaranteed Official Credential</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-black text-brand-text tracking-tight">
            Certificate of Completion Included
          </h2>
          <p className="text-sm sm:text-base text-brand-text/70 mt-1 max-w-xl">
            Upon finishing all video lessons, you automatically receive an official, verifiable digital credential to showcase on LinkedIn, your portfolio, and your CV.
          </p>
        </div>

        {/* Interactive Name Preview Field */}
        <div className="bg-brand-bg border border-brand-border/80 rounded-2xl p-2.5 sm:p-3 flex items-center gap-2.5 max-w-xs self-start md:self-auto shadow-2xs">
          <UserCheck className="w-4 h-4 text-emerald-600 shrink-0 ml-1" />
          <div className="flex-1 min-w-0">
            <label className="text-[10px] uppercase font-bold tracking-wider text-brand-text/50 block">
              Preview with your name
            </label>
            <input
              type="text"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value || "Your Name")}
              placeholder="Enter your name"
              className="w-full bg-transparent text-xs sm:text-sm font-bold text-brand-text outline-none truncate"
            />
          </div>
        </div>
      </div>

      {/* High-Resolution Luxury Certificate Canvas (WYSIWYG 1200x800 Responsive Scaled) */}
      <div
        ref={containerRef}
        className="relative w-full aspect-[1200/800] rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-700/20 group select-none bg-[#fbf6ec]"
      >
        {/* Floating Guaranteed Ribbon */}
        <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-xs font-bold shadow-md pointer-events-none">
          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
          <span>Accredited AutoLearn Credential</span>
        </div>

        <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 hidden sm:flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-emerald-700 text-white text-[9px] sm:text-xs font-bold shadow-md pointer-events-none">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
          <span>Verifiable Online</span>
        </div>

        {/* Scaled Certificate Template */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '1200px',
            height: '800px',
            transformOrigin: 'top left',
            transform: `scale(${scale})`,
          }}
        >
          <CertificateTemplate
            layout={layout}
            name={studentName}
            date={currentDate}
            course={courseTitle}
            certificateId={certId}
            backgroundSrc="/certificate-template-parchment-clean.png"
            logoSrc="/autolearn-brandmark-bold.png"
            sealSrc="/certificate-gold-seal.png"
            signatureUrl="/signature-femi-real.png"
            qrSrc="/certificate-qr-sample.png"
            title={layout?.elements?.find((el: any) => el.id === 'title')?.text || "CERTIFICATE OF COMPLETION"}
            subtitle={layout?.elements?.find((el: any) => el.id === 'subtitle')?.text || "This certificate is proudly presented to"}
            bodyText={layout?.elements?.find((el: any) => el.id === 'bodyText')?.text || "In Recognition of Completing the"}
            founderName={layout?.elements?.find((el: any) => el.id === 'founderName')?.text || authorName || "A. Femi Adeleke"}
            signatureText={layout?.elements?.find((el: any) => el.id === 'signatureText')?.text || "Founder & Lead Instructor"}
            footer={layout?.elements?.find((el: any) => el.id === 'footer')?.text || "AutoLearn Spot • Learn • Automate • Succeed"}
          />
        </div>
      </div>

      {/* 4 Trust & Guarantee Badges Underneath */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-brand-border/60">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <CheckCircle2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-brand-text">Online Verification</h4>
            <p className="text-[11px] text-brand-text/60 mt-0.5">Unique URL & QR code for employers</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <Share2 className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-brand-text">LinkedIn Integration</h4>
            <p className="text-[11px] text-brand-text/60 mt-0.5">1-click export to your public profile</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <Download className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-brand-text">High-Res Vector PDF</h4>
            <p className="text-[11px] text-brand-text/60 mt-0.5">Instant print-ready download upon completion</p>
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 shrink-0">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-brand-text">Lifetime Authenticity</h4>
            <p className="text-[11px] text-brand-text/60 mt-0.5">Permanent access in student portal</p>
          </div>
        </div>
      </div>
    </div>
  );
}
