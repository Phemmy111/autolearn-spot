require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const { data: p } = await supabase.from('learning_products').select('author_id').limit(1);
  const { data: a } = await supabase.from('authors').select('id, clerk_user_id').limit(1);
  console.log('Product author_id:', p);
  console.log('Authors id vs clerk_user_id:', a);
}
check();
