import { NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getUserEnrollments } from '@/lib/enrollment-service';

export const dynamic = 'force-dynamic';

export async function GET() {
  const { userId } = await auth();
  const user = await currentUser();

  if (!userId || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const email = user.primaryEmailAddress?.emailAddress || '';

  // 1. Check enrollments by email (simple, no joins)
  const { data: byEmail, error: e1 } = await supabaseAdmin
    .from('enrollments')
    .select('id, email, clerk_user_id, status, cohort_id, activated_at, created_at')
    .eq('email', email);

  // 2. Check enrollments by clerk_user_id
  const { data: byClerkId, error: e2 } = await supabaseAdmin
    .from('enrollments')
    .select('id, email, clerk_user_id, status, cohort_id, activated_at, created_at')
    .eq('clerk_user_id', userId);

  // 3. Check cohort join for learning product
  const { data: withCohortProduct, error: e3 } = await supabaseAdmin
    .from('enrollments')
    .select('id, status, cohort_id, cohort:cohorts(id, name, learning_product:learning_products(id, title))')
    .eq('email', email);

  // 4. Full getUserEnrollments result
  const allEnrollments = await getUserEnrollments(userId, email);

  return NextResponse.json({
    userId,
    email,
    byEmail: { data: byEmail, error: e1?.message },
    byClerkId: { data: byClerkId, error: e2?.message },
    withCohortProduct: { data: withCohortProduct, error: e3?.message },
    getUserEnrollmentsResult: { count: allEnrollments.length, enrollments: allEnrollments },
  });
}
