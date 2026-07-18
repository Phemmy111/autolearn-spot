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

if (!supabaseUrl || !keyToUse) {
  console.error('Could not parse env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, keyToUse);

async function setup() {
  console.log('Setting up site_settings table...');

  // Try to insert the default setting
  const { data, error } = await supabase
    .from('site_settings')
    .upsert(
      { key: 'certificate_enabled', value: false },
      { onConflict: 'key' }
    )
    .select();

  if (error) {
    if (error.message?.includes('does not exist') || error.code === '42P01') {
      console.log('\n❌ Table "site_settings" does not exist.');
      console.log('\nPlease run this SQL in your Supabase Dashboard > SQL Editor:\n');
      console.log(`
CREATE TABLE IF NOT EXISTS site_settings (
  key TEXT PRIMARY KEY,
  value BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO site_settings (key, value) 
VALUES ('certificate_enabled', false) 
ON CONFLICT (key) DO NOTHING;

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow service role full access" ON site_settings
  FOR ALL USING (true) WITH CHECK (true);
      `);
      console.log('\nOnce you run that, the feature will be ready!');
    } else {
      console.error('Error:', error.message);
    }
  } else {
    console.log('✅ site_settings table is ready!');
  }
}

setup();
