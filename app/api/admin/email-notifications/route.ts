import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

const DEFAULT_EVENT_TYPES = [
  'course_purchase',
  'course_sale',
  'new_student_enrollment',
  'author_application_submitted',
  'product_submitted',
  'withdrawal_request',
  'product_published',
  'product_rejected',
  'author_suspended',
  'author_reactivated',
  'course_completion',
  'quiz_completion',
  'assignment_submission',
  'partner_application_submitted',
  'scholarship_application_submitted',
  'system_alert',
];

/**
 * GET /api/admin/email-notifications
 * Get all email notification configurations
 */
export async function GET(request: Request) {
  try {
    const authorized = await isAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('email_notifications')
      .select('*')
      .order('event_type');

    if (!error && notifications && notifications.length > 0) {
      return NextResponse.json({ success: true, notifications });
    }

    // Fallback: check site_settings
    const { data: setting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'email_notifications')
      .maybeSingle();

    let settingsMap: Record<string, string[]> = {};
    if (setting?.value) {
      try {
        settingsMap = JSON.parse(setting.value);
      } catch {
        // ignore
      }
    }

    const defaultEmails = ['autolearnspot@gmail.com', 'femiadeleke2020@gmail.com'];
    const fallbackList = DEFAULT_EVENT_TYPES.map((evt) => ({
      id: evt,
      event_type: evt,
      recipient_emails: settingsMap[evt] || defaultEmails,
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    return NextResponse.json({ success: true, notifications: fallbackList });
  } catch (err: any) {
    console.error('[GET /api/admin/email-notifications] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/email-notifications
 * Create or update an email notification configuration
 */
export async function POST(request: Request) {
  try {
    const authorized = await isAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { event_type, recipient_emails, is_active } = body;

    if (!event_type || !recipient_emails || !Array.isArray(recipient_emails)) {
      return NextResponse.json({ error: 'event_type and recipient_emails are required' }, { status: 400 });
    }

    // Try upserting to email_notifications table
    const { data: notification, error } = await supabaseAdmin
      .from('email_notifications')
      .upsert({
        event_type,
        recipient_emails,
        is_active: is_active !== undefined ? is_active : true,
      }, {
        onConflict: 'event_type',
        ignoreDuplicates: false,
      })
      .select()
      .maybeSingle();

    if (!error && notification) {
      return NextResponse.json({ success: true, notification });
    }

    // If table doesn't exist, persist in site_settings
    console.warn('[POST /api/admin/email-notifications] Persisting to site_settings fallback:', error?.message);
    const { data: existingSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'email_notifications')
      .maybeSingle();

    let settingsMap: Record<string, string[]> = {};
    if (existingSetting?.value) {
      try {
        settingsMap = JSON.parse(existingSetting.value);
      } catch {
        // ignore
      }
    }

    settingsMap[event_type] = recipient_emails;

    await supabaseAdmin
      .from('site_settings')
      .upsert({
        key: 'email_notifications',
        value: JSON.stringify(settingsMap),
      }, { onConflict: 'key' });

    return NextResponse.json({
      success: true,
      notification: {
        id: event_type,
        event_type,
        recipient_emails,
        is_active: is_active !== undefined ? is_active : true,
      },
    });
  } catch (err: any) {
    console.error('[POST /api/admin/email-notifications] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error', details: err }, { status: 500 });
  }
}
