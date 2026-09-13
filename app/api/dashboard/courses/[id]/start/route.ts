import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const enrollmentId = params.id;

    // Check ownership
    const { data: enrollment, error: fetchError } = await supabaseAdmin
      .from('enrollments')
      .select('id, clerk_user_id, activated_at, status')
      .eq('id', enrollmentId)
      .single();

    if (fetchError || !enrollment) {
      return NextResponse.json({ error: 'Enrollment not found' }, { status: 404 });
    }

    if (enrollment.clerk_user_id !== userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    if (enrollment.activated_at) {
      return NextResponse.json({ error: 'Course already started' }, { status: 400 });
    }

    // Set activated_at to now
    const now = new Date().toISOString();
    const { error: updateError } = await supabaseAdmin
      .from('enrollments')
      .update({ activated_at: now, status: 'active' })
      .eq('id', enrollmentId);

    if (updateError) {
      console.error('Failed to start course:', updateError);
      return NextResponse.json({ error: 'Failed to start course' }, { status: 500 });
    }

    return NextResponse.json({ success: true, activated_at: now });
  } catch (error: any) {
    console.error('Start course API error:', error);
    return NextResponse.json({ error: error.message || 'Internal server error' }, { status: 500 });
  }
}
