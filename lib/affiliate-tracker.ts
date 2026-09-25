/**
 * Affiliate Tracker Utility
 * Saves ?ref=CODE from URL to localStorage with 30-day expiry.
 */

const STORAGE_KEY = 'affiliate_ref';
const EXPIRY_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

interface AffiliateRef {
  code: string;
  expires: number;
}

export function saveAffiliateRef(code: string): void {
  if (typeof window === 'undefined') return;
  const data: AffiliateRef = { code, expires: Date.now() + EXPIRY_MS };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function getActiveAffiliateRef(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data: AffiliateRef = JSON.parse(raw);
    if (Date.now() > data.expires) {
      localStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data.code;
  } catch {
    return null;
  }
}

export function clearAffiliateRef(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
