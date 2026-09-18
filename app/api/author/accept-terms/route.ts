import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { authorId, termsVersion } = body;

    if (!authorId || !termsVersion) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify that the author belongs to the authenticated user
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .select('id, clerk_user_id')
      .eq('id', authorId)
      .single();

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    if (author.clerk_user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update the author's terms acceptance
    const { error: updateError } = await supabaseAdmin
      .from('authors')
      .update({
        accepted_terms_at: new Date().toISOString(),
        accepted_terms_version: termsVersion,
        updated_at: new Date().toISOString(),
      })
      .eq('id', authorId);

    if (updateError) {
      console.error('Error updating author terms acceptance:', updateError);
      return NextResponse.json({ error: 'Failed to update terms acceptance' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in accept-terms API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}