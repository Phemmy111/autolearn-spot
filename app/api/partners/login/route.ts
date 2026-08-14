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

    console.log('[POST /api/partners/login] Login attempt:', { email, partnerType });

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

    console.log('[POST /api/partners/login] Auth result:', { success: authResult.success, error: authResult.error });

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
      
      console.log('[POST /api/partners/login] Email lookup result:', { found: !!partnerByEmail, error: emailError, partnerType: partnerByEmail?.partner_type });
      
      if (partnerByEmail) {
        console.log('[POST /api/partners/login] Found partner by email:', partnerByEmail.id, 'Partner type:', partnerByEmail.partner_type);
        
        // Check if partner type matches the login attempt
        if (partnerByEmail.partner_type !== partnerType) {
          console.log('[POST /api/partners/login] Partner type mismatch:', { dbType: partnerByEmail.partner_type, loginType: partnerType });
          return NextResponse.json({ error: `Please login as ${partnerByEmail.partner_type} partner` }, { status: 401 });
        }
        
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
        // Create partner record as fallback with minimal required fields
        try {
          const partnerData = {
            partner_id: authResult.user.id, // Use the ambassador ID as partner_id
            partner_type: partnerType,
            ...(partnerType === 'community' ? { community_ambassador_id: authResult.user.id } : { influencer_id: authResult.user.id }),
            full_name: authResult.user.full_name || 'Partner',
            email: authResult.user.email,
            commission_rate: partnerType === 'community' ? 1500 : 2000,
            status: 'active'
          };
          
          console.log('[POST /api/partners/login] Creating partner with data:', partnerData);
          
          const { data: newPartner, error: createError } = await supabaseAdmin
            .from('partners')
            .insert(partnerData)
            .select()
            .single();
          
          if (createError) {
            console.error('[POST /api/partners/login] Failed to create partner record:', createError);
            console.error('[POST /api/partners/login] Error details:', JSON.stringify(createError));
            return NextResponse.json({ error: 'Partner record not found and could not be created: ' + createError.message }, { status: 500 });
          }
          
          console.log('[POST /api/partners/login] Created new partner record:', newPartner.id);
          partner = newPartner;
        } catch (e) {
          console.error('[POST /api/partners/login] Exception creating partner record:', e);
          return NextResponse.json({ error: 'Partner record not found and could not be created' }, { status: 500 });
        }
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
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://autolearn-spot.vercel.app';
    try {
      await fetch(`${appUrl}/api/internal/update-last-login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: tableName, userId: authResult.user.id })
      });
    } catch (e) {
      console.error('[POST /api/partners/login] Failed to update last login:', e);
      // Continue anyway - this is not critical for login
    }

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