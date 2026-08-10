"use client";

import { useState, useEffect } from 'react';

export function useDirectEnrollmentFee() {
  const [fee, setFee] = useState<number>(8000);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchFee() {
      try {
        const res = await fetch('/api/settings/direct-enrollment-fee');
        if (res.ok) {
          const data = await res.json();
          setFee(data.fee);
        }
      } catch (e) {
        console.error('Failed to fetch direct enrollment fee:', e);
      } finally {
        setIsLoading(false);
      }
    }

    fetchFee();
  }, []);

  return { fee, isLoading };
}