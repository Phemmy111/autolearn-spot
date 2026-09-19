import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data: authors, error: authorsError } = await supabaseAdmin
    .from('authors')
    .select('id, display_name, status, created_at')
    .limit(20);

  const { data: skills, error: skillsError } = await supabaseAdmin
    .from('skills')
    .select('*')
    .limit(5);

  // Try to insert a test skill to see exact error
  const { data: insertTest, error: insertError } = await supabaseAdmin
    .from('skills')
    .insert({ name: '__test_skill__', description: 'test' })
    .select()
    .single();

  // If insert succeeded, delete it immediately
  if (insertTest?.id) {
    await supabaseAdmin.from('skills').delete().eq('id', insertTest.id);
  }

  const { data: products, error: productsError } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, status, author_id')
    .limit(10);

  return NextResponse.json({
    authors: { count: authors?.length ?? 0, data: authors, error: authorsError?.message },
    skills: { count: skills?.length ?? 0, sample_columns: skills?.[0] ? Object.keys(skills[0]) : [], error: skillsError?.message },
    skills_insert_test: { success: !!insertTest, error: insertError?.message },
    products: { count: products?.length ?? 0, data: products, error: productsError?.message },
  });
}
