require('dotenv').config({path: '.env.local'});
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  const { data: enrollments } = await supabase.from('enrollments').select('*').is('full_name', null);
  console.log(`Found ${enrollments.length} enrollments missing full_name`);
  
  for (const enr of enrollments) {
    let name = null;
    const { data: s } = await supabase.from('scholarship_applications').select('full_name').eq('email', enr.email).order('created_at', {ascending: false}).limit(1).maybeSingle();
    if (s && s.full_name) {
      name = s.full_name;
    } else {
      const { data: p } = await supabase.from('pending_enrollments').select('full_name, first_name, last_name').eq('email', enr.email).order('created_at', {ascending: false}).limit(1).maybeSingle();
      if (p) {
        name = p.full_name || [p.first_name, p.last_name].filter(Boolean).join(' ');
      }
    }
    
    if (name) {
      await supabase.from('enrollments').update({ full_name: name }).eq('id', enr.id);
      console.log(`Updated ${enr.email} to ${name}`);
    } else {
      console.log(`Could not find name for ${enr.email}`);
    }
  }
  
  // Also check if any existing 'Student' names need updating
  const { data: studentEnr } = await supabase.from('enrollments').select('*').eq('full_name', 'Student');
  console.log(`Found ${studentEnr.length} enrollments with name 'Student'`);
  
  for (const enr of studentEnr) {
    let name = null;
    const { data: s } = await supabase.from('scholarship_applications').select('full_name').eq('email', enr.email).order('created_at', {ascending: false}).limit(1).maybeSingle();
    if (s && s.full_name) {
      name = s.full_name;
    }
    
    if (name) {
      await supabase.from('enrollments').update({ full_name: name }).eq('id', enr.id);
      console.log(`Updated Student ${enr.email} to ${name}`);
    }
  }
  
  console.log('Done backfill!');
}
run();
