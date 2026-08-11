"use client";

import { useState, useEffect } from 'react';

export interface ActiveCohort {
  id: string;
  name: string;
  slug: string;
  start_date: string | null;
  end_date: string | null;
  status: string;
  is_current: boolean;
}

export function useActiveCohort() {
  const [cohort, setCohort] = useState<ActiveCohort | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchCohort() {
      try {
        const res = await fetch('/api/public/cohort');
        if (res.ok) {
          const data = await res.json();
          if (data.success && data.cohort) {
            setCohort(data.cohort);
          }
        }
      } catch (e) {
        console.error('Failed to fetch active cohort:', e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchCohort();
  }, []);

  return { cohort, isLoading };
}
