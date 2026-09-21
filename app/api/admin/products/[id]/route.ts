import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';

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
        lessons (
          id,
          title,
          status,
          order_index,
          youtube_url,
          youtube_video_id,
          vimeo_video_id,
          vdo_cipher_video_id
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

    let skill = null;
    if (product.skill_id) {
      console.log('[Admin Product] Fetching skill with ID:', product.skill_id);
      const { data: s, error: skillError } = await supabaseAdmin
        .from('skills')
        .select('name, category_id')
        .eq('id', product.skill_id)
        .single();
      
      if (skillError) {
        console.error('[Admin Product] Skill lookup failed:', skillError);
      }
      
      if (s) {
        skill = s;
        console.log('[Admin Product] Skill found:', s);
      } else {
        console.log('[Admin Product] No skill found for ID:', product.skill_id);
      }
    } else {
      console.log('[Admin Product] Product has no skill_id');
    }

    // Also fetch category if skill has category_id
    let category = null;
    if (skill?.category_id) {
      const { data: c } = await supabaseAdmin
        .from('categories')
        .select('name')
        .eq('id', skill.category_id)
        .single();
      
      if (c) {
        category = c;
      }
    }

    return NextResponse.json({ 
      success: true, 
      product: { ...product, author, skill, category } 
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

    // Get author details for notification
    const { data: author } = await supabaseAdmin
      .from('authors')
      .select('display_name, email')
      .eq('id', product.author_id)
      .single();

    // Send email notification based on status change
    try {
      if (status === 'PUBLISHED' && author) {
        await EmailService.sendProductPublishedNotification(
          author.display_name || author.email || 'Author',
          author.email || 'unknown',
          product.title,
          product.id
        );
      } else if (status === 'REJECTED' && author) {
        await EmailService.sendProductRejectedNotification(
          author.display_name || author.email || 'Author',
          author.email || 'unknown',
          product.title,
          feedback || 'No specific reason provided'
        );
      }
    } catch (emailError) {
      console.error('[PATCH /api/admin/products/[id]] Email notification failed:', emailError);
      // Don't fail the status update if email fails
    }

    // Send email notification based on status change
    try {
      if (status === 'PUBLISHED') {
        await EmailService.sendProductPublishedNotification(
          author?.display_name || author?.email || 'Author',
          author?.email || 'unknown',
          product.title,
          product.id
        );
      } else if (status === 'REJECTED') {
        await EmailService.sendProductRejectedNotification(
          author?.display_name || author?.email || 'Author',
          author?.email || 'unknown',
          product.title,
          feedback || 'No specific reason provided'
        );
      }
    } catch (emailError) {
      console.error('[PATCH /api/admin/products/[id]] Email notification failed:', emailError);
      // Don't fail the status update if email fails
    }

    return NextResponse.json({ success: true, product });
  } catch (err: any) {
    console.error('[PATCH /api/admin/products/[id]] error:', err);
    return NextResponse.json({ error: 'Failed to update product status' }, { status: 500 });
  }
}
