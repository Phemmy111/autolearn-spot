import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuthor } from '@/lib/author';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/live-classes/[id]
 * Get a specific live class
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorCheck = await requireAuthor();
    if (authorCheck instanceof NextResponse) return authorCheck;

    const { userId } = await auth();
    const { id: liveClassId } = await params;

    // Get author ID
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const { data: liveClass, error } = await supabaseAdmin
      .from('live_classes')
      .select(`
        *,
        learning_products (
          id,
          title,
          thumbnail
        )
      `)
      .eq('id', liveClassId)
      .eq('author_id', author.id)
      .single();

    if (error || !liveClass) {
      return NextResponse.json({ error: 'Live class not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, liveClass });
  } catch (error) {
    console.error('Error in live class API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PATCH /api/author/live-classes/[id]
 * Update a live class
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorCheck = await requireAuthor();
    if (authorCheck instanceof NextResponse) return authorCheck;

    const { userId } = await auth();
    const { id: liveClassId } = await params;
    const body = await request.json();

    // Get author ID
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Verify author owns this live class
    const { data: existing } = await supabaseAdmin
      .from('live_classes')
      .select('author_id')
      .eq('id', liveClassId)
      .single();

    if (!existing || existing.author_id !== author.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update live class
    const { data: liveClass, error } = await supabaseAdmin
      .from('live_classes')
      .update({
        ...body,
        updated_at: new Date().toISOString(),
      })
      .eq('id', liveClassId)
      .select()
      .single();

    if (error) {
      console.error('Error updating live class:', error);
      return NextResponse.json({ error: 'Failed to update live class' }, { status: 500 });
    }

    return NextResponse.json({ success: true, liveClass });
  } catch (error) {
    console.error('Error in live class API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * DELETE /api/author/live-classes/[id]
 * Cancel a live class
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authorCheck = await requireAuthor();
    if (authorCheck instanceof NextResponse) return authorCheck;

    const { userId } = await auth();
    const { id: liveClassId } = await params;

    // Get author ID
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Verify author owns this live class
    const { data: existing } = await supabaseAdmin
      .from('live_classes')
      .select('author_id')
      .eq('id', liveClassId)
      .single();

    if (!existing || existing.author_id !== author.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Cancel the live class (soft delete by setting status to CANCELLED)
    const { error } = await supabaseAdmin
      .from('live_classes')
      .update({
        status: 'CANCELLED',
        updated_at: new Date().toISOString(),
      })
      .eq('id', liveClassId);

    if (error) {
      console.error('Error cancelling live class:', error);
      return NextResponse.json({ error: 'Failed to cancel live class' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in live class API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}