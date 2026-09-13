const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function list() {
  const { data, error } = await supabase.rpc('get_tables_info').catch(() => ({}));
  if (error || !data) {
    console.log('Cant use RPC. Falling back to information_schema');
    const { data: q } = await supabase.from('learning_products').select('*').limit(1);
  }
}
list();
