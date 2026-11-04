/**
 * AutoLearn Spot: Database Data Migration Tool
 * Migrates data table-by-table from old Supabase project (kvnprkfdbhseqtfqymgl)
 * to the new Supabase project (tjvgonysradvjybwjhsn).
 */

const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const OLD_URL = 'https://kvnprkfdbhseqtfqymgl.supabase.co';
const OLD_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt2bnBya2ZkYmhzZXF0ZnF5bWdsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NjAzNzkwNywiZXhwIjoyMDkxNjEzOTA3fQ.wQc30ft1vsSvJlJt5pcwONuUed61y9VCG-aXyRTpdxI';

const NEW_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const NEW_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

const oldDb = createClient(OLD_URL, OLD_SERVICE_KEY);
const newDb = createClient(NEW_URL, NEW_SERVICE_KEY);

const TABLES_IN_ORDER = [
  'categories',
  'skills',
  'profiles',
  'authors',
  'learning_products',
  'cohorts',
  'lessons',
  'orders',
  'order_items',
  'enrollments',
  'lesson_progress',
  'certificates',
  'quizzes',
  'questions',
  'quiz_responses',
  'assignments',
  'submissions',
  'assignment_submissions',
  'partners',
  'partner_profiles',
  'commissions',
  'partner_commissions',
  'referral_codes',
  'affiliate_links',
  'author_sales',
  'author_transactions',
  'author_bank_accounts',
  'author_withdrawals',
  'notifications',
  'site_settings'
];

async function migrateTable(tableName) {
  console.log(`\n--- Migrating table: ${tableName} ---`);
  
  // 1. Fetch from old db
  const { data: rows, error: fetchErr } = await oldDb.from(tableName).select('*').limit(2000);
  if (fetchErr) {
    console.log(`[${tableName}] Failed to fetch from old DB: ${fetchErr.message}`);
    return { table: tableName, count: 0, status: 'error', error: fetchErr.message };
  }

  if (!rows || rows.length === 0) {
    console.log(`[${tableName}] 0 rows in old DB. Skipping.`);
    return { table: tableName, count: 0, status: 'empty' };
  }

  console.log(`[${tableName}] Found ${rows.length} rows in old DB. Inserting into new DB...`);

  // 2. Insert into new db in batches of 50
  let inserted = 0;
  for (let i = 0; i < rows.length; i += 50) {
    const batch = rows.slice(i, i + 50);
    const { error: insertErr } = await newDb.from(tableName).upsert(batch, { ignoreDuplicates: true });
    if (insertErr) {
      console.log(`[${tableName}] Batch ${i}-${i + batch.length} insert error: ${insertErr.message}`);
    } else {
      inserted += batch.length;
    }
  }

  console.log(`[${tableName}] Successfully migrated ${inserted}/${rows.length} rows.`);
  return { table: tableName, count: inserted, status: 'success' };
}

async function run() {
  console.log('Testing connection to old Supabase project...');
  const { error: testErr } = await oldDb.from('authors').select('id').limit(1);
  if (testErr) {
    console.error('Cannot connect to old DB:', testErr.message);
    if (testErr.message.includes('exceed_cached_egress_quota')) {
      console.error('\n*** ACTION REQUIRED ***');
      console.error('The old Supabase project is currently blocked by egress quota.');
      console.error('To unblock: Go to https://supabase.com/dashboard/project/kvnprkfdbhseqtfqymgl/settings/billing/subscription');
      console.error('and toggle OFF Spend Cap (or add payment method).');
    }
    return;
  }

  console.log('Connected to old DB successfully! Beginning migration...\n');
  const results = [];
  for (const t of TABLES_IN_ORDER) {
    const res = await migrateTable(t);
    results.push(res);
  }

  console.log('\n=== MIGRATION COMPLETE ===');
  console.table(results);
}

run().catch(console.error);
