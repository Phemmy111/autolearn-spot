/**
 * lib/meta-conversions-api.ts
 * Server-side Meta Conversions API (CAPI) implementation for AutoLearn Spot.
 *
 * Requirements:
 * - Safely disabled until META_CAPI_ACCESS_TOKEN is configured in Vercel.
 * - Zero hardcoded or invented tokens.
 * - Never expose access tokens in logs or client bundles.
 * - Standard SHA-256 hashing for user data (email, phone, first name, last name).
 * - Exact matching `event_id` to deduplicate against browser pixel events.
 * - Non-blocking: failures or missing token will not fail payments or webhooks.
 */

import crypto from 'crypto';
import { META_PIXEL_ID } from './meta-config';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CapiUserData {
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  clientIpAddress?: string | null;
  clientUserAgent?: string | null;
  fbc?: string | null;
  fbp?: string | null;
}

export interface CapiContentItem {
  id: string;
  quantity?: number;
  item_price?: number;
  title?: string;
}

export interface CapiCustomData {
  currency?: string;
  value?: number;
  content_type?: string;
  content_name?: string;
  content_ids?: string[];
  contents?: CapiContentItem[];
  num_items?: number;
  order_id?: string;
}

export interface CapiEventPayload {
  event_name: 'Purchase' | 'InitiateCheckout' | 'AddToCart' | 'ViewContent' | 'PageView';
  event_time?: number; // UNIX timestamp in seconds
  event_id: string; // Deduplication ID matching browser pixel
  event_source_url?: string;
  action_source?: 'website' | 'system_generated';
  user_data: CapiUserData;
  custom_data?: CapiCustomData;
}

export interface CapiResponse {
  success: boolean;
  skipped?: boolean;
  reason?: string;
  event_id: string;
  events_received?: number;
  fbtrace_id?: string;
  error?: string;
}

// ─── Normalization & Hashing Helpers ──────────────────────────────────────────

/**
 * Standard SHA-256 hash formatted as lowercase hex string.
 * Meta CAPI specification requires SHA-256 hash of lowercase, trimmed UTF-8 string.
 */
export function hashForMeta(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  if (!normalized) return null;
  return crypto.createHash('sha256').update(normalized).digest('hex');
}

/**
 * Normalize and hash a phone number according to Meta requirements.
 * Removes all non-digit characters, keeps country code prefix if present.
 */
export function hashPhoneForMeta(phone: string | null | undefined): string | null {
  if (!phone) return null;
  const digitsOnly = phone.replace(/\D/g, '');
  if (!digitsOnly) return null;
  return crypto.createHash('sha256').update(digitsOnly).digest('hex');
}

/**
 * Format user_data object with normalized, hashed identifiers.
 * Strictly adheres to Meta Business Tools Terms and Privacy Guidelines.
 * Never includes raw PII, payment info, passwords, or unauthorized data.
 */
function buildHashedUserData(raw: CapiUserData) {
  const userData: Record<string, any> = {};

  if (raw.email) {
    const hashedEmail = hashForMeta(raw.email);
    if (hashedEmail) userData.em = [hashedEmail];
  }

  if (raw.phone) {
    const hashedPhone = hashPhoneForMeta(raw.phone);
    if (hashedPhone) userData.ph = [hashedPhone];
  }

  if (raw.firstName) {
    const hashedFn = hashForMeta(raw.firstName);
    if (hashedFn) userData.fn = [hashedFn];
  }

  if (raw.lastName) {
    const hashedLn = hashForMeta(raw.lastName);
    if (hashedLn) userData.ln = [hashedLn];
  }

  // Non-hashed technical metadata
  if (raw.clientIpAddress) userData.client_ip_address = raw.clientIpAddress;
  if (raw.clientUserAgent) userData.client_user_agent = raw.clientUserAgent;
  if (raw.fbc) userData.fbc = raw.fbc;
  if (raw.fbp) userData.fbp = raw.fbp;

  return userData;
}

// ─── Main Dispatch Function ───────────────────────────────────────────────────

/**
 * Dispatch an event to Meta Conversions API.
 *
 * Graceful Fallback:
 * If META_CAPI_ACCESS_TOKEN is not configured, this immediately returns { success: true, skipped: true }
 * without throwing or blocking critical business logic.
 */
export async function sendMetaCapiEvent(
  event: CapiEventPayload
): Promise<CapiResponse> {
  const accessToken = process.env.META_CAPI_ACCESS_TOKEN?.trim();
  const pixelId = META_PIXEL_ID;

  // Safe skip if access token is not yet provided
  if (!accessToken) {
    console.info(
      `[Meta CAPI] Server event skipped (${event.event_name}, event_id: ${event.event_id}): META_CAPI_ACCESS_TOKEN is not configured.`
    );
    return {
      success: true,
      skipped: true,
      reason: 'META_CAPI_ACCESS_TOKEN not configured',
      event_id: event.event_id,
    };
  }

  try {
    const eventTime = event.event_time || Math.floor(Date.now() / 1000);
    const userData = buildHashedUserData(event.user_data);

    const payloadData: Record<string, any> = {
      event_name: event.event_name,
      event_time: eventTime,
      event_id: event.event_id,
      event_source_url:
        event.event_source_url ||
        'https://www.autolearnspot.com/checkout/success',
      action_source: event.action_source || 'website',
      user_data: userData,
    };

    if (event.custom_data) {
      payloadData.custom_data = {
        currency: event.custom_data.currency || 'NGN',
        value: typeof event.custom_data.value === 'number' ? event.custom_data.value : 0,
        content_type: event.custom_data.content_type || 'product',
        content_name: event.custom_data.content_name,
        content_ids: event.custom_data.content_ids,
        contents: event.custom_data.contents?.map((c) => ({
          id: c.id,
          quantity: c.quantity || 1,
          item_price: c.item_price,
        })),
        num_items: event.custom_data.num_items,
        order_id: event.custom_data.order_id,
      };
    }

    const requestBody: Record<string, any> = {
      data: [payloadData],
    };

    // If a Meta Test Event Code is set in environment (from Meta Events Manager Test Events tab)
    const testEventCode = process.env.META_CAPI_TEST_EVENT_CODE?.trim();
    if (testEventCode) {
      requestBody.test_event_code = testEventCode;
    }

    const endpoint = `https://graph.facebook.com/v19.0/${pixelId}/events`;

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error('[Meta CAPI] Graph API Error response:', {
        status: response.status,
        error: responseData.error,
        event_id: event.event_id,
        event_name: event.event_name,
      });

      return {
        success: false,
        event_id: event.event_id,
        error: responseData.error?.message || 'Meta CAPI request failed',
        fbtrace_id: responseData.error?.fbtrace_id,
      };
    }

    console.info(`[Meta CAPI] Event ${event.event_name} dispatched successfully:`, {
      event_id: event.event_id,
      events_received: responseData.events_received,
      fbtrace_id: responseData.fbtrace_id,
    });

    return {
      success: true,
      event_id: event.event_id,
      events_received: responseData.events_received,
      fbtrace_id: responseData.fbtrace_id,
    };
  } catch (error: any) {
    console.error(`[Meta CAPI] Unexpected exception dispatching ${event.event_name}:`, error);
    return {
      success: false,
      event_id: event.event_id,
      error: error.message || 'Unknown network error',
    };
  }
}
