require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('site_settings')
    .update({ value: true })
    .eq('key', 'certificate_enabled:ai-automation-bootcamp')
    .select();
  console.log("Updated:", data);
  console.log("Error:", error);
}
run();
