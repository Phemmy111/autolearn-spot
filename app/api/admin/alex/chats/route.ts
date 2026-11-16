import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/alex/chats
 * List conversations, search messages, or export training dataset (JSONL)
 */
export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search')?.trim();
    const mode = searchParams.get('mode');
    const exportFormat = searchParams.get('export'); // 'jsonl'
    const limit = Math.min(parseInt(searchParams.get('limit') || '50', 10), 200);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    // If exporting training data for fine-tuning
    if (exportFormat === 'jsonl') {
      const { data: allMessages, error: msgErr } = await supabaseAdmin
        .from('alex_messages')
        .select('conversation_id, role, content, created_at')
        .order('created_at', { ascending: true });

      if (msgErr) throw msgErr;

      // Group messages by conversation_id
      const convMap = new Map<string, Array<{ role: string; content: string }>>();
      for (const m of allMessages || []) {
        if (!convMap.has(m.conversation_id)) {
          convMap.set(m.conversation_id, []);
        }
        if (m.role === 'user' || m.role === 'assistant' || m.role === 'system') {
          convMap.get(m.conversation_id)!.push({
            role: m.role,
            content: m.content || '',
          });
        }
      }

      // Convert to JSONL lines containing messages array
      const jsonlLines: string[] = [];
      convMap.forEach((messages) => {
        // Only include conversations that have at least one user-assistant exchange
        const hasUser = messages.some((m) => m.role === 'user');
        const hasAssistant = messages.some((m) => m.role === 'assistant');
        if (hasUser && hasAssistant) {
          jsonlLines.push(
            JSON.stringify({
              messages: [
                {
                  role: 'system',
                  content:
                    'You are Alex, an intelligent AI tutor and learning assistant for AutoLearn Spot.',
                },
                ...messages,
              ],
            })
          );
        }
      });

      return new Response(jsonlLines.join('\n'), {
        headers: {
          'Content-Type': 'application/x-ndjson',
          'Content-Disposition': `attachment; filename="alex_training_${Date.now()}.jsonl"`,
        },
      });
    }

    // 1. Fetch conversations
    let query = supabaseAdmin
      .from('alex_conversations')
      .select('*')
      .order('updated_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (mode && mode !== 'all') {
      query = query.eq('mode', mode);
    }

    const { data: conversations, error: convError } = await query;
    if (convError) throw convError;

    const convIds = (conversations || []).map((c) => c.id);

    // 2. Fetch message counts and last message for each conversation
    let messageStats: Record<string, { count: number; lastMessage: string; lastRole: string }> = {};
    if (convIds.length > 0) {
      const { data: messages } = await supabaseAdmin
        .from('alex_messages')
        .select('conversation_id, role, content, created_at')
        .in('conversation_id', convIds)
        .order('created_at', { ascending: true });

      for (const m of messages || []) {
        if (!messageStats[m.conversation_id]) {
          messageStats[m.conversation_id] = { count: 0, lastMessage: '', lastRole: '' };
        }
        messageStats[m.conversation_id].count += 1;
        messageStats[m.conversation_id].lastMessage = m.content?.slice(0, 120) || '';
        messageStats[m.conversation_id].lastRole = m.role;
      }
    }

    // 3. Count total conversations and total messages for high-level stats
    const { count: totalConversations } = await supabaseAdmin
      .from('alex_conversations')
      .select('*', { count: 'exact', head: true });

    const { count: totalMessages } = await supabaseAdmin
      .from('alex_messages')
      .select('*', { count: 'exact', head: true });

    // Format results
    let results = (conversations || []).map((c) => {
      const stats = messageStats[c.id] || { count: 0, lastMessage: '', lastRole: '' };
      return {
        id: c.id,
        user_id: c.user_id,
        title: c.title || 'Untitled Conversation',
        mode: c.mode || 'auto',
        created_at: c.created_at,
        updated_at: c.updated_at,
        messageCount: stats.count,
        preview: stats.lastMessage,
        lastRole: stats.lastRole,
      };
    });

    if (search) {
      const s = search.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(s) ||
          r.preview.toLowerCase().includes(s) ||
          r.user_id?.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({
      success: true,
      stats: {
        totalConversations: totalConversations || 0,
        totalMessages: totalMessages || 0,
        trainingPairsReady: Math.floor((totalMessages || 0) / 2),
      },
      conversations: results,
    });
  } catch (error: any) {
    console.error('[GET /api/admin/alex/chats] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
