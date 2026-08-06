// Run this script directly to repair partner authentication
// Usage: npx tsx scripts/repair-partner-auth.ts

// Load environment variables
import { config } from 'dotenv';
config({ path: '.env.local' });

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

import crypto from 'crypto';

function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function repairPartnerAuth(partnerId: string) {
  console.log('Repairing auth for partner:', partnerId);

  // Get partner record
  const { data: partner, error: partnerError } = await supabaseAdmin
    .from('partners')
    .select('*')
    .eq('id', partnerId)
    .single();

  if (partnerError || !partner) {
    console.error('Partner not found:', partnerError);
    return;
  }

  console.log('Partner found:', partner.email, 'Type:', partner.partner_type);

  // Generate new password
  const tempPassword = Math.random().toString(36).slice(-8).toUpperCase();
  const hashedPassword = hashPassword(tempPassword);

  console.log('Generated password:', tempPassword);

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
      console.error('Failed to update auth record:', updateError);
      return;
    }

    console.log('Updated existing auth record');
  } else {
    // Create new auth record
    const authData = {
      full_name: partner.full_name,
      email: partner.email,
      password: hashedPassword,
      status: 'active'
    };

    console.log('Creating new auth record in table:', authTableName);

    const { data: authRecord, error: createError } = await supabaseAdmin
      .from(authTableName)
      .insert(authData)
      .select()
      .single();

    if (createError) {
      console.error('Failed to create auth record:', createError);
      return;
    }

    console.log('Created new auth record:', authRecord.id);

    // Link auth record to partner
    const { error: linkError } = await supabaseAdmin
      .from('partners')
      .update({ [linkField]: authRecord.id })
      .eq('id', partner.id);

    if (linkError) {
      console.error('Failed to link auth record:', linkError);
      return;
    }

    console.log('Linked auth record to partner');
  }

  console.log('✅ Repair completed successfully!');
  console.log('📧 New password:', tempPassword);
  console.log('📧 Email:', partner.email);
  console.log('👤 Partner type:', partner.partner_type);
}

// Run the repair
const partnerId = '5de52f70-1d52-4ebd-8bc9-5cfd5569adca';
repairPartnerAuth(partnerId);