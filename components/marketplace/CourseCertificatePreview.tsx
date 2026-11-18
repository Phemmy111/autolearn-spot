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
  authorName = "Lead Instructor",
  category = "Professional Certification",
}: CourseCertificatePreviewProps) {
  const [studentName, setStudentName] = useState("Alex Johnson");
  const currentDate = new Date().toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
  const certId = "ALS-2026-CERT-8841";

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

      {/* Ultra-High-Resolution Luxury Certificate Canvas (1200x800 Vector SVG) */}
      <div className="relative w-full rounded-2xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 group">
        
        {/* Floating Guaranteed Ribbon */}
        <div className="absolute top-3 left-3 sm:top-5 sm:left-5 z-20 flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md border border-white/20 text-white text-[10px] sm:text-xs font-bold shadow-md">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span>Accredited AutoLearn Credential</span>
        </div>

        <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-20 hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-600 text-white text-[10px] sm:text-xs font-bold shadow-md">
          <Sparkles className="w-3.5 h-3.5 text-amber-300" />
          <span>Verifiable Online</span>
        </div>

        {/* Vector SVG Certificate Canvas */}
        <svg
          viewBox="0 0 1200 800"
          className="w-full h-auto block select-none bg-[#030712]"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Background Radial Gradient */}
            <radialGradient id="cert-bg-grad" cx="50%" cy="50%" r="70%">
              <stop offset="0%" stopColor="#0B192C" />
              <stop offset="60%" stopColor="#050B14" />
              <stop offset="100%" stopColor="#020408" />
            </radialGradient>

            {/* Metallic Gold Gradient */}
            <linearGradient id="gold-grad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="25%" stopColor="#FDE68A" />
              <stop offset="50%" stopColor="#D97706" />
              <stop offset="75%" stopColor="#FCD34D" />
              <stop offset="100%" stopColor="#B45309" />
            </linearGradient>

            {/* Metallic Emerald Gradient */}
            <linearGradient id="emerald-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#059669" />
              <stop offset="50%" stopColor="#10B981" />
              <stop offset="100%" stopColor="#047857" />
            </linearGradient>

            {/* Guilloche Corner Pattern Definition */}
            <pattern id="guilloche-dots" x="0" y="0" width="24" height="24" patternUnits="userSpaceOnUse">
              <circle cx="12" cy="12" r="0.75" fill="#D4AF37" opacity="0.15" />
            </pattern>
          </defs>

          {/* Deep Canvas Background */}
          <rect width="1200" height="800" fill="url(#cert-bg-grad)" />

          {/* Subtle Geometric Security Mesh */}
          <rect width="1200" height="800" fill="url(#guilloche-dots)" />

          {/* Outer Gold Border Frame */}
          <rect
            x="24"
            y="24"
            width="1152"
            height="752"
            rx="12"
            fill="none"
            stroke="url(#gold-grad)"
            strokeWidth="3"
            opacity="0.85"
          />

          {/* Inner Emerald Border Frame */}
          <rect
            x="36"
            y="36"
            width="1128"
            height="728"
            rx="8"
            fill="none"
            stroke="url(#emerald-grad)"
            strokeWidth="1.5"
            strokeDasharray="6,3"
            opacity="0.6"
          />

          {/* Fine Hairline Border */}
          <rect
            x="44"
            y="44"
            width="1112"
            height="712"
            rx="6"
            fill="none"
            stroke="#ffffff"
            strokeWidth="0.5"
            opacity="0.2"
          />

          {/* Ornate Corner Accents */}
          {/* Top Left */}
          <path d="M 24 64 L 64 64 L 64 24" fill="none" stroke="url(#gold-grad)" strokeWidth="3" />
          <circle cx="64" cy="64" r="3" fill="#F59E0B" />

          {/* Top Right */}
          <path d="M 1176 64 L 1136 64 L 1136 24" fill="none" stroke="url(#gold-grad)" strokeWidth="3" />
          <circle cx="1136" cy="64" r="3" fill="#F59E0B" />

          {/* Bottom Left */}
          <path d="M 24 736 L 64 736 L 64 776" fill="none" stroke="url(#gold-grad)" strokeWidth="3" />
          <circle cx="64" cy="736" r="3" fill="#F59E0B" />

          {/* Bottom Right */}
          <path d="M 1176 736 L 1136 736 L 1136 776" fill="none" stroke="url(#gold-grad)" strokeWidth="3" />
          <circle cx="1136" cy="736" r="3" fill="#F59E0B" />

          {/* Certificate Header Insignia / Crest */}
          <g transform="translate(600, 105)">
            {/* Laurel Wreath Left */}
            <path
              d="M -30 -10 C -45 5 -45 25 -30 40 C -40 25 -40 10 -28 0"
              fill="url(#gold-grad)"
              opacity="0.9"
            />
            {/* Laurel Wreath Right */}
            <path
              d="M 30 -10 C 45 5 45 25 30 40 C 40 25 40 10 28 0"
              fill="url(#gold-grad)"
              opacity="0.9"
            />
            {/* Shield Crest Center */}
            <path
              d="M 0 -18 L 18 -6 L 18 14 C 18 26 0 34 0 34 C 0 34 -18 26 -18 14 L -18 -6 Z"
              fill="#059669"
              stroke="url(#gold-grad)"
              strokeWidth="1.5"
            />
            {/* Star Inside Crest */}
            <polygon
              points="0, -3 3, 5 10, 5 5, 9 7, 16 0, 12 -7, 16 -5, 9 -10, 5 -3, 5"
              fill="#FDE68A"
              transform="scale(0.8) translate(0, -2)"
            />
          </g>

          {/* Academy Brandmark Label */}
          <text
            x="600"
            y="170"
            textAnchor="middle"
            fill="url(#gold-grad)"
            fontSize="11"
            fontFamily="'JetBrains Mono', monospace"
            fontWeight="700"
            letterSpacing="5"
          >
            AUTOLEARN SPOT ACADEMY OF TECHNOLOGY
          </text>

          {/* Main Title: CERTIFICATE OF COMPLETION */}
          <text
            x="600"
            y="225"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="36"
            fontFamily="'Space Grotesk', system-ui, sans-serif"
            fontWeight="900"
            letterSpacing="3"
          >
            CERTIFICATE OF COMPLETION
          </text>

          {/* Horizontal Accent Line with Diamond */}
          <line x1="420" y1="245" x2="570" y2="245" stroke="url(#gold-grad)" strokeWidth="1" opacity="0.7" />
          <polygon points="600,242 604,245 600,248 596,245" fill="#F59E0B" />
          <line x1="630" y1="245" x2="780" y2="245" stroke="url(#gold-grad)" strokeWidth="1" opacity="0.7" />

          {/* Presentation Subtitle */}
          <text
            x="600"
            y="290"
            textAnchor="middle"
            fill="#94A3B8"
            fontSize="13"
            fontFamily="system-ui, sans-serif"
            fontWeight="600"
            letterSpacing="3"
          >
            THIS IS PROUDLY PRESENTED TO
          </text>

          {/* Student Recipient Name (Dynamic with gold glow) */}
          <text
            x="600"
            y="375"
            textAnchor="middle"
            fill="#ffffff"
            fontSize="54"
            fontFamily="Georgia, 'Playfair Display', serif"
            fontStyle="italic"
            fontWeight="700"
            letterSpacing="1"
            filter="drop-shadow(0 2px 10px rgba(245, 158, 11, 0.3))"
          >
            {studentName || "Alex Johnson"}
          </text>

          {/* Underline beneath Name */}
          <line x1="300" y1="395" x2="900" y2="395" stroke="url(#gold-grad)" strokeWidth="1.5" opacity="0.6" />

          {/* Qualification Statement */}
          <text
            x="600"
            y="435"
            textAnchor="middle"
            fill="#CBD5E1"
            fontSize="13"
            fontFamily="system-ui, sans-serif"
            fontWeight="500"
            letterSpacing="0.5"
          >
            For successfully demonstrating hands-on proficiency and completing the master curriculum in
          </text>

          {/* Dynamically Wired Course Title Box */}
          <g transform="translate(600, 485)">
            {/* Pill Container */}
            <rect
              x="-380"
              y="-28"
              width="760"
              height="56"
              rx="28"
              fill="#06201b"
              stroke="url(#emerald-grad)"
              strokeWidth="1.5"
            />
            {/* Course Title Text */}
            <text
              x="0"
              y="8"
              textAnchor="middle"
              fill="#34D399"
              fontSize={courseTitle.length > 36 ? "24" : "28"}
              fontFamily="'Space Grotesk', system-ui, sans-serif"
              fontWeight="800"
              letterSpacing="0.8"
            >
              {courseTitle}
            </text>
          </g>

          {/* Issue Details & Signatures Bar */}
          
          {/* Left Column: Date & Certification */}
          <g transform="translate(180, 620)">
            <text x="0" y="0" textAnchor="middle" fill="#FFFFFF" fontSize="15" fontFamily="'Space Grotesk', sans-serif" fontWeight="700">
              {currentDate}
            </text>
            <line x1="-80" y1="12" x2="80" y2="12" stroke="#475569" strokeWidth="1" />
            <text x="0" y="28" textAnchor="middle" fill="#94A3B8" fontSize="11" fontFamily="system-ui, sans-serif" fontWeight="600" letterSpacing="0.5">
              DATE OF ISSUANCE
            </text>
            <text x="0" y="44" textAnchor="middle" fill="#64748B" fontSize="10" fontFamily="'JetBrains Mono', monospace">
              Verified Credential
            </text>
          </g>

          {/* Center Column: 3D Embossed Gold Foil Seal with Ribbons */}
          <g transform="translate(600, 630)">
            {/* Ribbon Tails */}
            <path d="M -18 20 L -30 65 L -10 55 L 0 65 L -5 20 Z" fill="#B45309" opacity="0.9" />
            <path d="M 18 20 L 30 65 L 10 55 L 0 65 L 5 20 Z" fill="#D97706" opacity="0.9" />

            {/* Seal Starburst Outer */}
            <circle cx="0" cy="0" r="46" fill="url(#gold-grad)" filter="drop-shadow(0 4px 12px rgba(245, 158, 11, 0.4))" />
            {/* Seal Inner Ring */}
            <circle cx="0" cy="0" r="38" fill="#047857" stroke="url(#gold-grad)" strokeWidth="1.5" />
            {/* Seal Center Star */}
            <polygon
              points="0,-16 4,-4 16,-4 7,3 10,15 0,8 -10,15 -7,3 -16,-4 -4,-4"
              fill="#FDE68A"
            />
            {/* Ring Inscription (Simplified) */}
            <circle cx="0" cy="0" r="32" fill="none" stroke="#FDE68A" strokeWidth="0.75" strokeDasharray="3,2" />
          </g>

          {/* Right Column: Instructor Signature & Approval */}
          <g transform="translate(1020, 620)">
            {/* Stylized Script Signature Graphic */}
            <path
              d="M -60 -5 C -40 -18 -20 10 0 -8 C 20 -25 40 5 60 -3"
              fill="none"
              stroke="#FDE68A"
              strokeWidth="2.5"
              strokeLinecap="round"
              opacity="0.85"
            />
            <line x1="-80" y1="12" x2="80" y2="12" stroke="#475569" strokeWidth="1" />
            <text x="0" y="28" textAnchor="middle" fill="#FFFFFF" fontSize="12" fontFamily="'Space Grotesk', sans-serif" fontWeight="700">
              {authorName}
            </text>
            <text x="0" y="44" textAnchor="middle" fill="#94A3B8" fontSize="10" fontFamily="system-ui, sans-serif" fontWeight="600" letterSpacing="0.5">
              LEAD COURSE INSTRUCTOR
            </text>
          </g>

          {/* Bottom Verification Footer & QR Code Placeholder */}
          <g transform="translate(60, 750)">
            <text x="0" y="0" fill="#64748B" fontSize="10" fontFamily="'JetBrains Mono', monospace">
              ID: {certId} • Verify online at autolearnspot.com/certificate/verify
            </text>
          </g>

          <g transform="translate(1140, 750)">
            <text x="0" y="0" textAnchor="end" fill="#64748B" fontSize="10" fontFamily="'JetBrains Mono', monospace">
              100% Guaranteed & Permanent Credential
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
