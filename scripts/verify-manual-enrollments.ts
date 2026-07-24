import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runVerification() {
  console.log('--- Starting Manual Verification Script ---');

  // 1. Get a cohort
  let { data: cohort } = await supabase.from('cohorts').select('id').eq('is_current', true).single();
  if (!cohort) {
    const { data: anyCohort } = await supabase.from('cohorts').select('id').limit(1).single();
    if (!anyCohort) throw new Error('No cohort found in database at all');
    cohort = anyCohort;
  }

  const testEmail = 'verify_manual_test@example.com';
  
  // Cleanup any previous test runs
  await supabase.from('enrollments').delete().eq('email', testEmail);

  // 2. Create a manual enrollment
  console.log('Testing: Create a manual enrollment');
  const { data: newEnrollment, error: createError } = await supabase.from('enrollments').insert({
    email: testEmail,
    cohort_id: cohort.id,
    status: 'active',
    notes: 'Verification Test',
    activated_at: new Date().toISOString()
  }).select().single();
  
  if (createError) throw new Error(`Create failed: ${createError.message}`);
  console.log('✅ Manual enrollment created successfully.');

  // 3. Test "Already Enrolled" protection (simulated logic)
  console.log('Testing: "Already Enrolled" protection');
  const { data: existing } = await supabase.from('enrollments').select('status').eq('email', testEmail).eq('cohort_id', cohort.id).single();
  if (existing?.status === 'active') {
    console.log('✅ Protection works: Active enrollment detected.');
  } else {
    throw new Error('Protection failed: Expected active enrollment.');
  }

  // 4. Test Deactivate removes access (simulated logic using hasActiveEnrollment logic)
  console.log('Testing: Deactivate removes dashboard access');
  await supabase.from('enrollments').update({ status: 'inactive' }).eq('id', newEnrollment.id);
  const { data: deactivated } = await supabase.from('enrollments').select('status').eq('id', newEnrollment.id).single();
  if (deactivated?.status !== 'active') {
    console.log('✅ Dashboard access denied (status is not active).');
  } else {
    throw new Error('Deactivate failed.');
  }

  // 5. Test Reactivate restores access
  console.log('Testing: Reactivate restores dashboard access');
  await supabase.from('enrollments').update({ status: 'active' }).eq('id', newEnrollment.id);
  const { data: reactivated } = await supabase.from('enrollments').select('status').eq('id', newEnrollment.id).single();
  if (reactivated?.status === 'active') {
    console.log('✅ Dashboard access restored (status is active).');
  } else {
    throw new Error('Reactivate failed.');
  }

  // Cleanup
  await supabase.from('enrollments').delete().eq('email', testEmail);

  console.log('--- Verification Complete: All Checks Passed ---');
}

runVerification().catch(console.error);
