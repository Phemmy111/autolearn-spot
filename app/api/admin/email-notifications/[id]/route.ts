import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';

export const dynamic = 'force-dynamic';

/**
 * PATCH /api/admin/email-notifications/[id]
 * Update an email notification configuration
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = await isAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { recipient_emails, is_active } = body;

    const updateData: any = {};
    if (recipient_emails !== undefined) updateData.recipient_emails = recipient_emails;
    if (is_active !== undefined) updateData.is_active = is_active;

    const { data: notification, error } = await supabaseAdmin
      .from('email_notifications')
      .update(updateData)
      .eq('id', id)
      .select()
      .maybeSingle();

    if (error || !notification) {
      // Fallback: update in site_settings
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

      if (recipient_emails) {
        settingsMap[id] = recipient_emails;
        await supabaseAdmin
          .from('site_settings')
          .upsert({
            key: 'email_notifications',
            value: JSON.stringify(settingsMap),
          }, { onConflict: 'key' });
      }

      return NextResponse.json({
        success: true,
        notification: {
          id,
          event_type: id,
          recipient_emails: recipient_emails || settingsMap[id] || [],
          is_active: is_active !== undefined ? is_active : true,
        },
      });
    }

    return NextResponse.json({ success: true, notification });
  } catch (err: any) {
    console.error('[PATCH /api/admin/email-notifications/[id]] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/email-notifications/[id]
 * Delete an email notification configuration
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorized = await isAdmin();
    if (!authorized) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('email_notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.warn('[DELETE /api/admin/email-notifications/[id]] Table error:', error.message);
    }

    return NextResponse.json({ success: true, message: 'Notification deleted successfully' });
  } catch (err: any) {
    console.error('[DELETE /api/admin/email-notifications/[id]] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
