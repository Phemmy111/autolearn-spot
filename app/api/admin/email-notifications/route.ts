import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { currentUser } from '@clerk/nextjs/server';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/email-notifications
 * Get all email notification configurations
 */
export async function GET(request: Request) {
  try {
    // Get user email from Clerk
    const user = await currentUser();
    if (!user?.emailAddresses || user.emailAddresses.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('is_active')
      .eq('email', userEmail)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const { data: notifications, error } = await supabaseAdmin
      .from('email_notifications')
      .select('*')
      .order('event_type');

    if (error) {
      console.error('[GET /api/admin/email-notifications] error:', error);
      return NextResponse.json({ error: 'Failed to fetch email notifications' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notifications });
  } catch (err: any) {
    console.error('[GET /api/admin/email-notifications] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/admin/email-notifications
 * Create a new email notification configuration
 */
export async function POST(request: Request) {
  try {
    // Get user email from Clerk
    const user = await currentUser();
    if (!user?.emailAddresses || user.emailAddresses.length === 0) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userEmail = user.emailAddresses[0]?.emailAddress?.toLowerCase();
    if (!userEmail) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('is_active')
      .eq('email', userEmail)
      .eq('is_active', true)
      .single();

    if (adminError || !admin) {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const body = await request.json();
    const { event_type, recipient_emails, is_active } = body;

    if (!event_type || !recipient_emails || !Array.isArray(recipient_emails)) {
      return NextResponse.json({ error: 'event_type and recipient_emails are required' }, { status: 400 });
    }

    const { data: notification, error } = await supabaseAdmin
      .from('email_notifications')
      .insert({
        event_type,
        recipient_emails,
        is_active: is_active !== undefined ? is_active : true,
      })
      .select()
      .single();

    if (error) {
      console.error('[POST /api/admin/email-notifications] error:', error);
      return NextResponse.json({ error: 'Failed to create email notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true, notification });
  } catch (err: any) {
    console.error('[POST /api/admin/email-notifications] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
