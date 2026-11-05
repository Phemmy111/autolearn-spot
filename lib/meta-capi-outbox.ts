/**
 * lib/meta-capi-outbox.ts
 * Durable outbox and delivery tracking for Meta Conversions API (CAPI).
 *
 * Separates Payment Fulfillment Idempotency from Meta Event Delivery Reliability:
 * - When an order is already PAID or enrollment exists, payment fulfillment is skipped,
 *   but this outbox ensures the CAPI Purchase event is still safely delivered/retried.
 * - Tracks delivery status ('pending' | 'delivered' | 'failed' | 'skipped').
 * - Preserves the exact same event_id across all retries for Meta deduplication.
 * - Protects against duplicate payment fulfillment and concurrent duplicate calls.
 */

import { supabaseAdmin } from './supabase';
import { sendMetaCapiEvent, CapiEventPayload, CapiResponse } from './meta-conversions-api';

export type CapiDeliveryStatus = 'pending' | 'delivered' | 'failed' | 'skipped';

export interface CapiOutboxRecord {
  event_id: string;
  event_name: string;
  status: CapiDeliveryStatus;
  attempts: number;
  last_attempt_at: string;
  delivered_at?: string | null;
  fbtrace_id?: string | null;
  error?: string | null;
}

const OUTBOX_PREFIX = 'meta_capi_';

/**
 * Fetch the persistent delivery record for an event.
 */
export async function getCapiDeliveryRecord(
  eventId: string
): Promise<CapiOutboxRecord | null> {
  try {
    const key = `${OUTBOX_PREFIX}${eventId}`;
    const { data, error } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error || !data?.value) return null;
    return JSON.parse(data.value) as CapiOutboxRecord;
  } catch (err) {
    console.warn('[Meta CAPI Outbox] Error fetching delivery record:', err);
    return null;
  }
}

/**
 * Persist or update the delivery record for an event.
 */
export async function setCapiDeliveryRecord(
  record: CapiOutboxRecord
): Promise<void> {
  try {
    const key = `${OUTBOX_PREFIX}${record.event_id}`;
    await supabaseAdmin
      .from('site_settings')
      .upsert(
        {
          key,
          value: JSON.stringify(record),
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' }
      );
  } catch (err) {
    console.warn('[Meta CAPI Outbox] Error saving delivery record:', err);
  }
}

/**
 * Safely dispatch an event with durable outbox tracking and retry capability.
 *
 * Idempotency guarantees:
 * - If already marked 'delivered', will NOT re-send to Meta.
 * - If previous attempt failed or was skipped (e.g. token was missing), retries with the SAME event_id.
 * - Protects against concurrent processing using attempt timestamps.
 */
export async function dispatchCapiWithOutbox(
  payload: CapiEventPayload
): Promise<CapiResponse & { already_delivered?: boolean }> {
  const existing = await getCapiDeliveryRecord(payload.event_id);

  // 1. If already successfully delivered, do not re-send
  if (existing?.status === 'delivered') {
    console.info(
      `[Meta CAPI Outbox] Event ${payload.event_id} was already delivered to Meta at ${existing.delivered_at}. Skipping re-send.`
    );
    return {
      success: true,
      event_id: payload.event_id,
      already_delivered: true,
      fbtrace_id: existing.fbtrace_id || undefined,
    };
  }

  // 2. Concurrency protection: If another thread started an attempt in the last 10 seconds
  if (
    existing?.status === 'pending' &&
    Date.now() - new Date(existing.last_attempt_at).getTime() < 10000
  ) {
    console.info(
      `[Meta CAPI Outbox] Event ${payload.event_id} currently in-flight in another process. Yielding.`
    );
    return {
      success: true,
      event_id: payload.event_id,
      reason: 'in_flight',
    };
  }

  // 3. Mark in-flight
  const attemptCount = (existing?.attempts || 0) + 1;
  const inFlightRecord: CapiOutboxRecord = {
    event_id: payload.event_id,
    event_name: payload.event_name,
    status: 'pending',
    attempts: attemptCount,
    last_attempt_at: new Date().toISOString(),
  };
  await setCapiDeliveryRecord(inFlightRecord);

  // 4. Dispatch to Meta
  const result = await sendMetaCapiEvent(payload);

  // 5. Update outbox record based on result
  if (result.success && !result.skipped) {
    // Successfully received by Meta
    await setCapiDeliveryRecord({
      ...inFlightRecord,
      status: 'delivered',
      delivered_at: new Date().toISOString(),
      fbtrace_id: result.fbtrace_id || null,
      error: null,
    });
  } else if (result.skipped) {
    // Skipped because token not configured yet
    await setCapiDeliveryRecord({
      ...inFlightRecord,
      status: 'skipped',
      error: result.reason || 'META_CAPI_ACCESS_TOKEN not configured',
    });
  } else {
    // Delivery failed; mark for retry
    await setCapiDeliveryRecord({
      ...inFlightRecord,
      status: 'failed',
      error: result.error || 'Request failed',
    });
  }

  return result;
}
