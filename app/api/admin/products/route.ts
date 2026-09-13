import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    await requireAdmin();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    let query = supabaseAdmin
      .from('learning_products')
      .select(`
        *,
        skill:skills (
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (status && status !== 'ALL') {
      query = query.eq('status', status);
    }

    const { data: products, error } = await query;

    if (error) {
      console.error('[GET /api/admin/products] DB error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Try to resolve author names from enrollments as a hack (since clerk_user_id exists there)
    const authorIds = Array.from(new Set(products?.map(p => p.author_id).filter(Boolean)));
    const { data: users } = await supabaseAdmin
      .from('enrollments')
      .select('clerk_user_id, full_name, email')
      .in('clerk_user_id', authorIds);

    const userMap = new Map();
    users?.forEach(u => {
      if (!userMap.has(u.clerk_user_id)) {
        userMap.set(u.clerk_user_id, { name: u.full_name, email: u.email });
      }
    });

    const mappedProducts = products?.map((p: any) => ({
      ...p,
      author: userMap.get(p.author_id) || { name: p.author_id, email: 'Unknown' }
    }));

    return NextResponse.json({ success: true, products: mappedProducts });
  } catch (err: any) {
    console.error('[GET /api/admin/products] error:', err);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }
}
