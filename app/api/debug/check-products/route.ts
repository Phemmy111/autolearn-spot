import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Check all products and their author_id
    const { data: products, error: productsError } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, author_id, status')
      .order('created_at', { ascending: false })
      .limit(10);

    // Count products with and without author_id
    const { data: countData } = await supabaseAdmin
      .from('learning_products')
      .select('author_id');

    const withAuthor = countData?.filter(p => p.author_id).length || 0;
    const withoutAuthor = countData?.filter(p => !p.author_id).length || 0;

    return NextResponse.json({
      success: true,
      products: products || [],
      stats: {
        total: countData?.length || 0,
        withAuthor,
        withoutAuthor
      },
      error: productsError?.message
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
