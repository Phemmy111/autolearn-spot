"use client";

import { Webhook, BrainCircuit, Rocket, MessageCircle, GraduationCap, Target } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const featureIcons = [
  { icon: Webhook, title: 'n8n Automation', description: 'Master visual workflow automation' },
  { icon: BrainCircuit, title: 'AI Integration', description: 'Connect ChatGPT to real workflows' },
  { icon: Rocket, title: 'Real Projects', description: 'Build 10+ production-ready automations' },
  { icon: MessageCircle, title: 'Live Support', description: 'Direct access to instructors' },
  { icon: GraduationCap, title: 'Certification', description: 'Verified credential from Moon Space Network' },
  { icon: Target, title: 'Career Opportunities', description: 'Launch your automation career' },
];

export function AnimatedFeaturesSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1);

  return (
    <section ref={sectionRef} id="tools" className="py-6 sm:py-8 lg:py-12 bg-[#050505]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className={`text-center mb-4 sm:mb-6 lg:mb-8 reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e2e8] mb-3 sm:mb-4">
            What You'll Learn
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
          {featureIcons.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={feature.title}
                className={`border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 hover:border-[#00f0ff]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(0,240,255,0.1)] card-enhanced reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}
                style={{ transitionDelay: `${0.1 + index * 0.1}s` }}
              >
                <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center border border-[#00f0ff]/60 bg-[#00f0ff]/10 rounded-xl mb-3 sm:mb-4">
                  <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#00f0ff]" />
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-[#e2e2e8] mb-2">{feature.title}</h3>
                <p className="text-sm text-[#b9cacb]">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
