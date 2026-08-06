import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function GET(
  request: Request,
  { params }: { params: { email: string } }
) {
  try {
    // Temporarily disable admin check for debugging
    // const isAdminUser = await isAdmin();
    // if (!isAdminUser) {
    //   return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    // }
    
    const resolvedParams = await params;
    const email = decodeURIComponent(resolvedParams.email);
    
    console.log('[GET /api/admin/debug/partner-auth/:email] Debugging auth for:', email);

    // Get partner record
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('email', email)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found', details: partnerError }, { status: 404 });
    }

    // Get community ambassador record
    const { data: communityAmbassador, error: communityError } = await supabaseAdmin
      .from('community_ambassadors')
      .select('*')
      .eq('email', email)
      .single();

    // Get influencer record
    const { data: influencer, error: influencerError } = await supabaseAdmin
      .from('influencers')
      .select('*')
      .eq('email', email)
      .single();

    return NextResponse.json({
      success: true,
      partner: {
        id: partner.id,
        email: partner.email,
        partner_type: partner.partner_type,
        community_ambassador_id: partner.community_ambassador_id,
        influencer_id: partner.influencer_id,
        password: partner.password
      },
      community_ambassador: communityAmbassador ? {
        id: communityAmbassador.id,
        email: communityAmbassador.email,
        has_password: !!communityAmbassador.password,
        password_length: communityAmbassador.password?.length
      } : null,
      influencer: influencer ? {
        id: influencer.id,
        email: influencer.email,
        has_password: !!influencer.password,
        password_length: influencer.password?.length
      } : null,
      errors: {
        partner: partnerError,
        community: communityError,
        influencer: influencerError
      }
    });
  } catch (error) {
    console.error('[GET /api/admin/debug/partner-auth/:email] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}