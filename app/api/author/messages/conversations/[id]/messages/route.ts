import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { PushNotificationService } from '@/lib/push-notification-service';
import { EmailService } from '@/lib/email-service';

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

    // Verify conversation exists
    const { data: conversation } = await supabaseAdmin
      .from('author_conversations')
      .select('id, author_id, student_id, learning_product_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is author
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id, display_name')
      .eq('clerk_user_id', userId)
      .single();

    const isAuthor = author && author.id === conversation.author_id;
    let isStudent = conversation.student_id === userId;

    if (!isAuthor && !isStudent) {
      const clerkUser = await currentUser();
      const emails = (clerkUser?.emailAddresses || []).map(e => e.emailAddress.toLowerCase());

      // Check if user is the student through guest_id
      if (conversation.student_id?.startsWith('guest_')) {
        const { data: matchedOrder } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('guest_id', conversation.student_id)
          .or(`user_id.eq.${userId}${emails.length > 0 ? `,email.in.(${emails.map(e => `"${e}"`).join(',')})` : ''}`)
          .limit(1);
        if (matchedOrder && matchedOrder.length > 0) {
          isStudent = true;
        }
      }

      if (!isStudent && emails.length > 0) {
        // Also check if an enrollment exists for this user on this learning product
        const { data: enrollment } = await supabaseAdmin
          .from('enrollments')
          .select('id')
          .eq('learning_product_id', conversation.learning_product_id)
          .or(`clerk_user_id.eq.${userId},email.in.(${emails.map(e => `"${e}"`).join(',')})`)
          .limit(1);
        if (enrollment && enrollment.length > 0) {
          isStudent = true;
        }
      }
    }

    if (!isAuthor && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Fetch messages from author_messages
    const { data: rawMessages, error } = await supabaseAdmin
      .from('author_messages')
      .select('id, conversation_id, sender_id, sender_role, content, created_at')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      return NextResponse.json({ error: 'Failed to fetch messages' }, { status: 500 });
    }

    const messages = (rawMessages || []).map((m: any) => {
      let bodyText = m.content || '';
      let atts: any[] = [];

      if (bodyText.includes('<!-- ATTACHMENTS:')) {
        try {
          const parts = bodyText.split('<!-- ATTACHMENTS:');
          bodyText = parts[0].trim();
          const jsonStr = parts[1].replace('-->', '').trim();
          atts = JSON.parse(jsonStr);
        } catch (e) {
          console.error('Error parsing attachments JSON:', e);
        }
      }

      const hasAudio = atts.some((a: any) => a.mime_type?.startsWith('audio/'));
      const hasImage = atts.some((a: any) => a.mime_type?.startsWith('image/'));

      return {
        id: m.id,
        conversation_id: m.conversation_id,
        sender_id: m.sender_id,
        sender_role: m.sender_role,
        message_type: hasAudio ? 'VOICE' : (hasImage ? 'IMAGE' : 'TEXT'),
        body: bodyText,
        content: bodyText,
        created_at: m.created_at,
        delivery_status: 'DELIVERED',
        read_status: 'READ',
        author_message_attachments: atts
      };
    });

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

    // Verify conversation exists
    const { data: conversation } = await supabaseAdmin
      .from('author_conversations')
      .select('id, author_id, student_id, learning_product_id')
      .eq('id', conversationId)
      .single();

    if (!conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    // Check if user is author
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id, display_name')
      .eq('clerk_user_id', userId)
      .single();

    const isAuthor = author && author.id === conversation.author_id;
    let isStudent = conversation.student_id === userId;

    if (!isAuthor && !isStudent) {
      const clerkUser = await currentUser();
      const emails = (clerkUser?.emailAddresses || []).map(e => e.emailAddress.toLowerCase());

      // Check if user is the student through guest_id or email
      if (conversation.student_id?.startsWith('guest_')) {
        const { data: matchedOrder } = await supabaseAdmin
          .from('orders')
          .select('id')
          .eq('guest_id', conversation.student_id)
          .or(`user_id.eq.${userId}${emails.length > 0 ? `,email.in.(${emails.map(e => `"${e}"`).join(',')})` : ''}`)
          .limit(1);
        if (matchedOrder && matchedOrder.length > 0) {
          isStudent = true;
        }
      }

      if (!isStudent && emails.length > 0) {
        const { data: enrollment } = await supabaseAdmin
          .from('enrollments')
          .select('id')
          .eq('learning_product_id', conversation.learning_product_id)
          .or(`clerk_user_id.eq.${userId},email.in.(${emails.map(e => `"${e}"`).join(',')})`)
          .limit(1);
        if (enrollment && enrollment.length > 0) {
          isStudent = true;
        }
      }
    }

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
    const clientRole = body.sender_role === 'AUTHOR' || body.sender_role === 'STUDENT' ? body.sender_role : null;
    let senderRole: string;
    if (clientRole) {
      if (clientRole === 'AUTHOR' && isAuthor) senderRole = 'AUTHOR';
      else if (clientRole === 'STUDENT' && isStudent) senderRole = 'STUDENT';
      else senderRole = isAuthor ? 'AUTHOR' : 'STUDENT';
    } else {
      senderRole = isAuthor ? 'AUTHOR' : 'STUDENT';
    }

    let rawText = messageBody || body.content || '';
    let attachmentsWithIds: any[] = [];

    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      attachmentsWithIds = attachments.map((att: any, idx: number) => ({
        id: att.id || `${Date.now()}-${idx}-${Math.random().toString(36).slice(2, 7)}`,
        storage_path: att.storage_path,
        file_name: att.file_name || 'attachment',
        mime_type: att.mime_type || 'application/octet-stream',
        file_size: att.file_size || 0,
        duration_seconds: att.duration_seconds || null,
      }));

      rawText = `${rawText ? rawText + '\n\n' : ''}<!-- ATTACHMENTS:${JSON.stringify(attachmentsWithIds)} -->`;
    }

    // Insert message into author_messages
    const { data: message, error: messageError } = await supabaseAdmin
      .from('author_messages')
      .insert({
        conversation_id: conversationId,
        sender_id: userId,
        sender_role: senderRole,
        content: rawText,
      })
      .select()
      .single();

    if (messageError) {
      console.error('Error creating message:', messageError);
      return NextResponse.json({ error: 'Failed to create message' }, { status: 500 });
    }

    // Update conversation last_message_at
    try {
      await supabaseAdmin
        .from('author_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (error) {
      console.error('[POST messages] Error updating conversation last_message_at:', error);
    }

    // Send push notification to the recipient
    try {
      const recipientId = isAuthor ? conversation.student_id : conversation.author_id;
      const senderName = isAuthor ? author?.display_name || 'Author' : 'Student';
      const previewText = messageBody || (attachmentsWithIds.length > 0 ? (attachmentsWithIds[0].mime_type?.startsWith('audio/') ? 'Voice note' : 'Attachment') : 'New message');

      await PushNotificationService.sendNewMessageNotification(
        recipientId,
        senderName,
        previewText,
        conversationId
      );
    } catch (pushError) {
      console.error('[POST messages] Push notification failed:', pushError);
    }

    // Send email notification to recipient
    try {
      const previewText = messageBody || (attachmentsWithIds.length > 0 ? (attachmentsWithIds[0].mime_type?.startsWith('audio/') ? 'Sent a voice note' : 'Sent an attachment') : 'New message');
      
      if (isAuthor) {
        // Author replied to Student -> Send email to student
        let studentEmail: string | null = null;
        let studentName = 'Student';
        if (conversation.student_id?.startsWith('guest_')) {
          const { data: ord } = await supabaseAdmin
            .from('orders')
            .select('customer_email, customer_name')
            .eq('guest_id', conversation.student_id)
            .maybeSingle();
          if (ord) {
            studentEmail = ord.customer_email;
            studentName = ord.customer_name || studentName;
          }
        } else {
          const { data: enr } = await supabaseAdmin
            .from('enrollments')
            .select('email, full_name')
            .or(`clerk_user_id.eq.${conversation.student_id},email.eq.${conversation.student_id}`)
            .maybeSingle();
          if (enr) {
            studentEmail = enr.email;
            studentName = enr.full_name || studentName;
          }
        }

        if (studentEmail) {
          await EmailService.sendNewDirectMessageEmail(
            studentEmail,
            studentName,
            author?.display_name || 'Your Instructor',
            previewText,
            'https://www.autolearnspot.com/student/messages'
          );
        }
      } else {
        // Student sent message to Author -> Send email to author
        if (author?.email) {
          const clerkUser = await currentUser();
          const studentName = clerkUser?.fullName || clerkUser?.firstName || 'Student';
          await EmailService.sendNewDirectMessageEmail(
            author.email,
            author.display_name || 'Author',
            studentName,
            previewText,
            'https://www.autolearnspot.com/author/messages'
          );
        }
      }
    } catch (emailErr) {
      console.warn('[POST messages] Direct message email notification failed (non-fatal):', emailErr);
    }

    const hasAudio = attachmentsWithIds.some((a: any) => a.mime_type?.startsWith('audio/'));
    const hasImage = attachmentsWithIds.some((a: any) => a.mime_type?.startsWith('image/'));

    const formattedMessage = {
      ...message,
      body: messageBody || null,
      message_type: hasAudio ? 'VOICE' : (hasImage ? 'IMAGE' : (message_type || 'TEXT')),
      delivery_status: 'DELIVERED',
      read_status: 'UNREAD',
      author_message_attachments: attachmentsWithIds
    };

    return NextResponse.json({ success: true, message: formattedMessage });
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
