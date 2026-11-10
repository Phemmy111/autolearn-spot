import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuthor } from '@/lib/author';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/messages/conversations
 * Get all conversations for the authenticated author
 */
export async function GET(request: NextRequest) {
  try {
    const authorCheck = await requireAuthor();
    if (authorCheck instanceof NextResponse) return authorCheck;

    const { userId } = authorCheck;

    // Get author ID from clerk_user_id
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Get conversations with student info and product info
    const { data: conversations, error } = await supabaseAdmin
      .from('author_conversations')
      .select(`
        id,
        student_id,
        learning_product_id,
        created_at,
        updated_at:last_message_at,
        learning_products (
          id,
          title,
          thumbnail:thumbnail_url
        ),
        author_messages (
          id,
          content,
          sender_role,
          created_at
        )
      `)
      .eq('author_id', author.id)
      .order('last_message_at', { ascending: false, nullsFirst: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Get unread counts for each conversation
    const conversationIds = conversations?.map(c => c.id) || [];
    const unreadCounts = conversationIds.length > 0 ? await getUnreadCounts(conversationIds, author.id) : {};

    // Fetch student info from enrollments and orders
    const studentIds = [...new Set(conversations?.map(c => c.student_id).filter(Boolean) || [])];
    const studentMap: Record<string, { full_name: string; email: string }> = {};
    if (studentIds.length > 0) {
      const { data: enrs } = await supabaseAdmin
        .from('enrollments')
        .select('clerk_user_id, email, full_name')
        .or(`clerk_user_id.in.(${studentIds.map(s => `"${s}"`).join(',')}),email.in.(${studentIds.map(s => `"${s}"`).join(',')})`);
      enrs?.forEach(e => {
        if (e.clerk_user_id && e.full_name) studentMap[e.clerk_user_id] = { full_name: e.full_name, email: e.email };
        if (e.email && e.full_name) studentMap[e.email] = { full_name: e.full_name, email: e.email };
      });

      const guestIds = studentIds.filter(id => id.startsWith('guest_') || id.startsWith('manual_'));
      if (guestIds.length > 0) {
        const { data: ords } = await supabaseAdmin
          .from('orders')
          .select('guest_id, customer_name, customer_email')
          .in('guest_id', guestIds);
        ords?.forEach(o => {
          if (o.guest_id && o.customer_name) studentMap[o.guest_id] = { full_name: o.customer_name, email: o.customer_email };
        });
      }
    }

    const conversationsWithCounts = conversations?.map(conv => {
      const msgs = (conv.author_messages || []).slice().sort(
        (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );
      const latestMsg = msgs[0];
      let snippet = '';
      if (latestMsg) {
        if (latestMsg.content?.includes('<!-- ATTACHMENTS:')) {
          if (latestMsg.content.includes('audio/')) snippet = '🎙️ Voice note';
          else snippet = '📎 Attachment';
        } else {
          snippet = latestMsg.content || '';
        }
      }

      const resolvedStudent = studentMap[conv.student_id];

      return {
        ...conv,
        student_name: resolvedStudent?.full_name || null,
        student_email: resolvedStudent?.email || null,
        last_message: snippet,
        last_message_role: latestMsg?.sender_role || null,
        unread_count: unreadCounts[conv.id] || 0,
      };
    }) || [];

    return NextResponse.json({ success: true, conversations: conversationsWithCounts });
  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/author/messages/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const authorCheck = await requireAuthor();
    if (authorCheck instanceof NextResponse) return authorCheck;

    const { userId } = authorCheck;

    const body = await request.json();
    const { student_id, learning_product_id } = body;

    if (!student_id || !learning_product_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Get author ID
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Verify author owns the product
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id')
      .eq('id', learning_product_id)
      .single();

    if (!product || product.author_id !== author.id) {
      return NextResponse.json({ error: 'You do not have access to this product' }, { status: 403 });
    }

    // If student_id is a guest ID or email, see if a linked Clerk user ID exists
    let effectiveStudentId = student_id;
    if (student_id.startsWith('guest_') || student_id.startsWith('manual_')) {
      const { data: orderData } = await supabaseAdmin
        .from('orders')
        .select('customer_email')
        .eq('user_id', student_id)
        .maybeSingle();

      if (orderData?.customer_email) {
        const { data: enr } = await supabaseAdmin
          .from('enrollments')
          .select('clerk_user_id')
          .ilike('email', orderData.customer_email)
          .not('clerk_user_id', 'is', null)
          .maybeSingle();

        if (enr?.clerk_user_id) {
          effectiveStudentId = enr.clerk_user_id;
        }
      }
    } else if (student_id.includes('@')) {
      const { data: enr } = await supabaseAdmin
        .from('enrollments')
        .select('clerk_user_id')
        .ilike('email', student_id)
        .not('clerk_user_id', 'is', null)
        .maybeSingle();

      if (enr?.clerk_user_id) {
        effectiveStudentId = enr.clerk_user_id;
      }
    }

    // Verify student has access to this product
    const hasAccess = await verifyStudentAccess(student_id, learning_product_id) ||
      (effectiveStudentId !== student_id && await verifyStudentAccess(effectiveStudentId, learning_product_id));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Student does not have access to this product' }, { status: 403 });
    }

    // Check if conversation already exists (checking both student_id and effectiveStudentId)
    const { data: existing } = await supabaseAdmin
      .from('author_conversations')
      .select('*')
      .in('student_id', [student_id, effectiveStudentId])
      .eq('author_id', author.id)
      .eq('learning_product_id', learning_product_id)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ success: true, conversation: existing });
    }

    // Create new conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('author_conversations')
      .insert({
        student_id: effectiveStudentId,
        author_id: author.id,
        learning_product_id,
      })
      .select(`
        id,
        student_id,
        learning_product_id,
        created_at,
        updated_at:last_message_at,
        learning_products (
          id,
          title,
          thumbnail:thumbnail_url
        )
      `)
      .single();

    if (error) {
      console.error('Error creating conversation:', error);
      return NextResponse.json({ error: 'Failed to create conversation' }, { status: 500 });
    }

    return NextResponse.json({ success: true, conversation });
  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function verifyStudentAccess(studentId: string, productId: string): Promise<boolean> {
  if (!studentId || !productId) return false;

  // 1. Direct active enrollment match by clerk_user_id or email
  const { data: directEnrollments } = await supabaseAdmin
    .from('enrollments')
    .select('id, learning_product_id, status, clerk_user_id, email')
    .or(`clerk_user_id.eq.${studentId},email.ilike.${studentId}`)
    .in('status', ['active', 'not_started']);

  if (directEnrollments && directEnrollments.some(e => e.learning_product_id === productId)) {
    return true;
  }

  // 2. Direct order purchase match (order is PAID and contains productId)
  const { data: matchingOrders } = await supabaseAdmin
    .from('orders')
    .select('id, customer_email, user_id')
    .or(`user_id.eq.${studentId},customer_email.ilike.${studentId}`)
    .eq('status', 'PAID');

  if (matchingOrders && matchingOrders.length > 0) {
    const orderIds = matchingOrders.map(o => o.id);
    const { data: matchingItems } = await supabaseAdmin
      .from('order_items')
      .select('id')
      .in('order_id', orderIds)
      .eq('learning_product_id', productId);

    if (matchingItems && matchingItems.length > 0) {
      return true;
    }
  }

  // 3. If studentId is an order user_id (e.g. guest_...), find email on that order and check enrollments
  if (studentId.startsWith('guest_') || studentId.startsWith('manual_')) {
    const { data: guestOrders } = await supabaseAdmin
      .from('orders')
      .select('customer_email')
      .eq('user_id', studentId)
      .limit(1);

    const guestEmail = guestOrders?.[0]?.customer_email;
    if (guestEmail) {
      const { data: guestEnrollments } = await supabaseAdmin
        .from('enrollments')
        .select('id, learning_product_id')
        .ilike('email', guestEmail)
        .in('status', ['active', 'not_started']);

      if (guestEnrollments && guestEnrollments.some(e => e.learning_product_id === productId)) {
        return true;
      }
    }
  }

  // 4. Fallback: Cohort check for legacy enrollments
  const { data: legacyEnrollments } = await supabaseAdmin
    .from('enrollments')
    .select('cohort_id')
    .or(`clerk_user_id.eq.${studentId},email.ilike.${studentId}`)
    .in('status', ['active', 'not_started']);

  if (legacyEnrollments && legacyEnrollments.length > 0) {
    const cohortIds = legacyEnrollments.map(e => e.cohort_id).filter(Boolean);
    if (cohortIds.length > 0) {
      const { data: cohorts } = await supabaseAdmin
        .from('cohorts')
        .select('id')
        .in('id', cohortIds)
        .eq('learning_product_id', productId);

      if (cohorts && cohorts.length > 0) {
        return true;
      }
    }
  }

  return false;
}

async function getUnreadCounts(conversationIds: string[], authorId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('author_messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .neq('sender_role', 'AUTHOR') // Count messages not sent by author
      .eq('read_status', 'UNREAD'); // Only count unread messages

    if (error) {
      console.error('[getUnreadCounts] Error:', error);
      // If read_status column doesn't exist yet, fall back to counting all messages
      if (error.code === '42703') { // column does not exist
        const { data: fallbackData } = await supabaseAdmin
          .from('author_messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .neq('sender_role', 'AUTHOR');

        const counts: Record<string, number> = {};
        fallbackData?.forEach(msg => {
          counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
        });
        return counts;
      }
      return {};
    }

    const counts: Record<string, number> = {};
    data?.forEach(msg => {
      counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
    });
    return counts;
  } catch (error) {
    console.error('[getUnreadCounts] Exception:', error);
    return {};
  }
}