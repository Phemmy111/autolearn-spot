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
    .select('id, name, description')
    .limit(20);

  const { data: products, error: productsError } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, status, author_id')
    .limit(10);

  return NextResponse.json({
    authors: { count: authors?.length ?? 0, data: authors, error: authorsError?.message },
    skills: { count: skills?.length ?? 0, data: skills, error: skillsError?.message },
    products: { count: products?.length ?? 0, data: products, error: productsError?.message },
  });
}
