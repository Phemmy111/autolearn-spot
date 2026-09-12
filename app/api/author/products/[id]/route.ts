import { NextResponse } from 'next/server';
import { deleteProduct, updateProduct } from '@/lib/product-service';
import { requireAuthor } from '@/lib/author';
import { supabaseAdmin } from '@/lib/supabase';

/** GET a single product by ID */
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuthor();
    const { id } = await params;
    const { data: product, error } = await supabaseAdmin
      .from('learning_products')
      .select('*')
      .eq('id', id)
      .single();
    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error('[GET /api/author/products/[id]] error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

/** PATCH update mutable fields of a product */
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuthor();
    const { id } = await params;
    const body = await request.json();
    const updated = await updateProduct(id, body);
    if (!updated) {
      return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
    }
    return NextResponse.json({ success: true, product: updated });
  } catch (err: any) {
    console.error('[PATCH /api/author/products/[id]] error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

/** DELETE a DRAFT product */
export async function DELETE(request: Request, { params }: { params: Promise<{ id: string }> }) {
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
