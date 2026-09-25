import { NextResponse } from 'next/server';
import { deleteProduct, updateProduct, submitProduct, validateProductCompleteness } from '@/lib/product-service';
import { requireAuthor } from '@/lib/author';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

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

    // Fetch dynamic platform commission rate from site_settings
    const { data: commissionSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', 'platform_commission_rate')
      .maybeSingle();

    let platformCommissionRate = 10;
    if (commissionSetting?.value) {
      try {
        const parsed = JSON.parse(commissionSetting.value);
        if (typeof parsed === 'number') platformCommissionRate = parsed;
        else if (parsed && typeof parsed === 'object') platformCommissionRate = parsed.rate || parsed.value || 10;
      } catch {
        const parsed = parseFloat(commissionSetting.value);
        if (!isNaN(parsed)) platformCommissionRate = parsed;
      }
    } else if (product.commission_rate !== undefined && product.commission_rate !== null) {
      const pRate = Number(product.commission_rate);
      if (pRate <= 1 && pRate > 0) platformCommissionRate = pRate * 100;
      else if (pRate > 1) platformCommissionRate = pRate;
    }

    return NextResponse.json({ 
      success: true, 
      product,
      platform_commission_rate: platformCommissionRate 
    });
  } catch (err: any) {
    console.error('[GET /api/author/products/[id]] error:', err);
    return NextResponse.json({ error: err.message || 'Internal error' }, { status: 500 });
  }
}

/** POST submit a product for review (legacy endpoint support) */
export async function POST(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuthor();
    const { id } = await params;

    // Get the author ID from authentication
    const authorResult = await requireAuthor();
    const clerkUserId = typeof authorResult === 'object' && 'userId' in authorResult ? authorResult.userId : authorResult;

    // Get the database author ID from clerk user ID
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .select('id, display_name, email')
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

    // Send email notification to founder
    try {
      await EmailService.sendFounderProductSubmissionNotification({
        title: product.title,
        authorName: author.display_name || author.email,
        authorEmail: author.email,
        productType: product.product_type,
        price: product.price,
        currency: product.currency,
        description: product.description,
      });
    } catch (emailError) {
      console.error('[POST /api/author/products/[id]] Email notification failed:', emailError);
      // Don't fail the request if email fails
    }

    return NextResponse.json({ success: true, product: result });
  } catch (err: any) {
    console.error('[POST /api/author/products/[id]] error:', err);
    return NextResponse.json(
      { error: err.message || 'Internal server error' },
      { status: err.status || 500 }
    );
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
