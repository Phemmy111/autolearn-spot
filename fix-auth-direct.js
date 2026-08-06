// Run this directly with: node fix-auth-direct.js
// Make sure you have .env.local with SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY

const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing environment variables');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? 'SET' : 'NOT SET');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${hash}`;
}

async function setProperPassword() {
  const email = 'femiadeleke209@gmail.com';
  const newPassword = 'AutoLearn2026!'; // Strong password
  const hashedPassword = hashPassword(newPassword);
  
  console.log('Setting proper password for:', email);
  console.log('New password:', newPassword);
  console.log('Hashed password:', hashedPassword);

  // Update the influencer record with proper hash
  const { error: updateError } = await supabaseAdmin
    .from('influencers')
    .update({ password_hash: hashedPassword })
    .eq('email', email);

  if (updateError) {
    console.error('Failed to update password:', updateError);
    return;
  }

  console.log('✅ Password updated successfully!');
  console.log('📧 Email:', email);
  console.log('🔑 New password:', newPassword);
  console.log('🔐 Hash:', hashedPassword);
}

setProperPassword().catch(console.error);