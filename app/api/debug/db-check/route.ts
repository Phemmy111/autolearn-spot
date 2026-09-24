import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { data: product, error } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, author_id, authors(id, display_name, email)')
    .limit(1)
    .single();

  return NextResponse.json({
    product,
    error
  });
}
