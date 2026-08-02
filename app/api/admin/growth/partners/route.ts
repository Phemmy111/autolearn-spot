import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { CommunityAuthService } from '@/lib/growth-engine/CommunityAuthService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'influencer';

    if (type === 'influencer') {
      const { data, error } = await supabaseAdmin.from('influencers').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, partners: data });
    } else {
      const { data, error } = await supabaseAdmin.from('community_ambassadors').select('*').order('created_at', { ascending: false });
      if (error) throw error;
      return NextResponse.json({ success: true, partners: data });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { full_name, email, phone, commission_rate, platform } = await request.json();
    
    // Generate random password
    const randomPassword = Math.random().toString(36).slice(-8);
    const passwordHash = CommunityAuthService.hashPassword(randomPassword);

    const { error } = await supabaseAdmin
      .from('influencers')
      .insert({
        full_name,
        email,
        phone,
        password_hash: passwordHash,
        commission_rate: commission_rate || 2000,
        platform: platform || 'Other',
        status: 'active'
      });

    if (error) return NextResponse.json({ error: 'Failed to create influencer' }, { status: 500 });
    
    // In a real app, send email with password here
    console.log(`Created influencer partner. Email: ${email}, Password: ${randomPassword}`);

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
