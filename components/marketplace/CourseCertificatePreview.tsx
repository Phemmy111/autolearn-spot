"use client";

import React, { useState } from "react";
import {
  Award,
  CheckCircle2,
  ShieldCheck,
  Download,
  Share2,
  Sparkles,
  QrCode,
  ExternalLink,
  Lock,
  UserCheck
} from "lucide-react";

interface CourseCertificatePreviewProps {
  courseTitle: string;
  authorName?: string;
  category?: string;
}

export function CourseCertificatePreview({
  courseTitle,
  authorName = "Femi Adeleke",
  category = "Professional Certification",
}: CourseCertificatePreviewProps) {
  const [studentName, setStudentName] = useState("Femi Adeleke");
  
  // Format current date in executive certificate style (e.g. November 18, 2026)
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  const certId = "CERT-07D13D81";

  return (
    <div className="bg-[var(--card)]/90 backdrop-blur-xl border border-brand-border rounded-3xl p-6 sm:p-8 lg:p-10 shadow-xl transition-all animate-in fade-in slide-in-from-bottom-4 duration-700 fill-mode-both">
      
      {/* Header & Value Proposition */}
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
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

      {/* High-Resolution Luxury Parchment Certificate Canvas (1024x682 Vector SVG) */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-700/20 group">
        
        {/* Floating Guaranteed Ribbon */}
        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-900/80 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-bold shadow-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Accredited AutoLearn Credential</span>
        </div>

        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-700 text-white text-[10px] sm:text-xs font-bold shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Verifiable Online</span>
        </div>

        {/* Vector SVG Certificate Canvas */}
        <svg
          viewBox="0 0 1024 682"
          className="w-full h-auto block select-none bg-[#fbf6ec]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft Shadow Filter */}
            <filter id="soft-text-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1" stdDeviation="1" floodColor="#000000" floodOpacity="0.12" />
            </filter>
            
            {/* Metallic Gold Gradient for Filigree */}
            <linearGradient id="parchment-gold" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#C59B27" />
              <stop offset="50%" stopColor="#DFBA55" />
              <stop offset="100%" stopColor="#9E7616" />
            </linearGradient>
          </defs>

          {/* High-Resolution Textured Parchment Background with Victorian Corner Filigree & Gold/Emerald Seal */}
          <image
            href="/certificate-template-parchment-clean.png"
            x="0"
            y="0"
            width="1024"
            height="682"
            preserveAspectRatio="xMidYMid slice"
          />

          {/* ─── DYNAMIC OVERLAYS MATCHING IMAGE 2 SPECIFICATION ─── */}

          {/* 1. Recipient Student Name (Dynamic from Preview Input) */}
          <g transform="translate(512, 298)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#064e3b"
              fontSize={studentName.length > 25 ? "32" : studentName.length > 18 ? "38" : "44"}
              fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
              fontWeight="800"
              fontStyle="italic"
              letterSpacing="0.5"
              filter="url(#soft-text-shadow)"
            >
              {studentName}
            </text>
          </g>

          {/* 2. Ornate Filigree Underline Accent Beneath Name */}
          <g transform="translate(512, 332)">
            <path
              d="M -180 0 C -120 -8 -60 4 0 0 C 60 4 120 -8 180 0"
              fill="none"
              stroke="url(#parchment-gold)"
              strokeWidth="1.5"
              opacity="0.85"
            />
            {/* Central Ornate Knot */}
            <circle cx="0" cy="0" r="3" fill="#C59B27" />
            <circle cx="-12" cy="0" r="1.5" fill="#C59B27" />
            <circle cx="12" cy="0" r="1.5" fill="#C59B27" />
          </g>

          {/* 3. In Recognition of Completing the (Label) */}
          <text
            x="512"
            y="370"
            textAnchor="middle"
            fill="#334155"
            fontSize="15"
            fontFamily="Georgia, 'Times New Roman', serif"
            fontStyle="italic"
            fontWeight="500"
            letterSpacing="0.5"
          >
            In Recognition of Completing the
          </text>

          {/* 4. Course Title (Dynamic from Props, e.g. "AI Automation with n8n") */}
          <g transform="translate(512, 422)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#0f172a"
              fontSize={courseTitle.length > 35 ? "22" : courseTitle.length > 24 ? "26" : "30"}
              fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
              fontWeight="900"
              letterSpacing="0.5"
              filter="url(#soft-text-shadow)"
            >
              {courseTitle}
            </text>
          </g>

          {/* 5. Date Badge (Bottom Left) */}
          <g transform="translate(230, 526)">
            {/* Calendar Icon Graphic */}
            <g transform="translate(-105, -16) scale(0.9)">
              <rect x="0" y="3" width="18" height="15" rx="3" fill="none" stroke="#b45309" strokeWidth="1.5" />
              <line x1="0" y1="8" x2="18" y2="8" stroke="#b45309" strokeWidth="1.2" />
              <circle cx="5" cy="12" r="1" fill="#b45309" />
              <circle cx="9" cy="12" r="1" fill="#b45309" />
              <circle cx="13" cy="12" r="1" fill="#b45309" />
              <line x1="4" y1="0" x2="4" y2="4" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
              <line x1="14" y1="0" x2="14" y2="4" stroke="#b45309" strokeWidth="1.5" strokeLinecap="round" />
            </g>
            {/* Date Text */}
            <text
              x="-80"
              y="0"
              fill="#1e293b"
              fontSize="16"
              fontFamily="'Playfair Display', Georgia, serif"
              fontWeight="700"
            >
              {currentDate}
            </text>
            <text
              x="-15"
              y="20"
              textAnchor="middle"
              fill="#64748b"
              fontSize="13"
              fontFamily="Georgia, serif"
              fontStyle="italic"
            >
              Date
            </text>
          </g>

          {/* 6. Founder Signature (Bottom Right) */}
          <g transform="translate(740, 524)">
            {/* Calligraphic Founder Signature */}
            <path
              d="M -70 -12 C -45 -30 -25 15 -5 -8 C 15 -25 35 10 55 -5 C 70 -15 85 5 95 -8"
              fill="none"
              stroke="#0f172a"
              strokeWidth="2.2"
              strokeLinecap="round"
              opacity="0.9"
            />
            {/* Signature Underline */}
            <line x1="-80" y1="5" x2="80" y2="5" stroke="#94a3b8" strokeWidth="1" />
            
            {/* Signatory Name */}
            <text
              x="0"
              y="22"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="15"
              fontFamily="'Playfair Display', Georgia, serif"
              fontWeight="800"
            >
              A. Femi Adeleke
            </text>
            {/* Signatory Title */}
            <text
              x="0"
              y="38"
              textAnchor="middle"
              fill="#64748b"
              fontSize="12"
              fontFamily="Georgia, serif"
              fontStyle="italic"
            >
              Founder & Lead Instructor
            </text>
          </g>

          {/* 7. Bottom Real Motto & Brandmark */}
          <g transform="translate(512, 642)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#475569"
              fontSize="12"
              fontFamily="'Space Grotesk', system-ui, sans-serif"
              fontWeight="700"
              letterSpacing="1"
            >
              AutoLearn Spot • Learn • Automate • Succeed
            </text>
          </g>

          {/* 8. Certificate ID Tag (Subtle Top Right) */}
          <g transform="translate(940, 48)">
            <rect
              x="-60"
              y="-12"
              width="120"
              height="20"
              rx="4"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="0.75"
              opacity="0.9"
            />
            <text
              x="0"
              y="2"
              textAnchor="middle"
              fill="#475569"
              fontSize="9"
              fontFamily="'JetBrains Mono', monospace"
              fontWeight="700"
              letterSpacing="0.5"
            >
              ID: {certId}
            </text>
          </g>
        </svg>
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
