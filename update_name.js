require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  await supabase.from('certificates').update({ user_name: 'Phemmy' }).eq('user_name', 'Student');
  console.log("Updated generic Student names in DB");
}
run();
