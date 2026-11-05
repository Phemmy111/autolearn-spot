'use client';

/**
 * components/meta/MetaPixel.tsx
 * Meta Pixel component adapted for Next.js 16 / React 19 App Router.
 *
 * Uses confirmed Pixel ID: 3247216238795822.
 * Single initialization in root layout.
 * Tracks initial PageView and client-side route transitions without duplicates.
 */

import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { useEffect, useRef, Suspense } from 'react';
import { META_PIXEL_ID } from '@/lib/meta-config';
import { fbqPageView } from '@/lib/meta-pixel';

function NavigationTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedUrl = useRef<string>('');

  useEffect(() => {
    if (!pathname) return;

    // Construct current full relative URL
    const queryString = searchParams?.toString();
    const currentUrl = queryString ? `${pathname}?${queryString}` : pathname;

    // Prevent duplicate PageView firing for the same URL (e.g. React Strict Mode or rerenders)
    if (lastTrackedUrl.current === currentUrl) return;
    lastTrackedUrl.current = currentUrl;

    // Small delay to ensure fbq is available on initial hydration
    if (typeof window !== 'undefined' && typeof window.fbq === 'function') {
      fbqPageView(currentUrl);
    }
  }, [pathname, searchParams]);

  return null;
}

export function MetaPixel() {
  const pixelId = META_PIXEL_ID;

  return (
    <>
      {/* Route change tracker wrapped in Suspense for useSearchParams */}
      <Suspense fallback={null}>
        <NavigationTracker />
      </Suspense>

      {/* Primary Meta Pixel Script */}
      <Script
        id="meta-pixel"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            !function(f,b,e,v,n,t,s)
            {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
            n.callMethod.apply(n,arguments):n.queue.push(arguments)};
            if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
            n.queue=[];t=b.createElement(e);t.async=!0;
            t.src=v;s=b.getElementsByTagName(e)[0];
            s.parentNode.insertBefore(t,s)}(window, document,'script',
            'https://connect.facebook.net/en_US/fbevents.js');
            fbq('init', '${pixelId}');
            fbq('track', 'PageView');
          `,
        }}
      />

      {/* Noscript fallback */}
      <noscript>
        <img
          height="1"
          width="1"
          style={{ display: 'none' }}
          src={`https://www.facebook.com/tr?id=${pixelId}&ev=PageView&noscript=1`}
          alt=""
        />
      </noscript>
    </>
  );
}
