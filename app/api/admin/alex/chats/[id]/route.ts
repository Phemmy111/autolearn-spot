import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/alex/chats/[id]
 * Fetch messages for a specific Alex conversation
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAdmin();
    const { id } = await params;

    if (!id) {
      return NextResponse.json({ error: 'Conversation ID required' }, { status: 400 });
    }

    // Fetch conversation details
    const { data: conversation, error: convErr } = await supabaseAdmin
      .from('alex_conversations')
      .select('*')
      .eq('id', id)
      .single();

    if (convErr || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Fetch all messages
    const { data: messages, error: msgErr } = await supabaseAdmin
      .from('alex_messages')
      .select('*')
      .eq('conversation_id', id)
      .order('created_at', { ascending: true });

    if (msgErr) throw msgErr;

    // Optional profile lookup if user_id starts with user_
    let userInfo: any = null;
    if (conversation.user_id) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id, full_name, email, role')
        .eq('id', conversation.user_id)
        .maybeSingle();
      userInfo = profile;
    }

    return NextResponse.json({
      success: true,
      conversation,
      user: userInfo,
      messages: messages || [],
    });
  } catch (error: any) {
    console.error('[GET /api/admin/alex/chats/[id]] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
