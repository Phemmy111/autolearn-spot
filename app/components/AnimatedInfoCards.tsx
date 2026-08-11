"use client";

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

export function AnimatedInfoCards() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1);

  return (
    <section ref={sectionRef} className="py-6 lg:py-8 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-4 lg:gap-6">
          <div className={`border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-4 lg:p-6 text-center reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb] mb-2">COHORT</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#e2e2e8]">Current Cohort</div>
          </div>
          <div className={`border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-4 lg:p-6 text-center reveal-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '0.1s' }}>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[#b9cacb] mb-2">SEATS LEFT</div>
            <div className="text-lg sm:text-xl lg:text-2xl font-bold text-[#00f0ff]">Remaining Seats</div>
          </div>
        </div>
      </div>
    </section>
  )
}
