import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { auth } from '@clerk/nextjs/server';

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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('status')
      .eq('clerk_user_id', userId)
      .single();

    if (adminError || !admin || admin.status !== 'ACTIVE') {
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
      .single();

    if (error) {
      console.error('[PATCH /api/admin/email-notifications/[id]] error:', error);
      return NextResponse.json({ error: 'Failed to update email notification' }, { status: 500 });
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
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify admin access
    const { data: admin, error: adminError } = await supabaseAdmin
      .from('admins')
      .select('status')
      .eq('clerk_user_id', userId)
      .single();

    if (adminError || !admin || admin.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Forbidden: admin access required' }, { status: 403 });
    }

    const { id } = await params;

    const { error } = await supabaseAdmin
      .from('email_notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('[DELETE /api/admin/email-notifications/[id]] error:', error);
      return NextResponse.json({ error: 'Failed to delete email notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/admin/email-notifications/[id]] error:', err);
    return NextResponse.json({ error: err.message || 'Internal server error' }, { status: 500 });
  }
}
