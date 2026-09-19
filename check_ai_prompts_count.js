require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: p } = await supabase.from('ai_prompts').select('*').is('author_id', null).eq('prompt_type', 'quiz_generation').eq('is_active', true);
  console.log('Global active quiz prompts:', p?.length);
}
check();
