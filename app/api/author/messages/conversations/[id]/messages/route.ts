import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/messages/conversations/[id]/messages
 * Get all messages for a conversation
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;

    // Verify user has access to this conversation
    const { data: conversation } = await supabaseAdmin
      .from('author_conversations')
      .select('author_id, student_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is author
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    const isAuthor = author && author.id === conversation.author_id;
    const isStudent = conversation.student_id === userId;

    if (!isAuthor && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages with attachments
    const { data: messages, error } = await supabaseAdmin
      .from('author_messages')
      .select(`
        *,
        author_message_attachments (
          id,
          storage_path,
          file_name,
          mime_type,
          file_size,
          duration_seconds
        )
      `)
      .eq('conversation_id', conversationId)
      .is('deleted_at', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    return NextResponse.json({ success: true, messages });
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/author/messages/conversations/[id]/messages
 * Send a new message
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: conversationId } = await params;
    const body = await request.json();
    const { message_type, body: messageBody, attachments } = body;

    // Verify user has access to this conversation
    const { data: conversation } = await supabaseAdmin
      .from('author_conversations')
      .select('author_id, student_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is author
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    const isAuthor = author && author.id === conversation.author_id;
    const isStudent = conversation.student_id === userId;

    if (!isAuthor && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check for prohibited external contact methods
    if (messageBody && containsProhibitedContact(messageBody)) {
      return NextResponse.json({
        error: 'This message contains a prohibited external contact method. Please keep student communication on AutoLearn Spot.'
      }, { status: 400 });
    }

    // Determine sender role
    let senderRole = isAuthor ? 'AUTHOR' : 'STUDENT';
    if (isAuthor && isStudent && body.sender_role) {
      senderRole = body.sender_role === 'AUTHOR' ? 'AUTHOR' : 'STUDENT';
    } else if (isStudent && !isAuthor) {
      senderRole = 'STUDENT';
    } else if (isAuthor && !isStudent) {
      senderRole = 'AUTHOR';
    }
    const validTypes = ['TEXT', 'IMAGE', 'VOICE'];
    const safeMessageType = validTypes.includes(message_type) ? message_type : 'TEXT';

    // Create message
    const { data: message, error: messageError } = await supabaseAdmin
      .from('author_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_role: senderRole,
        message_type: safeMessageType,
        body: messageBody,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Handle attachments if provided
    if (attachments && attachments.length > 0) {
      const attachmentPromises = attachments.map((attachment: any) =>
        supabaseAdmin
          .from('author_message_attachments')
          .insert({
            message_id: message.id,
            storage_path: attachment.storage_path,
            file_name: attachment.file_name,
            mime_type: attachment.mime_type,
            file_size: attachment.file_size,
            duration_seconds: attachment.duration_seconds,
          })
      );

      await Promise.all(attachmentPromises);
    }

    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Error in messages API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

function containsProhibitedContact(text: string): boolean {
  const prohibitedPatterns = [
    /wa\.me/i,
    /whatsapp\.com/i,
    /whatsapp/i,
    /telegram/i,
  ];

  return prohibitedPatterns.some(pattern => pattern.test(text));
}