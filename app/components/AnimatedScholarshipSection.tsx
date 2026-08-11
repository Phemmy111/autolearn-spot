"use client";

import Link from 'next/link';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function AnimatedScholarshipSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1);

  return (
    <section ref={sectionRef} className="py-4 sm:py-6 lg:py-8 bg-[#050505]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className={`border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-10 reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 lg:gap-8">
            <div className="flex-1 text-center sm:text-left">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#e2e2e8] mb-2">
                Need Financial Support?
              </h2>
              <p className="text-sm sm:text-base text-[#b9cacb]">
                Apply for our scholarship programme and get trained at a reduced rate.
              </p>
            </div>
            <Link
              href="/scholarship/apply"
              className="flex items-center justify-center gap-2 border border-purple-500 bg-purple-500/10 px-5 py-3 sm:px-6 sm:py-3 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-purple-400 transition duration-150 hover:bg-purple-500/20 whitespace-nowrap btn-enhanced"
            >
              Apply For Scholarship
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}
