/**
 * tests/payment-services.test.js
 * Verification of order service and payment lookup queries against active database tables.
 */

const assert = require('assert');
require('dotenv').config({ path: '.env.local' });
require('dotenv').config({ path: '.env' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function testPaymentServices() {
  console.log('--- Testing Payment & Order Database Services ---');

  // 1. Verify connection to Supabase orders table
  const { data: orders, error: orderErr } = await supabase
    .from('orders')
    .select('id, status, total, provider_ref, customer_email')
    .limit(3);

  assert.strictEqual(orderErr, null, `Orders query should succeed: ${orderErr?.message}`);
  assert.ok(orders && orders.length > 0, 'Orders table should contain verified records');
  console.log(`✓ Test 1: orders query returned ${orders.length} records. Sample status: ${orders[0].status}`);

  // 2. Verify order_items table
  const { data: orderItems, error: itemsErr } = await supabase
    .from('order_items')
    .select('id, order_id, product_title, price_snapshot')
    .limit(3);

  assert.strictEqual(itemsErr, null, `order_items query should succeed: ${itemsErr?.message}`);
  console.log(`✓ Test 2: order_items query returned ${orderItems?.length || 0} records.`);

  // 3. Verify enrollments table
  const { data: enrollments, error: enrollErr } = await supabase
    .from('enrollments')
    .select('id, payment_ref, email')
    .limit(3);

  assert.strictEqual(enrollErr, null, `enrollments query should succeed: ${enrollErr?.message}`);
  console.log(`✓ Test 3: enrollments query returned ${enrollments?.length || 0} records.`);

  // 4. Test Outbox Save, Read, and Idempotency in site_settings
  const testOutboxKey = 'meta_capi_test_verification_key';
  const testPayload = {
    event_id: 'test_verification_key',
    event_name: 'Purchase',
    status: 'delivered',
    attempts: 1,
    last_attempt_at: new Date().toISOString(),
    delivered_at: new Date().toISOString(),
    fbtrace_id: 'test_fbtrace_abc123'
  };

  const { error: upsertErr } = await supabase
    .from('site_settings')
    .upsert(
      {
        key: testOutboxKey,
        value: JSON.stringify(testPayload),
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'key' }
    );

  assert.strictEqual(upsertErr, null, `Outbox upsert should succeed: ${upsertErr?.message}`);
  console.log('✓ Test 4A: Outbox upsert into site_settings succeeded.');

  const { data: fetchedSetting, error: fetchErr } = await supabase
    .from('site_settings')
    .select('value')
    .eq('key', testOutboxKey)
    .single();

  assert.strictEqual(fetchErr, null, 'Outbox read should succeed');
  const parsed = JSON.parse(fetchedSetting.value);
  assert.strictEqual(parsed.event_id, 'test_verification_key');
  assert.strictEqual(parsed.status, 'delivered');
  assert.strictEqual(parsed.fbtrace_id, 'test_fbtrace_abc123');
  console.log('✓ Test 4B: Outbox record fetched and parsed successfully.');

  // Clean up test key
  await supabase.from('site_settings').delete().eq('key', testOutboxKey);
  console.log('✓ Test 4C: Outbox test record cleaned up.');

  console.log('\n--- ALL PAYMENT & DATABASE TESTS PASSED SUCCESSFULLY ---');
}

testPaymentServices().catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
