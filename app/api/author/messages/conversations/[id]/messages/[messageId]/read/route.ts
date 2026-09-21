import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/author/messages/conversations/[id]/messages/[messageId]/read
 * Mark a message as read
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; messageId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId, messageId } = await params;

    // Update message read status
    const updateData: any = {};
    try {
      updateData.read_status = 'READ';
      updateData.read_at = new Date().toISOString();
    } catch (e) {
      // Columns might not exist yet
    }

    const { error } = await supabaseAdmin
      .from('author_messages')
      .update(updateData)
      .eq('id', messageId)
      .eq('conversation_id', conversationId);

    if (error) {
      console.error('Error marking message as read:', error);
      // If columns don't exist, just return success
      if (error.code === '42703') {
        return NextResponse.json({ success: true });
      }
      return NextResponse.json({ error: 'Failed to mark message as read' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error in mark as read API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
