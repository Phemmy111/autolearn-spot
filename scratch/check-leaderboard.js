const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function checkLeaderboard() {
  const { data, error } = await supabase.from('leaderboard').select('*').limit(5);
  console.log('Leaderboard:', data);
  console.log('Error:', error);
}

checkLeaderboard();
