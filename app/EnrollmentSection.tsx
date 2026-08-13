"use client";

import Link from 'next/link'
import { CheckCircle, Star, Rocket, Users, GraduationCap, MessageCircle, Calendar } from 'lucide-react'
import { useDirectEnrollmentFee } from '@/hooks/useDirectEnrollmentFee'
import { useActiveCohort } from '@/hooks/useActiveCohort'
import { useScrollAnimation } from '@/hooks/useScrollAnimation'
import { useState, useEffect } from 'react'
import { getPublicSettings } from '@/lib/public-settings'

const enrollmentBenefits = [
  'Live classes every Saturday',
  'Recorded lessons',
  'Practical assignments',
  'Certificate',
  'Community',
];

export function EnrollmentSection() {
  const { fee, isLoading: feeLoading } = useDirectEnrollmentFee();
  const { cohort, isLoading: cohortLoading } = useActiveCohort();
  const [sectionRef, isVisible] = useScrollAnimation(0.1);
  const [settings, setSettings] = useState({
    enrollmentButtonText: 'Enroll Now',
    enrollmentAnnouncement: '',
    enrollmentPageHeadline: 'Enroll Now',
    enrollmentPageDescription: 'Join our next cohort and master AI automation',
  });

  useEffect(() => {
    async function loadSettings() {
      try {
        const loadedSettings = await getPublicSettings([
          'enrollment_button_text',
          'enrollment_announcement',
          'enrollment_page_headline',
          'enrollment_page_description'
        ]);
        setSettings(loadedSettings);
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
    loadSettings();
  }, []);

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  return (
    <section ref={sectionRef} className="py-6 sm:py-8 lg:py-12 bg-[#0c0e12]">
      <div className="max-w-[1280px] mx-auto px-6 lg:px-8">
        {settings.enrollmentAnnouncement && (
          <div className="mb-6 p-4 bg-[#00f0ff]/10 border border-[#00f0ff]/30 rounded-xl text-center">
            <p className="text-sm text-[#00f0ff] font-medium">{settings.enrollmentAnnouncement}</p>
          </div>
        )}
        <div className="grid md:grid-cols-2 gap-4 sm:gap-6 lg:gap-12">
          <div className={`border border-[#1f2229] bg-[#050505]/80 backdrop-blur-xl rounded-2xl p-4 sm:p-6 lg:p-8 xl:p-10 reveal-on-scroll ${isVisible ? 'is-visible' : ''}`}>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-[#e2e2e8] mb-4 sm:mb-6">
              {settings.enrollmentPageHeadline}
            </h2>
            <p className="text-sm text-[#b9cacb] mb-4 sm:mb-6">
              {settings.enrollmentPageDescription}
            </p>
            <div className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold text-[#00f0ff] mb-4 sm:mb-6">
              {feeLoading ? 'Loading...' : `₦${fee.toLocaleString()}`}
            </div>

            {cohort && !cohortLoading && (
              <div className="mb-6 sm:mb-8 border border-[#1f2229] bg-[#0c0e12]/60 rounded-xl p-4 sm:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Calendar className="h-4 w-4 text-[#00f0ff]" />
                  <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e2e2e8]">
                    {cohort.name}
                  </span>
                </div>
                {cohort.start_date && (
                  <p className="text-sm sm:text-base text-[#b9cacb]">
                    Starts <span className="text-[#00f0ff] font-semibold">{formatDate(cohort.start_date)}</span>
                  </p>
                )}
              </div>
            )}

            <div className="space-y-2 sm:space-y-3 lg:space-y-4 mb-6 sm:mb-8">
              {enrollmentBenefits.map((benefit, index) => (
                <div key={benefit} className="flex items-center gap-3" style={{ transitionDelay: `${index * 0.1}s` }}>
                  <CheckCircle className="h-5 w-5 text-[#00f0ff] flex-shrink-0" />
                  <span className="text-sm sm:text-base text-[#e2e2e8]">{benefit}</span>
                </div>
              ))}
            </div>
            
            <Link
              href="/enroll"
              className="flex items-center justify-center gap-2 w-full border border-[#00f0ff] bg-[#00f0ff] px-5 py-3 sm:px-6 sm:py-4 lg:px-8 lg:py-4 font-mono text-[11px] font-semibold uppercase tracking-[0.1em] text-[#00363a] transition duration-150 hover:translate-y-[-1px] hover:shadow-[0_0_0_1px_rgba(0,240,255,0.45)] btn-enhanced"
            >
              {feeLoading ? 'Loading...' : `${settings.enrollmentButtonText} — ₦${fee.toLocaleString()}`}
            </Link>
            
            <p className="text-center text-xs sm:text-sm text-[#b9cacb] mt-3 sm:mt-4">
              Secure payment powered by Paystack
            </p>
          </div>
          
          <div className={`reveal-on-scroll ${isVisible ? 'is-visible' : ''}`} style={{ transitionDelay: '0.2s' }}>
            <h3 className="text-lg sm:text-xl lg:text-2xl font-bold text-[#e2e2e8] mb-4 sm:mb-6 lg:mb-8">What You'll Get</h3>
            <div className="space-y-3 sm:space-y-4">
              {[
                { icon: Star, title: 'Lifetime Access', description: 'Access all content forever' },
                { icon: Rocket, title: 'Real Projects', description: 'Build 10+ production workflows' },
                { icon: Users, title: 'Community', description: 'Join a network of automation experts' },
                { icon: GraduationCap, title: 'Certificate', description: 'Verified credential from Moon Space Network' },
                { icon: MessageCircle, title: 'Support', description: 'Direct access to instructors' },
              ].map((item, index) => {
                const Icon = item.icon
                return (
                  <div
                    key={item.title}
                    className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-4 sm:p-5 lg:p-6 card-enhanced"
                    style={{ transitionDelay: `${0.3 + index * 0.1}s` }}
                  >
                    <div className="flex items-start gap-3 sm:gap-4">
                      <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 border border-[#00f0ff]/60 bg-[#00f0ff]/10 rounded-lg flex items-center justify-center">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 text-[#00f0ff]" />
                      </div>
                      <div className="flex-1">
                        <h4 className="text-base sm:text-lg font-semibold text-[#e2e2e8] mb-1 sm:mb-2">{item.title}</h4>
                        <p className="text-sm text-[#b9cacb]">{item.description}</p>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}