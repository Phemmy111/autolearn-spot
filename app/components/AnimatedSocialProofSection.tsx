"use client";

import { useScrollAnimation } from '@/hooks/useScrollAnimation';
import { LiveActivityFeed } from '@/components/live-activity-feed';

export function AnimatedSocialProofSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1);

  return (
    <section ref={sectionRef} className="py-6 sm:py-8 lg:py-12 bg-[#050505]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className={`max-w-md mx-auto reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          <LiveActivityFeed />
        </div>
      </div>
    </section>
  )
}
