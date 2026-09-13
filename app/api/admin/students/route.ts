import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { data: enrollments, error } = await supabaseAdmin
      .from('enrollments')
      .select(`
        id,
        full_name,
        email,
        payment_amount,
        amount_paid,
        status,
        activated_at,
        enrolled_at,
        learning_product:learning_products (
          title,
          access_duration_days
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching students:', error);
      return NextResponse.json({ error: 'Failed to fetch students' }, { status: 500 });
    }

    const formattedData = enrollments.map(e => {
      const product = Array.isArray(e.learning_product) ? e.learning_product[0] : e.learning_product;
      
      let daysLeft = null;
      if (e.status === 'active' && e.activated_at && product?.access_duration_days) {
        const start = new Date(e.activated_at).getTime();
        const now = Date.now();
        const durationMs = product.access_duration_days * 24 * 60 * 60 * 1000;
        daysLeft = Math.max(0, Math.ceil((start + durationMs - now) / (1000 * 60 * 60 * 24)));
      }

      return {
        id: e.id,
        name: e.full_name || 'No name',
        email: e.email,
        course: product ? product.title : 'Unknown Course',
        amount: e.payment_amount || e.amount_paid || 0,
        status: e.status || 'inactive',
        date: e.activated_at || e.enrolled_at || 'N/A',
        days_left: daysLeft
      };
    });

    return NextResponse.json({ data: formattedData });
  } catch (error) {
    console.error('Error in admin students API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
