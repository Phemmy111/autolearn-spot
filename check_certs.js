require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const userId = "user_3JI4lwWSCQXqH9LKg30kcabvJmV";
  const { data, error } = await supabase
    .from('certificates')
    .select('*')
    .eq('user_id', userId);
  console.log("Certs:", data);
  if (error) console.error(error);
}
run();
