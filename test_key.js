require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function check() {
  const providerId = 'e38f5325-bd79-42d0-a891-336f469e05fd';
  const { data, error } = await supabase
    .from('ai_providers')
    .select('api_key_encrypted')
    .eq('id', providerId)
    .single();
    
  console.log('Encrypted key:', data?.api_key_encrypted);
}
check();
