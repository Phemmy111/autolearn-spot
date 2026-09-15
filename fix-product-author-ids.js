const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixProductAuthorIds() {
  try {
    console.log('Checking products without author_id...');
    
    // Get products without author_id
    const { data: products, error } = await supabase
      .from('learning_products')
      .select('id, title, author_id')
      .is('author_id', null);
    
    if (error) {
      console.error('Error fetching products:', error);
      return;
    }
    
    console.log(`Found ${products.length} products without author_id`);
    
    if (products.length === 0) {
      console.log('All products have author_id assigned');
      return;
    }
    
    // Get all authors
    const { data: authors, error: authorsError } = await supabase
      .from('authors')
      .select('id, clerk_user_id, display_name');
    
    if (authorsError) {
      console.error('Error fetching authors:', authorsError);
      return;
    }
    
    console.log(`Found ${authors.length} authors`);
    
    // For this case, we'll need to know which author should own which products
    // You'll need to provide a mapping or logic for this
    console.log('\nProducts without author_id:');
    products.forEach(p => {
      console.log(`- ${p.title} (ID: ${p.id})`);
    });
    
    console.log('\nAvailable authors:');
    authors.forEach(a => {
      console.log(`- ${a.display_name} (ID: ${a.id}, Clerk: ${a.clerk_user_id})`);
    });
    
    console.log('\nYou need to manually assign author_id to products using the Supabase dashboard or provide a mapping logic.');
    
  } catch (error) {
    console.error('Error:', error);
  }
}

fixProductAuthorIds();
