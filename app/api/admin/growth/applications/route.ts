import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CommunityAuthService } from '@/lib/growth-engine/CommunityAuthService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { data: applications, error } = await supabaseAdmin
      .from('ambassador_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return NextResponse.json({ success: true, applications });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { id, action } = await request.json();
    if (!id || !action) return NextResponse.json({ error: 'Missing parameters' }, { status: 400 });

    const { data: application, error: appError } = await supabaseAdmin
      .from('ambassador_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (appError || !application) return NextResponse.json({ error: 'Application not found' }, { status: 404 });

    if (action === 'approve') {
      // Create user if not student
      if (!application.is_student) {
        // Generate random password
        const randomPassword = Math.random().toString(36).slice(-8);
        const passwordHash = CommunityAuthService.hashPassword(randomPassword);

        const { error: insertError } = await supabaseAdmin
          .from('community_ambassadors')
          .insert({
            full_name: application.full_name,
            email: application.email,
            phone: application.phone,
            password_hash: passwordHash,
            status: 'active'
          });

        if (insertError) return NextResponse.json({ error: 'Failed to create community ambassador' }, { status: 500 });
        
        // In a real app, send email with password here
        console.log(`Created community ambassador. Email: ${application.email}, Password: ${randomPassword}`);
      }

      await supabaseAdmin.from('ambassador_applications').update({ status: 'approved' }).eq('id', id);
      return NextResponse.json({ success: true });
    } else if (action === 'reject') {
      await supabaseAdmin.from('ambassador_applications').update({ status: 'rejected' }).eq('id', id);
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
