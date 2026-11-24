import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { auth } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

async function resolvePartner(request: Request) {
  // 1. Check partner session cookie (OTP login)
  try {
    const session = await SessionService.getSession();
    if (session?.userId) {
      const { data: matchedPartners } = await supabaseAdmin
        .from('partners')
        .select('*')
        .or(`id.eq.${session.userId},user_id.eq.${session.userId},partner_id.eq.${session.userId}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (matchedPartners && matchedPartners.length > 0) {
        return matchedPartners[0];
      }
    }
  } catch (err) {
    console.warn('[bank-profile] Session check error:', err);
  }

  // 2. Fallback to Clerk auth
  try {
    const { userId } = await auth();
    if (userId) {
      const { data: matchedPartners } = await supabaseAdmin
        .from('partners')
        .select('*')
        .or(`id.eq.${userId},user_id.eq.${userId},clerk_user_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(1);

      if (matchedPartners && matchedPartners.length > 0) {
        return matchedPartners[0];
      }

      // Check if user is an enrolled student and auto-create partner record
      const { data: enrollment } = await supabaseAdmin
        .from('enrollments')
        .select('id, email, clerk_user_id')
        .or(`clerk_user_id.eq.${userId},user_id.eq.${userId}`)
        .limit(1)
        .maybeSingle();

      if (enrollment) {
        const { data: newPartner } = await supabaseAdmin
          .from('partners')
          .insert({
            clerk_user_id: userId,
            email: enrollment.email || 'student@autolearnspot.com',
            full_name: 'Enrolled Student',
            partner_type: 'student',
            status: 'active',
            available_earnings: 0,
            pending_earnings: 0,
            total_earnings: 0,
            paid_earnings: 0,
          })
          .select()
          .single();

        if (newPartner) return newPartner;
      }
    }
  } catch (err) {
    console.warn('[bank-profile] Clerk check error:', err);
  }

  return null;
}

export async function GET(request: Request) {
  try {
    const partner = await resolvePartner(request);
    if (!partner) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { data: bankProfile, error } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .maybeSingle();

    if (error) {
      console.error('[GET /api/partners/bank-profile] Error:', error);
      return NextResponse.json({ error: 'Failed to fetch bank profile' }, { status: 500 });
    }

    return NextResponse.json({ success: true, bankProfile: bankProfile || null });
  } catch (error: any) {
    console.error('[GET /api/partners/bank-profile] Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}

async function handleSaveBankProfile(request: Request) {
  try {
    const partner = await resolvePartner(request);
    if (!partner) {
      return NextResponse.json({ error: 'Unauthorized. Please sign in.' }, { status: 401 });
    }

    const body = await request.json();
    const { bank_name, account_number, account_name, account_type } = body;

    const trimmedBank = (bank_name || '').trim();
    const trimmedNumber = (account_number || '').trim();
    const trimmedName = (account_name || '').trim();

    if (!trimmedBank || !trimmedNumber || !trimmedName) {
      return NextResponse.json({ error: 'Bank name, account number, and account name are required' }, { status: 400 });
    }

    // Check if bank profile already exists for this partner
    const { data: existingProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('id')
      .eq('partner_id', partner.id)
      .maybeSingle();

    let savedData = null;
    if (existingProfile) {
      // Update existing record (only columns that exist in schema)
      const { data, error } = await supabaseAdmin
        .from('partner_bank_profiles')
        .update({
          bank_name: trimmedBank,
          account_number: trimmedNumber,
          account_name: trimmedName,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (error) {
        console.error('[handleSaveBankProfile] Update error:', error);
        throw error;
      }
      savedData = data;
    } else {
      // Insert new record (only columns that exist in schema)
      const { data, error } = await supabaseAdmin
        .from('partner_bank_profiles')
        .insert({
          partner_id: partner.id,
          bank_name: trimmedBank,
          account_number: trimmedNumber,
          account_name: trimmedName
        })
        .select()
        .single();

      if (error) {
        console.error('[handleSaveBankProfile] Insert error:', error);
        throw error;
      }
      savedData = data;
    }

    return NextResponse.json({ success: true, bankProfile: savedData });
  } catch (error: any) {
    console.error('[handleSaveBankProfile] Error:', error);
    return NextResponse.json({ error: error.message || 'Failed to save bank profile' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  return handleSaveBankProfile(request);
}

export async function PUT(request: Request) {
  return handleSaveBankProfile(request);
}
