import { NextResponse } from 'next/server';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { createClient } from '@supabase/supabase-js';
import { logReferralEvent } from '@/lib/audit-logging';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: Request) {
  try {
    const session = await SessionService.getSession();
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let partner;
    if (session.role === 'community') {
      partner = await PartnerService.getPartnerByCommunityAmbassadorId(session.userId);
      // Fallback: try to find partner by email if ambassador ID lookup fails
      if (!partner) {
        const { data: ambassador } = await supabaseAdmin
          .from('community_ambassadors')
          .select('email')
          .eq('id', session.userId)
          .single();
        
        if (ambassador?.email) {
          const { data: partnerByEmail } = await supabaseAdmin
            .from('partners')
            .select('*')
            .eq('email', ambassador.email)
            .single();
          partner = partnerByEmail;
        }
      }
    } else if (session.role === 'influencer') {
      partner = await PartnerService.getPartnerByInfluencerId(session.userId);
      // Fallback: try to find partner by email if influencer ID lookup fails
      if (!partner) {
        const { data: influencer } = await supabaseAdmin
          .from('influencers')
          .select('email')
          .eq('id', session.userId)
          .single();
        
        if (influencer?.email) {
          const { data: partnerByEmail } = await supabaseAdmin
            .from('partners')
            .select('*')
            .eq('email', influencer.email)
            .single();
          partner = partnerByEmail;
        }
      }
    } else {
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    if (!partner) {
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const { data: bankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .single();

    return NextResponse.json({ success: true, bankProfile });
  } catch (error) {
    console.error('[GET /api/partners/bank-profile] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    console.log('[PUT /api/partners/bank-profile] Starting request');
    const session = await SessionService.getSession();
    console.log('[PUT /api/partners/bank-profile] Session:', session);
    
    if (!session) {
      console.error('[PUT /api/partners/bank-profile] No session found');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let partner;
    console.log('[PUT /api/partners/bank-profile] Looking up partner for role:', session.role, 'userId:', session.userId);
    
    if (session.role === 'community') {
      partner = await PartnerService.getPartnerByCommunityAmbassadorId(session.userId);
      // Fallback: try to find partner by email if ambassador ID lookup fails
      if (!partner) {
        console.log('[PUT /api/partners/bank-profile] Ambassador ID lookup failed, trying email lookup');
        // Try to get community ambassador email first
        const { data: ambassador } = await supabaseAdmin
          .from('community_ambassadors')
          .select('email')
          .eq('id', session.userId)
          .single();
        
        if (ambassador?.email) {
          const { data: partnerByEmail } = await supabaseAdmin
            .from('partners')
            .select('*')
            .eq('email', ambassador.email)
            .single();
          partner = partnerByEmail;
          console.log('[PUT /api/partners/bank-profile] Found partner by email:', partner?.id);
        }
      }
    } else if (session.role === 'influencer') {
      partner = await PartnerService.getPartnerByInfluencerId(session.userId);
      // Fallback: try to find partner by email if influencer ID lookup fails
      if (!partner) {
        console.log('[PUT /api/partners/bank-profile] Influencer ID lookup failed, trying email lookup');
        // Try to get influencer email first
        const { data: influencer } = await supabaseAdmin
          .from('influencers')
          .select('email')
          .eq('id', session.userId)
          .single();
        
        if (influencer?.email) {
          const { data: partnerByEmail } = await supabaseAdmin
            .from('partners')
            .select('*')
            .eq('email', influencer.email)
            .single();
          partner = partnerByEmail;
          console.log('[PUT /api/partners/bank-profile] Found partner by email:', partner?.id);
        }
      }
    } else {
      console.error('[PUT /api/partners/bank-profile] Invalid role:', session.role);
      return NextResponse.json({ error: 'Invalid role' }, { status: 400 });
    }

    console.log('[PUT /api/partners/bank-profile] Partner lookup result:', partner);

    if (!partner) {
      console.error('[PUT /api/partners/bank-profile] Partner not found after all lookup attempts');
      return NextResponse.json({ error: 'Partner not found' }, { status: 404 });
    }

    const { bank_name, account_number, account_name } = await request.json();
    console.log('[PUT /api/partners/bank-profile] Request body:', { bank_name, account_number, account_name });

    if (!bank_name || !account_number || !account_name) {
      console.error('[PUT /api/partners/bank-profile] Missing required fields');
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Check if bank profile already exists
    const { data: existingBankProfile } = await supabaseAdmin
      .from('partner_bank_profiles')
      .select('*')
      .eq('partner_id', partner.id)
      .single();

    let bankProfile;
    let error;

    if (existingBankProfile) {
      // Update existing
      console.log('[PUT /api/partners/bank-profile] Updating existing bank profile');
      const result = await supabaseAdmin
        .from('partner_bank_profiles')
        .update({
          bank_name,
          account_number,
          account_name
        })
        .eq('partner_id', partner.id)
        .select()
        .single();
      bankProfile = result.data;
      error = result.error;
    } else {
      // Insert new
      console.log('[PUT /api/partners/bank-profile] Creating new bank profile');
      const result = await supabaseAdmin
        .from('partner_bank_profiles')
        .insert({
          partner_id: partner.id,
          bank_name,
          account_number,
          account_name
        })
        .select()
        .single();
      bankProfile = result.data;
      error = result.error;
    }

    if (error) {
      console.error('[PUT /api/partners/bank-profile] Database error:', error);
      return NextResponse.json({ error: 'Failed to save bank profile', details: error.message }, { status: 500 });
    }

    console.log('[PUT /api/partners/bank-profile] Bank profile saved:', bankProfile);

    try {
      await logReferralEvent({
        action: 'bank_profile_updated',
        category: 'profile',
        user_id: session.userId,
        description: `Partner ${partner.id} updated bank profile`,
        metadata: { partnerId: partner.id, bankName }
      });
    } catch (logError) {
      console.error('[PUT /api/partners/bank-profile] Failed to log event:', logError);
      // Don't fail the request if logging fails
    }

    return NextResponse.json({ success: true, bankProfile });
  } catch (error) {
    console.error('[PUT /api/partners/bank-profile] Unhandled error:', error);
    return NextResponse.json({ error: 'Internal Server Error', details: error instanceof Error ? error.message : 'Unknown error' }, { status: 500 });
  }
}