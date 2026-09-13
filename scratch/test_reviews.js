const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function check() {
  const tables = ['reviews', 'product_reviews', 'course_reviews', 'student_reviews'];
  for (const t of tables) {
    const { error } = await supabase.from(t).select('id').limit(1);
    console.log(t, error ? 'Missing/Error' : 'Exists');
  }
}
check();
