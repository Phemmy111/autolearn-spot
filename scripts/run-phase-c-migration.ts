import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Supabase URL and Key must be provided in environment variables.');
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  console.log('--- Starting Phase C Migration ---');
  console.log('Note: This script will output the SQL to run manually in your Supabase SQL Editor');
  console.log('The SQL file has been created at: migrations/phase-c-lesson-youtube-support.sql');
  console.log('');
  console.log('To apply the migration:');
  console.log('1. Open your Supabase dashboard');
  console.log('2. Go to SQL Editor');
  console.log('3. Open the file: migrations/phase-c-lesson-youtube-support.sql');
  console.log('4. Run the SQL');
  console.log('');
  console.log('The migration includes:');
  console.log('- YouTube support fields (youtube_url, youtube_video_id, youtube_thumbnail)');
  console.log('- Lesson status field (DRAFT/PUBLISHED)');
  console.log('- is_required flag for unlock configuration');
  console.log('- RLS policies for author lesson management');
  console.log('');
  console.log('--- Phase C Migration Script Complete ---');
}

runMigration();
