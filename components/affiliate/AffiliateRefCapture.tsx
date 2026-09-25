'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveAffiliateRef } from '@/lib/affiliate-tracker';

/**
 * Captures ?ref=CODE from the URL and saves it to localStorage with 30-day expiry.
 * This is a client-only component, wrapped in Suspense where used.
 */
export function AffiliateRefCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.length > 0) {
      saveAffiliateRef(ref);
    }
  }, [searchParams]);

  return null;
}
