import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = user.primaryEmailAddress?.emailAddress || '';

  // 1. Check enrollments by clerk_user_id
  const { data: byClerkId, error: e1 } = await supabaseAdmin
    .from('enrollments')
    .select('id, email, clerk_user_id, status, learning_product_id, activated_at, created_at')
    .eq('clerk_user_id', userId);

  // 2. Check enrollments by email
  const { data: byEmail, error: e2 } = await supabaseAdmin
    .from('enrollments')
    .select('id, email, clerk_user_id, status, learning_product_id, activated_at, created_at')
    .eq('email', email);

  // 3. Check if learning_products join works
  const { data: withProduct, error: e3 } = await supabaseAdmin
    .from('enrollments')
    .select('id, status, learning_product_id, learning_products(id, title)')
    .eq('email', email);

  return NextResponse.json({
    userId,
    email,
    byClerkId: { data: byClerkId, error: e1?.message },
    byEmail: { data: byEmail, error: e2?.message },
    withProduct: { data: withProduct, error: e3?.message },
  });
}
