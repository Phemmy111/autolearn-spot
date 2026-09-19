require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data: cohorts } = await supabase.from('cohorts').select('*');
  console.log("Cohorts:", cohorts);
  
  const { data: products } = await supabase.from('learning_products').select('id, title');
  console.log("Products:", products);
  
  // Update cohort 2 to point to the product
  if (products && products.length > 0 && cohorts) {
     const cohort2 = cohorts.find(c => c.name === 'Cohort 2' || c.id === '3633e893-7bc4-4cb6-9617-f7c5255aeaa9');
     if (cohort2) {
       await supabase.from('cohorts').update({ product_id: products[0].id }).eq('id', cohort2.id);
       console.log("Updated Cohort 2 to product:", products[0].title);
     }
  }
}
run();
