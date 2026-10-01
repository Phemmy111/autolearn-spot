import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: '.env.local' });

const sb = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function debug() {
  // Step 1: Get recent SALE_CREDIT transactions
  const { data: txs } = await sb
    .from('author_transactions')
    .select('id, type, amount, related_id, description')
    .eq('type', 'SALE_CREDIT')
    .order('created_at', { ascending: false })
    .limit(3);

  console.log('\n=== Recent SALE_CREDIT transactions ===');
  console.log(JSON.stringify(txs, null, 2));

  if (!txs || txs.length === 0) {
    console.log('No SALE_CREDIT transactions found');
    return;
  }

  const tx = txs[0];
  console.log('\n=== Checking related_id:', tx.related_id, '===');

  // Step 2: Try to find in author_sales
  const { data: sale, error: sErr } = await sb
    .from('author_sales')
    .select('*')
    .eq('id', tx.related_id)
    .maybeSingle();
  console.log('\nauthor_sales lookup:', { sale, sErr });

  // Step 3: Get sample author_sales columns
  const { data: sampleSale } = await sb.from('author_sales').select('*').limit(1);
  if (sampleSale?.[0]) {
    console.log('\nauthor_sales columns:', Object.keys(sampleSale[0]));
    console.log('Sample sale record:', JSON.stringify(sampleSale[0], null, 2));
  }

  // Step 4: Check if related_id matches something else (order_id maybe)
  const { data: saleByOrderId, error: s2Err } = await sb
    .from('author_sales')
    .select('*')
    .eq('order_id', tx.related_id)
    .maybeSingle();
  console.log('\nauthor_sales by order_id:', { saleByOrderId, s2Err });

  // Step 5: Check commissions table structure
  const { data: sampleComm } = await sb.from('commissions').select('*').limit(1);
  if (sampleComm?.[0]) {
    console.log('\ncommissions columns:', Object.keys(sampleComm[0]));
    console.log('Sample commission:', JSON.stringify(sampleComm[0], null, 2));
  }
}

debug().catch(console.error);
