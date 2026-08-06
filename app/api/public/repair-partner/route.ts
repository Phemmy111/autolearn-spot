import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId } = body;

    console.log('[POST /api/public/repair-partner] Repairing auth for partner:', partnerId);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get partner record
    const { data: partner, error: partnerError } = await supabaseAdmin
      .from('partners')
      .select('*')
      .eq('id', partnerId)
      .single();

    if (partnerError || !partner) {
      return NextResponse.json({ error: 'Partner not found', details: partnerError }, { status: 404 });
    }

    console.log('[POST /api/public/repair-partner] Partner found:', partner.email, 'Type:', partner.partner_type);

    // Generate new password
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = hashPassword(tempPassword);

    console.log('[POST /api/public/repair-partner] Generated password:', tempPassword);

    // Create auth record based on partner type
    const authTableName = partner.partner_type === 'influencer' ? 'influencers' : 'community_ambassadors';
    const linkField = partner.partner_type === 'influencer' ? 'influencer_id' : 'community_ambassador_id';

    // Check if auth record already exists
    const existingLinkId = partner[linkField];
    if (existingLinkId) {
      // Update existing auth record
      const { error: updateError } = await supabaseAdmin
        .from(authTableName)
        .update({ password: hashedPassword })
        .eq('id', existingLinkId);

      if (updateError) {
        console.error('[POST /api/public/repair-partner] Failed to update auth record:', updateError);
        return NextResponse.json({ error: 'Failed to update auth record', details: updateError.message }, { status: 500 });
      }

      console.log('[POST /api/public/repair-partner] Updated existing auth record');
    } else {
      // Create new auth record
      const authData = {
        full_name: partner.full_name,
        email: partner.email,
        password: hashedPassword,
        status: 'active'
      };

      console.log('[POST /api/public/repair-partner] Creating new auth record in table:', authTableName);

      const { data: authRecord, error: createError } = await supabaseAdmin
        .from(authTableName)
        .insert(authData)
        .select()
        .single();

      if (createError) {
        console.error('[POST /api/public/repair-partner] Failed to create auth record:', createError);
        return NextResponse.json({ error: 'Failed to create auth record', details: createError.message }, { status: 500 });
      }

      console.log('[POST /api/public/repair-partner] Created new auth record:', authRecord.id);

      // Link auth record to partner
      const { error: linkError } = await supabaseAdmin
        .from('partners')
        .update({ [linkField]: authRecord.id })
        .eq('id', partner.id);

      if (linkError) {
        console.error('[POST /api/public/repair-partner] Failed to link auth record:', linkError);
        return NextResponse.json({ error: 'Failed to link auth record', details: linkError.message }, { status: 500 });
      }

      console.log('[POST /api/public/repair-partner] Linked auth record to partner');
    }

    return NextResponse.json({
      success: true,
      message: 'Partner authentication repaired successfully',
      partner: {
        id: partner.id,
        email: partner.email,
        partner_type: partner.partner_type
      },
      newPassword: tempPassword
    });
  } catch (error) {
    console.error('[POST /api/public/repair-partner] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}