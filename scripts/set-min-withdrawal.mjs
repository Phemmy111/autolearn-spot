import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await sb
    .from('site_settings')
    .upsert({ key: 'partner_min_withdrawal', value: '1000' }, { onConflict: 'key' })
    .select();

  if (error) {
    console.error('Error:', error);
    process.exit(1);
  }
  console.log('✅ partner_min_withdrawal updated to 1000:', data);
}

run();
