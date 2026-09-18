import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/messages/conversations
 * Get all conversations for the authenticated author
 */
export async function GET(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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
        updated_at,
        learning_products (
          id,
          title,
          thumbnail
        )
      `)
      .eq('author_id', author.id)
      .order('updated_at', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      return NextResponse.json({ error: 'Failed to fetch conversations' }, { status: 500 });
    }

    // Get unread counts for each conversation
    const conversationIds = conversations?.map(c => c.id) || [];
    const unreadCounts = conversationIds.length > 0 ? await getUnreadCounts(conversationIds, author.id) : {};

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
 * POST /api/author/messages/conversations
 * Create a new conversation
 */
export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Verify student has access to this product
    const hasAccess = await verifyStudentAccess(student_id, learning_product_id);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Student does not have access to this product' }, { status: 403 });
    }

    // Check if conversation already exists
    const { data: existing } = await supabaseAdmin
      .from('author_conversations')
      .select('*')
      .eq('student_id', student_id)
      .eq('author_id', author.id)
      .eq('learning_product_id', learning_product_id)
      .single();

    if (existing) {
      return NextResponse.json({ success: true, conversation: existing });
    }

    // Create new conversation
    const { data: conversation, error } = await supabaseAdmin
      .from('author_conversations')
      .insert({
        student_id,
        author_id: author.id,
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

async function verifyStudentAccess(studentId: string, productId: string): Promise<boolean> {
  // Check if student has access via enrollments or orders
  const { data: enrollments } = await supabaseAdmin
    .from('enrollments')
    .select('cohort_id')
    .eq('clerk_user_id', studentId)
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

async function getUnreadCounts(conversationIds: string[], authorId: string) {
  const { data } = await supabaseAdmin
    .from('author_messages')
    .select('conversation_id')
    .in('conversation_id', conversationIds)
    .neq('sender_role', 'AUTHOR'); // Count messages not sent by author

  const counts: Record<string, number> = {};
  data?.forEach(msg => {
    counts[msg.conversation_id] = (counts[msg.conversation_id] || 0) + 1;
  });
  return counts;
}