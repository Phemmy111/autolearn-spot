import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/student/messages/conversations
 * Get all conversations for the authenticated student
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get conversations where student is the student
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
        )
      `)
      .eq('student_id', userId)
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
      .select()
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
  // Check if student has access via enrollments or orders
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('cohort_id')
    .eq('clerk_user_id', userId)
    .eq('status', 'active');

  if (!enrollments || enrollments.length === 0) {
    return false;
  }

  const cohortIds = enrollments.map(e => e.cohort_id);

  // Check if any cohort is linked to this learning product
  const { data: cohorts } = await supabaseAdmin
    .from('cohorts')
    .select('id')
    .in('id', cohortIds)
    .eq('learning_product_id', productId);

  return cohorts && cohorts.length > 0;
}

async function getUnreadCounts(conversationIds: string[], studentId: string) {
  const { data } = await supabaseAdmin
    .from('author_messages')
    .select('conversation_id')
    .in('conversation_id', conversationIds)
    .neq('sender_role', 'STUDENT'); // Count messages not sent by student

  const counts: Record<string, number> = {};
  data?.forEach(msg => {
    counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
  });
  return counts;
}