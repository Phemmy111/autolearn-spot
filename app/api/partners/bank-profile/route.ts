import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getAuth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { bank_name, account_number, account_name } = await request.json();

    if (!bank_name || !account_number || !account_name) {
      return NextResponse.json({ error: 'All fields are required' }, { status: 400 });
    }

    // Get the authenticated user from Clerk
    const { userId } = getAuth(request);
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Find the student partner record
    const { data: partner } = await supabaseAdmin
      .from('partners')
      .select('id')
      .eq('clerk_user_id', userId)
      .eq('partner_type', 'student')
      .eq('status', 'active')
      .single();

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    // Check if bank profile exists
    const { data: existingProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .single();

    let result;
    if (existingProfile) {
      // Update existing profile
      result = await supabaseAdmin
        .from('partner_bank_profiles')
        .update({
          bank_name,
          account_number,
          account_name,
          updated_at: new Date().toISOString()
        })
        .eq('partner_id', partner.id);
    } else {
      // Create new profile
      result = await supabaseAdmin
        .from('partner_bank_profiles')
        .insert({
          partner_id: partner.id,
          bank_name,
          account_number,
          account_name
        });
    }

    if (result.error) {
      console.error('Error saving bank profile:', result.error);
      return NextResponse.json({ error: 'Failed to save bank details' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[POST /api/partners/bank-profile] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
