import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/student/messages/conversations
 * Get all conversations for the authenticated student
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    const user = await currentUser();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const emails: string[] = [];
    if (user?.primaryEmailAddress?.emailAddress) {
      emails.push(user.primaryEmailAddress.emailAddress.toLowerCase().trim());
    }
    user?.emailAddresses?.forEach(e => {
      if (e.emailAddress) {
        const em = e.emailAddress.toLowerCase().trim();
        if (!emails.includes(em)) emails.push(em);
      }
    });

    // Auto-link any conversations addressed to student's email
    if (emails.length > 0) {
      await supabaseAdmin
        .from('author_conversations')
        .update({ student_id: userId })
        .in('student_id', emails);
    }

    // Get conversations where student is the student
    const studentIds = [userId, ...emails];
    const { data: conversations, error } = await supabaseAdmin
      .from('author_conversations')
      .select(`
        id,
        student_id,
        author_id,
        learning_product_id,
        created_at,
        updated_at,
        learning_products (
          id,
          title,
          thumbnail
        ),
        authors (
          id,
          display_name,
          profile_image
        ),
        author_messages (
          created_at
        )
      `)
      .in('student_id', studentIds)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Get unread counts for each conversation
    const conversationIds = conversations?.map(c => c.id) || [];
    const unreadCounts = conversationIds.length > 0 ? await getUnreadCounts(conversationIds, userId) : {};

    const conversationsWithCounts = conversations?.map(conv => ({
      ...conv,
      unread_count: unreadCounts[conv.id] || 0,
    })) || [];

    return NextResponse.json({ success: true, conversations: conversationsWithCounts });
  } catch (error) {
    console.error('Error in conversations API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/student/messages/conversations
 * Create a new conversation (student initiates)
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { learning_product_id } = body;

    if (!learning_product_id) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify student has access to this product
    const hasAccess = await verifyStudentAccess(userId, learning_product_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'You do not have access to this product' }, { status: 403 });
    }

    // Get the author for this product
    const { data: product } = await supabaseAdmin
      .from('learning_products')
      .select('author_id')
      .eq('id', learning_product_id)
      .single();

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Check if conversation already exists
    const { data: existing } = await supabaseAdmin
      .from('author_conversations')
      .select('*')
      .eq('student_id', userId)
      .eq('author_id', product.author_id)
      .eq('learning_product_id', learning_product_id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, conversation: existing });
    }

    // Create new conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('author_conversations')
      .insert({
        student_id: userId,
        author_id: product.author_id,
        learning_product_id,
      })
      .select(`
        id,
        student_id,
        author_id,
        learning_product_id,
        created_at,
        updated_at,
        learning_products (
          id,
          title,
          thumbnail
        ),
        authors (
          id,
          display_name,
          profile_image
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

async function verifyStudentAccess(userId: string, productId: string): Promise<boolean> {
  if (!userId || !productId) return false;

  // 1. Direct active enrollment match by clerk_user_id
  const { data: directEnrollments } = await supabaseAdmin
    .from('enrollments')
    .select('id, learning_product_id, status')
    .eq('clerk_user_id', userId)
    .in('status', ['active', 'not_started']);

  if (directEnrollments && directEnrollments.some(e => e.learning_product_id === productId)) {
    return true;
  }

  // 2. Direct order purchase match (order is PAID and contains productId)
  const { data: matchingOrders } = await supabaseAdmin
    .from('orders')
    .select('id')
    .eq('user_id', userId)
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

  // 3. Fallback: Cohort check for legacy enrollments
  const { data: legacyEnrollments } = await supabaseAdmin
    .from('enrollments')
    .select('cohort_id')
    .eq('clerk_user_id', userId)
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

async function getUnreadCounts(conversationIds: string[], studentId: string) {
  try {
    const { data, error } = await supabaseAdmin
      .from('author_messages')
      .select('conversation_id')
      .in('conversation_id', conversationIds)
      .neq('sender_role', 'STUDENT') // Count messages not sent by student
      .eq('read_status', 'UNREAD'); // Only count unread messages

    if (error) {
      console.error('[getUnreadCounts] Error:', error);
      // If read_status column doesn't exist yet, fall back to counting all messages
      if (error.code === '42703') { // column does not exist
        const { data: fallbackData } = await supabaseAdmin
          .from('author_messages')
          .select('conversation_id')
          .in('conversation_id', conversationIds)
          .neq('sender_role', 'STUDENT');

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