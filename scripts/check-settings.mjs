import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });
dotenv.config({ path: '.env' });

const supabaseAdmin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function checkSiteSettings() {
  const { data: settings, error } = await supabaseAdmin
    .from('site_settings')
    .select('*');
  console.log('Site settings:', settings, error);
}

checkSiteSettings().catch(console.error);
