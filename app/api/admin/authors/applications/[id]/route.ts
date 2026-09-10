import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

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

    // TODO: Send email notification based on status change
    // This will be implemented in the email notification service

    return NextResponse.json({ success: true, application });
  } catch (error) {
    console.error('Error in admin application update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
