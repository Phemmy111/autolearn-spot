require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const authorId = '215b73ef-92d5-40db-8b9d-c87c79411587';
  
  let { data: prompt, error: e1 } = await supabase
    .from('ai_prompts')
    .select('*')
    .eq('author_id', authorId)
    .eq('prompt_type', 'quiz_generation')
    .eq('is_active', true)
    .maybeSingle()
    
  console.log('e1:', e1);
    
  if (!prompt) {
    const { data: globalPrompt, error: e2 } = await supabase
      .from('ai_prompts')
      .select('*')
      .is('author_id', null)
      .eq('prompt_type', 'quiz_generation')
      .eq('is_active', true)
      .maybeSingle()
      
    console.log('e2:', e2);
    prompt = globalPrompt
  }
  
  console.log('Final prompt ID:', prompt?.id);
}
check();
