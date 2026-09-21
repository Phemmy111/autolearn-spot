import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { requireAuthor } from '@/lib/author';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/live-classes
 * Get all live classes for the authenticated author
 */
export async function GET(request: NextRequest) {
  try {
    const authorCheck = await requireAuthor();
    if (authorCheck instanceof NextResponse) return authorCheck;

    const { userId } = await auth();
    
    // Get author ID
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', userId)
      .single();

    if (!author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('live_classes')
      .select(`
        *,
        learning_products (
          id,
          title,
          thumbnail
        )
      `)
      .eq('author_id', author.id)
      .order('scheduled_start', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: liveClasses, error } = await query;

    if (error) {
      console.error('Error fetching live classes:', error);
      return NextResponse.json({ error: 'Failed to fetch live classes' }, { status: 500 });
    }

    return NextResponse.json({ success: true, liveClasses });
  } catch (error) {
    console.error('Error in live classes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * POST /api/author/live-classes
 * Create a new live class
 */
export async function POST(request: NextRequest) {
  try {
    const authorCheck = await requireAuthor();
    if (authorCheck instanceof NextResponse) return authorCheck;

    const { userId } = await auth();
    const body = await request.json();
    const { learning_product_id, title, description, scheduled_start, scheduled_end } = body;

    if (!learning_product_id || !title || !scheduled_start || !scheduled_end) {
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
      .select('author_id, title')
      .eq('id', learning_product_id)
      .single();

    if (!product || product.author_id !== author.id) {
      return NextResponse.json({ error: 'You do not have access to this product' }, { status: 403 });
    }

    // Generate unique meeting room and URL
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substr(2, 9);
    const meetingRoom = `AutoLearn-${product.title.replace(/[^a-zA-Z0-9-]/g, '')}-${uniqueId}`;
    const meetingUrl = `https://meet.jit.si/${meetingRoom}`;

    // Create live class
    const { data: liveClass, error } = await supabaseAdmin
      .from('live_classes')
      .insert({
        learning_product_id,
        author_id: author.id,
        title,
        description,
        scheduled_start,
        scheduled_end,
        meeting_provider: 'JITSI',
        meeting_room: meetingRoom,
        meeting_url: meetingUrl,
        status: 'SCHEDULED',
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating live class:', error);
      return NextResponse.json({ error: 'Failed to create live class' }, { status: 500 });
    }

    // Notify enrolled students
    await notifyEnrolledStudents(learning_product_id, liveClass);

    return NextResponse.json({ success: true, liveClass });
  } catch (error) {
    console.error('Error in live classes API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

async function notifyEnrolledStudents(productId: string, liveClass: any) {
  try {
    // Get enrolled students for this product
    const { data: enrollments } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id')
      .eq('status', 'active');

    if (!enrollments || enrollments.length === 0) return;

    // Get cohort IDs for this product
    const { data: cohorts } = await supabaseAdmin
      .from('cohorts')
      .select('id')
      .eq('learning_product_id', productId);

    if (!cohorts || cohorts.length === 0) return;

    const cohortIds = cohorts.map(c => c.id);

    // Filter enrollments for this product
    const studentIds = enrollments
      .filter(e => cohortIds.includes(e.cohort_id))
      .map(e => e.clerk_user_id)
      .filter(Boolean);

    if (studentIds.length === 0) return;

    // Create notifications
    const { createBulkNotifications } = await import('@/lib/notification-service');
    await createBulkNotifications(studentIds, {
      type: 'LIVE_CLASS_SCHEDULED',
      title: 'Live Class Scheduled',
      body: `Your author has scheduled a live class for ${liveClass.title}.`,
      actionUrl: `/dashboard`,
      metadata: {
        live_class_id: liveClass.id,
        scheduled_start: liveClass.scheduled_start,
      },
      eventId: `live-class-${liveClass.id}`,
    });
  } catch (error) {
    console.error('Error notifying students:', error);
  }
}