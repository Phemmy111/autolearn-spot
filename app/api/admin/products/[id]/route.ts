import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;

    // Fetch product with related data
    const { data: product, error } = await supabaseAdmin
      .from('learning_products')
      .select(`
        *,
        skill:skills (
          name,
          category_id
        ),
        lessons (
          id,
          title,
          is_published,
          order_index
        )
      `)
      .eq('id', id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Resolve author name
    let author = { name: product.author_id, email: 'Unknown' };
    if (product.author_id) {
      const { data: user } = await supabaseAdmin
        .from('enrollments')
        .select('full_name, email')
        .eq('clerk_user_id', product.author_id)
        .limit(1)
        .single();
      
      if (user) {
        author = { name: user.full_name, email: user.email };
      }
    }

    return NextResponse.json({ 
      success: true, 
      product: { ...product, author } 
    });
  } catch (err: any) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}

export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
    const { id } = await params;
    const body = await request.json();
    const { status, feedback } = body;

    if (!['PUBLISHED', 'REJECTED', 'SUSPENDED', 'PENDING_REVIEW'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const updates: any = { status, updated_at: new Date().toISOString() };
    if (status === 'PUBLISHED') {
      updates.published_at = new Date().toISOString();
    }

    // Update product
    const { data: product, error } = await supabaseAdmin
      .from('learning_products')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw error;
    }

    // TODO: Send notification with feedback to author if needed

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error('[PATCH /api/admin/products/[id]] error:', err);
    return NextResponse.json({ error: 'Failed to update product status' }, { status: 500 });
  }
}
