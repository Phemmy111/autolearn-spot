"use client";

import { Award, Video, Rocket, Infinity, Users } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const trustBadges = [
  { icon: Award, text: 'Certificate Issued' },
  { icon: Video, text: 'Live Classes' },
  { icon: Rocket, text: 'Practical Projects' },
  { icon: Infinity, text: 'Lifetime Access' },
  { icon: Users, text: 'Community Support' },
];

export function AnimatedTrustBadgesSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1);

  return (
    <section ref={sectionRef} className="py-4 sm:py-6 lg:py-8 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 lg:gap-4">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon
            return (
              <div
                key={badge.text}
                className={`flex items-center gap-2 border border-[#1f2229] bg-[#050505]/80 backdrop-blur-xl rounded-full px-3 py-1.5 sm:px-4 sm:py-2 lg:px-5 lg:py-2.5 reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}
                style={{ transitionDelay: `${index * 0.1}s` }}
              >
                <Icon className="h-4 w-4 text-[#00f0ff]" />
                <span className="text-xs sm:text-sm text-[#e2e2e8]">{badge.text}</span>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
