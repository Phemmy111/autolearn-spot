"use client";

import { Calendar, Clock } from 'lucide-react';
import { useActiveCohort } from '@/hooks/useActiveCohort';

export function CohortCard() {
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
    <div className="border border-[#1f2229] bg-[#0c0e12]/80 backdrop-blur-xl rounded-xl p-4 sm:p-5 lg:p-6 animate-scale-in">
      <div className="space-y-3 sm:space-y-4">
        {/* Cohort Name */}
        <div>
          <h3 className="font-mono text-sm sm:text-base font-semibold uppercase tracking-[0.14em] text-[#e2e2e8]">
            {cohort.name}
          </h3>
        </div>

        {/* Start Date */}
        {formattedDate && (
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-[#00f0ff] flex-shrink-0" />
            <div>
              <p className="text-[10px] sm:text-xs text-[#b9cacb] uppercase tracking-wider">Starts</p>
              <p className="text-sm sm:text-base font-semibold text-[#00f0ff]">
                {formattedDate}
              </p>
            </div>
          </div>
        )}

        {/* Duration Badge */}
        <div className="inline-flex items-center gap-2 border border-[#00f0ff]/40 bg-[#00f0ff]/5 px-3 py-1.5 sm:px-4 sm:py-2 rounded-lg">
          <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-[#00f0ff] flex-shrink-0" />
          <span className="font-mono text-[10px] sm:text-[11px] font-semibold uppercase tracking-[0.14em] text-[#00f0ff]">
            4-Week Hands-On Training
          </span>
        </div>
      </div>
    </div>
  );
}
