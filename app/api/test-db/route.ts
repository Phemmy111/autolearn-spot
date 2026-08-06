import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

export async function GET(request: NextRequest) {
  try {
    console.log('Testing database connection...');
    console.log('Supabase URL:', supabaseUrl);
    console.log('Service key exists:', !!supabaseServiceKey);

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Test basic connection
    const { data: testData, error: testError } = await supabaseAdmin
      .from('pending_enrollments')
      .select('count')
      .limit(1);

    console.log('Test query result:', testData);
    console.log('Test query error:', testError);

    if (testError) {
      console.error('Database connection failed:', testError);
      return NextResponse.json({
        success: false,
        error: 'Database connection failed',
        details: testError,
        tables: {
          pending_enrollments: 'Error accessing table'
        }
      });
    }

    // Check if table exists by trying to describe it
    const { data: tableInfo, error: tableError } = await supabaseAdmin
      .rpc('get_table_info', { table_name: 'pending_enrollments' })
      .catch(() => ({ data: null, error: { message: 'RPC function not available' } }));

    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      tables: {
        pending_enrollments: tableError ? 'Cannot verify structure' : 'Accessible'
      },
      testQuery: testData,
      tableInfo: tableInfo
    });

  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { partnerId } = body;

    console.log('[POST /api/test-db] Repairing auth for partner:', partnerId);

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

    console.log('[POST /api/test-db] Partner found:', partner.email, 'Type:', partner.partner_type);

    // Generate new password
    const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
    const hashedPassword = hashPassword(tempPassword);

    console.log('[POST /api/test-db] Generated password:', tempPassword);

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
        console.error('[POST /api/test-db] Failed to update auth record:', updateError);
        return NextResponse.json({ error: 'Failed to update auth record', details: updateError.message }, { status: 500 });
      }

      console.log('[POST /api/test-db] Updated existing auth record');
    } else {
      // Create new auth record
      const authData = {
        full_name: partner.full_name,
        email: partner.email,
        password: hashedPassword,
        status: 'active'
      };

      console.log('[POST /api/test-db] Creating new auth record in table:', authTableName);

      const { data: authRecord, error: createError } = await supabaseAdmin
        .from(authTableName)
        .insert(authData)
        .select()
        .single();

      if (createError) {
        console.error('[POST /api/test-db] Failed to create auth record:', createError);
        return NextResponse.json({ error: 'Failed to create auth record', details: createError.message }, { status: 500 });
      }

      console.log('[POST /api/test-db] Created new auth record:', authRecord.id);

      // Link auth record to partner
      const { error: linkError } = await supabaseAdmin
        .from('partners')
        .update({ [linkField]: authRecord.id })
        .eq('id', partner.id);

      if (linkError) {
        console.error('[POST /api/test-db] Failed to link auth record:', linkError);
        return NextResponse.json({ error: 'Failed to link auth record', details: linkError.message }, { status: 500 });
      }

      console.log('[POST /api/test-db] Linked auth record to partner');
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
    console.error('[POST /api/test-db] Error:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}