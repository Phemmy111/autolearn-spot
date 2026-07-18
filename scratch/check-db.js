const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

async function check() {
  const { data: questions, error } = await supabase
    .from('questions')
    .select('*')
    .limit(5);

  if (error) {
    console.error(error);
    return;
  }
  
  questions.forEach(q => {
    console.log(`Q: ${q.question_text}`);
    console.log(`Options: ${q.options}`);
    console.log(`Correct: ${q.correct_answer}`);
    console.log('---');
  });
}

check();
