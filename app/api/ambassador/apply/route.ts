import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { 
      is_student, userId, full_name, email, phone, whatsapp, 
      state, institution, occupation, promotion_method, social_links, experience, reason 
    } = data;

    if (!full_name || !email) {
      return NextResponse.json({ error: 'Name and email required' }, { status: 400 });
    }

    // Check if already applied
    const { data: existing } = await supabaseAdmin
      .from('ambassador_applications')
      .select('id, status')
      .eq('email', email)
      .single();

    if (existing) {
      if (existing.status === 'approved') return NextResponse.json({ error: 'Already an ambassador' }, { status: 400 });
      return NextResponse.json({ error: 'You already have a pending application' }, { status: 400 });
    }

    const { data: application, error } = await supabaseAdmin
      .from('ambassador_applications')
      .insert({
        is_student: is_student || false,
        user_id: userId || null,
        full_name,
        email,
        phone,
        whatsapp,
        state,
        institution,
        occupation,
        promotion_method,
        social_links,
        experience,
        reason,
        status: 'pending'
      })
      .select()
      .single();

    if (error) {
      console.error('[Apply API] Error:', error);
      return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
    }

    await logReferralEvent({
      action: 'ambassador_application_submitted',
      category: 'application_submission',
      user_id: userId || 'anonymous',
      description: `New ${is_student ? 'student' : 'community'} ambassador application submitted by ${email}`,
      metadata: { applicationId: application.id }
    });

    return NextResponse.json({ success: true, application });
  } catch (err) {
    console.error('[Apply API] Exception:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
