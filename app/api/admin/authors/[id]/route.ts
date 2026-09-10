import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = params;

    // Get author details with earnings
    const { data: author, error: authorError } = await supabaseAdmin
      .from('authors')
      .select(`
        *,
        author_earnings (
          total_gross,
          total_commission,
          total_net
        )
      `)
      .eq('id', id)
      .single();

    if (authorError || !author) {
      return NextResponse.json({ error: 'Author not found' }, { status: 404 });
    }

    // Get author's products
    const { data: products, error: productsError } = await supabaseAdmin
      .from('learning_products')
      .select(`
        id,
        title,
        price,
        skill_id,
        created_at,
        published_at,
        enrollments (count)
      `)
      .eq('author_id', id);

    // Get author's sales
    const { data: sales, error: salesError } = await supabaseAdmin
      .from('author_sales')
      .select(`
        *,
        order_items (
          quantity
        ),
        learning_products (
          title
        )
      `)
      .eq('author_id', id)
      .order('created_at', { ascending: false })
      .limit(10);

    // Get author's withdrawals
    const { data: withdrawals, error: withdrawalsError } = await supabaseAdmin
      .from('author_withdrawals')
      .select('*')
      .eq('author_id', id)
      .order('requested_at', { ascending: false })
      .limit(10);

    // Calculate performance metrics
    const totalProducts = products?.length || 0;
    const totalSales = sales?.length || 0;
    const totalStudents = products?.reduce((sum, p) => sum + (p.enrollments?.[0]?.count || 0), 0) || 0;
    const totalRevenue = author.author_earnings?.[0]?.total_gross || 0;
    const authorEarnings = author.author_earnings?.[0]?.total_net || 0;

    return NextResponse.json({
      author: {
        ...author,
        earnings: author.author_earnings?.[0] || null,
      },
      performance: {
        totalProducts,
        totalSales,
        totalStudents,
        totalRevenue,
        authorEarnings,
      },
      products: products || [],
      recentSales: sales || [],
      recentWithdrawals: withdrawals || [],
    });
  } catch (error) {
    console.error('Error in admin author details API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
  }

  try {
    const { id } = params;
    const body = await request.json();
    const { status, display_name, bio, profile_image } = body;

    const { data: author, error } = await supabaseAdmin
      .from('authors')
      .update({
        status,
        display_name,
        bio,
        profile_image,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating author:', error);
      return NextResponse.json({ error: 'Failed to update author' }, { status: 500 });
    }

    return NextResponse.json({ success: true, author });
  } catch (error) {
    console.error('Error in admin author update API:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
