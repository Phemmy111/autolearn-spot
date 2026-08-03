import { NextResponse } from 'next/server';
import { CommunityAuthService } from '@/lib/growth-engine/CommunityAuthService';
import { SessionService } from '@/lib/growth-engine/SessionService';
import { PartnerService } from '@/lib/growth-engine/PartnerService';
import { logReferralEvent } from '@/lib/audit-logging';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function POST(request: Request) {
  try {
    const { email, password, partnerType } = await request.json();

    if (!email || !password || !partnerType) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (partnerType !== 'community' && partnerType !== 'influencer') {
      return NextResponse.json({ error: 'Invalid partner type' }, { status: 400 });
    }

    // Authenticate based on partner type
    const authResult = partnerType === 'community' 
      ? await CommunityAuthService.authenticate(email, password)
      : await CommunityAuthService.authenticateInfluencer(email, password);

    if (!authResult.success || !authResult.user) {
      return NextResponse.json({ error: authResult.error || 'Invalid credentials' }, { status: 401 });
    }

    // Get partner record
    let partner = partnerType === 'community'
      ? await PartnerService.getPartnerByCommunityAmbassadorId(authResult.user.id)
      : await PartnerService.getPartnerByInfluencerId(authResult.user.id);

    // Fallback: try to find partner by email if not found by ID
    if (!partner) {
      console.log('[POST /api/partners/login] Partner not found by ID, trying email lookup');
      const { data: partnerByEmail, error: emailError } = await supabaseAdmin
        .from('partners')
        .select('*')
        .eq('email', email)
        .single();
      
      console.log('[POST /api/partners/login] Email lookup result:', { found: !!partnerByEmail, error: emailError });
      
      if (partnerByEmail) {
        console.log('[POST /api/partners/login] Found partner by email:', partnerByEmail.id);
        partner = partnerByEmail;
        
        // Link the ambassador to the partner if not already linked
        if (partnerType === 'community' && !partnerByEmail.community_ambassador_id) {
          console.log('[POST /api/partners/login] Linking ambassador to partner');
          await supabaseAdmin
            .from('partners')
            .update({ community_ambassador_id: authResult.user.id })
            .eq('id', partnerByEmail.id);
        }
      } else {
        console.log('[POST /api/partners/login] Partner not found by email either, creating new partner record');
        // Create partner record as fallback
        const { data: newPartner, error: createError } = await supabaseAdmin
          .from('partners')
          .insert({
            partner_type: 'community',
            community_ambassador_id: authResult.user.id,
            full_name: authResult.user.full_name,
            email: authResult.user.email,
            phone: authResult.user.phone,
            commission_rate: 1500,
            status: 'active'
          })
          .select()
          .single();
        
        if (createError) {
          console.error('[POST /api/partners/login] Failed to create partner record:', createError);
          return NextResponse.json({ error: 'Partner record not found and could not be created' }, { status: 404 });
        }
        
        console.log('[POST /api/partners/login] Created new partner record:', newPartner.id);
        partner = newPartner;
      }
    }

    if (!partner) {
      return NextResponse.json({ error: 'Partner record not found' }, { status: 404 });
    }

    if (partner.status !== 'active') {
      return NextResponse.json({ error: 'Account is not active' }, { status: 403 });
    }

    // Create session
    await SessionService.createSession(authResult.user.id, partnerType);

    // Update last login
    const tableName = partnerType === 'community' ? 'community_ambassadors' : 'influencers';
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/internal/update-last-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: tableName, userId: authResult.user.id })
    });

    await logReferralEvent({
      action: 'partner_login',
      category: 'auth',
      user_id: authResult.user.id,
      description: `${partnerType} partner logged in`,
      metadata: { email, partnerId: partner.id }
    });

    return NextResponse.json({ 
      success: true, 
      user: authResult.user,
      partner: {
        id: partner.id,
        type: partner.partner_type,
        name: partner.full_name,
        email: partner.email,
        commissionRate: partner.commission_rate
      }
    });

  } catch (error) {
    console.error('[POST /api/partners/login] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}