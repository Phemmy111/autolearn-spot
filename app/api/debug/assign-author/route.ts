import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('productId');
    const authorId = searchParams.get('authorId');

    if (!productId || !authorId) {
      return NextResponse.json({ error: 'Product ID and Author ID are required as query params' }, { status: 400 });
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
