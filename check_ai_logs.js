require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: logs } = await supabase.from('ai_usage_logs').select('*').order('created_at', { ascending: false }).limit(2);
  console.log(logs);
}
check();
