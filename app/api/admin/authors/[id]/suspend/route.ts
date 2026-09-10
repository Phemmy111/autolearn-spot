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
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: 'Reason is required for suspension' }, { status: 400 });
    }

    // Get the author
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .select('*')
      .eq('id', id)
      .single();

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    if (author.status === 'SUSPENDED') {
      return NextResponse.json({ error: 'Author already suspended' }, { status: 400 });
    }

    // Update author status
    const { data: updatedAuthor, error: updateError } = await supabaseAdmin
      .from('authors')
      .update({
        status: 'SUSPENDED',
        suspension_reason: reason,
        suspended_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error suspending author:', updateError);
      return NextResponse.json({ error: 'Failed to suspend author' }, { status: 500 });
    }

    // Send suspension email
    await EmailService.sendAuthorSuspended(
      author.email,
      author.display_name,
      reason
    );

    return NextResponse.json({
      success: true,
      author: updatedAuthor,
      message: 'Author suspended successfully.',
    });
  } catch (error) {
    console.error('Error in suspend author API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
