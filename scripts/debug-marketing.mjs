import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';
dotenv.config({ path: '.env.local' });
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  // Fetch existing records to see what partner_id looks like
  const { data, error } = await sb.from('partner_marketing_downloads').select('id, partner_id, resource_name').limit(5);
  console.log('Existing records:', JSON.stringify(data, null, 2), error);

  // Try inserting with partner_id = null to see if that's allowed
  const { data: test, error: testErr } = await sb
    .from('partner_marketing_downloads')
    .insert({ resource_name: 'TEST_DELETE_ME', resource_type: 'test', partner_id: null })
    .select().single();
  console.log('Insert with null partner_id:', test?.id, testErr?.message);
  if (test?.id) {
    // Clean up
    await sb.from('partner_marketing_downloads').delete().eq('id', test.id);
    console.log('Cleaned up test record');
  }
}
run().catch(console.error);
