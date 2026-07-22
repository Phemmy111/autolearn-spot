const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'));
const decoded = envContent.toString('utf-8').replace(/\0/g, '');
const lines = decoded.split(/\r?\n/);

let supabaseUrl = '';
let supabaseKey = '';
let anonKey = '';

lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = trimmed.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
  }
  if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = trimmed.substring('SUPABASE_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
  }
  if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    anonKey = trimmed.substring('NEXT_PUBLIC_SUPABASE_ANON_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
  }
});

const keyToUse = supabaseKey || anonKey;
const supabase = createClient(supabaseUrl, keyToUse);

async function testVerification() {
  console.log('--- 1. Querying site_settings ---');
  const { data: settings, error: settingsError } = await supabase
    .from('site_settings')
    .select('*');

  if (settingsError) {
    console.error('Error fetching site_settings:', settingsError.message);
  } else {
    console.log('site_settings entries:', settings);
  }

  console.log('\n--- 2. Upserting Test Settings (Simulating Super Admin setting Course Completion) ---');
  const courseSlug = 'ai-automation-bootcamp';
  const testFinalLesson = 'wk1-vid3';
  
  const { error: upsertError } = await supabase.from('site_settings').upsert([
    { key: `final_lesson_id:${courseSlug}`, value: testFinalLesson },
    { key: `certificate_enabled:${courseSlug}`, value: true },
    { key: 'certificate_enabled', value: true }
  ], { onConflict: 'key' });

  if (upsertError) {
    console.error('Error upserting settings:', upsertError.message);
  } else {
    console.log('Successfully saved settings into site_settings:');
    console.log(`- final_lesson_id:${courseSlug} => ${testFinalLesson}`);
    console.log(`- certificate_enabled:${courseSlug} => true`);
  }

  console.log('\n--- 3. Querying certificates table ---');
  const { data: certs, error: certsError } = await supabase
    .from('certificates')
    .select('*');

  if (certsError) {
    console.error('Error fetching certificates:', certsError.message);
  } else {
    console.log('Current certificates in DB:', certs);
  }

  console.log('\n--- 4. Simulating Student Certificate Grant (Database Level) ---');
  const testUserId = 'user_test_student_123';
  const testCohortId = 'a1111111-1111-1111-1111-111111111111';
  
  const { data: insertedCert, error: grantError } = await supabase
    .from('certificates')
    .upsert({
      cohort_id: testCohortId,
      user_id: testUserId,
      user_name: 'Test Student',
      user_email: 'student@example.com',
      certificate_code: 'CERT-TEST1234',
      issued_at: new Date().toISOString()
    }, { onConflict: 'cohort_id,user_id' })
    .select()
    .single();

  if (grantError) {
    console.error('Error granting certificate:', grantError.message);
  } else {
    console.log('Successfully created test certificate record:');
    console.log(insertedCert);
  }
}

testVerification();
