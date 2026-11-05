/**
 * lib/meta-pixel.ts
 * Browser-side Meta Pixel tracking utilities for AutoLearn Spot.
 *
 * Implements:
 * - PageView (route changes & initial load without duplicates)
 * - ViewContent (viewing learning products)
 * - AddToCart (after successful cart addition)
 * - InitiateCheckout (checkout beginning)
 * - Purchase (only after verified payment with event_id deduplication)
 *
 * Uses Meta's exact standard parameters and eventID deduplication mechanism.
 */

import { META_PIXEL_ID, isAllowedDomain } from './meta-config';

// ─── Type Declarations ────────────────────────────────────────────────────────

declare global {
  interface Window {
    fbq?: {
      (action: 'init', pixelId: string, options?: Record<string, any>): void;
      (
        action: 'track' | 'trackCustom',
        eventName: string,
        params?: Record<string, any>,
        options?: { eventID?: string }
      ): void;
      loaded?: boolean;
      version?: string;
      queue?: any[];
      callMethod?: (...args: any[]) => void;
    };
    _fbq?: any;
  }
}

export interface MetaContentItem {
  id: string;
  quantity?: number;
  item_price?: number;
  title?: string;
}

export interface ViewContentParams {
  content_id: string;
  content_name: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

export interface AddToCartParams {
  content_id: string;
  content_name: string;
  content_category?: string;
  value?: number;
  currency?: string;
}

export interface InitiateCheckoutParams {
  contents?: MetaContentItem[];
  content_ids?: string[];
  num_items?: number;
  value?: number;
  currency?: string;
}

export interface PurchaseParams {
  event_id: string;
  value: number;
  currency?: string;
  content_ids?: string[];
  contents?: MetaContentItem[];
  num_items?: number;
}

// ─── Deduplication State (In-Memory per session) ──────────────────────────────

const executedEvents = new Set<string>();

function getEventKey(eventName: string, identifier: string): string {
  return `${eventName}:${identifier}`;
}

/**
 * Safe wrapper around window.fbq
 */
function safeFbq(
  action: 'track' | 'trackCustom',
  eventName: string,
  params?: Record<string, any>,
  options?: { eventID?: string }
): void {
  if (typeof window === 'undefined') return;
  if (!isAllowedDomain()) {
    console.debug(`[Meta Pixel] Skipped ${eventName} - domain not allowed.`);
    return;
  }

  if (typeof window.fbq !== 'function') {
    console.debug(`[Meta Pixel] fbq not available yet. Queuing or skipping ${eventName}`);
    return;
  }

  try {
    if (options?.eventID) {
      window.fbq(action, eventName, params, { eventID: options.eventID });
      console.debug(`[Meta Pixel] Tracked ${eventName} with eventID: ${options.eventID}`, params);
    } else {
      window.fbq(action, eventName, params);
      console.debug(`[Meta Pixel] Tracked ${eventName}`, params);
    }
  } catch (error) {
    console.warn(`[Meta Pixel] Error tracking ${eventName}:`, error);
  }
}

// ─── Exported Event Trackers ──────────────────────────────────────────────────

/**
 * Track PageView.
 * Guards against duplicate triggers for the same exact URL.
 */
export function fbqPageView(currentUrl?: string): void {
  const url = currentUrl || (typeof window !== 'undefined' ? window.location.href : '');
  const key = getEventKey('PageView', url);
  if (executedEvents.has(key)) return;
  
  // Keep history manageable
  if (executedEvents.size > 100) executedEvents.clear();
  executedEvents.add(key);

  safeFbq('track', 'PageView');
}

/**
 * Track ViewContent when a student views a published product.
 * Deduplicated per product per page visit.
 */
export function fbqViewContent(params: ViewContentParams): void {
  const key = getEventKey('ViewContent', params.content_id);
  if (executedEvents.has(key)) return;
  executedEvents.add(key);

  safeFbq('track', 'ViewContent', {
    content_name: params.content_name,
    content_ids: [params.content_id],
    content_type: 'product',
    content_category: params.content_category || 'Online Course',
    value: typeof params.value === 'number' ? params.value : 0,
    currency: params.currency || 'NGN',
  });
}

/**
 * Track AddToCart after a product is successfully added to the user's cart.
 */
export function fbqAddToCart(params: AddToCartParams): void {
  safeFbq('track', 'AddToCart', {
    content_name: params.content_name,
    content_ids: [params.content_id],
    content_type: 'product',
    content_category: params.content_category || 'Online Course',
    value: typeof params.value === 'number' ? params.value : 0,
    currency: params.currency || 'NGN',
  });
}

/**
 * Track InitiateCheckout when the user genuinely begins the checkout process.
 */
export function fbqInitiateCheckout(params: InitiateCheckoutParams): void {
  const contents = params.contents?.map((c) => ({
    id: c.id,
    quantity: c.quantity || 1,
    item_price: c.item_price,
  }));

  safeFbq('track', 'InitiateCheckout', {
    content_type: 'product',
    contents: contents && contents.length > 0 ? contents : undefined,
    content_ids: params.content_ids || contents?.map((c) => c.id),
    num_items: params.num_items || contents?.length || 1,
    value: typeof params.value === 'number' ? params.value : 0,
    currency: params.currency || 'NGN',
  });
}

/**
 * Track Purchase ONLY after payment is confirmed and verified.
 *
 * CRITICAL:
 * - Requires a durable event_id (e.g. `purchase_${order_id}` or `purchase_${reference}`).
 * - Uses localStorage/sessionStorage to strictly ensure the event is NEVER fired
 *   multiple times for the same order if the customer refreshes the success page.
 * - Passes the exact same `event_id` to Meta so it merges with the server-side CAPI event.
 */
export function fbqPurchase(params: PurchaseParams): boolean {
  if (!params.event_id) {
    console.error('[Meta Pixel] fbqPurchase requires an event_id');
    return false;
  }

  // Check persistent storage to prevent duplicates across page refreshes
  if (typeof window !== 'undefined') {
    const storageKey = `meta_purchase_fired_${params.event_id}`;
    if (sessionStorage.getItem(storageKey) === 'true') {
      console.debug(`[Meta Pixel] Purchase ${params.event_id} already tracked in this session.`);
      return false;
    }

    sessionStorage.setItem(storageKey, 'true');
  }

  const contents = params.contents?.map((c) => ({
    id: c.id,
    quantity: c.quantity || 1,
    item_price: c.item_price,
  }));

  safeFbq(
    'track',
    'Purchase',
    {
      content_type: 'product',
      contents: contents && contents.length > 0 ? contents : undefined,
      content_ids: params.content_ids || contents?.map((c) => c.id),
      num_items: params.num_items || contents?.length || 1,
      value: params.value,
      currency: params.currency || 'NGN',
    },
    { eventID: params.event_id }
  );

  return true;
}
