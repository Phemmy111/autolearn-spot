require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  await supabase.from('cohorts').update({ learning_product_id: 'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921' }).eq('id', '3633e893-7bc4-4cb6-9617-f7c5255aeaa9');
  console.log("Updated Cohort 2 to AI Automation with n8n");
}
run();
