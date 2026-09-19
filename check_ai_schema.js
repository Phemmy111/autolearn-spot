require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: p } = await supabase.from('ai_prompts').select('author_id').limit(1);
  const { data: q } = await supabase.from('ai_providers').select('author_id').limit(1);
  console.log('ai_prompts author_id:', p);
  console.log('ai_providers author_id:', q);
}
check();
