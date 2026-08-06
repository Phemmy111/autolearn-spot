import { NextResponse } from 'next/server';
import { isAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';
import { CommunityAuthService } from '@/lib/growth-engine/CommunityAuthService';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const isAdminUser = await isAdmin();
    if (!isAdminUser) {
      return NextResponse.json({ error: 'Unauthorized: Admin access required' }, { status: 401 });
    }
    
    console.log('[POST /api/admin/repair/all-partners-auth] Starting batch repair');

    // Get all partners without auth records
    const { data: partners, error: partnersError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .or('community_ambassador_id.is.null,influencer_id.is.null')
      .in('partner_type', ['community', 'influencer']);

    if (partnersError) {
      console.error('[POST /api/admin/repair/all-partners-auth] Failed to fetch partners:', partnersError);
      return NextResponse.json({ error: 'Failed to fetch partners', details: partnersError.message }, { status: 500 });
    }

    console.log('[POST /api/admin/repair/all-partners-auth] Found partners needing repair:', partners?.length || 0);

    if (!partners || partners.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No partners need authentication repair',
        repaired: 0,
        failed: 0
      });
    }

    const results = {
      repaired: 0,
      failed: 0,
      errors: [] as any[]
    };

    for (const partner of partners) {
      try {
        console.log('[POST /api/admin/repair/all-partners-auth] Repairing partner:', partner.email, 'Type:', partner.partner_type);

        // Generate new password
        const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
        const hashedPassword = CommunityAuthService.hashPassword(tempPassword);

        // Create auth record based on partner type
        const authTableName = partner.partner_type === 'influencer' ? 'influencers' : 'community_ambassadors';
        const linkField = partner.partner_type === 'influencer' ? 'influencer_id' : 'community_ambassador_id';

        const authData = {
          full_name: partner.full_name,
          email: partner.email,
          password: hashedPassword,
          status: 'active'
        };

        const { data: authRecord, error: createError } = await supabaseAdmin
          .from(authTableName)
          .insert(authData)
          .select()
          .single();

        if (createError) {
          console.error('[POST /api/admin/repair/all-partners-auth] Failed to create auth record for:', partner.email, createError);
          results.failed++;
          results.errors.push({ email: partner.email, error: createError.message });
          continue;
        }

        // Link auth record to partner
        const { error: linkError } = await supabaseAdmin
          .from('partners')
          .update({ [linkField]: authRecord.id })
          .eq('id', partner.id);

        if (linkError) {
          console.error('[POST /api/admin/repair/all-partners-auth] Failed to link auth record for:', partner.email, linkError);
          results.failed++;
          results.errors.push({ email: partner.email, error: linkError.message });
          continue;
        }

        console.log('[POST /api/admin/repair/all-partners-auth] Successfully repaired:', partner.email);
        results.repaired++;
      } catch (partnerError) {
        console.error('[POST /api/admin/repair/all-partners-auth] Exception for partner:', partner.email, partnerError);
        results.failed++;
        results.errors.push({ email: partner.email, error: String(partnerError) });
      }
    }

    return NextResponse.json({
      success: true,
      message: `Batch repair completed. Repaired: ${results.repaired}, Failed: ${results.failed}`,
      ...results
    });
  } catch (error) {
    console.error('[POST /api/admin/repair/all-partners-auth] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}