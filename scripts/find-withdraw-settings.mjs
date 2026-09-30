import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function findWithdrawalSettings() {
  const { data: settings } = await supabaseAdmin
    .from('site_settings')
    .select('*');
  const withdrawSettings = (settings || []).filter(s => s.key.toLowerCase().includes('withdraw') || s.key.toLowerCase().includes('min'));
  console.log('Withdrawal / min settings:', withdrawSettings);
}

findWithdrawalSettings().catch(console.error);
