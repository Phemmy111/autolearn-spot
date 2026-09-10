import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

export const dynamic = 'force-dynamic';

export async function POST(
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
    const { admin_review_note } = body;

    if (!admin_review_note) {
      return NextResponse.json({ error: 'Review note is required for declining' }, { status: 400 });
    }

    // Get the application
    const { data: application, error: appError } = await supabaseAdmin
      .from('author_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status === 'DECLINED') {
      return NextResponse.json({ error: 'Application already declined' }, { status: 400 });
    }

    // Update application status
    const { data: updatedApp, error: updateError } = await supabaseAdmin
      .from('author_applications')
      .update({
        status: 'DECLINED',
        admin_review_note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error declining application:', updateError);
      return NextResponse.json({ error: 'Failed to decline application' }, { status: 500 });
    }

    // Send decline email
    await EmailService.sendApplicationDeclined(
      application.email,
      application.full_name,
      admin_review_note
    );

    return NextResponse.json({
      success: true,
      application: updatedApp,
      message: 'Application declined.',
    });
  } catch (error) {
    console.error('Error in decline application API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
