import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  const orderId = '48a657b8-aab2-490e-8143-ed4cc2f6df9e';
  const orderItemId = 'a8af5dad-dfa2-48bb-b623-99ee1bfccbac';
  const productId = 'c1e11cc7-d8f6-4c2d-8a3b-1bb204892921';

  // Check orders table
  const { data: order } = await sb.from('orders').select('*').eq('id', orderId).maybeSingle();
  console.log('Order columns:', order ? Object.keys(order) : 'not found');
  console.log('Order:', JSON.stringify(order, null, 2));

  // Check order_items table  
  const { data: item } = await sb.from('order_items').select('*').eq('id', orderItemId).maybeSingle();
  console.log('\norder_items columns:', item ? Object.keys(item) : 'not found');
  console.log('Order item:', JSON.stringify(item, null, 2));

  // Check commission for this order
  const { data: commissions } = await sb
    .from('commissions')
    .select('*')
    .eq('learning_product_id', productId);
  console.log('\nCommissions for product:', JSON.stringify(commissions, null, 2));

  // Check product
  const { data: product } = await sb.from('learning_products').select('title, price, affiliate_commission_rate').eq('id', productId).maybeSingle();
  console.log('\nProduct:', JSON.stringify(product, null, 2));
}

debug().catch(console.error);
