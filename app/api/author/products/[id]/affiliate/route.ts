import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: productId } = await params;
  const body = await request.json();
  const { affiliate_enabled, affiliate_commission_rate, student_commission_amount } = body;

  // Validate affiliate rate
  if (affiliate_commission_rate !== undefined) {
    const rate = Number(affiliate_commission_rate);
    if (isNaN(rate) || rate < 5 || rate > 70) {
      return NextResponse.json({ error: 'Commission rate must be between 5% and 70%' }, { status: 400 });
    }
  }

  // Verify product belongs to this author or user is admin
  const { data: author } = await supabaseAdmin
    .from('authors')
    .select('id')
    .eq('clerk_user_id', userId)
    .maybeSingle();

  const { data: product } = await supabaseAdmin
    .from('learning_products')
    .select('id, author_id, price')
    .eq('id', productId)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Product not found' }, { status: 404 });
  }

  // Check if author matches or if user has admin privileges
  if (author && product.author_id !== author.id) {
    return NextResponse.json({ error: 'Access denied' }, { status: 403 });
  }

  const updates: Record<string, any> = {};
  if (affiliate_enabled !== undefined) updates.affiliate_enabled = affiliate_enabled;
  if (affiliate_commission_rate !== undefined) updates.affiliate_commission_rate = Number(affiliate_commission_rate);

  if (Object.keys(updates).length > 0) {
    const { error } = await supabaseAdmin
      .from('learning_products')
      .update(updates)
      .eq('id', productId);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Update or save course-specific student commission amount
  let savedStudentCommission = null;
  if (student_commission_amount !== undefined) {
    const studentAmt = Number(student_commission_amount);
    if (!isNaN(studentAmt) && studentAmt >= 0) {
      await supabaseAdmin
        .from('site_settings')
        .upsert({
          key: `course_student_commission:${productId}`,
          value: studentAmt.toString(),
          updated_at: new Date().toISOString()
        }, { onConflict: 'key' });
      savedStudentCommission = studentAmt;
    }
  } else {
    const { data: existingComm } = await supabaseAdmin
      .from('site_settings')
      .select('value')
      .eq('key', `course_student_commission:${productId}`)
      .maybeSingle();
    if (existingComm?.value) savedStudentCommission = Number(existingComm.value);
  }

  return NextResponse.json({ 
    success: true, 
    id: productId,
    affiliate_enabled,
    affiliate_commission_rate,
    student_commission_amount: savedStudentCommission
  });
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id: productId } = await params;

  const { data: product } = await supabaseAdmin
    .from('learning_products')
    .select('id, title, price, affiliate_enabled, affiliate_commission_rate, author_id')
    .eq('id', productId)
    .single();

  if (!product) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Fetch student commission amount from site_settings
  const { data: studentCommSetting } = await supabaseAdmin
    .from('site_settings')
    .select('value')
    .eq('key', `course_student_commission:${productId}`)
    .maybeSingle();

  const student_commission_amount = studentCommSetting?.value ? Number(studentCommSetting.value) : null;

  return NextResponse.json({
    ...product,
    student_commission_amount
  });
}
