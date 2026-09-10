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

    // Get the author
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .select('*')
      .eq('id', id)
      .single();

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    if (author.status !== 'SUSPENDED') {
      return NextResponse.json({ error: 'Author is not suspended' }, { status: 400 });
    }

    // Update author status
    const { data: updatedAuthor, error: updateError } = await supabaseAdmin
      .from('authors')
      .update({
        status: 'ACTIVE',
        suspension_reason: null,
        suspended_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('Error reactivating author:', updateError);
      return NextResponse.json({ error: 'Failed to reactivate author' }, { status: 500 });
    }

    // Send reactivation email
    await EmailService.sendAuthorReactivated(
      author.email,
      author.display_name
    );

    return NextResponse.json({
      success: true,
      author: updatedAuthor,
      message: 'Author reactivated successfully.',
    });
  } catch (error) {
    console.error('Error in reactivate author API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
