import { NextResponse } from 'next/server';
import { createProduct, listOwnProducts, deleteProduct } from '@/lib/product-service';
import { requireAuthor } from '@/lib/author';

export const dynamic = 'force-dynamic';

/**
 * GET /api/author/products?status=DRAFT
 * List the authenticated author's products, optional status filter.
 */
export async function GET(request: Request) {
  try {
    await requireAuthor(); // ensures approved/active author
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const products = await listOwnProducts(status ? { status } : undefined);
    return NextResponse.json({ success: true, products });
  } catch (err: any) {
    console.error('[GET /api/author/products] error:', err);
    return NextResponse.json({ error: err.message || 'Unauthorized' }, { status: err.status || 401 });
  }
}

/**
 * POST /api/author/products
 * Create a new product (must be DRAFT). Body expects all product fields except id, author_id, status, timestamps.
 */
export async function POST(request: Request) {
  try {
    await requireAuthor();
    const body = await request.json();
    // Basic validation – ensure required fields are present
    const required = ['skill_id', 'title', 'slug', 'product_type'];
    for (const field of required) {
      if (!body[field]) {
        return NextResponse.json({ error: `${field} is required` }, { status: 400 });
      }
    }
    const product = await createProduct(body);
    if (!product) {
      return NextResponse.json({ error: 'Failed to create product' }, { status: 500 });
    }
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error('[POST /api/author/products] error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

/**
 * DELETE /api/author/products/[id]
 * Delete a DRAFT product
 */
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuthor();
    const { id } = await params;
    const success = await deleteProduct(id);
    if (!success) {
      return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[DELETE /api/author/products/[id]] error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}
