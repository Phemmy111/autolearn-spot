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

      {/* High-Resolution Luxury Parchment Certificate Canvas (1024x683 Vector SVG) */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-700/20 group">
        
        {/* Floating Guaranteed Ribbon */}
        <div className="absolute top-2.5 left-2.5 sm:top-4 sm:left-4 z-20 flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-slate-900/85 backdrop-blur-md border border-white/20 text-white text-[9px] sm:text-xs font-bold shadow-md">
          <ShieldCheck className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400" />
          <span>Accredited AutoLearn Credential</span>
        </div>

        <div className="absolute top-2.5 right-2.5 sm:top-4 sm:right-4 z-20 hidden sm:flex items-center gap-1.5 px-2.5 py-1 sm:px-3 sm:py-1 rounded-full bg-emerald-700 text-white text-[9px] sm:text-xs font-bold shadow-md">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-300" />
          <span>Verifiable Online</span>
        </div>

        {/* Vector SVG Certificate Canvas */}
        <svg
          viewBox="0 0 1024 683"
          className="w-full h-auto block select-none bg-[#fbf6ec]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Soft Shadow Filter */}
            <filter id="soft-text-shadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="1.5" stdDeviation="1.5" floodColor="#000000" floodOpacity="0.14" />
            </filter>
            
            {/* Metallic Gold Gradient for Medal & Badges */}
            <linearGradient id="gold-medal-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="30%" stopColor="#FDE68A" />
              <stop offset="60%" stopColor="#D97706" />
              <stop offset="85%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>
          </defs>

          {/* 1. 100% Clean Textured Parchment Background (Image 3) - Zero Blur Smudges */}
          <image
            href="/certificate-template-parchment-clean.png"
            x="0"
            y="0"
            width="1024"
            height="683"
            preserveAspectRatio="xMidYMid slice"
          />

          {/* ─── DYNAMIC OVERLAYS ALIGNED TO LUXURY PARCHMENT DIVIDERS ─── */}

          {/* 2. Top Header: Official AutoLearn Spot Brandmark & Motto */}
          <g transform="translate(512, 58)">
            {/* Real Official AutoLearn Brandmark Logo */}
            <image
              href="/autolearn-brandmark.png"
              x="-182"
              y="-28"
              width="56"
              height="56"
              preserveAspectRatio="xMidYMid meet"
            />

            {/* Brand Separator Bar */}
            <line x1="-116" y1="-22" x2="-116" y2="24" stroke="#cbd5e1" strokeWidth="1.5" />

            {/* Brand Title & Real Motto */}
            <text
              x="-102"
              y="2"
              fill="#047857"
              fontSize="24"
              fontFamily="'Space Grotesk', system-ui, sans-serif"
              fontWeight="800"
              letterSpacing="1.5"
            >
              AUTOLEARN <tspan fill="#0f172a">SPOT</tspan>
            </text>
            <text
              x="-102"
              y="20"
              fill="#475569"
              fontSize="9.5"
              fontFamily="'Space Grotesk', system-ui, sans-serif"
              fontWeight="700"
              letterSpacing="2.6"
            >
              LEARN • AUTOMATE • SUCCEED
            </text>
          </g>

          {/* 3. Certificate Title: "CERTIFICATE OF COMPLETION" (Grand, Prominent, 42px) */}
          <g transform="translate(512, 132)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="42"
              fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
              fontWeight="900"
              letterSpacing="3.5"
              filter="url(#soft-text-shadow)"
            >
              CERTIFICATE OF COMPLETION
            </text>
          </g>

          {/* 4. Presentation Lead: "This certificate is proudly presented to" */}
          <g transform="translate(512, 208)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#334155"
              fontSize="19"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontStyle="italic"
              fontWeight="500"
              letterSpacing="0.4"
            >
              This certificate is proudly presented to
            </text>
          </g>

          {/* 5. Recipient Student Name (Dynamic from Preview Input - Large, Bold Italic Emerald) */}
          <g transform="translate(512, 272)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#045a38"
              fontSize={studentName.length > 25 ? "44" : studentName.length > 18 ? "54" : "64"}
              fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
              fontWeight="800"
              fontStyle="italic"
              letterSpacing="0.8"
              filter="url(#soft-text-shadow)"
            >
              {studentName}
            </text>
          </g>

          {/* 6. In Recognition of Completing the */}
          <g transform="translate(512, 368)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#334155"
              fontSize="19"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontStyle="italic"
              fontWeight="500"
              letterSpacing="0.4"
            >
              In Recognition of Completing the
            </text>
          </g>

          {/* 7. Course Title (Dynamic from Props - Bold, Wide, Commanding) */}
          <g transform="translate(512, 420)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#0f172a"
              fontSize={courseTitle.length > 35 ? "28" : courseTitle.length > 24 ? "34" : "38"}
              fontFamily="'Playfair Display', Georgia, 'Times New Roman', serif"
              fontWeight="900"
              letterSpacing="0.6"
              filter="url(#soft-text-shadow)"
            >
              {courseTitle}
            </text>
          </g>

          {/* 8. Credentials Zone: Date (Left), Authentic Gold Medal (Center), Real Signature (Right), Real QR (Far Right) */}

          {/* 8A. Date Column */}
          <g transform="translate(230, 545)">
            {/* Calendar Icon Graphic */}
            <g transform="translate(-115, -18) scale(1.1)">
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
              x="-82"
              y="2"
              fill="#0f172a"
              fontSize="18"
              fontFamily="'Playfair Display', Georgia, serif"
              fontWeight="700"
            >
              {currentDate}
            </text>
            {/* Underline */}
            <line x1="-115" y1="12" x2="75" y2="12" stroke="#cbd5e1" strokeWidth="1.2" />
            {/* Date Label */}
            <text
              x="-20"
              y="32"
              textAnchor="middle"
              fill="#64748b"
              fontSize="14"
              fontFamily="Georgia, serif"
              fontStyle="italic"
            >
              Date
            </text>
          </g>

          {/* 8B. Center Authentic 3D Gold Ribbon Medal with AutoLearn Logo */}
          <g transform="translate(512, 534)">
            <image
              href="/certificate-gold-seal.png"
              x="-82"
              y="-95"
              width="164"
              height="190"
              preserveAspectRatio="xMidYMid meet"
              filter="drop-shadow(0 6px 14px rgba(180,83,9,0.35))"
            />
          </g>

          {/* 8C. Real Authentic Founder Signature (Right) */}
          <g transform="translate(740, 545)">
            {/* Authentic Femi Adeleke Handwritten Signature */}
            <image
              href="/signature-femi-real.png"
              x="-95"
              y="-55"
              width="190"
              height="58"
              preserveAspectRatio="xMidYMid meet"
            />
            {/* Signature Underline */}
            <line x1="-95" y1="12" x2="95" y2="12" stroke="#cbd5e1" strokeWidth="1.2" />
            
            {/* Signatory Name */}
            <text
              x="0"
              y="32"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="16"
              fontFamily="'Playfair Display', Georgia, serif"
              fontWeight="800"
            >
              A. Femi Adeleke
            </text>
            {/* Signatory Title */}
            <text
              x="0"
              y="48"
              textAnchor="middle"
              fill="#64748b"
              fontSize="13"
              fontFamily="Georgia, serif"
              fontStyle="italic"
            >
              Founder & Lead Instructor
            </text>
          </g>

          {/* 8D. Real Scannable QR Code & Online Verification (Far Right) */}
          <g transform="translate(915, 540)">
            {/* Clean QR White Rounded Card */}
            <rect
              x="-42"
              y="-46"
              width="84"
              height="84"
              rx="6"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="1.2"
              filter="drop-shadow(0 2px 6px rgba(0,0,0,0.08))"
            />
            {/* Real Scannable High-Res QR Code Image */}
            <image
              href="/certificate-qr-sample.png"
              x="-38"
              y="-42"
              width="76"
              height="76"
              preserveAspectRatio="xMidYMid meet"
            />

            {/* Verification Label */}
            <text
              x="0"
              y="52"
              textAnchor="middle"
              fill="#475569"
              fontSize="9.5"
              fontFamily="'Space Grotesk', system-ui, sans-serif"
              fontWeight="700"
              letterSpacing="0.4"
            >
              Verify Certificate
            </text>
          </g>

          {/* 9. Bottom Motto (Positioned cleanly below Divider 3 at y=654) */}
          <g transform="translate(512, 654)">
            <text
              x="0"
              y="0"
              textAnchor="middle"
              fill="#475569"
              fontSize="12"
              fontFamily="'Space Grotesk', system-ui, sans-serif"
              fontWeight="700"
              letterSpacing="1.2"
            >
              AutoLearn Spot • Learn • Automate • Succeed
            </text>
          </g>

          {/* 10. Certificate ID Tag (Subtle Top Right) */}
          <g transform="translate(935, 46)">
            <rect
              x="-55"
              y="-11"
              width="110"
              height="22"
              rx="4"
              fill="#ffffff"
              stroke="#cbd5e1"
              strokeWidth="0.8"
              opacity="0.95"
            />
            <text
              x="0"
              y="4"
              textAnchor="middle"
              fill="#475569"
              fontSize="9.5"
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
