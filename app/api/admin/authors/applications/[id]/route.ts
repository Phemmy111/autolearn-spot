import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = params;

    const { data: application, error } = await supabaseAdmin
      .from('author_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    return NextResponse.json({ application });
  } catch (error) {
    console.error('Error in admin application details API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { status, admin_review_note } = body;

    // First get the current application data for email sending
    const { data: currentApplication } = await supabaseAdmin
      .from('author_applications')
      .select('*')
      .eq('id', id)
      .single();

    const { data: application, error } = await supabaseAdmin
      .from('author_applications')
      .update({
        status,
        admin_review_note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating application status:', error);
      return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
    }

    // Send email notification based on status change
    try {
      if (status === 'UNDER_REVIEW' && currentApplication) {
        await EmailService.sendApplicationUnderReview(currentApplication.email, currentApplication.full_name);
        console.log('[Admin Update] Under review email sent to:', currentApplication.email);
      }
    } catch (emailError) {
      console.error('[Admin Update] Failed to send status change email:', emailError);
      // Don't fail the update if email fails
    }

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('Error in admin application update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
