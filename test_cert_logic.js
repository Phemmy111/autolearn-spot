require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const userId = "user_2l7T1qQ5n2Uj7P7XgL8uP8T4n8t"; // We need the userId. Wait, I can just mock the POST logic to see what fails!
  
  // From screenshot: lessonId = '66f8dddc-b607-4979-a071-f66d8d1bba5c'
  const lessonId = '66f8dddc-b607-4979-a071-f66d8d1bba5c';
  
  // 1. find product
  const { data: lessonData } = await supabase.from('lessons').select('product_id').eq('uuid_id', lessonId).single();
  console.log("lessonData:", lessonData);
  if (!lessonData?.product_id) {
    console.log("Error: No product ID");
    return;
  }
  
  const productId = lessonData.product_id;
  
  const { data: productLessons } = await supabase.from('lessons').select('uuid_id').eq('product_id', productId);
  const totalLessons = productLessons?.length || 0;
  const lessonIds = productLessons?.map(l => l.uuid_id) || [];
  
  console.log("Total Lessons:", totalLessons);
  console.log("Lesson IDs:", lessonIds);
  
  // Let's see lesson progress for ANY user on this product to see if there's progress saved!
  const { data: progress } = await supabase.from('lesson_progress').select('*').in('lesson_uuid_id', lessonIds);
  console.log("Progress rows:", progress);
}
run();
