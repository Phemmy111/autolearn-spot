/**
 * lib/meta-config.ts
 * Central configuration for Meta Pixel and Meta Conversions API (CAPI).
 *
 * NOTE: Pixel ID is 3247216238795822.
 * (1034478519648163 is the Meta Account ID - NEVER use it as Pixel ID).
 */

export const META_PIXEL_ID =
  process.env.NEXT_PUBLIC_META_PIXEL_ID || '3247216238795822';

/**
 * Production domains allowlisted in Meta Events Manager.
 */
export const ALLOWED_DOMAINS = [
  'autolearnspot.com',
  'www.autolearnspot.com',
  'autolearn-spot.vercel.app',
];

/**
 * Check if running in a domain where Pixel tracking should be active.
 * In development or non-production domains, events can still be sent
 * if a test event code is configured, but will avoid polluting production data.
 */
export function isAllowedDomain(): boolean {
  if (typeof window === 'undefined') return true;
  const hostname = window.location.hostname.toLowerCase();
  
  // Allow localhost / preview if test mode is enabled
  if (
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname.endsWith('.vercel.app')
  ) {
    return true;
  }

  return ALLOWED_DOMAINS.some(
    (d) => hostname === d || hostname.endsWith(`.${d}`)
  );
}
