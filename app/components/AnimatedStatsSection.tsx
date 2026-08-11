"use client";

import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const stats = [
  { value: '10+', label: 'Real Workflows Built' },
  { value: '12', label: 'Live Hands-on Sessions' },
  { value: '4 Weeks', label: 'Program Duration' },
  { value: '100%', label: 'Practical Learning' },
];

export function AnimatedStatsSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1);

  return (
    <section ref={sectionRef} className="py-4 sm:py-6 lg:py-8 bg-[#050505]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          {stats.map((stat, index) => (
            <div 
              key={stat.label} 
              className={`border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-3 sm:p-4 lg:p-6 text-center reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}
              style={{ transitionDelay: `${index * 0.1}s` }}
            >
              <div className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl font-bold text-[#00f0ff] stat-counter">{stat.value}</div>
              <div className="text-xs sm:text-sm text-[#b9cacb] mt-1 sm:mt-2">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
