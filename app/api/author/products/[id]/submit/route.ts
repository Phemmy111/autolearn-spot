import { NextResponse } from 'next/server';
import { submitProduct, validateProductCompleteness } from '@/lib/product-service';
import { requireAuthor } from '@/lib/author';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

/**
 * POST /api/author/products/[id]/submit
 * Submit a DRAFT product for admin review
 */
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthor();
    const { id } = await params;

    // Get the author ID from authentication
    const authorResult = await requireAuthor();
    const clerkUserId = typeof authorResult === 'object' && 'userId' in authorResult ? authorResult.userId : authorResult;

    // Get the database author ID from clerk user ID
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .select('id')
      .eq('clerk_user_id', clerkUserId)
      .single();

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author profile not found' }, { status: 404 });
    }

    const authorId = author.id;

    // Fetch the product to validate ownership
    const { data: product, error: fetchError } = await supabaseAdmin
      .from('learning_products')
      .select('*')
      .eq('id', id)
      .eq('author_id', authorId)
      .single();

    if (fetchError || !product) {
      return NextResponse.json({ error: 'Product not found or access denied' }, { status: 404 });
    }

    // Validate product can be submitted (must be DRAFT)
    if (product.status !== 'DRAFT') {
      return NextResponse.json(
        { error: `Cannot submit product with status: ${product.status}. Only DRAFT products can be submitted.` },
        { status: 400 }
      );
    }

    // Validate product completeness
    const validation = validateProductCompleteness(product);
    if (!validation.valid) {
      return NextResponse.json(
        { error: 'Product is incomplete', details: validation.errors },
        { status: 400 }
      );
    }

    // Submit for review
    const result = await submitProduct(id);
    if (!result) {
      return NextResponse.json({ error: 'Failed to submit product for review' }, { status: 500 });
    }

    return NextResponse.json({ success: true, product: result });
  } catch (err: any) {
    console.error('[POST /api/author/products/[id]/submit] error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: err.status || 500 }
    );
  }
}
