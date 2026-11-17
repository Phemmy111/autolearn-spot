'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { saveAffiliateRef } from '@/lib/affiliate-tracker';

/**
 * Captures ?ref=CODE from URL:
 * 1. Saves to localStorage with 30-day expiry.
 * 2. Sets client cookies (affiliate_ref, referral_code) for redundancy.
 * 3. Dispatches async click tracking to record ad traffic in DB.
 */
export function AffiliateRefCapture() {
  const searchParams = useSearchParams();

  useEffect(() => {
    const ref = searchParams.get('ref');
    if (ref && ref.trim().length > 0) {
      const cleanRef = ref.trim();

      // 1. Save in localStorage
      saveAffiliateRef(cleanRef);

      // 2. Set client cookies
      try {
        const maxAge = 30 * 24 * 60 * 60; // 30 days
        document.cookie = `affiliate_ref=${encodeURIComponent(cleanRef)}; path=/; max-age=${maxAge}; SameSite=Lax`;
        document.cookie = `referral_code=${encodeURIComponent(cleanRef)}; path=/; max-age=${maxAge}; SameSite=Lax`;
      } catch {
        // ignore in non-browser environments
      }

      // 3. Dispatch click tracking to database
      try {
        fetch('/api/referrals/track', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code: cleanRef,
            referrer: typeof document !== 'undefined' ? document.referrer : '',
            userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
          }),
        }).catch(() => {
          // Non-blocking fire-and-forget
        });
      } catch {
        // ignore
      }
    }
  }, [searchParams]);

  return null;
}
