"use client";

import { CheckCircle } from 'lucide-react';
import { useScrollAnimation } from '@/hooks/useScrollAnimation';

const curriculumWeeks = [
  {
    step: '01',
    title: 'n8n Fundamentals',
    phase: 'WEEK 1',
    body: 'Build your first workflow from scratch.',
    items: ['Theory + Account Setup', 'Form -> Email Automation', 'Add Google Sheets'],
  },
  {
    step: '02',
    title: 'AI-Powered Workflows',
    phase: 'WEEK 2',
    body: 'Connect ChatGPT to your automations.',
    items: ['AI Telegram Bot', 'AI Email Auto-Responder', 'AI Content Summarizer'],
  },
  {
    step: '03',
    title: 'Deploy & Scale',
    phase: 'WEEK 3',
    body: 'Take your workflows live on Railway.',
    items: ['Deploy n8n on Railway', 'AI Customer Support Bot', 'Lead Capture + AI Qualifier'],
  },
  {
    step: '04',
    title: 'Capstone Project',
    phase: 'WEEK 4',
    body: 'Build a full product and get certified.',
    items: ['Social Media Content Bot', 'Capstone Build Day', 'Presentation + Certificate'],
    active: true,
  },
];

export function AnimatedCurriculumSection() {
  const [sectionRef, isVisible] = useScrollAnimation(0.1);

  return (
    <section ref={sectionRef} id="curriculum" className="py-6 sm:py-8 lg:py-12 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        <div className={`text-center mb-4 sm:mb-6 lg:mb-8 reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#e2e2e8] mb-3 sm:mb-4">
            Curriculum
          </h2>
          <p className="text-sm sm:text-base text-[#b9cacb] max-w-2xl mx-auto">
            A structured 4-week program designed to take you from beginner to certified automation expert
          </p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
          {curriculumWeeks.map((week, index) => (
            <div
              key={week.step}
              className={`border ${
                week.active 
                  ? 'border-[#00f0ff] bg-[#00f0ff]/5' 
                  : 'border-[#1f2229] bg-[#050505]/80'
              } backdrop-blur-xl rounded-2xl p-4 sm:p-5 lg:p-6 hover:border-[#00f0ff]/50 transition-all duration-300 card-enhanced reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}
              style={{ transitionDelay: `${0.1 + index * 0.1}s` }}
            >
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center ${
                  week.active 
                    ? 'bg-[#00f0ff] text-[#00363a]' 
                    : 'bg-[#1f2229] text-[#00f0ff]'
                }`}>
                  <span className="text-lg sm:text-xl font-bold">{week.step}</span>
                </div>
                {week.active && (
                  <span className="px-2 py-1 bg-[#00f0ff]/10 text-[#00f0ff] text-xs font-mono uppercase tracking-wider">
                    Current
                  </span>
                )}
              </div>
              <div className="font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-[#00f0ff] mb-2">
                {week.phase}
              </div>
              <h3 className="text-base sm:text-lg font-bold text-[#e2e2e8] mb-2">{week.title}</h3>
              <p className="text-sm text-[#b9cacb] mb-3 sm:mb-4">{week.body}</p>
              <ul className="space-y-1 sm:space-y-2">
                {week.items.map((item) => (
                  <li key={item} className="flex items-center gap-2 text-xs text-[#b9cacb]">
                    <CheckCircle className="h-3 w-3 text-[#00f0ff] flex-shrink-0" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
