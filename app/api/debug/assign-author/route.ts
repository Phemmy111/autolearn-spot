import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { productId, authorId } = body;

    if (!productId || !authorId) {
      return NextResponse.json({ error: 'Product ID and Author ID are required' }, { status: 400 });
    }

    // Update product with author_id
    const { data: product, error: updateError } = await supabaseAdmin
      .from('learning_products')
      .update({ author_id: authorId })
      .eq('id', productId)
      .select()
      .single();

    if (updateError) {
      return NextResponse.json({ error: updateError.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      product,
      message: 'Author assigned to product successfully'
    });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
