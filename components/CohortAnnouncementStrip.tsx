"use client";

import { Rocket, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { useActiveCohort } from '@/hooks/useActiveCohort';

export function CohortAnnouncementStrip() {
  const { cohort, isLoading } = useActiveCohort();

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Don't render if no active cohort or still loading
  if (!cohort || isLoading) {
    return null;
  }

  const formattedDate = formatDate(cohort.start_date);

  return (
    <div className="relative border-b border-neutral-200 bg-gray-100]/95 backdrop-blur-xl animate-fade-in">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-2.5 sm:py-3">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3 flex-1">
            <Rocket className="h-4 w-4 sm:h-5 sm:w-5 text-[#10b981] flex-shrink-0" />
            <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2">
              <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e2e2e8]">
                {cohort.name} IS NOW OPEN
              </span>
              {formattedDate && (
                <>
                  <span className="hidden sm:inline text-[#1f2229]">•</span>
                  <span className="text-[10px] sm:text-[11px] text-neutral-500">
                    Starts {formattedDate}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <Link
            href="/enroll"
            className="flex items-center gap-1.5 border border-[#10b981]/60 bg-gray-100]/10 px-3 py-1.5 sm:px-4 sm:py-2 font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.1em] text-[#10b981] hover:bg-gray-100]/20 transition-colors flex-shrink-0"
          >
            Enroll Now
            <ArrowRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
