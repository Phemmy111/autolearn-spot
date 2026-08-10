"use client";

import Link from 'next/link'
import { Star, Play } from 'lucide-react'
import { useDirectEnrollmentFee } from '@/hooks/useDirectEnrollmentFee'
import { N8nWorkflowPanel } from '@/components/N8nWorkflowPanel'

export function HeroSection() {
  const { fee, isLoading: feeLoading } = useDirectEnrollmentFee();

  return (
    <section className="relative min-h-screen flex items-center bg-[#050505] overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-[#050505] via-[#0c0e12] to-[#111317]" />
      <div className="absolute inset-0 opacity-30 [background-image:radial-gradient(circle_at_50%_50%,rgba(0,240,255,0.1)_0%,transparent_50%)]" />

      <div className="relative max-w-[1280px] mx-auto px-6 lg:px-8 pt-24 md:pt-20 lg:pt-16 pb-12">
        <div className="grid md:grid-cols-2 gap-8 lg:gap-12 items-center">
          <div className="space-y-6 lg:space-y-8 flex flex-col justify-center">
            <div className="inline-flex items-center gap-2 border border-[#00f0ff]/60 bg-[#00f0ff]/10 px-3 py-1.5 sm:px-4 sm:py-2">
              <Star className="h-4 w-4 text-[#00f0ff]" />
              <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00f0ff]">
                4 WEEK HANDS-ON TRAINING
              </span>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#e2e2e8] leading-tight">
              BUILD REAL AI
              <span className="text-[#00f0ff]"> AUTOMATIONS.</span>
              <br />
              GET CERTIFIED.
            </h1>

            <p className="text-sm sm:text-base lg:text-lg text-[#b9cacb] leading-relaxed">
              Master n8n automation and build powerful AI-powered workflows without coding.
            </p>

            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
              <Link
                href="/enroll"
                className="flex items-center justify-center gap-2 border border-[#00f0ff] bg-[#00f0ff] px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#00363a] transition duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_0_1px_rgba(0,240,255,0.45)] w-full sm:w-auto"
              >
                {feeLoading ? 'Loading...' : `Enroll Now — ₦${fee.toLocaleString()}`}
              </Link>
              <button className="flex items-center justify-center gap-2 border border-[#00f0ff] bg-transparent px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#00f0ff] transition duration-150 hover:bg-[#00f0ff]/10 w-full sm:w-auto">
                <Play className="h-4 w-4" />
                Watch Preview
              </button>
            </div>
          </div>

          <div className="relative order-2 md:order-2 mt-8 md:mt-0">
            <N8nWorkflowPanel />
            <div className="absolute -top-4 -right-4 w-20 h-20 bg-[#00f0ff]/20 rounded-full blur-2xl" />
            <div className="absolute -bottom-4 -left-4 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl" />
          </div>
        </div>
      </div>
    </section>
  );
}