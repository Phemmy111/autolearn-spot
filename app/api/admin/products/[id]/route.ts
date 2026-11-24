import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';
import { EmailService } from '@/lib/email-service';
import { SKILLS_BY_CATEGORY } from '@/lib/taxonomy';

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
    let categoryName = null;
    
    if (product.skill_id) {
      console.log('[Admin Product] Looking up skill in taxonomy for ID:', product.skill_id);
      
      // Look up skill in taxonomy data (not database)
      for (const [cat, skills] of Object.entries(SKILLS_BY_CATEGORY)) {
        const foundSkill = skills.find(s => s.id === product.skill_id);
        if (foundSkill) {
          skill = { name: foundSkill.name, id: foundSkill.id };
          categoryName = cat;
          console.log('[Admin Product] Skill found in taxonomy:', skill, 'Category:', categoryName);
          break;
        }
      }
      
      if (!skill) {
        console.log('[Admin Product] Skill not found in taxonomy for ID:', product.skill_id);
      }
    } else {
      console.log('[Admin Product] Product has no skill_id');
    }

    // Fetch course-specific student referral commission
    const { data: studentCommSetting } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', `course_student_commission:${id}`)
      .maybeSingle();

    const student_commission_amount = studentCommSetting?.value ? Number(studentCommSetting.value) : 1500;

    return NextResponse.json({ 
      success: true, 
      product: { 
        ...product, 
        student_commission_amount,
        author, 
        skill, 
        category: categoryName ? { name: categoryName } : null 
      } 
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
    const { status, feedback, affiliate_commission_rate, affiliate_enabled, student_commission_amount } = body;

    const updates: any = { updated_at: new Date().toISOString() };
    if (status) {
      if (!['PUBLISHED', 'REJECTED', 'SUSPENDED', 'PENDING_REVIEW'].includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
      }
      updates.status = status;
      if (status === 'PUBLISHED') {
        updates.published_at = new Date().toISOString();
      }
    }

    if (affiliate_commission_rate !== undefined) {
      updates.affiliate_commission_rate = Number(affiliate_commission_rate);
    }
    if (affiliate_enabled !== undefined) {
      updates.affiliate_enabled = Boolean(affiliate_enabled);
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

    // Save student commission amount in site_settings
    if (student_commission_amount !== undefined) {
      const studentAmt = Number(student_commission_amount);
      if (!isNaN(studentAmt) && studentAmt >= 0) {
        await supabaseAdmin
          .from('site_settings')
          .upsert({
            key: `course_student_commission:${id}`,
            value: studentAmt.toString(),
            updated_at: new Date().toISOString()
          }, { onConflict: 'key' });
      }
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
