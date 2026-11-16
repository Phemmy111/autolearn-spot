import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/partners/courses
 * Returns all courses and their author-configured affiliate commission rates
 */
export async function GET() {
  try {
    await requireAdmin();

    const { data: products, error: prodErr } = await supabaseAdmin
      .from('learning_products')
      .select('id, title, price, status, affiliate_enabled, affiliate_commission_rate, author_id')
      .order('created_at', { ascending: false });

    if (prodErr) throw prodErr;

    const { data: authors } = await supabaseAdmin
      .from('authors')
      .select('id, display_name, email');

    const authorMap = new Map<string, any>();
    (authors || []).forEach((a) => authorMap.set(a.id, a));

    const courses = (products || []).map((p) => {
      const author = authorMap.get(p.author_id);
      const rate = p.affiliate_commission_rate ?? 20;
      const price = Number(p.price) || 0;
      const payout = Math.round(price * (rate / 100));

      return {
        id: p.id,
        title: p.title,
        price,
        status: p.status,
        affiliate_enabled: p.affiliate_enabled !== false,
        affiliate_commission_rate: rate,
        commission_payout: payout,
        author: {
          id: p.author_id,
          name: author?.display_name || 'Author',
          email: author?.email || '',
        },
      };
    });

    return NextResponse.json({ success: true, courses });
  } catch (error: any) {
    console.error('[GET /api/admin/partners/courses] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/admin/partners/courses
 * Update affiliate commission rate or enabled status for a course
 */
export async function PATCH(request: Request) {
  try {
    await requireAdmin();

    const body = await request.json();
    const { courseId, affiliate_enabled, affiliate_commission_rate } = body;

    if (!courseId) {
      return NextResponse.json({ error: 'Course ID is required' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (affiliate_enabled !== undefined) {
      updates.affiliate_enabled = Boolean(affiliate_enabled);
    }
    if (affiliate_commission_rate !== undefined) {
      const rate = Number(affiliate_commission_rate);
      if (isNaN(rate) || rate < 0 || rate > 90) {
        return NextResponse.json(
          { error: 'Commission rate must be between 0% and 90%' },
          { status: 400 }
        );
      }
      updates.affiliate_commission_rate = rate;
    }

    const { data: updated, error } = await supabaseAdmin
      .from('learning_products')
      .update(updates)
      .eq('id', courseId)
      .select('id, title, price, affiliate_enabled, affiliate_commission_rate')
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, course: updated });
  } catch (error: any) {
    console.error('[PATCH /api/admin/partners/courses] Error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
