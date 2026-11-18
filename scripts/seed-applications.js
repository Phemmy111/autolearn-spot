const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabaseAdmin = createClient(supabaseUrl, supabaseKey);
const REGISTRY_KEY = 'partner_applications_registry';

async function seed() {
  console.log('Fetching partners...');
  const { data: partners, error } = await supabaseAdmin
    .from('partners')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching partners:', error);
    process.exit(1);
  }

  console.log(`Found ${partners.length} partners.`);

  const registry = partners.map((p) => {
    const isFemi = (p.email || '').toLowerCase().includes('femi');
    return {
      id: p.id,
      partner_id: p.partner_id || 'ALS0000',
      full_name: p.name || 'Partner',
      name: p.name || 'Partner',
      email: (p.email || '').toLowerCase().trim(),
      phone: p.phone || '08120934828',
      whatsapp: p.phone || '08120934828',
      state: 'Lagos',
      occupation: isFemi ? 'Lead Growth & Systems Architect' : 'Digital Creator & Course Marketer',
      organization: isFemi ? 'AutoLearn Spot Partner Network' : 'Independent Affiliate Creator',
      website: isFemi ? 'https://www.autolearnspot.com' : '',
      motivation: 'Passionate about democratizing technical education and connecting high-demand skills to career-driven African students.',
      promotion_method: 'Direct paid advertising, targeted WhatsApp educational cohorts, and social media campaigns on LinkedIn and X.',
      experience: 'Over 3 years driving digital education sales with strong conversion funnels.',
      facebook: '',
      instagram: '',
      tiktok: '',
      linkedin: isFemi ? 'https://linkedin.com/in/femiadeleke' : '',
      youtube: '',
      status: p.status || 'active',
      applied_at: p.created_at || new Date().toISOString()
    };
  });

  // Save master registry
  console.log('Saving master registry to site_settings...');
  const { error: regErr } = await supabaseAdmin.from('site_settings').upsert({
    key: REGISTRY_KEY,
    value: JSON.stringify(registry),
    updated_at: new Date().toISOString()
  }, { onConflict: 'key' });

  if (regErr) {
    console.error('Error saving registry:', regErr);
    process.exit(1);
  }

  // Save individual keys for fast lookup
  for (const app of registry) {
    await supabaseAdmin.from('site_settings').upsert([
      {
        key: `partner_app_email_${app.email}`,
        value: JSON.stringify(app),
        updated_at: new Date().toISOString()
      },
      {
        key: `partner_app_id_${app.id}`,
        value: JSON.stringify(app),
        updated_at: new Date().toISOString()
      }
    ], { onConflict: 'key' });
  }

  console.log(`Successfully seeded ${registry.length} partner application dossiers into site_settings!`);
}

seed();
