const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const envContent = fs.readFileSync('.env.local'); // read as buffer
// Convert to string and remove null bytes in case of UTF-16 LE mixed encoding
const decoded = envContent.toString('utf-8').replace(/\0/g, '');
const lines = decoded.split(/\r?\n/);

let supabaseUrl = '';
let supabaseKey = '';
let anonKey = '';

lines.forEach(line => {
  const trimmed = line.trim();
  if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) {
    supabaseUrl = trimmed.substring('NEXT_PUBLIC_SUPABASE_URL='.length).trim().replace(/^['"]|['"]$/g, '');
  }
  if (trimmed.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) {
    supabaseKey = trimmed.substring('SUPABASE_SERVICE_ROLE_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
  }
  if (trimmed.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) {
    anonKey = trimmed.substring('NEXT_PUBLIC_SUPABASE_ANON_KEY='.length).trim().replace(/^['"]|['"]$/g, '');
  }
});

const keyToUse = supabaseKey || anonKey;

if (!supabaseUrl || !keyToUse) {
  console.error('Could not parse env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, keyToUse);

async function resetDatabase() {
  console.log('Deleting all quiz responses (history)...');
  const { error: err1 } = await supabase
    .from('quiz_responses')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    
  if (err1) console.error('Error deleting responses:', err1);
  else console.log('Successfully cleared quiz history.');

  console.log('Deleting all questions...');
  const { error: err2 } = await supabase
    .from('questions')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    
  if (err2) console.error('Error deleting questions:', err2);
  else console.log('Successfully deleted all questions.');

  console.log('Deleting all quizzes...');
  const { error: err3 } = await supabase
    .from('quizzes')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all
    
  if (err3) console.error('Error deleting quizzes:', err3);
  else console.log('Successfully deleted all quizzes.');

  console.log('Database reset complete!');
}

resetDatabase();
